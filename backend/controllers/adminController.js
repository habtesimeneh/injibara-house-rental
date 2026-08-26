import { getPool } from '../../database/db.js';
import bcrypt from 'bcryptjs';
import { securityAuditLog } from '../middleware/securityMiddleware.js';
import { SENSITIVE_SETTING_KEYS } from '../routes/settingRoutes.js';

/*
|--------------------------------------------------------------------------
| Admin Controller
|--------------------------------------------------------------------------
| Goals:
| - Strong input validation
| - Safer admin/user management
| - Prevent accidental self-deletion
| - Prevent deleting the last admin
| - Prevent duplicate email/phone
| - Never use default passwords
| - Consistent API responses
| - Avoid exposing sensitive database errors
| - MySQL-compatible analytics
|--------------------------------------------------------------------------
*/

const ALLOWED_ROLES = ['admin', 'manager', 'employee', 'customer', 'tenant', 'landlord', 'broker'];

const HOUSE_STATUSES = [
  'Available',
  'Rented',
  'Reserved',
  'Unavailable',
  'Pending'
];

const PAYMENT_TYPES = [
  'Bank Transfer',
  'Telebirr',
  'Cash',
  'Other'
];

const MAX_AI_LOGS = 100;

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    error: message
  });
};

const sendSuccess = (res, status = 200, data = {}) => {
  return res.status(status).json({
    success: true,
    ...data
  });
};

const cleanString = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

const nullableString = (value) => {
  const cleaned = cleanString(value);
  return cleaned === '' ? null : cleaned;
};

const isValidEmail = (email) => {
  if (!email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  if (!phone) return false;

  /*
   * Allows:
   * +251912345678
   * 0912345678
   * 251912345678
   */
  return /^\+?[0-9]{9,15}$/.test(phone);
};

const isValidId = (id) => {
  return /^\d+$/.test(String(id || ''));
};

const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;

  /*
   * Minimum 8 characters.
   * bcrypt will handle the actual hashing.
   */
  return password.length >= 8 && password.length <= 128;
};

const normalizeRole = (role) => {
  return cleanString(role).toLowerCase();
};

const normalizeStatus = (status) => {
  const value = cleanString(status);

  return HOUSE_STATUSES.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  ) || null;
};

const normalizePaymentType = (paymentType) => {
  const value = cleanString(paymentType);

  return PAYMENT_TYPES.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  ) || null;
};

const getCurrentAdminId = (req) => {
  return (
    req.user?.user_id ??
    req.user?.id ??
    req.admin?.user_id ??
    req.admin?.id ??
    null
  );
};

const isAdminRole = (role) => {
  return normalizeRole(role) === 'admin';
};

const isEmptyBody = (body) => {
  return !body || typeof body !== 'object' || Array.isArray(body);
};

/*
|--------------------------------------------------------------------------
| Upload
|--------------------------------------------------------------------------
*/

export const adminUpload = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image uploaded');
    }

    /*
     * multer should already handle file type/size restrictions.
     * This additional check prevents unexpected files from being returned.
     */
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (
      req.file.mimetype &&
      !allowedMimeTypes.includes(req.file.mimetype)
    ) {
      return sendError(res, 400, 'Only valid image files are allowed');
    }

    const filename = cleanString(req.file.filename);

    if (!filename) {
      return sendError(res, 400, 'Uploaded file is invalid');
    }

    const image_url = `/uploads/${encodeURIComponent(filename)}`;

    return sendSuccess(res, 200, {
      message: 'Image uploaded successfully',
      image_url
    });
  } catch (error) {
    console.error('Admin upload error:', error);

    return sendError(
      res,
      500,
      'Server error during upload'
    );
  }
};

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

