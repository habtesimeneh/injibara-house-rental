import express from 'express';
import { getPool } from '../../database/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get reviews for a house
router.get('/houses/:houseId/reviews', async (req, res) => {
  try {
    const { houseId } = req.params;
    const pool = getPool();

    const [reviews] = await pool.query(
      `SELECT r.*, u.name as reviewer_name, u.role as reviewer_role 
       FROM reviews r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.house_id = ? 
       ORDER BY r.created_at DESC`,
      [houseId]
    );

    // Calculate average rating
    let avgRating = 0;
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
      avgRating = Number((sum / reviews.length).toFixed(1));
    }

    res.json({
      reviews: reviews || [],
      totalReviews: reviews ? reviews.length : 0,
      averageRating: avgRating
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch house reviews' });
  }
});

// Post a review for a house (Protected)
router.post('/houses/:houseId/reviews', protect, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
    }

    const pool = getPool();

    // Insert review
    await pool.query(
      `INSERT INTO reviews (user_id, house_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [userId, houseId, Math.round(Number(rating)), comment || '']
    );

    res.status(201).json({ message: 'አስተያየትዎ እና ደረጃዎ በስኬት ተመዝግቧል! Thank you for your review.' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
