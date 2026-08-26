import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { getPool } from "../../database/db.js";
import {
  loginAttemptTracker,
  checkLoginLockout,
  securityAuditLog
} from "../middleware/securityMiddleware.js";
import { sendAdmin2FAEmail, formatEmailError } from "../services/emailService.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ACCESS_TOKEN_EXPIRES = "1d";
const ACCESS_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

const ADMIN_OTP_EXPIRY_MINUTES = 5;
const GENERAL_OTP_EXPIRY_MINUTES = 10;

const MAX_OTP_ATTEMPTS = 5;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD_HASH = (() => {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || !pwd.trim()) return null;
  try {
    return bcrypt.hashSync(pwd.trim(), 12);
  } catch (e) {
    console.error('Failed to hash ADMIN_PASSWORD:', e);
    return null;
  }
})();

const USE_ENV_ADMIN_AUTH = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD_HASH);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too weak. Use at least 32 characters."
    );
  }

  return secret;
};

const normalizeEmail = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const normalizePhone = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
};

const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

const normalizeRole = (role) => {
  return String(role || "")
    .trim()
    .toLowerCase();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  return /^[0-9+]{7,20}$/.test(phone);
};

const isStrongPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  if (password.length < 8 || password.length > 128) {
    return false;
  }

  return true;
};

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

const generateCsrfToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

const getCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/"
  };
};

const setAuthCookies = (res, token) => {
  res.cookie(
    "token",
    token,
    {
      ...getCookieOptions(),
      maxAge: ACCESS_COOKIE_MAX_AGE
    }
  );

  const csrfToken = generateCsrfToken();

  res.cookie(
    "csrfToken",
    csrfToken,
    {
      httpOnly: false,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_COOKIE_MAX_AGE,
      path: "/"
    }
  );

  return csrfToken;
};

const clearAuthCookies = (res) => {
  const options = {
    ...getCookieOptions()
  };

  res.clearCookie("token", options);

  res.clearCookie(
    "csrfToken",
    {
      httpOnly: false,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    }
  );
};

const createAccessToken = ({
  userId,
  role,
  twoFactorVerified = false
}) => {
  return jwt.sign(
    {
      id: userId,
      role,
      ...(twoFactorVerified
        ? {
            twoFactorVerified: true
          }
        : {})
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_EXPIRES
    }
  );
};

const calculateMinutesLeft = (lockedUntil) => {
  const milliseconds =
    new Date(lockedUntil).getTime() -
    Date.now();

  return Math.max(
    1,
    Math.ceil(
      milliseconds / (1000 * 60)
    )
  );
};

const clearLoginAttempts = async (
  pool,
  identifier,
  ip
) => {
  try {
    await pool.query(
      `
      DELETE FROM login_attempts
      WHERE email = ?
         OR ip_address = ?
      `,
      [identifier, ip]
    );
  } catch (error) {
    console.warn(
      "Unable to clear login attempts:",
      error.message
    );
  }
};

const getUserSafe = (user) => {
  return {
    id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    region: user.region,
    city: user.city,
    sub_city: user.sub_city,
    address: user.address,
    avatar: user.avatar
  };
};

/*
|--------------------------------------------------------------------------
| AUTH GUARD MIDDLEWARE
|--------------------------------------------------------------------------
*/