export const getAdminUsers = async (req, res) => {
  try {
    const pool = getPool();

    const [users] = await pool.query(`
      SELECT
        user_id,
        name,
        email,
        phone,
        role,
        region,
        city,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return sendSuccess(res, 200, {
      users: users || []
    });
  } catch (error) {
    console.error('Get admin users error:', error);

    return sendError(res, 500, 'Failed to fetch users');
  }
};

export const createAdminUser = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const {
      name,
      email,
      phone,
      role,
      password,
      city,
      region
    } = req.body;

    const cleanName = cleanString(name);
    const cleanEmail = cleanString(email).toLowerCase();
    const cleanPhone = cleanString(phone);
    const cleanRole = normalizeRole(role);
    const cleanCity = nullableString(city);
    const cleanRegion = nullableString(region);

    /*
     * Required fields
     */
    if (!cleanName) {
      return sendError(res, 400, 'Name is required');
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      return sendError(
        res,
        400,
        'Name must be between 2 and 100 characters'
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return sendError(res, 400, 'A valid email address is required');
    }

    if (!isValidPhone(cleanPhone)) {
      return sendError(res, 400, 'A valid phone number is required');
    }

    if (!ALLOWED_ROLES.includes(cleanRole)) {
      return sendError(res, 400, 'Invalid user role');
    }

    /*
     * IMPORTANT:
     * Never create an account with a hard-coded/default password.
     */
    if (!isValidPassword(password)) {
      return sendError(
        res,
        400,
        'Password must be between 8 and 128 characters'
      );
    }

    const pool = getPool();

    /*
     * Duplicate check
     */
    const [existing] = await pool.query(
      `
        SELECT user_id, email, phone
        FROM users
        WHERE email = ? OR phone = ?
        LIMIT 1
      `,
      [cleanEmail, cleanPhone]
    );

    if (existing.length > 0) {
      const duplicate = existing[0];

      if (
        duplicate.email &&
        duplicate.email.toLowerCase() === cleanEmail
      ) {
        return sendError(
          res,
          409,
          'A user with this email already exists'
        );
      }

      return sendError(
        res,
        409,
        'A user with this phone number already exists'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `
        INSERT INTO users
        (
          name,
          email,
          phone,
          role,
          password,
          city,
          region
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanRole,
        hashedPassword,
        cleanCity,
        cleanRegion
      ]
    );

    try {
      await securityAuditLog(req, 'USER_CREATED', {
        userId: result.insertId,
        role: cleanRole
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return sendSuccess(res, 201, {
      message: 'User created successfully',
      user_id: result.insertId
    });
  } catch (error) {
    console.error('Create admin user error:', error);

    /*
     * Do not expose raw SQL/database errors to clients.
     */
    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(
        res,
        409,
        'Email or phone number already exists'
      );
    }

    return sendError(res, 500, 'Failed to create user');
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid user ID');
    }

    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const userId = Number(req.params.id);

    const {
      name,
      email,
      phone,
      role,
      city,
      region,
      password
    } = req.body;

    const cleanName = cleanString(name);
    const cleanEmail = cleanString(email).toLowerCase();
    const cleanPhone = cleanString(phone);
    const cleanRole = normalizeRole(role);
    const cleanCity = nullableString(city);
    const cleanRegion = nullableString(region);

    if (!cleanName) {
      return sendError(res, 400, 'Name is required');
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      return sendError(
        res,
        400,
        'Name must be between 2 and 100 characters'
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return sendError(res, 400, 'A valid email address is required');
    }

    if (!isValidPhone(cleanPhone)) {
      return sendError(res, 400, 'A valid phone number is required');
    }

    if (!ALLOWED_ROLES.includes(cleanRole)) {
      return sendError(res, 400, 'Invalid user role');
    }

    if (
      password !== undefined &&
      cleanString(password) !== '' &&
      !isValidPassword(password)
    ) {
      return sendError(
        res,
        400,
        'Password must be between 8 and 128 characters'
      );
    }

    const pool = getPool();

    /*
     * Verify target user exists
     */
    const [targetRows] = await pool.query(
      `
        SELECT user_id, role
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (targetRows.length === 0) {
      return sendError(res, 404, 'User not found');
    }

    const currentTarget = targetRows[0];
    const currentAdminId = getCurrentAdminId(req);

    /*
     * Prevent an admin from accidentally removing their own admin role.
     */
    if (
      currentAdminId &&
      Number(currentAdminId) === userId &&
      !isAdminRole(cleanRole)
    ) {
      return sendError(
        res,
        403,
        'You cannot remove your own administrator role'
      );
    }

    /*
     * If an admin is being changed to another role,
     * make sure another admin remains.
     */
    if (
      isAdminRole(currentTarget.role) &&
      !isAdminRole(cleanRole)
    ) {
      const [adminCountRows] = await pool.query(
        `
          SELECT COUNT(*) AS count
          FROM users
          WHERE LOWER(role) = 'admin'
        `
      );

      const adminCount = Number(adminCountRows[0]?.count || 0);

      if (adminCount <= 1) {
        return sendError(
          res,
          403,
          'The last administrator cannot be demoted'
        );
      }
    }

    /*
     * Duplicate email/phone check excluding current user.
     */
    const [duplicates] = await pool.query(
      `
        SELECT user_id, email, phone
        FROM users
        WHERE (email = ? OR phone = ?)
          AND user_id <> ?
        LIMIT 1
      `,
      [cleanEmail, cleanPhone, userId]
    );

    if (duplicates.length > 0) {
      const duplicate = duplicates[0];

      if (
        duplicate.email &&
        duplicate.email.toLowerCase() === cleanEmail
      ) {
        return sendError(
          res,
          409,
          'Another user already uses this email'
        );
      }

      return sendError(
        res,
        409,
        'Another user already uses this phone number'
      );
    }

    /*
     * Update password only when explicitly supplied.
     */
    if (cleanString(password) !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);

      await pool.query(
        `
          UPDATE users
          SET
            name = ?,
            email = ?,
            phone = ?,
            role = ?,
            city = ?,
            region = ?,
            password = ?
          WHERE user_id = ?
        `,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          cleanRole,
          cleanCity,
          cleanRegion,
          hashedPassword,
          userId
        ]
      );
    } else {
      await pool.query(
        `
          UPDATE users
          SET
            name = ?,
            email = ?,
            phone = ?,
            role = ?,
            city = ?,
            region = ?
          WHERE user_id = ?
        `,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          cleanRole,
          cleanCity,
          cleanRegion,
          userId
        ]
      );
    }

    try {
      await securityAuditLog(req, 'USER_UPDATED', {
        userId,
        role: cleanRole
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return sendSuccess(res, 200, {
      message: 'User account updated successfully'
    });
  } catch (error) {
    console.error('Update admin user error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(
        res,
        409,
        'Email or phone number already exists'
      );
    }

    return sendError(res, 500, 'Failed to update user account');
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid user ID');
    }

    const userId = Number(req.params.id);
    const currentAdminId = getCurrentAdminId(req);

    /*
     * Never allow an admin to delete their own account through
     * this endpoint.
     */
    if (
      currentAdminId &&
      Number(currentAdminId) === userId
    ) {
      return sendError(
        res,
        403,
        'You cannot delete your own administrator account'
      );
    }

    const pool = getPool();

    const [users] = await pool.query(
      `
        SELECT user_id, role
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (users.length === 0) {
      return sendError(res, 404, 'User not found');
    }

    const targetUser = users[0];

    /*
     * Prevent deleting the last admin.
     */
    if (isAdminRole(targetUser.role)) {
      const [adminCountRows] = await pool.query(
        `
          SELECT COUNT(*) AS count
          FROM users
          WHERE LOWER(role) = 'admin'
        `
      );

      const adminCount = Number(adminCountRows[0]?.count || 0);

      if (adminCount <= 1) {
        return sendError(
          res,
          403,
          'The last administrator cannot be deleted'
        );
      }
    }

    /*
     * Foreign key constraints may prevent deletion when the user
     * owns houses or has related records.
     *
     * We deliberately let the database protect referential integrity.
     */
    try {
      await pool.query(
        'DELETE FROM users WHERE user_id = ?',
        [userId]
      );
    } catch (deleteError) {
      if (
        deleteError?.code === 'ER_ROW_IS_REFERENCED_2' ||
        deleteError?.code === 'ER_ROW_IS_REFERENCED'
      ) {
        return sendError(
          res,
          409,
          'This user has related records and cannot be deleted'
        );
      }

      throw deleteError;
    }

    try {
      await securityAuditLog(req, 'USER_DELETED', {
        userId
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return sendSuccess(res, 200, {
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);

    return sendError(res, 500, 'Failed to delete user');
  }
};

export const updateAdminUserRole = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid user ID');
    }

    const userId = Number(req.params.id);
    const cleanRole = normalizeRole(req.body?.role);
    const currentAdminId = getCurrentAdminId(req);

    if (!ALLOWED_ROLES.includes(cleanRole)) {
      return sendError(res, 400, 'Invalid user role');
    }

    /*
     * Prevent self-demotion.
     */
    if (
      currentAdminId &&
      Number(currentAdminId) === userId &&
      !isAdminRole(cleanRole)
    ) {
      return sendError(
        res,
        403,
        'You cannot remove your own administrator role'
      );
    }

    const pool = getPool();

    const [users] = await pool.query(
      `
        SELECT user_id, role
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (users.length === 0) {
      return sendError(res, 404, 'User not found');
    }

    const currentRole = users[0].role;

    /*
     * Protect the last administrator.
     */
    if (
      isAdminRole(currentRole) &&
      !isAdminRole(cleanRole)
    ) {
      const [adminCountRows] = await pool.query(
        `
          SELECT COUNT(*) AS count
          FROM users
          WHERE LOWER(role) = 'admin'
        `
      );

      const adminCount = Number(adminCountRows[0]?.count || 0);

      if (adminCount <= 1) {
        return sendError(
          res,
          403,
          'The last administrator cannot be demoted'
        );
      }
    }

    await pool.query(
      `
        UPDATE users
        SET role = ?
        WHERE user_id = ?
      `,
      [cleanRole, userId]
    );

    try {
      await securityAuditLog(req, 'USER_ROLE_CHANGED', {
        userId,
        newRole: cleanRole
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return sendSuccess(res, 200, {
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update admin user role error:', error);

    return sendError(res, 500, 'Failed to update user role');
  }
};

/*
|--------------------------------------------------------------------------
| HOUSES
|--------------------------------------------------------------------------
*/

export const getAdminHouses = async (req, res) => {
  try {
    const pool = getPool();

    const [houses] = await pool.query(`
      SELECT
        h.*,
        u.name AS owner_name
      FROM houses h
      LEFT JOIN users u
        ON h.owner_id = u.user_id
      ORDER BY h.created_at DESC
    `);

    return sendSuccess(res, 200, {
      houses: houses || []
    });
  } catch (error) {
    console.error('Get admin houses error:', error);

    return sendError(res, 500, 'Failed to fetch houses');
  }
};

export const createAdminHouse = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const {
      title,
      type,
      price,
      address,
      area,
      bedrooms,
      bathrooms,
      description,
      image_url,
      status,
      owner_id
    } = req.body;

    const cleanTitle = cleanString(title);
    const cleanType = cleanString(type);
    const cleanAddress = cleanString(address);
    const cleanDescription = nullableString(description);
    const cleanImageUrl = nullableString(image_url);
    const cleanStatus = normalizeStatus(status || 'Available');

    if (!cleanTitle) {
      return sendError(res, 400, 'House title is required');
    }

    if (!cleanType) {
      return sendError(res, 400, 'House type is required');
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return sendError(res, 400, 'Invalid house price');
    }

    if (!cleanAddress) {
      return sendError(res, 400, 'House address is required');
    }

    if (!cleanStatus) {
      return sendError(res, 400, 'Invalid house status');
    }

    const numericBedrooms =
      bedrooms === undefined ||
      bedrooms === null ||
      bedrooms === ''
        ? 0
        : Number(bedrooms);

    const numericBathrooms =
      bathrooms === undefined ||
      bathrooms === null ||
      bathrooms === ''
        ? 0
        : Number(bathrooms);

    const numericArea =
      area === undefined ||
      area === null ||
      area === ''
        ? null
        : Number(area);

    if (
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0
    ) {
      return sendError(res, 400, 'Invalid bedroom count');
    }

    if (
      !Number.isInteger(numericBathrooms) ||
      numericBathrooms < 0
    ) {
      return sendError(res, 400, 'Invalid bathroom count');
    }

    if (
      numericArea !== null &&
      (!Number.isFinite(numericArea) || numericArea < 0)
    ) {
      return sendError(res, 400, 'Invalid area');
    }

    const pool = getPool();

    let ownerId = null;

    if (
      owner_id !== undefined &&
      owner_id !== null &&
      owner_id !== ''
    ) {
      if (!isValidId(owner_id)) {
        return sendError(res, 400, 'Invalid owner ID');
      }

      ownerId = Number(owner_id);

      const [owners] = await pool.query(
        `
          SELECT user_id
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [ownerId]
      );

      if (owners.length === 0) {
        return sendError(res, 404, 'House owner not found');
      }
    }

    const [result] = await pool.query(
      `
        INSERT INTO houses
        (
          title,
          type,
          price,
          address,
          area,
          bedrooms,
          bathrooms,
          description,
          image_url,
          status,
          owner_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cleanTitle,
        cleanType,
        numericPrice,
        cleanAddress,
        numericArea,
        numericBedrooms,
        numericBathrooms,
        cleanDescription,
        cleanImageUrl,
        cleanStatus,
        ownerId
      ]
    );

    return sendSuccess(res, 201, {
      message: 'House created successfully',
      house_id: result.insertId
    });
  } catch (error) {
    console.error('Create admin house error:', error);

    return sendError(res, 500, 'Failed to create house');
  }
};

export const updateAdminHouse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid house ID');
    }

    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const houseId = Number(req.params.id);

    const {
      title,
      type,
      price,
      address,
      area,
      bedrooms,
      bathrooms,
      description,
      image_url,
      status
    } = req.body;

    const cleanTitle = cleanString(title);
    const cleanType = cleanString(type);
    const cleanAddress = cleanString(address);
    const cleanDescription = nullableString(description);
    const cleanImageUrl = nullableString(image_url);
    const cleanStatus = normalizeStatus(status);

    if (!cleanTitle) {
      return sendError(res, 400, 'House title is required');
    }

    if (!cleanType) {
      return sendError(res, 400, 'House type is required');
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return sendError(res, 400, 'Invalid house price');
    }

    if (!cleanAddress) {
      return sendError(res, 400, 'House address is required');
    }

    if (!cleanStatus) {
      return sendError(res, 400, 'Invalid house status');
    }

    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);
    const numericArea =
      area === undefined ||
      area === null ||
      area === ''
        ? null
        : Number(area);

    if (
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0
    ) {
      return sendError(res, 400, 'Invalid bedroom count');
    }

    if (
      !Number.isInteger(numericBathrooms) ||
      numericBathrooms < 0
    ) {
      return sendError(res, 400, 'Invalid bathroom count');
    }

    if (
      numericArea !== null &&
      (!Number.isFinite(numericArea) || numericArea < 0)
    ) {
      return sendError(res, 400, 'Invalid area');
    }

    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT house_id
        FROM houses
        WHERE house_id = ?
        LIMIT 1
      `,
      [houseId]
    );

    if (existing.length === 0) {
      return sendError(res, 404, 'House not found');
    }

    await pool.query(
      `
        UPDATE houses
        SET
          title = ?,
          type = ?,
          price = ?,
          address = ?,
          area = ?,
          bedrooms = ?,
          bathrooms = ?,
          description = ?,
          image_url = ?,
          status = ?
        WHERE house_id = ?
      `,
      [
        cleanTitle,
        cleanType,
        numericPrice,
        cleanAddress,
        numericArea,
        numericBedrooms,
        numericBathrooms,
        cleanDescription,
        cleanImageUrl,
        cleanStatus,
        houseId
      ]
    );

    return sendSuccess(res, 200, {
      message: 'House updated successfully'
    });
  } catch (error) {
    console.error('Update admin house error:', error);

    return sendError(res, 500, 'Failed to update house');
  }
};

export const updateAdminHouseStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid house ID');
    }

    const cleanStatus = normalizeStatus(req.body?.status);

    if (!cleanStatus) {
      return sendError(res, 400, 'Invalid house status');
    }

    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT house_id
        FROM houses
        WHERE house_id = ?
        LIMIT 1
      `,
      [Number(req.params.id)]
    );

    if (existing.length === 0) {
      return sendError(res, 404, 'House not found');
    }

    await pool.query(
      `
        UPDATE houses
        SET status = ?
        WHERE house_id = ?
      `,
      [cleanStatus, Number(req.params.id)]
    );

    return sendSuccess(res, 200, {
      message: 'House status updated successfully'
    });
  } catch (error) {
    console.error('Update house status error:', error);

    return sendError(res, 500, 'Failed to update house status');
  }
};

export const deleteAdminHouse = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid house ID');
    }

    const houseId = Number(req.params.id);
    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT house_id
        FROM houses
        WHERE house_id = ?
        LIMIT 1
      `,
      [houseId]
    );

    if (existing.length === 0) {
      return sendError(res, 404, 'House not found');
    }

    try {
      await pool.query(
        'DELETE FROM houses WHERE house_id = ?',
        [houseId]
      );
    } catch (deleteError) {
      if (
        deleteError?.code === 'ER_ROW_IS_REFERENCED_2' ||
        deleteError?.code === 'ER_ROW_IS_REFERENCED'
      ) {
        return sendError(
          res,
          409,
          'This house has related records and cannot be deleted'
        );
      }

      throw deleteError;
    }

    return sendSuccess(res, 200, {
      message: 'House deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin house error:', error);

    return sendError(res, 500, 'Failed to delete house');
  }
};

