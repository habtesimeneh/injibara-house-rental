import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAdminUserIds } from '../middleware/securityMiddleware.js';
import { seekingAdLimiter } from '../middleware/rateLimiter.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure Multer for receipt uploads
const MIME_TO_EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf"
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeExtension = MIME_TO_EXT_MAP[file.mimetype] || '.bin';
    cb(null, 'receipt-' + uniqueSuffix + safeExtension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed as receipts'));
  }
});

// Get all active seeking ads (public)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [ads] = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar 
       FROM tenant_seeking_ads a 
       JOIN users u ON a.user_id = u.user_id 
       WHERE a.status = 'Active' 
       ORDER BY a.created_at DESC`
    );
    res.json(ads);
  } catch (error) {
    console.error('Fetch ads error:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Admin: Get all ads (any status)
router.get('/admin', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [ads] = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar 
       FROM tenant_seeking_ads a 
       JOIN users u ON a.user_id = u.user_id 
       ORDER BY a.created_at DESC`
    );
    res.json(ads);
  } catch (error) {
    console.error('Fetch admin ads error:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Get user's seeking ads
router.get('/my-ads', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [ads] = await pool.query(
      'SELECT * FROM tenant_seeking_ads WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your ads' });
  }
});

// Create a new ad (Tenant only)
router.post('/', protect, authorize('Tenant'), seekingAdLimiter, upload.single('receipt'), async (req, res) => {
  try {
    const { title, description, budget_max, preferred_location, house_type, payment_method, transaction_ref } = req.body;
    let receipt_url = '';

    if (req.file) {
      receipt_url = `/uploads/${req.file.filename}`;
    }

    if (!payment_method || !transaction_ref) {
      return res.status(400).json({ error: 'Please provide payment details (Payment Method and Transaction Reference) for the service fee.' });
    }

    const pool = getPool();
    const [settingsRows] = await pool.query('SELECT key_name, value FROM website_settings');
    const settings = {};
    if (Array.isArray(settingsRows)) {
      settingsRows.forEach(r => {
        if (r && r.key_name) settings[r.key_name] = r.value;
      });
    }

    const getEnvOrDbValue = (envKey, dbKey, fallback = '') => {
      const envValue = process.env[envKey];
      const normalisedEnv = typeof envValue === 'string' ? envValue.trim() : '';
      if (normalisedEnv) return normalisedEnv;
      const dbValue = settings[dbKey];
      if (typeof dbValue === 'string') {
        const normalisedDb = dbValue.trim();
        if (normalisedDb) return normalisedDb;
      }
      if (dbValue !== undefined && dbValue !== null) return String(dbValue);
      return fallback;
    };

    const PUBLIC_PAYMENTS = {
      telebirr: { phone: 'TELEBIRR_NO', name: 'TELEBIRR_NAME' },
      cbe: { account: 'CBE_ACCOUNT', name: 'CBE_ACCOUNT_NAME' },
      abyssinia: { account: 'ABYSSINIA_ACCOUNT', name: 'ABYSSINIA_ACCOUNT_NAME' },
      mpesa: { account: 'MPESA_ACCOUNT', name: 'MPESA_ACCOUNT_NAME' },
      amhara: { account: 'AMHARA_ACCOUNT', name: 'AMHARA_ACCOUNT_NAME' }
    };

    const configuredMethods = [];
    for (const [method, fields] of Object.entries(PUBLIC_PAYMENTS)) {
      const entry = {};
      let hasValue = false;
      for (const [field, envKey] of Object.entries(fields)) {
        const val = getEnvOrDbValue(envKey, envKey.toLowerCase(), '');
        if (val) {
          entry[field] = val;
          hasValue = true;
        }
      }
      if (hasValue) {
        configuredMethods.push(method);
      }
    }

    if (!configuredMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid or unconfigured payment method.' });
    }

    const [result] = await pool.query(
      "INSERT INTO tenant_seeking_ads (user_id, title, description, budget_max, preferred_location, house_type, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending Approval')",
      [req.user.id, title, description, budget_max, preferred_location, house_type || 'Apartment']
    );

    const [feeRow] = await pool.query("SELECT value FROM website_settings WHERE key_name = 'ad_fee_tenant_seeking'");
    const ad_fee = feeRow && feeRow[0] ? Number(feeRow[0].value) : 250;

    await pool.query(
      `INSERT INTO ad_payments (user_id, user_role, ad_type, seeking_ad_id, amount, payment_method, transaction_ref, receipt_url, status)
       VALUES (?, 'Tenant', 'Tenant Seeking Ad', ?, ?, ?, ?, ?, 'Pending')`,
      [req.user.id, result.insertId, ad_fee, payment_method, transaction_ref, receipt_url]
    );

    // Notify admins
    const adminIds = await getAdminUserIds();
    if (adminIds.length > 0) {
      const notifPromises = adminIds.map(adminId =>
        pool.query(
          `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
          [adminId, 'New Tenant Ad Payment', `Tenant ${req.user.name} submitted seeking ad "${title}" with payment of ${ad_fee} ETB via ${payment_method} (Ref: ${transaction_ref})`]
        )
      );
      await Promise.all(notifPromises);
    }

    res.status(201).json({ 
      message: 'Ad submitted successfully! Once admin approves your service fee payment, your ad will be active.', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Update ad status or content (Admin or Owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, budget_max, preferred_location, house_type, status } = req.body;
    const pool = getPool();
    
    // Check if user is authorized (Owner or Admin)
    const [ad] = await pool.query('SELECT user_id, status as existing_status FROM tenant_seeking_ads WHERE id = ?', [req.params.id]);
    if (ad.length === 0) return res.status(404).json({ error: 'Ad not found' });
    
    const isUserAdmin = String(req.user.role || "").trim().toLowerCase() === 'admin';
    if (ad[0].user_id !== req.user.id && !isUserAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!isUserAdmin && status !== undefined) {
      return res.status(403).json({ error: 'You are not authorized to modify ad status.' });
    }

    const finalStatus = isUserAdmin && status !== undefined ? status : ad[0].existing_status;

    await pool.query(
      'UPDATE tenant_seeking_ads SET title=?, description=?, budget_max=?, preferred_location=?, house_type=?, status=? WHERE id=?',
      [title, description, budget_max, preferred_location, house_type, finalStatus, req.params.id]
    );
    
    res.json({ message: 'Ad updated successfully' });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Delete an ad (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [ad] = await pool.query('SELECT user_id FROM tenant_seeking_ads WHERE id = ?', [req.params.id]);
    if (ad.length === 0) return res.status(404).json({ error: 'Ad not found' });
    
    if (ad[0].user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await pool.query('DELETE FROM tenant_seeking_ads WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

export default router;
