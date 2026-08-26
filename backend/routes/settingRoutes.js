import express from 'express';
import { getPool } from '../../database/db.js';

const router = express.Router();

export const SENSITIVE_SETTING_KEYS = new Set([
  'telebirr_no',
  'telebirr_name',
  'cbe_account',
  'cbe_account_name',
  'abyssinia_account',
  'abyssinia_account_name',
  'mpesa_account',
  'mpesa_account_name',
  'amhara_account',
  'amhara_account_name'
]);

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [settings] = await pool.query('SELECT key_name, value FROM website_settings');
    const settingsObj = {};
    for (const s of settings) {
      if (SENSITIVE_SETTING_KEYS.has(s.key_name)) {
        continue;
      }
      settingsObj[s.key_name] = s.value;
    }
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const pool = getPool();
    const [categories] = await pool.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all SEO meta records for client dynamic head injection
router.get('/seo', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM seo_meta ORDER BY route_path ASC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO meta settings' });
  }
});

// GET specific SEO meta record by route path
router.get('/seo/by-route', async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: 'Path query param is required' });
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM seo_meta WHERE route_path = ?', [path]);
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'No custom SEO meta found for route' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