/*
|--------------------------------------------------------------------------
| WEBSITE SETTINGS
|--------------------------------------------------------------------------
*/

export const updateAdminSettings = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Settings data is required');
    }

    const pool = getPool();

    const entries = Object.entries(req.body);

    if (entries.length === 0) {
      return sendError(res, 400, 'No settings provided');
    }

    for (const [key, value] of entries) {
      const cleanKey = cleanString(key);

      if (!cleanKey) {
        continue;
      }

      if (cleanKey.length > 150) {
        return sendError(
          res,
          400,
          'Setting key is too long'
        );
      }

      if (value === undefined || value === null) {
        continue;
      }

      const stringValue =
        typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

      /*
       * MySQL version.
       */
    await pool.query(
      `
        INSERT INTO website_settings
        (key_name, value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          value = VALUES(value)
      `,
      [cleanKey, stringValue]
    );
  }

  await securityAuditLog(req, 'SETTINGS_UPDATED', {
    keys: entries.map(([k]) => k)
  });

  return sendSuccess(res, 200, {
    message: 'Settings updated successfully'
  });
  } catch (error) {
    console.error('Update settings error:', error);

    return sendError(res, 500, 'Failed to update settings');
  }
};

export const deleteAdminSetting = async (req, res) => {
  try {
    const key = cleanString(req.params.key);

    if (!key) {
      return sendError(res, 400, 'Setting key is required');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        DELETE FROM website_settings
        WHERE key_name = ?
      `,
      [key]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'Setting not found');
    }

    await securityAuditLog(req, 'SETTINGS_DELETED', {
      key
    });

    return sendSuccess(res, 200, {
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin setting error:', error);

    return sendError(res, 500, 'Failed to delete setting');
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN SETTINGS - GROUPED
|--------------------------------------------------------------------------
*/

export const getAdminSettingsGrouped = async (req, res) => {
  try {
    const pool = getPool();

    const [settings] = await pool.query('SELECT key_name, value FROM website_settings');
    const website = {};
    for (const s of settings) {
      if (SENSITIVE_SETTING_KEYS.has(s.key_name)) continue;
      website[s.key_name] = s.value;
    }

    const [paymentAccounts] = await pool.query('SELECT * FROM payment_accounts ORDER BY display_order ASC, id DESC');
    const [seoRows] = await pool.query('SELECT * FROM seo_meta ORDER BY route_path ASC');
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    const [announcements] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    const [heroSlides] = await pool.query('SELECT * FROM hero_slides ORDER BY display_order ASC, id DESC');
    const [authSlides] = await pool.query('SELECT * FROM auth_slides ORDER BY display_order ASC, id DESC');
    const [contactPage] = await pool.query('SELECT * FROM contact_page LIMIT 1');
    const [contactOffices] = await pool.query('SELECT * FROM contact_offices ORDER BY display_order ASC, id DESC');
    const [contactPhones] = await pool.query('SELECT * FROM contact_phones ORDER BY display_order ASC, id DESC');
    const [aboutPage] = await pool.query('SELECT * FROM about_page LIMIT 1');
    const [aboutFaqs] = await pool.query('SELECT * FROM about_faqs ORDER BY display_order ASC, id DESC');
    const [testimonials] = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    const [authPageSettings] = await pool.query('SELECT * FROM auth_page_settings LIMIT 1');
    const [locations] = await pool.query('SELECT * FROM locations ORDER BY region ASC, city ASC');

    return sendSuccess(res, 200, {
      website,
      payment_config: website,
      payment_accounts: paymentAccounts || [],
      seo: seoRows || [],
      categories: categories || [],
      announcements: announcements || [],
      hero_slides: heroSlides || [],
      auth_slides: authSlides || [],
      contact_page: contactPage[0] || {},
      contact_offices: contactOffices || [],
      contact_phones: contactPhones || [],
      about_page: aboutPage[0] || {},
      about_faqs: aboutFaqs || [],
      testimonials: testimonials || [],
      auth_page_settings: authPageSettings[0] || {},
      locations: locations || []
    });
  } catch (error) {
    console.error('Get grouped settings error:', error);
    return sendError(res, 500, 'Failed to fetch settings');
  }
};

export const getAdminSettingByKey = async (req, res) => {
  try {
    const key = cleanString(req.params.key);
    if (!key) {
      return sendError(res, 400, 'Setting key is required');
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT key_name, value FROM website_settings WHERE key_name = ? LIMIT 1', [key]);

    if (rows.length === 0) {
      return sendError(res, 404, 'Setting not found');
    }

    return sendSuccess(res, 200, rows[0]);
  } catch (error) {
    console.error('Get setting error:', error);
    return sendError(res, 500, 'Failed to fetch setting');
  }
};

/*
|--------------------------------------------------------------------------
| ABOUT FAQS - UPDATE
|--------------------------------------------------------------------------
*/

export const updateAdminFaq = async (req, res) => {
  try {
    const faqId = Number(req.params.id);

    if (!Number.isInteger(faqId) || faqId <= 0) {
      return sendError(res, 400, 'Invalid FAQ ID');
    }

    const {
      question_en,
      question_am,
      answer_en,
      answer_am,
      display_order
    } = req.body;

    const cleanQuestionEn = cleanString(question_en);
    const cleanQuestionAm = cleanString(question_am);
    const cleanAnswerEn = nullableString(answer_en);
    const cleanAnswerAm = nullableString(answer_am);
    const cleanDisplayOrder = display_order !== undefined ? Number(display_order) : 0;

    if (!cleanQuestionEn || !cleanQuestionAm) {
      return sendError(res, 400, 'FAQ question is required in both languages');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
      UPDATE about_faqs
      SET question_en = ?, question_am = ?, answer_en = ?, answer_am = ?, display_order = ?
      WHERE id = ?
      `,
      [
        cleanQuestionEn,
        cleanQuestionAm,
        cleanAnswerEn,
        cleanAnswerAm,
        cleanDisplayOrder,
        faqId
      ]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'FAQ not found');
    }

    await securityAuditLog(req, 'FAQ_UPDATED', {
      faqId
    });

    return sendSuccess(res, 200, {
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    return sendError(res, 500, 'Failed to update FAQ');
  }
};

/*
|--------------------------------------------------------------------------
| LOCATIONS
|--------------------------------------------------------------------------
*/

export const getAdminLocations = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM locations ORDER BY region ASC, city ASC');
    return sendSuccess(res, 200, rows || []);
  } catch (error) {
    console.error('Get locations error:', error);
    return sendError(res, 500, 'Failed to fetch locations');
  }
};

