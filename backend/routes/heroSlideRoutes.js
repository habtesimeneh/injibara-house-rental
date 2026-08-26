import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Get all active slides
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [slides] = await pool.query('SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// Admin: Get all slides
router.get('/admin', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [slides] = await pool.query('SELECT * FROM hero_slides ORDER BY created_at DESC');
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// Admin: Create slide
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      title_en, title_am, subtitle_en, subtitle_am, 
      description_en, description_am, 
      button_text_en, button_text_am, button_url,
      image_url, is_active, display_order 
    } = req.body;
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO hero_slides (
        title_en, title_am, subtitle_en, subtitle_am, 
        description_en, description_am, 
        button_text_en, button_text_am, button_url,
        image_url, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title_en || '', title_am || '', subtitle_en || '', subtitle_am || '',
        description_en || '', description_am || '',
        button_text_en || '', button_text_am || '', button_url || '',
        image_url || '', is_active ? 1 : 0, display_order || 0
      ]
    );
    res.status(201).json({ message: 'Slide created', id: result.insertId });
  } catch (error) {
    console.error('Create slide error:', error);
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

// Admin: Update slide
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      title_en, title_am, subtitle_en, subtitle_am, 
      description_en, description_am, 
      button_text_en, button_text_am, button_url,
      image_url, is_active, display_order 
    } = req.body;
    const pool = getPool();
    await pool.query(
      `UPDATE hero_slides SET 
        title_en=?, title_am=?, subtitle_en=?, subtitle_am=?, 
        description_en=?, description_am=?, 
        button_text_en=?, button_text_am=?, button_url=?,
        image_url=?, is_active=?, display_order=? 
      WHERE id=?`,
      [
        title_en || '', title_am || '', subtitle_en || '', subtitle_am || '',
        description_en || '', description_am || '',
        button_text_en || '', button_text_am || '', button_url || '',
        image_url || '', is_active ? 1 : 0, display_order || 0, req.params.id
      ]
    );
    res.json({ message: 'Slide updated' });
  } catch (error) {
    console.error('Update slide error:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// Admin: Delete slide
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

export default router;
