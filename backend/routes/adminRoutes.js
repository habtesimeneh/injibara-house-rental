import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { protect, authorize } from '../middleware/authMiddleware.js';
import { securityAuditLog } from '../middleware/securityMiddleware.js';

import {
  adminUpload,

  // Users
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  updateAdminUserRole,

  // Houses
  getAdminHouses,
  createAdminHouse,
  updateAdminHouse,
  updateAdminHouseStatus,
  deleteAdminHouse,

  // Settings
  getAdminSettingsGrouped,
  getAdminSettingByKey,
  updateAdminSettings,
  deleteAdminSetting,

  // Payment Accounts
  getAdminPaymentAccounts,
  createAdminPaymentAccount,
  updateAdminPaymentAccount,
  deleteAdminPaymentAccount,

  // Categories
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,

  // SEO
  updateAdminSeo,
  deleteAdminSeo,

  // FAQs
  updateAdminFaq,

  // Locations
  getAdminLocations,
  createAdminLocation,
  updateAdminLocation,
  deleteAdminLocation,

  // Fees
  getAdminFees,
  updateAdminFees,

  // Dashboard
  getAdminStats,
  getAdminAnalytics,

  // AI Logs
  getAdminAiLogs,
  markAiLogAsRead,
  markAllAiLogsAsRead,
  deleteAiLog
} from '../controllers/adminController.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp'
]);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
|
| Resolve the upload directory relative to the project working directory.
| The directory is created automatically if it does not exist.
|
*/

const uploadDirectory = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

/*
|--------------------------------------------------------------------------
| Admin Authentication + Authorization
|--------------------------------------------------------------------------
|
| EVERY admin endpoint below is protected.
|
| protect:
|   - verifies JWT
|   - attaches authenticated user to req
|
| authorize("Admin"):
|   - ensures the authenticated user has admin permission
|
*/

router.use(protect);
router.use(authorize('Admin'));

/*
|--------------------------------------------------------------------------
| Security Audit
|--------------------------------------------------------------------------
|
| Audit logs should not contain passwords, tokens, files or request bodies.
| Only safe route/method information is recorded here.
|
*/

router.use((req, res, next) => {
  try {
    securityAuditLog(req, 'ADMIN_ACCESS', {
      path: req.path,
      method: req.method
    });
  } catch (error) {
    /*
     * Audit logging should never break a valid admin request.
     */
    console.error(
      'Security audit logging error:',
      error
    );
  }

  next();
});

/*
|--------------------------------------------------------------------------
| Multer Storage
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const mimeToExt = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp"
    };

    const safeExtension =
      mimeToExt[file.mimetype] || ".bin";

    const timestamp = Date.now();

    const randomPart = Math.random()
      .toString(36)
      .slice(2, 12);

    const safeFilename =
      `admin-${timestamp}-${randomPart}${safeExtension}`;

    cb(null, safeFilename);
  }
});

/*
|--------------------------------------------------------------------------
| Multer File Validation
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  try {
    const extension = path
      .extname(file.originalname || '')
      .toLowerCase();

    const mimeType = String(
      file.mimetype || ''
    ).toLowerCase();

    /*
     * Validate both extension and MIME type.
     */
    if (
      !ALLOWED_IMAGE_EXTENSIONS.has(extension) ||
      !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)
    ) {
      return cb(
        new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image')
      );
    }

    return cb(null, true);
  } catch (error) {
    return cb(error);
  }
};

/*
|--------------------------------------------------------------------------
| Multer Upload Middleware
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  },

  fileFilter
});

/*
|--------------------------------------------------------------------------
| Upload Route
|--------------------------------------------------------------------------
|
| POST /admin/upload
|
*/

router.post(
  '/upload',
  upload.single('image'),
  adminUpload
);

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

/*
 * GET    /admin/users
 * POST   /admin/users
 * PUT    /admin/users/:id
 * DELETE /admin/users/:id
 */

router.get(
  '/users',
  getAdminUsers
);

router.post(
  '/users',
  createAdminUser
);

router.put(
  '/users/:id',
  updateAdminUser
);

router.delete(
  '/users/:id',
  deleteAdminUser
);