export const createAdminLocation = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const { region, city } = req.body;
    const cleanRegion = cleanString(region);
    const cleanCity = cleanString(city);

    if (!cleanRegion || !cleanCity) {
      return sendError(res, 400, 'Region and city are required');
    }

    const pool = getPool();

    try {
      const [result] = await pool.query(
        'INSERT INTO locations (region, city) VALUES (?, ?)',
        [cleanRegion, cleanCity]
      );

      await securityAuditLog(req, 'LOCATION_CREATED', {
        locationId: result.insertId,
        region: cleanRegion,
        city: cleanCity
      });

      return sendSuccess(res, 201, {
        message: 'Location created successfully',
        id: result.insertId
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, 409, 'This region/city combination already exists');
      }
      throw err;
    }
  } catch (error) {
    console.error('Create location error:', error);
    return sendError(res, 500, 'Failed to create location');
  }
};

export const updateAdminLocation = async (req, res) => {
  try {
    const locationId = Number(req.params.id);

    if (!Number.isInteger(locationId) || locationId <= 0) {
      return sendError(res, 400, 'Invalid location ID');
    }

    const { region, city } = req.body;
    const cleanRegion = cleanString(region);
    const cleanCity = cleanString(city);

    if (!cleanRegion || !cleanCity) {
      return sendError(res, 400, 'Region and city are required');
    }

    const pool = getPool();

    try {
      const [result] = await pool.query(
        'UPDATE locations SET region = ?, city = ? WHERE id = ?',
        [cleanRegion, cleanCity, locationId]
      );

      if (result.affectedRows === 0) {
        return sendError(res, 404, 'Location not found');
      }

      await securityAuditLog(req, 'LOCATION_UPDATED', {
        locationId,
        region: cleanRegion,
        city: cleanCity
      });

      return sendSuccess(res, 200, {
        message: 'Location updated successfully'
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, 409, 'This region/city combination already exists');
      }
      throw err;
    }
  } catch (error) {
    console.error('Update location error:', error);
    return sendError(res, 500, 'Failed to update location');
  }
};

