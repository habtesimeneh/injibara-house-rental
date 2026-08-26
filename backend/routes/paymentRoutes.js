import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { triggerPropertyAlerts } from '../services/alertService.js';
import { sendSMS } from '../services/smsService.js';
import multer from 'multer';
import path from 'path';
import { securityAuditLog, getAdminUserIds } from '../middleware/securityMiddleware.js';
import { paymentSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const PUBLIC_FEES = {
  featured_house: 'ad_fee_featured_house',
  tenant_seeking: 'ad_fee_tenant_seeking',
  tenant_contact: 'ad_fee_tenant_contact',
  banner: 'ad_fee_banner',
  landlord_post: 'ad_fee_landlord_post'
};

const PUBLIC_PAYMENTS = {
  telebirr: { phone: 'TELEBIRR_NO', name: 'TELEBIRR_NAME' },
  cbe: { account: 'CBE_ACCOUNT', name: 'CBE_ACCOUNT_NAME' },
  abyssinia: { account: 'ABYSSINIA_ACCOUNT', name: 'ABYSSINIA_ACCOUNT_NAME' },
  mpesa: { account: 'MPESA_ACCOUNT', name: 'MPESA_ACCOUNT_NAME' },
  amhara: { account: 'AMHARA_ACCOUNT', name: 'AMHARA_ACCOUNT_NAME' }
};

const buildGetEnvOrDbValue = (settings) => {
  return (envKey, dbKey, fallback = '') => {
    const envValue = process.env[envKey];
    const normalisedEnv = typeof envValue === 'string' ? envValue.trim() : '';
    if (normalisedEnv) return normalisedEnv;

    const dbValue = settings[dbKey];
    if (typeof dbValue === 'string') {
      const normalisedDb = dbValue.trim();
      if (normalisedDb) return normalisedDb;
    }

    if (dbValue !== undefined && dbValue !== null) {
      return String(dbValue);
    }

    return fallback;
  };
};

// Configure Multer for receipt uploads
const MIME_TO_EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
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
    const filetypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed as receipts'));
  }
});

// GET payment config (public payment accounts + fees) - All authenticated users
router.get('/config', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT key_name, value FROM website_settings');
    const settings = {};
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (r && r.key_name) {
          settings[r.key_name] = r.value;
        }
      });
    }

    const getEnvOrDbValue = buildGetEnvOrDbValue(settings);

    const fees = {};
    for (const [outKey, settingKey] of Object.entries(PUBLIC_FEES)) {
      fees[outKey] = settings[settingKey] || '';
    }

    const payments = {};
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
        payments[method] = entry;
      }
    }

    res.json({
      success: true,
      data: {
        fees,
        payments
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment config' });
  }
});

// GET public active payment accounts - Admin only (contains sensitive account info)
router.get('/accounts', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM payment_accounts WHERE is_active = 1 ORDER BY display_order ASC, id DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment accounts' });
  }
});