export const protect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (typeof req.headers.authorization === "string" && req.headers.authorization.toLowerCase().startsWith("bearer ")
        ? req.headers.authorization.split(/\s+/)[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required."
      });
    }

    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token."
      });
    }

    const pool = getPool();
    const [users] = await pool.query(
      `SELECT user_id, name, email, phone, role, region, city, sub_city, address, avatar, last_seen
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (!users || users.length === 0) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: "User account no longer exists."
      });
    }

    const user = users[0];
    const normalizedRole = normalizeRole(user.role);

    if (normalizedRole === "admin" && decoded.twoFactorVerified !== true) {
      clearAuthCookies(res);
      return res.status(403).json({
        success: false,
        error: "Admin authentication requires two-factor verification."
      });
    }

    req.user = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      region: user.region,
      city: user.city,
      sub_city: user.sub_city,
      address: user.address,
      avatar: user.avatar,
      last_seen: user.last_seen
    };

    next();
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token."
    });
  }
};

export const authorize = (...allowedRoles) => {
  const roles = allowedRoles.map((role) => String(role || "").trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({
        success: false,
        error: "Authentication required."
      });
    }

    const userRole = String(req.user.role || "").trim().toLowerCase();

    if (roles.length > 0 && !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access this resource."
      });
    }

    next();
  };
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

export const register = async (req, res) => {
  try {
    const {
      name,
      email: rawEmail,
      phone: rawPhone,
      password,
      role,
      region,
      city,
      sub_city,
      address
    } = req.body;

    const cleanName =
      String(name || "").trim();

    const email =
      normalizeEmail(rawEmail);

    const phone =
      normalizePhone(rawPhone);

    if (
      !cleanName ||
      !email ||
      !phone ||
      !password ||
      !region ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide all required fields."
      });
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        error:
          "Name must be between 2 and 100 characters."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address."
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide a valid phone number."
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be between 8 and 128 characters."
      });
    }

    const requestedRole =
      String(role || "Tenant")
        .trim();

    const normalizedRequestedRole =
      String(requestedRole || "")
        .toLowerCase();

    if (normalizedRequestedRole === "admin") {
      return res.status(403).json({
        success: false,
        error:
          "This role cannot be assigned during public registration."
      });
    }

    const validRole =
      requestedRole === "Landlord"
        ? "Landlord"
        : "Tenant";

    const pool = getPool();

    /*
     * Check email.
     */

    const [existingEmail] =
      await pool.query(
        `
        SELECT user_id
        FROM users
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1
        `,
        [email]
      );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        error:
          "An account already exists with this email."
      });
    }

    /*
     * Check phone.
     */

    const [existingPhone] =
      await pool.query(
        `
        SELECT user_id
        FROM users
        WHERE REPLACE(phone, ' ', '') = ?
        LIMIT 1
        `,
        [phone]
      );

    if (existingPhone.length > 0) {
      return res.status(409).json({
        success: false,
        error:
          "An account already exists with this phone number."
      });
    }

    /*
     * Hash password.
     */

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const [result] =
      await pool.query(
        `
        INSERT INTO users
        (
          name,
          email,
          phone,
          password,
          role,
          region,
          city,
          sub_city,
          address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cleanName,
          email,
          phone,
          hashedPassword,
          validRole,
          String(region).trim(),
          String(city).trim(),
          String(sub_city || "").trim(),
          String(address || "").trim()
        ]
      );

    await securityAuditLog(
      req,
      "USER_REGISTERED",
      {
        userId: result.insertId
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully.",
      userId: result.insertId
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    /*
     * Handle duplicate database constraints.
     */

    if (
      error?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        error:
          "An account already exists with the provided information."
      });
    }

    return res.status(500).json({
      success: false,
      error:
        "Unable to complete registration."
    });
  }
};

/*
|--------------------------------------------------------------------------
| NORMAL USER LOGIN
|--------------------------------------------------------------------------
*/