export const deleteAdminLocation = async (req, res) => {
  try {
    const locationId = Number(req.params.id);

    if (!Number.isInteger(locationId) || locationId <= 0) {
      return sendError(res, 400, 'Invalid location ID');
    }

    const pool = getPool();

    const [houseRows] = await pool.query(
      'SELECT COUNT(*) as cnt FROM houses WHERE region = (SELECT region FROM locations WHERE id = ?) OR city = (SELECT city FROM locations WHERE id = ?)',
      [locationId, locationId]
    );

    const houseCount = Number(houseRows[0]?.cnt || 0);
    if (houseCount > 0) {
      return sendError(res, 409, `Cannot delete location: ${houseCount} house(s) reference this location. Remove or reassign them first.`);
    }

    const [result] = await pool.query('DELETE FROM locations WHERE id = ?', [locationId]);

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'Location not found');
    }

    await securityAuditLog(req, 'LOCATION_DELETED', {
      locationId
    });

    return sendSuccess(res, 200, {
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    return sendError(res, 500, 'Failed to delete location');
  }
};

/*
|--------------------------------------------------------------------------
| FEES
|--------------------------------------------------------------------------
*/

export const getAdminFees = async (req, res) => {
  try {
    const pool = getPool();
    const feeKeys = [
      'ad_fee_featured_house',
      'ad_fee_tenant_seeking',
      'ad_fee_tenant_contact',
      'ad_fee_banner'
    ];

    const [rows] = await pool.query(
      `SELECT key_name, value FROM website_settings WHERE key_name IN (${feeKeys.map(() => '?').join(',')})`,
      feeKeys
    );

    const fees = {};
    for (const row of rows) {
      fees[row.key_name] = row.value;
    }

    return sendSuccess(res, 200, fees);
  } catch (error) {
    console.error('Get fees error:', error);
    return sendError(res, 500, 'Failed to fetch fees');
  }
};