// POST submit payment request (User)
router.post('/submit', protect, paymentSubmissionLimiter, upload.single('receipt'), async (req, res) => {
  try {
    const { ad_type, house_id, seeking_ad_id, amount, payment_method, transaction_ref } = req.body;

    if (!ad_type || !amount || !payment_method || !transaction_ref) {
      return res.status(400).json({ error: 'Please fill all required payment fields (Type, Amount, Method, Ref Number).' });
    }

    // Server-side validation: ensure the submitted payment method is configured.
    const pool = getPool();
    const [settingsRows] = await pool.query('SELECT key_name, value FROM website_settings');
    const settings = {};
    if (Array.isArray(settingsRows)) {
      settingsRows.forEach(r => {
        if (r && r.key_name) settings[r.key_name] = r.value;
      });
    }

    const getEnvOrDbValue = buildGetEnvOrDbValue(settings);

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

    // Prevent duplicate submissions for the same single-time fee.
    // Backend remains authoritative: a tenant with an existing Pending or
    // Approved payment for this ad_type must not be charged again.
    const [existing] = await pool.query(
      `SELECT id, status FROM ad_payments
       WHERE user_id = ? AND ad_type = ? AND status IN ('Pending', 'Approved')
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, ad_type]
    );
    if (existing.length > 0) {
      const alreadyApproved = existing[0].status === 'Approved';
      return res.status(400).json({
        error: alreadyApproved
          ? 'You have already paid this fee. No further payment is required.'
          : 'You already have a pending payment for this fee. Please wait for admin approval.',
        duplicate: true,
        status: existing[0].status
      });
    }

    let receipt_url = null;
    if (req.file) {
      receipt_url = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO ad_payments (user_id, user_role, ad_type, house_id, seeking_ad_id, amount, payment_method, transaction_ref, receipt_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        req.user.id,
        req.user.role || 'Landlord',
        ad_type,
        house_id ? Number(house_id) : null,
        seeking_ad_id ? Number(seeking_ad_id) : null,
        Number(amount),
        payment_method,
        transaction_ref,
        receipt_url
      ]
    );

    // Notify admins
    const adminIds = await getAdminUserIds();
    if (adminIds.length > 0) {
      const notifPromises = adminIds.map(adminId =>
        pool.query(
          `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
          [adminId, 'New Ad Payment', `User #${req.user.id} submitted ${amount} ETB via ${payment_method} (Ref: ${transaction_ref})`]
        )
      );
      await Promise.all(notifPromises);
    }

    try {
      await securityAuditLog(req, 'PAYMENT_CREATED', {
        paymentId: result.insertId,
        adType: ad_type,
        amount: Number(amount)
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.status(201).json({
      message: 'Payment request submitted successfully. It will be reviewed by admin.',
      payment_id: result.insertId
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment request' });
  }
});

// GET my payment history (User)
router.get('/my-payments', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [payments] = await pool.query(
      `SELECT p.*, h.title as house_title, s.title as seeking_ad_title
       FROM ad_payments p
       LEFT JOIN houses h ON p.house_id = h.house_id
       LEFT JOIN tenant_seeking_ads s ON p.seeking_ad_id = s.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(payments || []);
  } catch (error) {
    console.error('Fetch my payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// GET tenant contact payment status
router.get('/tenant-status', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT status FROM ad_payments 
       WHERE user_id = ? AND ad_type = 'Tenant Contact Access' 
       ORDER BY id DESC LIMIT 1`,
      [req.user.id]
    );

    const [settingsRows] = await pool.query("SELECT value FROM website_settings WHERE key_name = 'ad_fee_tenant_contact'");
    const feeAmount = settingsRows.length > 0 ? Number(settingsRows[0].value) : 200;

    // Check if the user is Admin or Landlord (they don't need to pay this fee)
    const isExempt = req.user.role === 'Admin' || req.user.role === 'Landlord';

    if (isExempt) {
      return res.json({
        hasPaid: true,
        status: 'Approved',
        feeAmount,
        isExempt: true
      });
    }

    if (rows.length > 0) {
      res.json({
        hasPaid: rows[0].status === 'Approved',
        status: rows[0].status, // 'Pending', 'Approved', 'Rejected'
        feeAmount,
        isExempt: false
      });
    } else {
      res.json({
        hasPaid: false,
        status: 'None',
        feeAmount,
        isExempt: false
      });
    }
  } catch (err) {
    console.error('Error fetching tenant payment status:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// GET all payments (Admin only)
router.get('/admin/all', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [payments] = await pool.query(
      `SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
              h.title as house_title, s.title as seeking_ad_title
       FROM ad_payments p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN houses h ON p.house_id = h.house_id
       LEFT JOIN tenant_seeking_ads s ON p.seeking_ad_id = s.id
       ORDER BY p.created_at DESC`
    );
    res.json(payments || []);
  } catch (error) {
    console.error('Fetch admin payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT update payment status (Admin only)
router.put('/admin/:id/status', protect, authorize('Admin'), async (req, res) => {
  try {
    const { status, admin_notes, transaction_ref, payment_method } = req.body;
    const paymentId = req.params.id;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM ad_payments WHERE id = ?', [paymentId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = rows[0];

    // Update status and details
    await pool.query(
      `UPDATE ad_payments 
       SET status = ?, 
           admin_notes = ?, 
           transaction_ref = COALESCE(?, transaction_ref), 
           payment_method = COALESCE(?, payment_method) 
       WHERE id = ?`,
      [status, admin_notes || '', transaction_ref || null, payment_method || null, paymentId]
    );

    try {
      await securityAuditLog(req, 'PAYMENT_STATUS_CHANGED', {
        paymentId,
        newStatus: status,
        adType: payment.ad_type
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    // If approved, promote the house or seeking ad
    if (status === 'Approved') {
      if (payment.house_id) {
        await pool.query("UPDATE houses SET is_featured = 1, status = 'Available' WHERE house_id = ?", [payment.house_id]);
        // Trigger matching alerts for tenants now that house status is Available
        try {
          await triggerPropertyAlerts(payment.house_id);
        } catch (alertErr) {
          console.error('[PAYMENT ROUTE] Error triggering property alerts:', alertErr.message);
        }
      }
      if (payment.seeking_ad_id) {
        await pool.query("UPDATE tenant_seeking_ads SET is_featured = 1, status = 'Active' WHERE id = ?", [payment.seeking_ad_id]);
      }
    } else if (status === 'Rejected') {
      if (payment.house_id) {
        await pool.query("UPDATE houses SET is_featured = 0, status = 'Pending Approval' WHERE house_id = ?", [payment.house_id]);
      }
      if (payment.seeking_ad_id) {
        await pool.query("UPDATE tenant_seeking_ads SET is_featured = 0, status = 'Pending Approval' WHERE id = ?", [payment.seeking_ad_id]);
      }
    }

    // Send notification to user
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [
        payment.user_id,
        `Ad Payment ${status}`,
        `Your payment of ${payment.amount} ETB for ${payment.ad_type} (Ref: ${payment.transaction_ref}) was ${status.toLowerCase()}.${admin_notes ? ' Note: ' + admin_notes : ''}`
      ]
    );

    // Send automated email and SMS to the paying user
    try {
      const [userRows] = await pool.query('SELECT name, email, phone FROM users WHERE user_id = ?', [payment.user_id]);
      if (userRows && userRows.length > 0) {
        const payer = userRows[0];

        // 1. Send SMS
        if (payer.phone) {
          const cleanPhone = String(payer.phone).trim();
          if (cleanPhone) {
            const smsMsg = `Selam ${payer.name}! Your advertisement payment of ETB ${payment.amount} (Ref: ${payment.transaction_ref}) was ${status}. ${admin_notes ? 'Note: ' + admin_notes : ''} - Amhara House Rentals`;
            await sendSMS(cleanPhone, smsMsg);
          }
        }

        // 2. Log Email for preview/inbox
        if (payer.email) {
          const subject = `[Amhara House Rentals] Ad Payment ${status}`;
          const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #1e293b; max-width: 600px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: ${status === 'Approved' ? '#16a34a' : '#dc2626'}">Payment ${status}</h2>
              <p>Dear ${payer.name},</p>
              <p>Your advertisement payment of <strong>ETB ${payment.amount}</strong> for <strong>${payment.ad_type}</strong> (Ref: <code>${payment.transaction_ref}</code>) has been <strong>${status.toLowerCase()}</strong> by our administrator.</p>
              ${admin_notes ? `<div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin: 15px 0;"><strong>Message from admin:</strong> ${admin_notes}</div>` : ''}
              <p>Thank you for using our platform!</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
              <p style="font-size: 11px; color: #64748b; text-align: center;">Amhara House Rentals, Bahir Dar, Ethiopia</p>
            </div>
          `;
          await pool.query(
            'INSERT INTO email_logs (user_id, recipient_email, subject, body_html, status) VALUES (?, ?, ?, ?, ?)',
            [payment.user_id, payer.email, subject, emailHtml, 'Delivered']
          );
        }
      }
    } catch (notifErr) {
      console.error('[PAYMENT ROUTE] Error sending automated alerts to user:', notifErr.message);
    }

    res.json({ message: `Payment ${status} successfully.` });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST Admin manually add payment
router.post('/admin/add', protect, authorize('Admin'), upload.single('receipt'), async (req, res) => {
  try {
    const { user_id, user_role, ad_type, house_id, seeking_ad_id, amount, payment_method, transaction_ref, status, admin_notes } = req.body;

    if (!user_id || !ad_type || !amount || !payment_method || !transaction_ref) {
      return res.status(400).json({ error: 'Please provide User, Ad Type, Amount, Payment Method, and Reference Number.' });
    }

    let receipt_url = null;
    if (req.file) {
      receipt_url = `/uploads/${req.file.filename}`;
    }

    const payStatus = status || 'Approved';
    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO ad_payments (user_id, user_role, ad_type, house_id, seeking_ad_id, amount, payment_method, transaction_ref, receipt_url, status, admin_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(user_id),
        user_role || 'Landlord',
        ad_type,
        house_id ? Number(house_id) : null,
        seeking_ad_id ? Number(seeking_ad_id) : null,
        Number(amount),
        payment_method,
        transaction_ref,
        receipt_url,
        payStatus,
        admin_notes || 'Manually entered by Admin'
      ]
    );

    const paymentId = result.insertId;

    // Trigger actions if Approved
    if (payStatus === 'Approved') {
      if (house_id) {
        await pool.query("UPDATE houses SET is_featured = 1, status = 'Available' WHERE house_id = ?", [house_id]);
        try {
          await triggerPropertyAlerts(house_id);
        } catch (aErr) {
          console.error('Alert trigger error:', aErr);
        }
      }
      if (seeking_ad_id) {
        await pool.query("UPDATE tenant_seeking_ads SET is_featured = 1, status = 'Active' WHERE id = ?", [seeking_ad_id]);
      }
    }

    // Send user notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [
        user_id,
        `Payment Recorded (${payStatus})`,
        `Payment of ${amount} ETB via ${payment_method} (Ref: ${transaction_ref}) was recorded as ${payStatus.toLowerCase()}.`
      ]
    );

    try {
      await securityAuditLog(req, 'PAYMENT_CREATED', {
        paymentId,
        adType: ad_type,
        amount: Number(amount)
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.status(201).json({ message: 'Payment recorded successfully', payment_id: paymentId });
  } catch (error) {
    console.error('Admin add payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// DELETE Admin delete payment record
router.delete('/admin/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const paymentId = Number(req.params.id);
    await pool.query('DELETE FROM ad_payments WHERE id = ?', [paymentId]);

    try {
      await securityAuditLog(req, 'PAYMENT_DELETED', {
        paymentId
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.json({ message: 'Payment record deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment record' });
  }
});

export default router;
