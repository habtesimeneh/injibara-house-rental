import 'dotenv/config';
import { testConnection, getPool } from '../database/db.js';

(async () => {
  try {
    await testConnection();
    const pool = getPool();
    const [users] = await pool.query(
      "SELECT user_id, name, email, role, phone FROM users WHERE LOWER(email) = 'habtesimeneh30@gmail.com'"
    );
    console.log('MATCHING USERS:', JSON.stringify(users, null, 2));
    const [all] = await pool.query('SELECT user_id, email, role FROM users LIMIT 20');
    console.log('ALL USERS (id/email/role):', JSON.stringify(all, null, 2));
  } catch (err) {
    console.error('DIAG ERROR:', err.message);
  } finally {
    process.exit(0);
  }
})();