export const updateAdminFees = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Fee data is required');
    }

    const pool = getPool();
    const allowedKeys = [
      'ad_fee_featured_house',
      'ad_fee_tenant_seeking',
      'ad_fee_tenant_contact',
      'ad_fee_banner'
    ];

    const updates = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (!allowedKeys.includes(key)) continue;
      if (value === undefined || value === null) continue;

      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) {
        return sendError(res, 400, `Invalid fee value for ${key}`);
      }

      updates.push({ key, value: String(numVal) });
    }

    if (updates.length === 0) {
      return sendError(res, 400, 'No valid fee keys provided');
    }

    for (const u of updates) {
      await pool.query(
        `
        INSERT INTO website_settings (key_name, value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
        `,
        [u.key, u.value]
      );
    }

    await securityAuditLog(req, 'FEES_UPDATED', {
      keys: updates.map(u => u.key)
    });

    return sendSuccess(res, 200, {
      message: 'Fees updated successfully'
    });
  } catch (error) {
    console.error('Update fees error:', error);
    return sendError(res, 500, 'Failed to update fees');
  }
};

export const getAdminPaymentAccounts = async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.query(`
      SELECT *
      FROM payment_accounts
      ORDER BY display_order ASC, id DESC
    `);

    return sendSuccess(res, 200, {
      paymentAccounts: rows || []
    });
  } catch (error) {
    console.error('Get payment accounts error:', error);

    return sendError(
      res,
      500,
      'Failed to fetch payment accounts'
    );
  }
};

export const createAdminPaymentAccount = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const {
      bank_name,
      account_name,
      account_number,
      payment_type,
      instructions,
      qr_code_url,
      is_active
    } = req.body;

    const cleanBankName = cleanString(bank_name);
    const cleanAccountName = cleanString(account_name);
    const cleanAccountNumber = cleanString(account_number);
    const cleanInstructions = nullableString(instructions);
    const cleanQrCodeUrl = nullableString(qr_code_url);

    const cleanPaymentType = normalizePaymentType(
      payment_type || 'Bank Transfer'
    );

    if (!cleanBankName) {
      return sendError(res, 400, 'Bank/payment provider name is required');
    }

    if (!cleanAccountName) {
      return sendError(res, 400, 'Account name is required');
    }

    if (!cleanAccountNumber) {
      return sendError(res, 400, 'Account number is required');
    }

    if (!cleanPaymentType) {
      return sendError(res, 400, 'Invalid payment type');
    }

    const active =
      is_active === undefined
        ? 1
        : is_active === true ||
          is_active === 1 ||
          is_active === '1'
          ? 1
          : 0;

    const pool = getPool();

    const [result] = await pool.query(
      `
        INSERT INTO payment_accounts
        (
          bank_name,
          account_name,
          account_number,
          payment_type,
          instructions,
          qr_code_url,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cleanBankName,
        cleanAccountName,
        cleanAccountNumber,
        cleanPaymentType,
        cleanInstructions || '',
        cleanQrCodeUrl || '',
        active
      ]
    );

    return sendSuccess(res, 201, {
      message: 'Payment account added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create payment account error:', error);

    return sendError(
      res,
      500,
      'Failed to add payment account'
    );
  }
};

export const updateAdminPaymentAccount = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid payment account ID');
    }

    const {
      bank_name,
      account_name,
      account_number,
      payment_type,
      instructions,
      qr_code_url,
      is_active
    } = req.body;

    const cleanBankName = cleanString(bank_name);
    const cleanAccountName = cleanString(account_name);
    const cleanAccountNumber = cleanString(account_number);
    const cleanInstructions = nullableString(instructions);
    const cleanQrCodeUrl = nullableString(qr_code_url);

    const cleanPaymentType = normalizePaymentType(
      payment_type
    );

    if (!cleanBankName) {
      return sendError(res, 400, 'Bank/payment provider name is required');
    }

    if (!cleanAccountName) {
      return sendError(res, 400, 'Account name is required');
    }

    if (!cleanAccountNumber) {
      return sendError(res, 400, 'Account number is required');
    }

    if (!cleanPaymentType) {
      return sendError(res, 400, 'Invalid payment type');
    }

    const active =
      is_active === true ||
      is_active === 1 ||
      is_active === '1'
        ? 1
        : 0;

    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT id
        FROM payment_accounts
        WHERE id = ?
        LIMIT 1
      `,
      [Number(req.params.id)]
    );

    if (existing.length === 0) {
      return sendError(res, 404, 'Payment account not found');
    }

    await pool.query(
      `
        UPDATE payment_accounts
        SET
          bank_name = ?,
          account_name = ?,
          account_number = ?,
          payment_type = ?,
          instructions = ?,
          qr_code_url = ?,
          is_active = ?
        WHERE id = ?
      `,
      [
        cleanBankName,
        cleanAccountName,
        cleanAccountNumber,
        cleanPaymentType,
        cleanInstructions || '',
        cleanQrCodeUrl || '',
        active,
        Number(req.params.id)
      ]
    );

    return sendSuccess(res, 200, {
      message: 'Payment account updated successfully'
    });
  } catch (error) {
    console.error('Update payment account error:', error);

    return sendError(
      res,
      500,
      'Failed to update payment account'
    );
  }
};

