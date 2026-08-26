import express from 'express';
import { getPool } from '../../database/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { triggerPropertyAlerts, generatePropertyEmailHTML } from '../services/alertService.js';

const router = express.Router();

// Get logged in tenant's saved search alerts
router.get('/my-alerts', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [alerts] = await pool.query(
      'SELECT * FROM property_alerts WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching property alerts:', error);
    res.status(500).json({ error: 'Failed to fetch saved property alerts' });
  }
});

// Create or update a property search alert
router.post('/', protect, async (req, res) => {
  try {
    const { house_type, min_price, max_price, location_keyword, min_rooms, notification_email } = req.body;
    const pool = getPool();

    const targetEmail = notification_email || req.user.email;

    // Check if user already has an alert for this criteria, or insert new
    const [result] = await pool.query(
      `INSERT INTO property_alerts (user_id, house_type, min_price, max_price, location_keyword, min_rooms, notification_email, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.id,
        house_type || 'All',
        min_price ? Number(min_price) : 0,
        max_price ? Number(max_price) : null,
        location_keyword ? String(location_keyword).trim() : '',
        min_rooms ? Number(min_rooms) : 0,
        targetEmail
      ]
    );

    res.status(201).json({
      message: 'የቤት ማሳወቂያ መስፈርት ተመዝግቧል! አዲስ ቤት ሲወጣ በኢሜይል ይደርስዎታል (Alert criteria saved successfully)',
      alert_id: result.insertId
    });
  } catch (error) {
    console.error('Error saving property alert:', error);
    res.status(500).json({ error: 'Failed to save property alert criteria' });
  }
});

// Delete property alert
router.delete('/:id', protect, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM property_alerts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'የቤት ማሳወቂያ ተሰርዟል (Alert deleted)' });
  } catch (error) {
    console.error('Error deleting property alert:', error);
    res.status(500).json({ error: 'Failed to delete property alert' });
  }
});

// Get email logs for logged in user (or all if admin)
router.get('/email-logs', protect, async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT e.*, h.title as house_title, h.image_url as house_image, h.price as house_price FROM email_logs e LEFT JOIN houses h ON e.house_id = h.house_id WHERE e.user_id = ? ORDER BY e.sent_at DESC';
    let params = [req.user.id];

    if (req.user.role === 'Admin') {
      query = 'SELECT e.*, h.title as house_title, h.image_url as house_image, h.price as house_price, u.name as user_name FROM email_logs e LEFT JOIN houses h ON e.house_id = h.house_id LEFT JOIN users u ON e.user_id = u.user_id ORDER BY e.sent_at DESC LIMIT 100';
      params = [];
    }

    const [logs] = await pool.query(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email notification logs' });
  }
});

// Test send / trigger alert email for preview
router.post('/test-send', protect, async (req, res) => {
  try {
    const { house_id } = req.body;
    const pool = getPool();

    let targetHouseId = house_id;
    if (!targetHouseId) {
      const [houses] = await pool.query('SELECT house_id FROM houses ORDER BY house_id DESC LIMIT 1');
      if (houses.length > 0) targetHouseId = houses[0].house_id;
    }

    const [houses] = await pool.query('SELECT * FROM houses WHERE house_id = ?', [targetHouseId || 0]);
    let house = houses[0];

    // If no house found in DB, use a professional mock house for preview purposes
    if (!house) {
      house = {
        house_id: 999,
        title: 'የሙከራ የመኖሪያ ቤት (Sample House for Preview)',
        price: 12000,
        city: 'እንጅባራ (Injibara)',
        sub_city: 'ቀበሌ 01 (Kebele 01)',
        address: 'በዩኒቨርሲቲው አቅራቢያ',
        type: 'የመኖሪያ ቤት',
        rooms: 3,
        bathrooms: 2,
        image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80',
        description: 'ይህ አውቶማቲክ ማሳወቂያ እንዴት እንደሚሰራ ለማሳየት የቀረበ የሙከራ ቤት መረጃ ነው።'
      };
    }

    const recipientEmail = req.user.email;
    const subject = `[እንጅባራ ቤት ኪራይ] አዲስ የሚስማማዎት ቤት ተመዝግቧል! - ${house.title}`;
    const emailHtml = generatePropertyEmailHTML(house, req.user);

    // Save notification & email log
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [req.user.id, 'አዲስ የሚስማማዎት ቤት ተፖስቷል! 🏠 (Test Alert)', `ከእርስዎ የፍለጋ መስፈርት ጋር የሚስማማ አዲስ ቤት ተመዝግቧል፡ "${house.title}"`]
    );

    const [result] = await pool.query(
      'INSERT INTO email_logs (user_id, recipient_email, subject, body_html, house_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, recipientEmail, subject, emailHtml, house.house_id, 'Delivered']
    );

    res.json({
      message: 'የሙከራ የኢሜይል ማሳወቂያ ተልኳል! (Test automated email generated and sent)',
      log_id: result.insertId,
      subject,
      recipientEmail
    });
  } catch (error) {
    console.error('Test alert send error:', error);
    res.status(500).json({ error: 'Failed to generate test email notification' });
  }
});

export default router;
