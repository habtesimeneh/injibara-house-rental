import { getPool } from '../../database/db.js';

export const getTickerItems = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM ticker_items WHERE is_active = 1');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addTickerItem = async (req, res) => {
  try {
    const { text_en, text_am } = req.body;
    const pool = getPool();
    const result = await pool.query('INSERT INTO ticker_items (text_en, text_am) VALUES (?, ?)', [text_en, text_am]);
    res.json({ id: result[0].insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTickerItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { text_en, text_am, is_active } = req.body;
    const pool = getPool();
    await pool.query('UPDATE ticker_items SET text_en = ?, text_am = ?, is_active = ? WHERE id = ?', [text_en, text_am, is_active ? 1 : 0, id]);
    res.json({ message: 'Ticker item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTickerItem = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    await pool.query('DELETE FROM ticker_items WHERE id = ?', [id]);
    res.json({ message: 'Ticker item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
