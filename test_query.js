import 'dotenv/config';
import { getPool } from './database/db.js';

async function testQuery() {
  const pool = getPool();
  
  // Get all users
  const [allUsers] = await pool.query('SELECT user_id, name, email, phone, role, HEX(email) as email_hex FROM users');
  console.log('All users:', JSON.stringify(allUsers, null, 2));
  
  // Try exact match
  const [exact] = await pool.query('SELECT * FROM users WHERE email = ?', ['habtesimeneh30@gmail.com']);
  console.log('Exact match:', JSON.stringify(exact, null, 2));
  
  // Try lower(trim())
  const [normalized] = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', ['habtesimeneh30@gmail.com']);
  console.log('Normalized match:', JSON.stringify(normalized, null, 2));
  
  // Try with LIKE
  const [like] = await pool.query('SELECT * FROM users WHERE email LIKE ?', ['%habtesimeneh30%']);
  console.log('LIKE match:', JSON.stringify(like, null, 2));
}

testQuery().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
