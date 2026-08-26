import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Get Auth Page Settings
router.get('/settings', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM auth_page_settings ORDER BY id DESC LIMIT 1');
    if (rows && rows[0]) {
      return res.json(rows[0]);
    }
    
    // Default pre-filled settings if database row is empty
    const defaultSettings = {
      login_title_en: 'Welcome Back to Injibara Rentals',
      login_title_am: 'እንኳን ደህና መጡ ወደ እንጅባራ ቤት ኪራይ',
      login_subtitle_en: 'Sign in to access your rental dashboard, view inquiries, and manage your properties.',
      login_subtitle_am: 'ወደ አካውንትዎ በመግባት የኪራይ አገልግሎቶችን፣ ማመልከቻዎችን እና ቤቶችን ያስተዳድሩ።',
      register_title_en: 'Create an Account',
      register_title_am: 'አዲስ አካውንት ይፍጠሩ',
      register_subtitle_en: 'Join Injibara House Rentals to easily rent or list properties in Injibara town.',
      register_subtitle_am: 'በእንጅባራ ከተማ ቤቶችን በቀላሉ ለመከራየት ወይም ለማከራየት ዛሬውኑ ይቀላቀሉን።'
    };
    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auth settings' });
  }
});

// Admin: Update Auth Page Settings
router.post('/settings', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      login_title_en, login_title_am, login_subtitle_en, login_subtitle_am,
      register_title_en, register_title_am, register_subtitle_en, register_subtitle_am
    } = req.body;
    const pool = getPool();
    
    const [existing] = await pool.query('SELECT id FROM auth_page_settings LIMIT 1');
    
    if (existing.length > 0) {
      await pool.query(
        `UPDATE auth_page_settings SET 
          login_title_en=?, login_title_am=?, login_subtitle_en=?, login_subtitle_am=?,
          register_title_en=?, register_title_am=?, register_subtitle_en=?, register_subtitle_am=?,
          updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [
          login_title_en, login_title_am, login_subtitle_en, login_subtitle_am,
          register_title_en, register_title_am, register_subtitle_en, register_subtitle_am,
          existing[0].id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO auth_page_settings (
          login_title_en, login_title_am, login_subtitle_en, login_subtitle_am,
          register_title_en, register_title_am, register_subtitle_en, register_subtitle_am
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          login_title_en, login_title_am, login_subtitle_en, login_subtitle_am,
          register_title_en, register_title_am, register_subtitle_en, register_subtitle_am
        ]
      );
    }
    
    res.json({ message: 'Auth page settings updated' });
  } catch (error) {
    console.error('Update auth settings error:', error);
    res.status(500).json({ error: 'Failed to update auth settings' });
  }
});

// Auth Slides Routes
const DEFAULT_AUTH_SLIDES = [
  {
    title_en: 'Residential Homes & Villas',
    title_am: 'ለግል መኖሪያ የሚሆኑ ቤቶች እና ቪላዎች',
    desc_en: 'Find comfortable villas, apartments, and condos for you and your family in Injibara town.',
    desc_am: 'በእንጅባራ ለግል እና ለቤተሰብ መኖሪያ የሚሆኑ ምቹ ቪላዎች፣ አፓርትመንቶች እና ኮንዶሚኒየሞች።',
    badge_en: '1. Residential',
    badge_am: '1. የመኖሪያ ቤቶች',
    image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80',
    display_order: 1,
    is_active: 1
  },
  {
    title_en: 'Boutique & Clothing Retail',
    title_am: 'ለቡቲክ፣ ጫማ እና አልባሳት መደብሮች',
    desc_en: 'Prime retail spaces located on main roads, perfect for boutiques, shoe stores, and clothing shops.',
    desc_am: 'በዋና መንገድ ዳር የሚገኙ ለቡቲክ፣ ለጫማ እና ለተለያዩ አልባሳት መሸጫ የሚሆኑ ምርጥ የንግድ ሱቆች።',
    badge_en: '2. Boutique & Clothing',
    badge_am: '2. ቡቲክ እና አልባሳት',
    image_url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80',
    display_order: 2,
    is_active: 1
  },
  {
    title_en: 'Hotel, Restaurant & Cafe Spaces',
    title_am: 'ለሆቴል፣ ሬስቶራንት እና ካፌ አገልግሎት',
    desc_en: 'Spacious commercial spaces ideal for restaurants, traditional cafes, and hospitality businesses.',
    desc_am: 'ለሆቴል፣ ሬስቶራንት እና ካፌ አገልግሎት የሚውሉ ምቹ፣ ሰፊ እና ተመራጭ ቦታዎች።',
    badge_en: '3. Hospitality',
    badge_am: '3. ሆቴል እና ካፌ',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
    display_order: 3,
    is_active: 1
  },
  {
    title_en: 'Electronics & Photo Studio Shops',
    title_am: 'ለኤሌክትሮኒክስ እና ፎቶ ስቱዲዮ',
    desc_en: 'Secure and well-located store spaces for electronics repair, sales, and photo studios.',
    desc_am: 'ለኤሌክትሮኒክስ እቃዎች፣ ስልክ ጥገና እና ለፎቶ ስቱዲዮ የሚሆኑ ደህንነታቸው የተጠበቀ ሱቆች።',
    badge_en: '4. Electronics & Photo',
    badge_am: '4. ኤሌክትሮኒክስ እና ፎቶ',
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80',
    display_order: 4,
    is_active: 1
  },
  {
    title_en: 'Pharmacy & Medical Clinic Spaces',
    title_am: 'ለፋርማሲ እና ክሊኒክ አገልግሎት',
    desc_en: 'Clean and accessible spaces suitable for pharmacies, medical clinics, and laboratories.',
    desc_am: 'ለፋርማሲ፣ ክሊኒክ እና ላቦራቶሪ አገልግሎት የሚውሉ ንጹህ እና ተደራሽ ቦታዎች።',
    badge_en: '5. Health & Medical',
    badge_am: '5. ፋርማሲ እና ክሊኒክ',
    image_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80',
    display_order: 5,
    is_active: 1
  }
];

async function seedDefaultAuthSlidesIfEmpty(pool) {
  try {
    const [check] = await pool.query('SELECT COUNT(*) as count FROM auth_slides');
    if (check[0].count === 0) {
      for (const slide of DEFAULT_AUTH_SLIDES) {
        await pool.query(
          'INSERT INTO auth_slides (title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [slide.title_en, slide.title_am, slide.desc_en, slide.desc_am, slide.badge_en, slide.badge_am, slide.image_url, slide.display_order, slide.is_active]
        );
      }
    }
  } catch (err) {
    console.error('Seed auth slides error:', err);
  }
}

router.get('/slides', async (req, res) => {
  try {
    const pool = getPool();
    await seedDefaultAuthSlidesIfEmpty(pool);
    const [rows] = await pool.query('SELECT * FROM auth_slides WHERE is_active = 1 ORDER BY display_order ASC, id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auth slides' });
  }
});

router.get('/slides/admin', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await seedDefaultAuthSlidesIfEmpty(pool);
    const [rows] = await pool.query('SELECT * FROM auth_slides ORDER BY display_order ASC, id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auth slides' });
  }
});

router.post('/slides', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order, is_active } = req.body;
    const pool = getPool();
    await pool.query(
      'INSERT INTO auth_slides (title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order || 0, is_active ? 1 : 0]
    );
    res.json({ message: 'Auth slide added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add auth slide' });
  }
});

router.put('/slides/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order, is_active } = req.body;
    const pool = getPool();
    await pool.query(
      'UPDATE auth_slides SET title_en=?, title_am=?, desc_en=?, desc_am=?, badge_en=?, badge_am=?, image_url=?, display_order=?, is_active=? WHERE id=?',
      [title_en, title_am, desc_en, desc_am, badge_en, badge_am, image_url, display_order, is_active ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Auth slide updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update auth slide' });
  }
});

router.delete('/slides/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM auth_slides WHERE id = ?', [req.params.id]);
    res.json({ message: 'Auth slide deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete auth slide' });
  }
});

export default router;
