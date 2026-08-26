import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    try {
      await pool.query("ALTER TABLE announcements ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'promotional_notice'");
    } catch (e) {
      // Column already exists
    }
    
    const { type } = req.query;
    let query = 'SELECT * FROM announcements';
    const params = [];
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC';
    
    const [announcements] = await pool.query(query, params);
    res.json(announcements);
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Admin: Create announcement
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title_en, title_am, content_en, content_am, badge, is_active, type } = req.body;
    const pool = getPool();
    try {
      await pool.query("ALTER TABLE announcements ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'promotional_notice'");
    } catch (e) {}
    
    const [result] = await pool.query(
      'INSERT INTO announcements (title_en, title_am, content_en, content_am, badge, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title_en, title_am, content_en || '', content_am || '', badge || 'NEWS', is_active !== false ? 1 : 0, type || 'promotional_notice']
    );
    res.status(201).json({ message: 'Announcement created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Admin: Update announcement
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title_en, title_am, content_en, content_am, badge, is_active, type } = req.body;
    const pool = getPool();
    try {
      await pool.query("ALTER TABLE announcements ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'promotional_notice'");
    } catch (e) {}
    
    await pool.query(
      'UPDATE announcements SET title_en=?, title_am=?, content_en=?, content_am=?, badge=?, is_active=?, type=? WHERE id=?',
      [title_en, title_am, content_en || '', content_am || '', badge || 'NEWS', is_active !== false ? 1 : 0, type || 'promotional_notice', req.params.id]
    );
    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Admin: Delete announcement
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