export const login = async (req, res) => {
  try {
    const {
      email: rawIdentifier,
      password,
      isAdminPortal
    } = req.body;

    const identifier =
      String(rawIdentifier || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error:
          "Email/phone and password are required."
      });
    }

    const email =
      normalizeEmail(identifier);

    const phone =
      normalizePhone(identifier);

    const ip =
      getClientIp(req);

    /*
     * Lockout check.
     */

    const lockout =
      await checkLoginLockout(
        identifier,
        ip
      );

    if (lockout.locked) {
      return res.status(429).json({
        success: false,
        error:
          `Too many failed login attempts. Please try again in ${calculateMinutesLeft(
            lockout.lockedUntil
          )} minutes.`
      });
    }

    const pool = getPool();

    const [users] =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE
          LOWER(TRIM(email)) = ?
          OR REPLACE(phone, ' ', '') = ?
        LIMIT 1
        `,
        [
          email,
          phone
        ]
      );

    if (
      !users ||
      users.length === 0
    ) {
      await loginAttemptTracker(
        identifier,
        ip,
        false
      );

      return res.status(401).json({
        success: false,
        error:
          "Invalid email/phone or password."
      });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error:
          "Invalid email/phone or password."
      });
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordValid) {
      const trackerResult =
        await loginAttemptTracker(
          identifier,
          ip,
          false
        );

      if (trackerResult?.locked) {
        return res.status(429).json({
          success: false,
          error:
            `Too many failed login attempts. Please try again in ${calculateMinutesLeft(
              trackerResult.lockedUntil
            )} minutes.`
        });
      }

      return res.status(401).json({
        success: false,
        error:
          "Invalid email/phone or password."
      });
    }

    /*
     * Admin cannot use normal login.
     */

    if (
      isAdminPortal ||
      normalizeRole(user.role) === "admin"
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Admin accounts must use the Admin login page."
      });
    }

    const token =
      createAccessToken({
        userId: user.user_id,
        role: user.role
      });

    await clearLoginAttempts(
      pool,
      identifier.toLowerCase(),
      ip
    );

    const csrfToken =
      setAuthCookies(
        res,
        token
      );

    await securityAuditLog(
      req,
      "USER_LOGIN_SUCCESS",
      {
        userId: user.user_id
      }
    );

    return res.json({
      success: true,
      csrfToken,
      user: getUserSafe(user)
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to complete login."
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN LOGIN
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This endpoint DOES NOT issue JWT.
|
| Admin must complete:
|
| password → OTP → JWT
|
|--------------------------------------------------------------------------
*/

export const adminLogin = async (
  req,
  res
) => {
  /*
   * Keep this endpoint as a compatibility
   * wrapper around credential verification.
   */

  return verifyAdminCredentials(
    req,
    res
  );
};

/*
|--------------------------------------------------------------------------
| VERIFY ADMIN CREDENTIALS
|--------------------------------------------------------------------------
| STEP 1
|--------------------------------------------------------------------------
*/

export const verifyAdminCredentials =
  async (req, res) => {
    try {
      const {
        email: rawEmail,
        password
      } = req.body;

      const email =
        normalizeEmail(rawEmail);

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error:
            "Email and password are required."
        });
      }

      const ip =
        getClientIp(req);

      /*
       * Login lockout.
       */

      const lockout =
        await checkLoginLockout(
          email,
          ip
        );

      if (lockout.locked) {
        return res.status(429).json({
          success: false,
          error:
            `Too many failed login attempts. Please try again in ${calculateMinutesLeft(
              lockout.lockedUntil
            )} minutes.`
        });
      }

      const pool = getPool();

      /*
       * If .env-based admin auth is configured,
       * validate against .env FIRST before touching the database.
       *
       * This allows admin login even when the database
       * does not yet contain the expected admin user.
       */

      if (USE_ENV_ADMIN_AUTH) {
        if (email !== ADMIN_EMAIL) {
          await loginAttemptTracker(
            email,
            ip,
            false
          );

          return res.status(401).json({
            success: false,
            error:
              "Invalid admin credentials."
          });
        }

        const passwordValid =
          bcrypt.compareSync(
            password,
            ADMIN_PASSWORD_HASH
          );

        if (!passwordValid) {
          const trackerResult =
            await loginAttemptTracker(
              email,
              ip,
              false
            );

          if (trackerResult?.locked) {
            return res.status(429).json({
              success: false,
              error:
                `Too many failed login attempts. Please try again in ${calculateMinutesLeft(
                  trackerResult.lockedUntil
                )} minutes.`
            });
          }

          return res.status(401).json({
            success: false,
            error:
              "Invalid admin credentials."
          });
        }

        const [users] =
          await pool.query(
            `
            SELECT
              user_id,
              name,
              email,
              phone,
              password,
              role
            FROM users
            WHERE LOWER(TRIM(email)) = ?
            LIMIT 1
            `,
            [email]
          );

        let user = users?.[0];

        if (!user) {
          await loginAttemptTracker(
            email,
            ip,
            false
          );

          return res.status(401).json({
            success: false,
            error:
              "Invalid admin credentials."
          });
        }

        if (normalizeRole(user.role) !== "admin") {
          await loginAttemptTracker(
            email,
            ip,
            false
          );

          return res.status(401).json({
            success: false,
            error:
              "Invalid admin credentials."
          });
        }

        await clearLoginAttempts(
          pool,
          email,
          ip
        );

        await securityAuditLog(
          req,
          "ADMIN_PASSWORD_VERIFIED",
          {
            userId: user.user_id
          }
        );

        return res.json({
          success: true,
          verified: true,
          requires2FA: true,
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          message:
            "Credentials verified. Please complete two-factor authentication."
        });
      }

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            password,
            role
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [email]
        );

      /*
       * Do not reveal whether the email exists.
       */

      if (
        !users ||
        users.length === 0
      ) {
        await loginAttemptTracker(
          email,
          ip,
          false
        );

        return res.status(401).json({
          success: false,
          error:
            "Invalid admin credentials."
        });
      }

      const user = users[0];

      if (
        normalizeRole(user.role) !==
        "admin"
      ) {
        await loginAttemptTracker(
          email,
          ip,
          false
        );

        return res.status(401).json({
          success: false,
          error:
            "Invalid admin credentials."
        });
      }

      if (!user.password) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid admin credentials."
        });
      }

      const passwordValid =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordValid) {
        const trackerResult =
          await loginAttemptTracker(
            email,
            ip,
            false
          );

        if (trackerResult?.locked) {
          return res.status(429).json({
            success: false,
            error:
              `Too many failed login attempts. Please try again in ${calculateMinutesLeft(
                trackerResult.lockedUntil
              )} minutes.`
          });
        }

        return res.status(401).json({
          success: false,
          error:
            "Invalid admin credentials."
        });
      }

      /*
       * Credentials are valid.
       *
       * IMPORTANT:
       * No JWT is issued here.
       */

      await clearLoginAttempts(
        pool,
        email,
        ip
      );

      await securityAuditLog(
        req,
        "ADMIN_PASSWORD_VERIFIED",
        {
          userId: user.user_id
        }
      );

      return res.json({
        success: true,
        verified: true,
        requires2FA: true,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message:
          "Credentials verified. Please complete two-factor authentication."
      });

    } catch (error) {
      console.error(
        "Admin credential verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to verify admin credentials."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| SEND ADMIN 2FA
|--------------------------------------------------------------------------
| STEP 2
|--------------------------------------------------------------------------
*/

export const sendAdmin2FA =
  async (req, res) => {
    try {
      const {
        email: rawEmail
      } = req.body;

      const email =
        normalizeEmail(rawEmail);

      if (!email) {
        return res.status(400).json({
          success: false,
          error:
            "Admin email is required."
        });
      }

      const pool = getPool();

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [email]
        );

      /*
       * Generic response prevents account
       * enumeration.
       */

      if (
        !users ||
        users.length === 0 ||
        normalizeRole(users[0].role) !==
          "admin"
      ) {
        return res.status(200).json({
          success: true,
          requires2FA: true,
          message:
            "If the account is eligible, a verification code has been sent."
        });
      }

      const user = users[0];

      if (!user.email) {
        return res.status(400).json({
          success: false,
          error:
            "No email address is associated with this Admin account."
        });
      }

      /*
       * Generate cryptographically secure OTP.
       */

      const code =
        generateOtp();

      const otpHash =
        await bcrypt.hash(
          code,
          12
        );

      /*
       * Remove previous OTP.
       */

      await pool.query(
        `
        DELETE FROM otp_codes
        WHERE identifier = ?
          AND type = 'admin_2fa'
        `,
        [email]
      );

      /*
       * Expiration.
       */

      const expiresAt =
        new Date(
          Date.now() +
            ADMIN_OTP_EXPIRY_MINUTES *
              60 *
              1000
        );

      const expiresAtSql =
        expiresAt
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

      await pool.query(
        `
        INSERT INTO otp_codes
        (
          identifier,
          code,
          type,
          expires_at
        )
        VALUES (?, ?, 'admin_2fa', ?)
        `,
        [
          email,
          otpHash,
          expiresAtSql
        ]
      );

      /*
       * NEVER log the OTP.
       */

      try {
        await sendAdmin2FAEmail(
          user.email,
          user.name,
          code,
          ADMIN_OTP_EXPIRY_MINUTES
        );
      } catch (emailError) {
        const formattedError = formatEmailError(emailError);

        console.error(
          "Admin 2FA email error:",
          formattedError
        );

        await securityAuditLog(
          req,
          "ADMIN_2FA_EMAIL_FAILED",
          {
            userId: user.user_id,
            error: formattedError
          }
        );

        return res.status(502).json({
          success: false,
          error:
            "Unable to deliver the Admin verification code. Please try again later."
        });
      }

      await securityAuditLog(
        req,
        "ADMIN_2FA_SENT",
        {
          userId: user.user_id
        }
      );

      return res.json({
        success: true,
        requires2FA: true,
        message: "Verification code sent to your registered email."
      });

    } catch (error) {
      const formattedError = formatEmailError(error);

      console.error(
        "Admin 2FA send error:",
        formattedError
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to send Admin verification code."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| VERIFY ADMIN 2FA
|--------------------------------------------------------------------------
| STEP 3
|--------------------------------------------------------------------------
*/

export const verifyAdmin2FA =
  async (req, res) => {
    try {
      const {
        email: rawEmail,
        code
      } = req.body;

      const email =
        normalizeEmail(rawEmail);

      const cleanCode =
        String(code || "").trim();

      if (!email || !cleanCode) {
        return res.status(400).json({
          success: false,
          error:
            "Email and verification code are required."
        });
      }

      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          error:
            "Verification code must contain exactly 6 digits."
        });
      }

      const pool = getPool();

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role,
            region,
            city,
            sub_city,
            address,
            avatar
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [email]
        );

      if (
        !users ||
        users.length === 0
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid verification request."
        });
      }

      const user = users[0];

      if (
        normalizeRole(user.role) !==
        "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Admin access required."
        });
      }

      /*
       * Get active OTP.
       */

      const [rows] =
        await pool.query(
          `
          SELECT
            id,
            identifier,
            code,
            type,
            expires_at
          FROM otp_codes
          WHERE identifier = ?
            AND type = 'admin_2fa'
            AND expires_at > CURRENT_TIMESTAMP
          ORDER BY id DESC
          LIMIT 1
          `,
          [email]
        );

      if (
        !rows ||
        rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Verification code is invalid or expired. Please request a new code."
        });
      }

      const otpRecord =
        rows[0];

      /*
       * Compare OTP hash.
       */

      const valid =
        await bcrypt.compare(
          cleanCode,
          otpRecord.code
        );

      if (!valid) {
        await securityAuditLog(
          req,
          "ADMIN_2FA_FAILED",
          {
            userId: user.user_id
          }
        );

        await pool.query(
          `
          DELETE FROM otp_codes
          WHERE id = ?
          `,
          [otpRecord.id]
        );

        return res.status(401).json({
          success: false,
          error:
            "Invalid verification code."
        });
      }

      /*
       * One-time use.
       */

      await pool.query(
        `
        DELETE FROM otp_codes
        WHERE id = ?
        `,
        [otpRecord.id]
      );

      /*
       * Create JWT ONLY AFTER 2FA.
       */

      const token =
        createAccessToken({
          userId: user.user_id,
          role: user.role,
          twoFactorVerified: true
        });

      /*
       * IMPORTANT:
       * JWT is NOT returned in JSON.
       *
       * It is stored in HttpOnly cookie.
       */

      const csrfToken =
        setAuthCookies(
          res,
          token
        );

      await securityAuditLog(
        req,
        "ADMIN_2FA_SUCCESS",
        {
          userId: user.user_id
        }
      );

      return res.json({
        success: true,
        verified: true,
        csrfToken,
        message:
          "Admin authentication successful.",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          region: user.region,
          city: user.city,
          sub_city: user.sub_city,
          address: user.address,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error(
        "Admin 2FA verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to verify Admin authentication."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GENERAL OTP
|--------------------------------------------------------------------------
*/

export const sendOtpCode =
  async (req, res) => {
    try {
      const {
        identifier,
        phone,
        email,
        type = "register"
      } = req.body;

      const targetIdentifier =
        String(
          identifier ||
            email ||
            phone ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!targetIdentifier) {
        return res.status(400).json({
          success: false,
          error:
            "Phone or email identifier is required."
        });
      }

      /*
       * Prevent public endpoint from
       * creating Admin 2FA records.
       */

      if (type === "admin_2fa") {
        return res.status(403).json({
          success: false,
          error:
            "Invalid OTP request."
        });
      }

      const code =
        generateOtp();

      const otpHash =
        await bcrypt.hash(
          code,
          12
        );

      const pool =
        getPool();

      await pool.query(
        `
        DELETE FROM otp_codes
        WHERE identifier = ?
          AND type = ?
        `,
        [
          targetIdentifier,
          type
        ]
      );

      const expiresAt =
        new Date(
          Date.now() +
            GENERAL_OTP_EXPIRY_MINUTES *
              60 *
              1000
        );

      const expiresAtSql =
        expiresAt
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

      await pool.query(
        `
        INSERT INTO otp_codes
        (
          identifier,
          code,
          type,
          expires_at
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          targetIdentifier,
          otpHash,
          type,
          expiresAtSql
        ]
      );

      let smsSent = false;

      const targetPhone =
        phone ||
        (
          /^[0-9+]+$/.test(
            targetIdentifier
          )
            ? targetIdentifier
            : null
        );

      if (targetPhone) {
        try {
          await sendSMS(
            targetPhone,
            `[Injibara House Rental] Your verification code is ${code}. It expires in ${GENERAL_OTP_EXPIRY_MINUTES} minutes. Do not share this code.`
          );

          smsSent = true;

        } catch (error) {
          console.warn(
            "General OTP SMS failed:",
            error.message
          );
        }
      }

      /*
       * Do not claim email was delivered.
       *
       * There is no real email service in the
       * provided controller.
       */

      if (!smsSent) {
        return res.status(502).json({
          success: false,
          error:
            "Unable to deliver verification code."
        });
      }

      return res.json({
        success: true,
        message:
          "Verification code sent successfully.",
        identifier:
          targetIdentifier
      });

    } catch (error) {
      console.error(
        "sendOtpCode error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to send verification code."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GENERAL OTP VERIFY
|--------------------------------------------------------------------------
*/

export const verifyOtpCode =
  async (req, res) => {
    try {
      const {
        identifier,
        code
      } = req.body;

      const targetIdentifier =
        String(
          identifier || ""
        )
          .trim()
          .toLowerCase();

      const cleanCode =
        String(code || "").trim();

      if (
        !targetIdentifier ||
        !cleanCode
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Identifier and OTP code are required."
        });
      }

      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid verification code."
        });
      }

      const pool =
        getPool();

      const [rows] =
        await pool.query(
          `
          SELECT
            id,
            code,
            type,
            expires_at
          FROM otp_codes
          WHERE identifier = ?
            AND type <> 'admin_2fa'
            AND expires_at > CURRENT_TIMESTAMP
          ORDER BY id DESC
          LIMIT 1
          `,
          [targetIdentifier]
        );

      if (
        !rows ||
        rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid or expired verification code."
        });
      }

      const otpRecord =
        rows[0];

      const valid =
        await bcrypt.compare(
          cleanCode,
          otpRecord.code
        );

      if (!valid) {
        await pool.query(
          `
          DELETE FROM otp_codes
          WHERE id = ?
          `,
          [otpRecord.id]
        );

        return res.status(401).json({
          success: false,
          error:
            "Invalid verification code."
        });
      }

      await pool.query(
        `
        DELETE FROM otp_codes
        WHERE id = ?
        `,
        [otpRecord.id]
      );

      return res.json({
        success: true,
        verified: true,
        message:
          "OTP verified successfully."
      });

    } catch (error) {
      console.error(
        "verifyOtpCode error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to verify OTP."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This controller expects `protect` middleware.
|
| req.user.id comes from authMiddleware.
|
|--------------------------------------------------------------------------
*/

export const updateProfile =
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error:
            "Authentication required."
        });
      }

      const {
        name,
        phone,
        region,
        city,
        sub_city,
        address
      } = req.body;

      const cleanName =
        String(name || "").trim();

      const cleanPhone =
        normalizePhone(phone);

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          error:
            "Name is required."
        });
      }

      if (
        cleanPhone &&
        !isValidPhone(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid phone number."
        });
      }

      const pool =
        getPool();

      /*
       * Prevent duplicate phone numbers.
       */

      if (cleanPhone) {
        const [existing] =
          await pool.query(
            `
            SELECT user_id
            FROM users
            WHERE REPLACE(phone, ' ', '') = ?
              AND user_id <> ?
            LIMIT 1
            `,
            [
              cleanPhone,
              req.user.id
            ]
          );

        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            error:
              "This phone number is already in use."
          });
        }
      }

      let avatar =
        req.body.avatar || null;

      if (req.file) {
        avatar =
          `/uploads/${req.file.filename}`;
      }

      await pool.query(
        `
        UPDATE users
        SET
          name = ?,
          phone = ?,
          region = ?,
          city = ?,
          sub_city = ?,
          address = ?,
          avatar = ?
        WHERE user_id = ?
        `,
        [
          cleanName,
          cleanPhone,
          String(region || "").trim(),
          String(city || "").trim(),
          String(sub_city || "").trim(),
          String(address || "").trim(),
          avatar,
          req.user.id
        ]
      );

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role,
            region,
            city,
            sub_city,
            address,
            avatar
          FROM users
          WHERE user_id = ?
          LIMIT 1
          `,
          [req.user.id]
        );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          error:
            "User account not found."
        });
      }

      await securityAuditLog(
        req,
        "PROFILE_UPDATED",
        {
          userId: req.user.id
        }
      );

      return res.json({
        success: true,
        message:
          "Profile updated successfully.",
        user: users[0]
      });

    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to update profile."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/

export const getUserById =
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: "Authentication required."
        });
      }

      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid user ID."
        });
      }

      const requesterId =
        Number(req.user.id);

      const requesterRole =
        normalizeRole(req.user.role);

      if (
        requesterId !== userId &&
        requesterRole !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You are not allowed to view this account."
        });
      }

      const pool =
        getPool();

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role,
            region,
            city,
            avatar,
            last_seen
          FROM users
          WHERE user_id = ?
          LIMIT 1
          `,
          [userId]
        );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          error:
            "User not found."
        });
      }

      const user =
        users[0];

      const canSeePrivateData =
        requesterId === user.user_id ||
        requesterRole === "admin";

      const sanitized = {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        region: user.region,
        city: user.city,
        avatar: user.avatar,
        last_seen: user.last_seen
      };

      if (canSeePrivateData) {
        sanitized.email =
          user.email;

        sanitized.phone =
          user.phone;
      }

      return res.json(
        sanitized
      );

    } catch (error) {
      console.error(
        "Error fetching user:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to fetch user information."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET LANDLORDS
|--------------------------------------------------------------------------
*/

export const getLandlords =
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: "Authentication required."
        });
      }

      const pool =
        getPool();

      const [landlords] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role,
            region,
            city,
            sub_city
          FROM users
          WHERE role IN ('Landlord', 'Admin')
          ORDER BY name ASC
          `
        );

      const requesterRole =
        normalizeRole(req.user?.role);
      const isAdmin =
        requesterRole === "admin";

      const sanitized =
        landlords.map(
          (landlord) => ({
            user_id:
              landlord.user_id,
            name:
              landlord.name,
            role:
              landlord.role,
            region:
              landlord.region,
            city:
              landlord.city,
            sub_city:
              landlord.sub_city,
            ...(isAdmin
              ? {
                  email:
                    landlord.email,
                  phone:
                    landlord.phone
                }
              : {})
          })
        );

      return res.json(
        sanitized
      );

    } catch (error) {
      console.error(
        "Error fetching landlords:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to fetch landlords list."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Never return reset token to client.
|
| A real email service should deliver it.
|
|--------------------------------------------------------------------------
*/

export const forgotPassword =
  async (req, res) => {
    try {
      const {
        email: rawEmail
      } = req.body;

      const email =
        normalizeEmail(rawEmail);

      if (!email) {
        return res.status(400).json({
          success: false,
          error:
            "Email is required."
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide a valid email address."
        });
      }

      const pool =
        getPool();

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            email
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [email]
        );

      /*
       * Generic response prevents account enumeration.
       */

      if (!users.length) {
        return res.json({
          success: true,
          message:
            "If an account exists with this email, password reset instructions will be sent."
        });
      }

      const user =
        users[0];

      /*
       * Generate a random opaque reset token.
       *
       * We store only its SHA-256 hash.
       */

      const rawToken =
        crypto
          .randomBytes(48)
          .toString("hex");

      const tokenHash =
        crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");

      const expiresAt =
        new Date(
          Date.now() +
            60 * 60 * 1000
        );

      /*
       * Remove previous active tokens.
       */

      await pool.query(
        `
        UPDATE password_reset_tokens
        SET used = 1
        WHERE user_id = ?
          AND used = 0
        `,
        [user.user_id]
      );

      /*
       * Store HASH, not raw token.
       */

      await pool.query(
        `
        INSERT INTO password_reset_tokens
        (
          user_id,
          token,
          expires_at,
          created_at
        )
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          user.user_id,
          tokenHash,
          expiresAt
        ]
      );

      await securityAuditLog(
        req,
        "PASSWORD_RESET_REQUESTED",
        {
          userId: user.user_id
        }
      );

      /*
       * IMPORTANT:
       *
       * The current project does not contain
       * a real email sending service.
       *
       * Therefore we do NOT falsely claim that
       * an email was delivered and we do NOT
       * return the reset token.
       *
       * Connect your email service here.
       */

      return res.json({
        success: true,
        message:
          "If an account exists with this email, password reset instructions will be sent."
      });

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to process password reset request."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

