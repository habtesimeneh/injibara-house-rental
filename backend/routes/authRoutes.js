import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

import {
  authLimiter,
  otpLimiter,
  resetPasswordLimiter,
  refreshTokenLimiter,
  smsSendIpLimiter
} from "../middleware/rateLimiter.js";
import { protect } from "../middleware/authMiddleware.js";
import { UPLOAD_DIR } from "../config/uploadDir.js";

import {
  register,
  login,
  adminLogin,

  // Admin authentication / 2FA
  verifyAdminCredentials,
  sendAdmin2FA,
  verifyAdmin2FA,

  updateProfile,
  getUserById,
  getLandlords,

  forgotPassword,
  resetPassword,

  refreshToken,
  logout
} from "../controllers/authController.js";

const router = express.Router();

/* =========================================================
   AVATAR UPLOAD SECURITY
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex");

    const mimeToExt = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp"
    };

    const safeExtension = mimeToExt[file.mimetype] || ".bin";

    cb(
      null,
      `avatar-${Date.now()}-${randomName}${safeExtension}`
    );
  }
});

const avatarUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp"
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.includes(extension)
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP image files are allowed."
      )
    );
  }
});


/* =========================================================
   PUBLIC AUTHENTICATION
========================================================= */

// Register
router.post(
  "/register",
  authLimiter,
  register
);


// Normal user login
router.post(
  "/login",
  authLimiter,
  login
);


/* =========================================================
   ADMIN AUTHENTICATION
   IMPORTANT:
   Admin login MUST complete 2FA.
========================================================= */

// Legacy admin login kept for compatibility with the existing AdminLogin page
router.post(
  "/admin-login",
  authLimiter,
  adminLogin
);

// STEP 1
// Verify admin email + password
router.post(
  "/admin/verify-credentials",
  authLimiter,
  verifyAdminCredentials
);


// STEP 2
// Send OTP to registered admin phone
router.post(
  "/admin/send-2fa",
  authLimiter,
  smsSendIpLimiter,
  sendAdmin2FA
);


// STEP 3
// Verify OTP and finally issue JWT
router.post(
  "/admin/verify-2fa",
  authLimiter,
  otpLimiter,
  verifyAdmin2FA
);


/*
   DO NOT KEEP THIS:

   router.post('/admin-login', authLimiter, adminLogin);

   because the old adminLogin() issued a JWT before 2FA.
*/


/* =========================================================
   PASSWORD RESET
========================================================= */

router.post(
  "/forgot-password",
  authLimiter,
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPassword
);


/* =========================================================
   TOKEN / SESSION
========================================================= */

router.post(
  "/refresh-token",
  refreshTokenLimiter,
  refreshToken
);

router.post(
  "/logout",
  logout
);


/* =========================================================
   PROTECTED PROFILE
========================================================= */

router.put(
  "/profile",
  protect,
  avatarUpload.single("avatar_file"),
  updateProfile
);


/* =========================================================
   USER INFORMATION
========================================================= */

router.get(
  "/user/:id",
  protect,
  getUserById
);


router.get(
  "/landlords",
  protect,
  getLandlords
);


/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Image size must not exceed 5 MB."
      });
    }

    return res.status(400).json({
      error: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message || "Upload failed."
    });
  }

  next();
});


export default router;