import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Get About Page content
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM about_page ORDER BY id DESC LIMIT 1');
    if (rows && rows.length > 0) {
      return res.json(rows[0]);
    }

    // Default fallback about page data if database is empty
    const defaultAbout = {
      title_en: "EMPOWERING ETHIOPIA'S RENTAL ECOSYSTEM WITH TRUST & EFFICIENCY",
      title_am: "በእንጅባራ እና አማራ ክልል የቤት ኪራይ አገልግሎትን በዘመናዊ መንገድ እናቀላጥፋለን",
      subtitle_en: "Connecting discerning tenants with verified house owners across Injibara and Amhara Region using modern digital platform.",
      subtitle_am: "እንጅባራ ቤት ደላላ (Injibara House Rental) በእንጅባራ ከተማና አካባቢዋ ለሚገኙ ተከራዮችና የቤት አከራዮች የተዘጋጀ ታማኝና ዘመናዊ የቤት ኪራይ መድረክ ነው።",
      content_en: "We are Injibara's premier real estate platform connecting tenants with verified house owners.",
      content_am: "እኛ በእንጅባራ ከተማ የቤት ኪራይ አገልግሎትን የሚያቀላጥፍ ዘመናዊ መድረክ ነን።",
      image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80",
      mission_en: "To revolutionize the Ethiopian rental industry by creating a seamless, transparent, zero-commission digital ecosystem that bridges property owners and tenants across Injibara and Amhara region.",
      mission_am: "በእንጅባራ ከተማና በአማራ ክልል ያሉ ተከራዮችና አከራዮችን ያላንዳች ደላላ በቀጥታ የሚያገናኝ ዘመናዊ፣ ታማኝና ቀልጣፋ የቤት ኪራይ መድረክ ማቅረብ።",
      vision_en: "To become East Africa's most trusted and widely adopted digital housing marketplace, setting benchmark standards for rental convenience and verified listings.",
      vision_am: "በኢትዮጵያና በአፍሪካ ቀንድ የመጀመሪያውና ተመራጩ የታመነ የቤት ኪራይና የመኖሪያ መድረክ መሆን።",
      values_en: "Transparency, Innovation, Security, Community Empowerment, and Excellence in Customer Satisfaction.",
      values_am: "ግልፅነት፣ ታማኝነት፣ ደህንነት፣ ማህበረሰባዊ እድገት እና ደንበኛ ተኮር አገልግሎት።",
      tailored_en: "Tailored experience for both tenants and landlords with kebele-based filtering, direct messaging, and instant updates.",
      tailored_am: "ለተከራዮችና ለአከራዮች የተመቸ የቀበሌ መፈለጊያ፣ ቀጥታ የመልእክት ልውውጥ እና ፈጣን ማስታወቂያዎች።",
      footprint_en: "Serving Kebele 01, Kebele 02, Kebele 03, Injibara University Area, Bus Station Area, and Agni Hospital Area.",
      footprint_am: "በቀበሌ 01፣ ቀበሌ 02፣ ቀበሌ 03፣ ዩኒቨርሲቲ አካባቢ፣ አውቶቡስ ተራ እና ሆስፒታል አካባቢ አገልግሎት እንሰጣለን።",
      banner_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80",
      banner_subtitle_en: "Injibara & Amhara Real Estate Platform",
      banner_subtitle_am: "የእንጅባራና አማራ ክልል የቤት ኪራይ መድረክ"
    };

    // Auto-seed into database
    await pool.query(
      `INSERT INTO about_page (
        title_en, title_am, subtitle_en, subtitle_am, content_en, content_am, image_url,
        mission_en, mission_am, vision_en, vision_am, values_en, values_am,
        tailored_en, tailored_am, footprint_en, footprint_am,
        banner_image_url, banner_subtitle_en, banner_subtitle_am
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultAbout.title_en, defaultAbout.title_am, defaultAbout.subtitle_en, defaultAbout.subtitle_am,
        defaultAbout.content_en, defaultAbout.content_am, defaultAbout.image_url,
        defaultAbout.mission_en, defaultAbout.mission_am, defaultAbout.vision_en, defaultAbout.vision_am,
        defaultAbout.values_en, defaultAbout.values_am, defaultAbout.tailored_en, defaultAbout.tailored_am,
        defaultAbout.footprint_en, defaultAbout.footprint_am, defaultAbout.banner_image_url,
        defaultAbout.banner_subtitle_en, defaultAbout.banner_subtitle_am
      ]
    );

    const [newRows] = await pool.query('SELECT * FROM about_page ORDER BY id DESC LIMIT 1');
    res.json(newRows[0] || defaultAbout);
  } catch (error) {
    console.error('Fetch about page error:', error);
    res.status(500).json({ error: 'Failed to fetch about page', details: error.message });
  }
});

// Admin: Update About Page
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      title_en, title_am, subtitle_en, subtitle_am, content_en, content_am, image_url,
      mission_en, mission_am, vision_en, vision_am, values_en, values_am,
      tailored_en, tailored_am, footprint_en, footprint_am,
      banner_image_url, banner_subtitle_en, banner_subtitle_am
    } = req.body;
    const pool = getPool();
    
    const [existing] = await pool.query('SELECT id FROM about_page LIMIT 1');
    
    if (existing.length > 0) {
      await pool.query(
        `UPDATE about_page SET 
          title_en=?, title_am=?, subtitle_en=?, subtitle_am=?, content_en=?, content_am=?, image_url=?, 
          mission_en=?, mission_am=?, vision_en=?, vision_am=?, values_en=?, values_am=?, 
          tailored_en=?, tailored_am=?, footprint_en=?, footprint_am=?, 
          banner_image_url=?, banner_subtitle_en=?, banner_subtitle_am=?, 
          updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [
          title_en, title_am, subtitle_en, subtitle_am, content_en, content_am, image_url,
          mission_en, mission_am, vision_en, vision_am, values_en, values_am,
          tailored_en, tailored_am, footprint_en, footprint_am,
          banner_image_url, banner_subtitle_en, banner_subtitle_am,
          existing[0].id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO about_page (
          title_en, title_am, subtitle_en, subtitle_am, content_en, content_am, image_url,
          mission_en, mission_am, vision_en, vision_am, values_en, values_am,
          tailored_en, tailored_am, footprint_en, footprint_am,
          banner_image_url, banner_subtitle_en, banner_subtitle_am
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title_en, title_am, subtitle_en, subtitle_am, content_en, content_am, image_url,
          mission_en, mission_am, vision_en, vision_am, values_en, values_am,
          tailored_en, tailored_am, footprint_en, footprint_am,
          banner_image_url, banner_subtitle_en, banner_subtitle_am
        ]
      );
    }
    
    res.json({ message: 'About page updated' });
  } catch (error) {
    console.error('Update about error:', error);
    res.status(500).json({ error: 'Failed to update about page' });
  }
});

// FAQ Routes
router.get('/faqs', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM about_faqs ORDER BY display_order ASC, id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

router.post('/faqs', protect, authorize('Admin'), async (req, res) => {
  try {
    const { question_en, question_am, answer_en, answer_am, display_order } = req.body;
    const pool = getPool();
    await pool.query(
      'INSERT INTO about_faqs (question_en, question_am, answer_en, answer_am, display_order) VALUES (?, ?, ?, ?, ?)',
      [question_en, question_am, answer_en, answer_am, display_order || 0]
    );
    res.json({ message: 'FAQ added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add FAQ' });
  }
});

router.delete('/faqs/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM about_faqs WHERE id = ?', [req.params.id]);
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

export default router;