export const resetPassword =
  async (req, res) => {
    try {
      const {
        token,
        newPassword
      } = req.body;

      if (
        !token ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Reset token and new password are required."
        });
      }

      if (
        typeof token !== "string" ||
        token.length < 40 ||
        token.length > 200
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid password reset request."
        });
      }

      if (
        !isStrongPassword(
          newPassword
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Password must be between 8 and 128 characters."
        });
      }

      const tokenHash =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      const pool =
        getPool();

      const [tokens] =
        await pool.query(
          `
          SELECT
            id,
            user_id
          FROM password_reset_tokens
          WHERE token = ?
            AND expires_at > CURRENT_TIMESTAMP
            AND used = 0
          LIMIT 1
          `,
          [tokenHash]
        );

      if (!tokens.length) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid or expired password reset token."
        });
      }

      const resetRecord =
        tokens[0];

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          12
        );

      await pool.query(
        `
        UPDATE users
        SET password = ?
        WHERE user_id = ?
        `,
        [
          hashedPassword,
          resetRecord.user_id
        ]
      );

      await pool.query(
        `
        UPDATE password_reset_tokens
        SET used = 1
        WHERE id = ?
        `,
        [resetRecord.id]
      );

      /*
       * Invalidate all other reset tokens.
       */

      await pool.query(
        `
        UPDATE password_reset_tokens
        SET used = 1
        WHERE user_id = ?
        `,
        [resetRecord.user_id]
      );

      await securityAuditLog(
        req,
        "PASSWORD_RESET_COMPLETED",
        {
          userId:
            resetRecord.user_id
        }
      );

      return res.json({
        success: true,
        message:
          "Password reset successfully. Please login again."
      });

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to reset password."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| REFRESH TOKEN
|--------------------------------------------------------------------------
*/

