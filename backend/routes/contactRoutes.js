import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: Default Contact Page Info
const DEFAULT_CONTACT = {
  title_en: 'Get In Touch With Injibara House Rentals',
  title_am: 'ከእንጅባራ ቤት ኪራይ ጋር ይገናኙ',
  subtitle_en: 'Have questions, need a home, or want to list your property? Reach out to our dedicated local team anytime.',
  subtitle_am: 'ጥያቄ አለዎት፣ ቤት ይፈልጋሉ ወይንስ ቤትዎን ማስተዋወቅ ይፈልጋሉ? በማንኛውም ጊዜ ያግኙን።',
  address_en: 'Main Commercial Street, Kebele 01, Injibara Town, Awi Zone, Amhara, Ethiopia',
  address_am: 'ዋና ንግድ መንገድ፣ ቀበሌ 01፣ እንጅባራ ከተማ፣ አዊ ዞን፣ አማራ ክልል፣ ኢትዮጵያ',
  phone_1: '',
  phone_2: '',
  phone_3: '',
  email: '',
  working_hours_en: 'Monday - Saturday: 8:00 AM - 6:00 PM (Local Time)',
  working_hours_am: 'ሰኞ - ቅዳሜ፡ ከጠዋቱ 2:00 እስከ ምሽቱ 12:00 ሰዓት',
  facebook_url: 'https://facebook.com/injibarahouserentals',
  telegram_url: 'https://t.me/Habte88',
  tiktok_url: 'https://tiktok.com/@injibarahouse',
  youtube_url: 'https://youtube.com/@injibara_rentals',
  banner_image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200'
};

// Seed default offices & phones if tables are empty
async function seedDefaultContactData(pool) {
  try {
    // Check offices count
    const [offices] = await pool.query('SELECT COUNT(*) as count FROM contact_offices');
    if (offices[0].count === 0) {
      await pool.query(`
        INSERT INTO contact_offices (name_en, name_am, address_en, address_am, phone, agent_name, working_hours, is_active, display_order)
        VALUES 
        (
          'Kebele 01 Main Branch Office', 
          'ቀበሌ 01 ዋና ጽሕፈት ቤት', 
          'Main Road, Near Commercial Bank of Ethiopia, Injibara', 
          'ዋና መንገድ፣ ከኢትዮጵያ ንግድ ባንክ አጠገብ፣ እንጅባራ', 
          '', 
          'Habtamu Simeneh (Manager)', 
          'Mon-Sat: 8:00 AM - 6:00 PM', 
          1, 1
        ),
        (
          'Kebele 02 Sub-Office Station', 
          'ቀበሌ 02 ቅርንጫፍ ጣቢያ', 
          'Near Injibara University Main Gate, Injibara', 
          'ከእንጅባራ ዩኒቨርሲቲ ዋና በር አጠገብ፣ እንጅባራ', 
          '', 
          'Awi Zone Rental Desk', 
          'Mon-Sat: 8:30 AM - 5:30 PM', 
          1, 2
        )
      `);
    }

    // Check phones count
    const [phones] = await pool.query('SELECT COUNT(*) as count FROM contact_phones');
    if (phones[0].count === 0) {
      await pool.query(`
        INSERT INTO contact_phones (department_en, department_am, phone_number, telegram_username, contact_person, is_whatsapp, is_active, display_order)
        VALUES 
        ('Main Rental Support & Verification', 'ዋና የቤት ኪራይ እርዳታና ማረጋገጫ', '', '@Habte88', 'Habtamu Simeneh', 1, 1, 1),
        ('Landlord Property Promotion Desk', 'የአከራዮች ቤት ማስተዋወቂያ', '', '@Habte88', 'Injibara Admin', 1, 1, 2),
        ('Urgent Tenant Request Hotline', 'የተከራዮች አጣዳፊ ጥያቄ መስመር', '', '@Habte88', 'Customer Care Desk', 1, 1, 3)
      `);
    }
  } catch (e) {
    console.error('Seed contact data error:', e.message);
  }
}

// Public: Get Contact Page content + Offices + Phone Hotlines
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    await seedDefaultContactData(pool);

    const [rows] = await pool.query('SELECT * FROM contact_page ORDER BY id DESC LIMIT 1');
    const [offices] = await pool.query('SELECT * FROM contact_offices WHERE is_active = 1 ORDER BY display_order ASC, id ASC');
    const [phones] = await pool.query('SELECT * FROM contact_phones WHERE is_active = 1 ORDER BY display_order ASC, id ASC');

    const contactData = rows[0] ? { ...DEFAULT_CONTACT, ...rows[0] } : DEFAULT_CONTACT;

    res.json({
      ...contactData,
      offices: offices || [],
      phones: phones || []
    });
  } catch (error) {
    console.error('Failed to fetch contact page:', error);
    res.status(500).json({ error: 'Failed to fetch contact page' });
  }
});

