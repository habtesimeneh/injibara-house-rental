import express from 'express';
import { getPool } from '../../database/db.js';
import { UPLOAD_DIR } from '../config/uploadDir.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure Multer for image uploads
const MIME_TO_EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp"
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeExtension = MIME_TO_EXT_MAP[file.mimetype] || '.bin';
    cb(null, 'pub-img-' + uniqueSuffix + safeExtension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Admin image upload endpoint
router.post('/upload', protect, authorize('Admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const image_url = `/uploads/${req.file.filename}`;
    res.json({ image_url });
  } catch (error) {
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Get approved testimonials for public homepage
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [testimonials] = await pool.query('SELECT * FROM testimonials WHERE is_approved = 1 OR is_approved IS NULL ORDER BY created_at DESC');
    res.json(testimonials);
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Admin: Get ALL testimonials (including pending approval)
router.get('/admin', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [testimonials] = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(testimonials);
  } catch (error) {
    console.error('Fetch admin testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Public / Customer: Submit a new testimonial (Starts as Pending Approval, is_approved = 0)
router.post('/submit', async (req, res) => {
  try {
    const { 
      name, 
      role_en, role_am, 
      location_en, location_am, 
      avatar, 
      rating, 
      house_type_en, house_type_am, 
      comment_en, comment_am, 
      badge_en, badge_am 
    } = req.body;

    if (!name || (!comment_en && !comment_am)) {
      return res.status(400).json({ error: 'Name and comment are required' });
    }

    const pool = getPool();
    
    const [result] = await pool.query(
      `INSERT INTO testimonials (
        name, 
        role_en, role_am, 
        location_en, location_am, 
        avatar, 
        rating, 
        house_type_en, house_type_am, 
        comment_en, comment_am, 
        badge_en, badge_am,
        is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        name, 
        role_en || 'Customer / Tenant', 
        role_am || 'ተገልጋይ / ተከራይ', 
        location_en || 'Injibara Town', 
        location_am || 'እንጅባራ ከተማ', 
        avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80', 
        rating || 5, 
        house_type_en || 'Rented Property', 
        house_type_am || 'የተከራዩት ቤት', 
        comment_en || comment_am || '', 
        comment_am || comment_en || '', 
        badge_en || 'User Review', 
        badge_am || 'የተጠቃሚ አስተያየት'
      ]
    );
    
    res.status(201).json({ 
      message: 'Testimonial submitted successfully! It will appear on the homepage after admin approval.', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Submit testimonial error:', error);
    res.status(500).json({ error: 'Failed to submit testimonial' });
  }
});

// Admin: Create testimonial (Approved by default)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      name, 
      role_en, role_am, 
      location_en, location_am, 
      avatar, 
      rating, 
      house_type_en, house_type_am, 
      comment_en, comment_am, 
      badge_en, badge_am,
      is_approved
    } = req.body;
    const pool = getPool();
    
    const [result] = await pool.query(
      `INSERT INTO testimonials (
        name, 
        role_en, role_am, 
        location_en, location_am, 
        avatar, 
        rating, 
        house_type_en, house_type_am, 
        comment_en, comment_am, 
        badge_en, badge_am,
        is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        role_en, role_am, 
        location_en, location_am, 
        avatar, 
        rating || 5, 
        house_type_en, house_type_am, 
        comment_en, comment_am, 
        badge_en, badge_am,
        is_approved !== undefined ? (is_approved ? 1 : 0) : 1
      ]
    );
    
    res.status(201).json({ message: 'Testimonial created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// Admin: Approve / Toggle approval status
router.put('/:id/approve', protect, authorize('Admin'), async (req, res) => {
  try {
    const { is_approved } = req.body;
    const pool = getPool();
    const approvedVal = is_approved !== undefined ? (is_approved ? 1 : 0) : 1;
    await pool.query('UPDATE testimonials SET is_approved = ? WHERE id = ?', [approvedVal, req.params.id]);
    res.json({ message: 'Testimonial approval status updated successfully' });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({ error: 'Failed to update testimonial status' });
  }
});

// Admin: Update testimonial
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      name, 
      role_en, role_am, 
      location_en, location_am, 
      avatar, 
      rating, 
      house_type_en, house_type_am, 
      comment_en, comment_am, 
      badge_en, badge_am,
      is_approved
    } = req.body;
    const pool = getPool();
    
    await pool.query(
      `UPDATE testimonials SET 
        name=?, 
        role_en=?, role_am=?, 
        location_en=?, location_am=?, 
        avatar=?, 
        rating=?, 
        house_type_en=?, house_type_am=?, 
        comment_en=?, comment_am=?, 
        badge_en=?, badge_am=?,
        is_approved=?
      WHERE id=?`,
      [
        name, 
        role_en, role_am, 
        location_en, location_am, 
        avatar, 
        rating, 
        house_type_en, house_type_am, 
        comment_en, comment_am, 
        badge_en, badge_am, 
        is_approved !== undefined ? (is_approved ? 1 : 0) : 1,
        req.params.id
      ]
    );
    
    res.json({ message: 'Testimonial updated successfully' });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// Admin: Delete testimonial
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;