export const deleteAdminPaymentAccount = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid payment account ID');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        DELETE FROM payment_accounts
        WHERE id = ?
      `,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'Payment account not found');
    }

    return sendSuccess(res, 200, {
      message: 'Payment account deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment account error:', error);

    return sendError(
      res,
      500,
      'Failed to delete payment account'
    );
  }
};

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

export const getAdminCategories = async (req, res) => {
  try {
    const pool = getPool();

    const [categories] = await pool.query(`
      SELECT *
      FROM categories
      ORDER BY id DESC
    `);

    return sendSuccess(res, 200, {
      categories: categories || []
    });
  } catch (error) {
    console.error('Get categories error:', error);

    return sendError(res, 500, 'Failed to fetch categories');
  }
};

export const createAdminCategory = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'Request body is required');
    }

    const {
      name,
      name_am,
      description,
      description_am,
      font_size,
      image_url
    } = req.body;

    const cleanName = cleanString(name);

    if (!cleanName) {
      return sendError(res, 400, 'Category name is required');
    }

    const numericFontSize =
      font_size === undefined ||
      font_size === null ||
      font_size === ''
        ? null
        : Number(font_size);

    if (
      numericFontSize !== null &&
      (!Number.isFinite(numericFontSize) ||
        numericFontSize <= 0 ||
        numericFontSize > 200)
    ) {
      return sendError(res, 400, 'Invalid font size');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        INSERT INTO categories
        (
          name,
          name_am,
          description,
          description_am,
          font_size,
          image_url
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        cleanName,
        nullableString(name_am),
        nullableString(description),
        nullableString(description_am),
        numericFontSize,
        nullableString(image_url)
      ]
    );

    return sendSuccess(res, 201, {
      message: 'Category added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create category error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(
        res,
        409,
        'A category with this name already exists'
      );
    }

    return sendError(res, 500, 'Failed to add category');
  }
};

export const updateAdminCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid category ID');
    }

    const {
      name,
      name_am,
      description,
      description_am,
      font_size,
      image_url
    } = req.body;

    const cleanName = cleanString(name);

    if (!cleanName) {
      return sendError(res, 400, 'Category name is required');
    }

    const numericFontSize =
      font_size === undefined ||
      font_size === null ||
      font_size === ''
        ? null
        : Number(font_size);

    if (
      numericFontSize !== null &&
      (!Number.isFinite(numericFontSize) ||
        numericFontSize <= 0 ||
        numericFontSize > 200)
    ) {
      return sendError(res, 400, 'Invalid font size');
    }

    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT id
        FROM categories
        WHERE id = ?
        LIMIT 1
      `,
      [Number(req.params.id)]
    );

    if (existing.length === 0) {
      return sendError(res, 404, 'Category not found');
    }

    await pool.query(
      `
        UPDATE categories
        SET
          name = ?,
          name_am = ?,
          description = ?,
          description_am = ?,
          font_size = ?,
          image_url = ?
        WHERE id = ?
      `,
      [
        cleanName,
        nullableString(name_am),
        nullableString(description),
        nullableString(description_am),
        numericFontSize,
        nullableString(image_url),
        Number(req.params.id)
      ]
    );

    return sendSuccess(res, 200, {
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);

    return sendError(res, 500, 'Failed to update category');
  }
};

export const deleteAdminCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid category ID');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        DELETE FROM categories
        WHERE id = ?
      `,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'Category not found');
    }

    return sendSuccess(res, 200, {
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);

    if (
      error?.code === 'ER_ROW_IS_REFERENCED_2' ||
      error?.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return sendError(
        res,
        409,
        'This category is being used and cannot be deleted'
      );
    }

    return sendError(res, 500, 'Failed to delete category');
  }
};

/*
|--------------------------------------------------------------------------
| SEO
|--------------------------------------------------------------------------
*/

export const updateAdminSeo = async (req, res) => {
  try {
    if (isEmptyBody(req.body)) {
      return sendError(res, 400, 'SEO data is required');
    }

    const {
      route_path,
      title,
      description,
      keywords,
      og_image
    } = req.body;

    const cleanRoutePath = cleanString(route_path);
    const cleanTitle = cleanString(title);
    const cleanDescription = cleanString(description);
    const cleanKeywords = cleanString(keywords);
    const cleanOgImage = cleanString(og_image);

    if (!cleanRoutePath) {
      return sendError(res, 400, 'Route path is required');
    }

    if (!cleanTitle) {
      return sendError(res, 400, 'SEO title is required');
    }

    if (cleanRoutePath.length > 500) {
      return sendError(res, 400, 'Route path is too long');
    }

    if (cleanTitle.length > 255) {
      return sendError(res, 400, 'SEO title is too long');
    }

    const pool = getPool();

    const [existing] = await pool.query(
      `
        SELECT id
        FROM seo_meta
        WHERE route_path = ?
        LIMIT 1
      `,
      [cleanRoutePath]
    );

    if (existing.length > 0) {
      await pool.query(
        `
          UPDATE seo_meta
          SET
            title = ?,
            description = ?,
            keywords = ?,
            og_image = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE route_path = ?
        `,
        [
          cleanTitle,
          cleanDescription,
          cleanKeywords,
          cleanOgImage,
          cleanRoutePath
        ]
      );
    } else {
      await pool.query(
        `
          INSERT INTO seo_meta
          (
            route_path,
            title,
            description,
            keywords,
            og_image
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          cleanRoutePath,
          cleanTitle,
          cleanDescription,
          cleanKeywords,
          cleanOgImage
        ]
      );
    }

    return sendSuccess(res, 200, {
      message: 'SEO meta updated successfully'
    });
  } catch (error) {
    console.error('Update SEO error:', error);

    return sendError(
      res,
      500,
      'Failed to update SEO metadata'
    );
  }
};

