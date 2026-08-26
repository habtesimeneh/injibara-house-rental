import express from 'express';
import { getPool } from '../../database/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user's wishlist
router.get('/', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [wishlists] = await pool.query(
      `SELECT w.id as wishlist_id, h.*, u.name as owner_name 
       FROM wishlists w 
       JOIN houses h ON w.house_id = h.house_id 
       JOIN users u ON h.owner_id = u.user_id 
       WHERE w.user_id = ? 
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(wishlists);
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add to wishlist
router.post('/:houseId', protect, async (req, res) => {
  try {
    const pool = getPool();
    const houseId = req.params.houseId;
    const userId = req.user.id;

    await pool.query(
      'INSERT OR IGNORE INTO wishlists (user_id, house_id) VALUES (?, ?)',
      [userId, houseId]
    );
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove from wishlist
router.delete('/:houseId', protect, async (req, res) => {
  try {
    const pool = getPool();
    const houseId = req.params.houseId;
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM wishlists WHERE user_id = ? AND house_id = ?',
      [userId, houseId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

export default router;