export const refreshToken =
  async (req, res) => {
    try {
      const token =
        req.cookies?.token ||
        (
          typeof req.headers.authorization ===
            "string" &&
          req.headers.authorization
            .toLowerCase()
            .startsWith("bearer ")
            ? req.headers.authorization
                .split(/\s+/)[1]
            : null
        );

      if (!token) {
        return res.status(401).json({
          success: false,
          error:
            "Authentication required."
        });
      }

      const decoded =
        jwt.verify(
          token,
          getJwtSecret(),
          { algorithms: ['HS256'] }
        );

      if (
        !decoded?.id
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid authentication token."
        });
      }

      const pool =
        getPool();

      const [users] =
        await pool.query(
          `
          SELECT
            user_id,
            name,
            email,
            phone,
            role,
            region,
            city,
            sub_city,
            address,
            avatar
          FROM users
          WHERE user_id = ?
          LIMIT 1
          `,
          [decoded.id]
        );

      if (!users.length) {
        clearAuthCookies(res);

        return res.status(401).json({
          success: false,
          error:
            "User account no longer exists."
        });
      }

      const user =
        users[0];

      /*
       * Preserve Admin 2FA status when
       * refreshing an authenticated Admin token.
       */

      const isAdmin =
        normalizeRole(user.role) ===
        "admin";

      if (
        isAdmin &&
        decoded.twoFactorVerified !== true
      ) {
        clearAuthCookies(res);

        return res.status(403).json({
          success: false,
          error:
            "Admin authentication requires two-factor verification."
        });
      }

      const newToken =
        createAccessToken({
          userId:
            user.user_id,
          role:
            user.role,
          twoFactorVerified:
            isAdmin
              ? true
              : false
        });

      const csrfToken =
        setAuthCookies(
          res,
          newToken
        );

      return res.json({
        success: true,
        csrfToken,
        user: getUserSafe(user)
      });

    } catch (error) {
      clearAuthCookies(res);

      return res.status(401).json({
        success: false,
        error:
          "Invalid or expired authentication token."
      });
    }
  };

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export const logout =
  async (req, res) => {
    try {
      const userId =
        req.user?.id || null;

      clearAuthCookies(res);

      await securityAuditLog(
        req,
        "LOGOUT",
        {
          userId
        }
      );

      return res.json({
        success: true,
        message:
          "Logged out successfully."
      });

    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      /*
       * Even if audit logging fails,
       * authentication cookies should already
       * be cleared.
       */

      return res.status(500).json({
        success: false,
        error:
          "Unable to complete logout."
      });
    }
  };