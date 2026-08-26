import 'dotenv/config';
import { testConnection, getPool } from './database/db.js';

async function checkAdminUser() {
  try {
    await testConnection();
    const pool = getPool();
    const [users] = await pool.query('SELECT user_id, name, email, phone, role FROM users');
    console.log('Active engine:', pool.activeEngine);
    console.log('All users:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkAdminUser();