// Admin: Update Contact Page Global Settings
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { 
      title_en, title_am, subtitle_en, subtitle_am, 
      address_en, address_am, phone_1, phone_2, phone_3, email,
      working_hours_en, working_hours_am,
      facebook_url, telegram_url, tiktok_url, youtube_url,
      banner_image_url
    } = req.body;
    const pool = getPool();
    
    const [existing] = await pool.query('SELECT id FROM contact_page LIMIT 1');
    
    if (existing.length > 0) {
      await pool.query(
        `UPDATE contact_page SET 
          title_en=?, title_am=?, subtitle_en=?, subtitle_am=?, 
          address_en=?, address_am=?, phone_1=?, phone_2=?, phone_3=?, email=?,
          working_hours_en=?, working_hours_am=?,
          facebook_url=?, telegram_url=?, tiktok_url=?, youtube_url=?,
          banner_image_url=?, updated_at=CURRENT_TIMESTAMP 
          WHERE id=?`,
        [
          title_en || DEFAULT_CONTACT.title_en, 
          title_am || DEFAULT_CONTACT.title_am, 
          subtitle_en || DEFAULT_CONTACT.subtitle_en, 
          subtitle_am || DEFAULT_CONTACT.subtitle_am, 
          address_en || DEFAULT_CONTACT.address_en, 
          address_am || DEFAULT_CONTACT.address_am, 
          phone_1 || DEFAULT_CONTACT.phone_1, 
          phone_2 || DEFAULT_CONTACT.phone_2, 
          phone_3 || DEFAULT_CONTACT.phone_3, 
          email || DEFAULT_CONTACT.email,
          working_hours_en || DEFAULT_CONTACT.working_hours_en, 
          working_hours_am || DEFAULT_CONTACT.working_hours_am,
          facebook_url || DEFAULT_CONTACT.facebook_url, 
          telegram_url || DEFAULT_CONTACT.telegram_url, 
          tiktok_url || DEFAULT_CONTACT.tiktok_url, 
          youtube_url || DEFAULT_CONTACT.youtube_url,
          banner_image_url || DEFAULT_CONTACT.banner_image_url, 
          existing[0].id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO contact_page (
          title_en, title_am, subtitle_en, subtitle_am, 
          address_en, address_am, phone_1, phone_2, phone_3, email,
          working_hours_en, working_hours_am,
          facebook_url, telegram_url, tiktok_url, youtube_url,
          banner_image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title_en || DEFAULT_CONTACT.title_en, 
          title_am || DEFAULT_CONTACT.title_am, 
          subtitle_en || DEFAULT_CONTACT.subtitle_en, 
          subtitle_am || DEFAULT_CONTACT.subtitle_am, 
          address_en || DEFAULT_CONTACT.address_en, 
          address_am || DEFAULT_CONTACT.address_am, 
          phone_1 || DEFAULT_CONTACT.phone_1, 
          phone_2 || DEFAULT_CONTACT.phone_2, 
          phone_3 || DEFAULT_CONTACT.phone_3, 
          email || DEFAULT_CONTACT.email,
          working_hours_en || DEFAULT_CONTACT.working_hours_en, 
          working_hours_am || DEFAULT_CONTACT.working_hours_am,
          facebook_url || DEFAULT_CONTACT.facebook_url, 
          telegram_url || DEFAULT_CONTACT.telegram_url, 
          tiktok_url || DEFAULT_CONTACT.tiktok_url, 
          youtube_url || DEFAULT_CONTACT.youtube_url,
          banner_image_url || DEFAULT_CONTACT.banner_image_url
        ]
      );
    }

    // Also synchronize website_settings for website-wide contact keys
    try {
      const syncKeys = [
        ['contact_email', email || DEFAULT_CONTACT.email],
        ['contact_phone', `${phone_1 || DEFAULT_CONTACT.phone_1} / ${phone_2 || DEFAULT_CONTACT.phone_2}`],
        ['contact_telegram', telegram_url || DEFAULT_CONTACT.telegram_url],
        ['contact_location_en', address_en || DEFAULT_CONTACT.address_en],
        ['contact_location_am', address_am || DEFAULT_CONTACT.address_am]
      ];
      for (const [k, v] of syncKeys) {
        await pool.query('INSERT INTO website_settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [k, String(v)]);
      }
    } catch (e) {
      console.error('Settings sync error:', e.message);
    }
    
    res.json({ message: 'Contact page updated successfully' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact page' });
  }
});

// --- OFFICE BRANCHES CRUD ---

// Get all offices (Admin includes inactive)
router.get('/offices', async (req, res) => {
  try {
    const pool = getPool();
    const [offices] = await pool.query('SELECT * FROM contact_offices ORDER BY display_order ASC, id DESC');
    res.json(offices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch office branches' });
  }
});

// Add Office Branch
router.post('/offices', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name_en, name_am, address_en, address_am, phone, agent_name, working_hours, is_active, display_order } = req.body;
    const pool = getPool();
    await pool.query(
      `INSERT INTO contact_offices (name_en, name_am, address_en, address_am, phone, agent_name, working_hours, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name_en || 'New Office Branch',
        name_am || 'አዲስ የቅርንጫፍ ጽሕፈት ቤት',
        address_en || 'Injibara Town',
        address_am || 'እንጅባራ ከተማ',
        phone || '',
        agent_name || 'Agent',
        working_hours || 'Mon-Sat: 8:00 AM - 6:00 PM',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        display_order || 0
      ]
    );
    res.json({ message: 'Office branch added successfully' });
  } catch (error) {
    console.error('Add office error:', error);
    res.status(500).json({ error: 'Failed to add office branch' });
  }
});

// Update Office Branch
router.put('/offices/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name_en, name_am, address_en, address_am, phone, agent_name, working_hours, is_active, display_order } = req.body;
    const pool = getPool();
    await pool.query(
      `UPDATE contact_offices SET 
        name_en=?, name_am=?, address_en=?, address_am=?, 
        phone=?, agent_name=?, working_hours=?, is_active=?, display_order=?
       WHERE id=?`,
      [
        name_en, name_am, address_en, address_am,
        phone, agent_name, working_hours,
        is_active ? 1 : 0, display_order || 0,
        req.params.id
      ]
    );
    res.json({ message: 'Office branch updated successfully' });
  } catch (error) {
    console.error('Update office error:', error);
    res.status(500).json({ error: 'Failed to update office branch' });
  }
});

// Delete Office Branch
router.delete('/offices/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM contact_offices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Office branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete office branch' });
  }
});

// --- PHONE HOTLINES CRUD ---

// Get all phones
router.get('/phones', async (req, res) => {
  try {
    const pool = getPool();
    const [phones] = await pool.query('SELECT * FROM contact_phones ORDER BY display_order ASC, id DESC');
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phone hotlines' });
  }
});

// Add Phone Hotline
router.post('/phones', protect, authorize('Admin'), async (req, res) => {
  try {
    const { department_en, department_am, phone_number, telegram_username, contact_person, is_whatsapp, is_active, display_order } = req.body;
    const pool = getPool();
    await pool.query(
      `INSERT INTO contact_phones (department_en, department_am, phone_number, telegram_username, contact_person, is_whatsapp, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        department_en || 'Support Hotline',
        department_am || 'የእርዳታ መስመር',
        phone_number || '',
        telegram_username || '@Habte88',
        contact_person || 'Support Desk',
        is_whatsapp ? 1 : 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        display_order || 0
      ]
    );
    res.json({ message: 'Phone hotline added successfully' });
  } catch (error) {
    console.error('Add phone error:', error);
    res.status(500).json({ error: 'Failed to add phone hotline' });
  }
});

// Update Phone Hotline
router.put('/phones/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { department_en, department_am, phone_number, telegram_username, contact_person, is_whatsapp, is_active, display_order } = req.body;
    const pool = getPool();
    await pool.query(
      `UPDATE contact_phones SET 
        department_en=?, department_am=?, phone_number=?, telegram_username=?, 
        contact_person=?, is_whatsapp=?, is_active=?, display_order=?
       WHERE id=?`,
      [
        department_en, department_am, phone_number, telegram_username,
        contact_person, is_whatsapp ? 1 : 0, is_active ? 1 : 0, display_order || 0,
        req.params.id
      ]
    );
    res.json({ message: 'Phone hotline updated successfully' });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ error: 'Failed to update phone hotline' });
  }
});

// Delete Phone Hotline
router.delete('/phones/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM contact_phones WHERE id = ?', [req.params.id]);
    res.json({ message: 'Phone hotline deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete phone hotline' });
  }
});

export default router;