export const deleteAdminSeo = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid SEO ID');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        DELETE FROM seo_meta
        WHERE id = ?
      `,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'SEO metadata not found');
    }

    return sendSuccess(res, 200, {
      message: 'SEO meta deleted successfully'
    });
  } catch (error) {
    console.error('Delete SEO error:', error);

    return sendError(
      res,
      500,
      'Failed to delete SEO metadata'
    );
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN STATS
|--------------------------------------------------------------------------
*/

export const getAdminStats = async (req, res) => {
  try {
    const pool = getPool();

    const [
      [users],
      [houses],
      [requests],
      [active]
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS count
        FROM users
      `),

      pool.query(`
        SELECT COUNT(*) AS count
        FROM houses
      `),

      pool.query(`
        SELECT COUNT(*) AS count
        FROM rental_requests
      `),

      pool.query(`
        SELECT COUNT(*) AS count
        FROM houses
        WHERE status = 'Rented'
      `)
    ]);

    return sendSuccess(res, 200, {
      totalUsers: Number(users[0]?.count || 0),
      totalHouses: Number(houses[0]?.count || 0),
      totalRequests: Number(requests[0]?.count || 0),
      activeRentals: Number(active[0]?.count || 0)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);

    return sendError(res, 500, 'Failed to fetch dashboard statistics');
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN ANALYTICS
|--------------------------------------------------------------------------
| IMPORTANT:
| The previous implementation used SQLite strftime().
| This version uses MySQL DATE_FORMAT().
|--------------------------------------------------------------------------
*/

export const getAdminAnalytics = async (req, res) => {
  try {
    const pool = getPool();

    const [
      [rentsByDay],
      [housesByDay],
      [rentsByMonth],
      [housesByMonth],
      [rentsByYear],
      [housesByYear]
    ] = await Promise.all([
      /*
       * Daily rental requests
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
          SUM(
            CASE
              WHEN status = 'Approved' THEN 1
              ELSE 0
            END
          ) AS successful,
          SUM(
            CASE
              WHEN status = 'Rejected' THEN 1
              ELSE 0
            END
          ) AS failed
        FROM rental_requests
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date DESC
        LIMIT 30
      `),

      /*
       * Daily houses
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
          COUNT(house_id) AS total
        FROM houses
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date DESC
        LIMIT 30
      `),

      /*
       * Monthly rental requests
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS date,
          SUM(
            CASE
              WHEN status = 'Approved' THEN 1
              ELSE 0
            END
          ) AS successful,
          SUM(
            CASE
              WHEN status = 'Rejected' THEN 1
              ELSE 0
            END
          ) AS failed
        FROM rental_requests
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY date DESC
        LIMIT 12
      `),

      /*
       * Monthly houses
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS date,
          COUNT(house_id) AS total
        FROM houses
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY date DESC
        LIMIT 12
      `),

      /*
       * Yearly rental requests
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y') AS date,
          SUM(
            CASE
              WHEN status = 'Approved' THEN 1
              ELSE 0
            END
          ) AS successful,
          SUM(
            CASE
              WHEN status = 'Rejected' THEN 1
              ELSE 0
            END
          ) AS failed
        FROM rental_requests
        GROUP BY DATE_FORMAT(created_at, '%Y')
        ORDER BY date DESC
        LIMIT 5
      `),

      /*
       * Yearly houses
       */
      pool.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y') AS date,
          COUNT(house_id) AS total
        FROM houses
        GROUP BY DATE_FORMAT(created_at, '%Y')
        ORDER BY date DESC
        LIMIT 5
      `)
    ]);

    const normalizeNumberFields = (rows, fields) => {
      return (rows || []).reverse().map((row) => {
        const normalized = { ...row };

        for (const field of fields) {
          if (normalized[field] !== undefined) {
            normalized[field] = Number(normalized[field] || 0);
          }
        }

        return normalized;
      });
    };

    return sendSuccess(res, 200, {
      daily: {
        rents: normalizeNumberFields(
          rentsByDay,
          ['successful', 'failed']
        ),
        houses: normalizeNumberFields(
          housesByDay,
          ['total']
        )
      },

      monthly: {
        rents: normalizeNumberFields(
          rentsByMonth,
          ['successful', 'failed']
        ),
        houses: normalizeNumberFields(
          housesByMonth,
          ['total']
        )
      },

      yearly: {
        rents: normalizeNumberFields(
          rentsByYear,
          ['successful', 'failed']
        ),
        houses: normalizeNumberFields(
          housesByYear,
          ['total']
        )
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);

    return sendError(
      res,
      500,
      'Failed to fetch analytics'
    );
  }
};

/*
|--------------------------------------------------------------------------
| AI CHAT LOGS
|--------------------------------------------------------------------------
*/

export const getAdminAiLogs = async (req, res) => {
  try {
    const pool = getPool();

    const [logs] = await pool.query(
      `
        SELECT
          ai.*,
          u.name AS user_name,
          u.email AS user_email
        FROM ai_chats ai
        LEFT JOIN users u
          ON ai.user_id = u.user_id
        ORDER BY ai.created_at DESC
        LIMIT ?
      `,
      [MAX_AI_LOGS]
    );

    const normalized = (logs || []).map((log) => ({
      ...log,

      /*
       * Keep compatibility with both possible column names.
       */
      prompt: log.user_message || log.prompt || '',
      response: log.ai_response || log.response || '',

      /*
       * Do not expose unnecessary sensitive user data.
       * user_name/email are retained because the admin UI
       * may need them.
       */
      is_read:
        Boolean(log.is_read)
    }));

    return sendSuccess(res, 200, {
      logs: normalized
    });
  } catch (error) {
    console.error('Failed to fetch AI logs:', error);

    return sendError(
      res,
      500,
      'Failed to fetch AI chat logs'
    );
  }
};

export const markAiLogAsRead = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid AI log ID');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        UPDATE ai_chats
        SET is_read = 1
        WHERE id = ?
      `,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'AI chat log not found');
    }

    return sendSuccess(res, 200, {
      message: 'Chat log marked as read'
    });
  } catch (error) {
    console.error('Failed to mark AI log as read:', error);

    return sendError(
      res,
      500,
      'Failed to update AI chat log'
    );
  }
};

export const markAllAiLogsAsRead = async (req, res) => {
  try {
    const pool = getPool();

    await pool.query(`
      UPDATE ai_chats
      SET is_read = 1
      WHERE is_read = 0
         OR is_read IS NULL
    `);

    return sendSuccess(res, 200, {
      message: 'All AI chat logs marked as read'
    });
  } catch (error) {
    console.error(
      'Failed to mark all AI logs as read:',
      error
    );

    return sendError(
      res,
      500,
      'Failed to update AI chat logs'
    );
  }
};

export const deleteAiLog = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, 'Invalid AI log ID');
    }

    const pool = getPool();

    const [result] = await pool.query(
      `
        DELETE FROM ai_chats
        WHERE id = ?
      `,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'AI chat log not found');
    }

    return sendSuccess(res, 200, {
      message: 'AI chat log deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete AI log:', error);

    return sendError(
      res,
      500,
      'Failed to delete AI chat log'
    );
  }
};