router.put(
  '/users/:id/role',
  updateAdminUserRole
);

/*
|--------------------------------------------------------------------------
| HOUSES
|--------------------------------------------------------------------------
*/

router.get(
  '/houses',
  getAdminHouses
);

router.post(
  '/houses',
  createAdminHouse
);

router.put(
  '/houses/:id',
  updateAdminHouse
);

router.put(
  '/houses/:id/status',
  updateAdminHouseStatus
);

router.delete(
  '/houses/:id',
  deleteAdminHouse
);

/*
|--------------------------------------------------------------------------
| WEBSITE SETTINGS
|--------------------------------------------------------------------------
*/

router.get(
  '/settings',
  getAdminSettingsGrouped
);

router.get(
  '/settings/:key',
  getAdminSettingByKey
);

router.put(
  '/settings',
  updateAdminSettings
);

router.delete(
  '/settings/:key',
  deleteAdminSetting
);

/*
|--------------------------------------------------------------------------
| FAQS
|--------------------------------------------------------------------------
*/

router.put(
  '/about/faqs/:id',
  updateAdminFaq
);

/*
|--------------------------------------------------------------------------
| LOCATIONS
|--------------------------------------------------------------------------
*/

router.get(
  '/locations',
  getAdminLocations
);

router.post(
  '/locations',
  createAdminLocation
);

router.put(
  '/locations/:id',
  updateAdminLocation
);

router.delete(
  '/locations/:id',
  deleteAdminLocation
);

/*
|--------------------------------------------------------------------------
| FEES
|--------------------------------------------------------------------------
*/

router.get(
  '/fees',
  getAdminFees
);

router.put(
  '/fees',
  updateAdminFees
);

/*
|--------------------------------------------------------------------------
| PAYMENT ACCOUNTS
|--------------------------------------------------------------------------
*/

router.get(
  '/payment-accounts',
  getAdminPaymentAccounts
);

router.post(
  '/payment-accounts',
  createAdminPaymentAccount
);

router.put(
  '/payment-accounts/:id',
  updateAdminPaymentAccount
);

router.delete(
  '/payment-accounts/:id',
  deleteAdminPaymentAccount
);

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

router.get(
  '/categories',
  getAdminCategories
);

router.post(
  '/categories',
  createAdminCategory
);

router.put(
  '/categories/:id',
  updateAdminCategory
);

router.delete(
  '/categories/:id',
  deleteAdminCategory
);

/*
|--------------------------------------------------------------------------
| SEO
|--------------------------------------------------------------------------
*/

router.put(
  '/seo',
  updateAdminSeo
);

router.delete(
  '/seo/:id',
  deleteAdminSeo
);

/*
|--------------------------------------------------------------------------
| DASHBOARD STATS & ANALYTICS
|--------------------------------------------------------------------------
*/

router.get(
  '/stats',
  getAdminStats
);

router.get(
  '/analytics',
  getAdminAnalytics
);

/*
|--------------------------------------------------------------------------
| AI CHAT LOGS
|--------------------------------------------------------------------------
*/

router.get(
  '/ai-logs',
  getAdminAiLogs
);

router.put(
  '/ai-logs/read-all',
  markAllAiLogsAsRead
);

router.put(
  '/ai-logs/:id/read',
  markAiLogAsRead
);

router.delete(
  '/ai-logs/:id',
  deleteAiLog
);

/*
|--------------------------------------------------------------------------
| Multer / Upload Error Handler
|--------------------------------------------------------------------------
|
| This middleware only handles errors generated by routes in this router.
| It prevents ugly raw errors from reaching the client.
|
*/

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Image size must not exceed 5MB'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Only one image can be uploaded at a time'
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid image file. Only JPG, JPEG, PNG, GIF and WEBP are allowed'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid file upload'
    });
  }

  /*
   * Custom file validation error
   */
  if (
    error?.message &&
    error.message.toLowerCase().includes('image')
  ) {
    return res.status(400).json({
      success: false,
      error: 'Only valid image files are allowed'
    });
  }

  console.error(
    'Admin router error:',
    error
  );

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default router;