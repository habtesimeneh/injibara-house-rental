import express from 'express';
import { getPool } from '../../database/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get logged-in user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(Array.isArray(notifications) ? notifications : []);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(200).json([]);
  }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Mark single notification read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
