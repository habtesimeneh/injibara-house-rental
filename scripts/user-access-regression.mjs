import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { getUserById } from '../backend/controllers/authController.js';

const db = createClient({ url: 'file:./database.sqlite' });
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT,
    region TEXT,
    city TEXT,
    sub_city TEXT,
    address TEXT,
    avatar TEXT,
    last_seen TEXT
  )
`);
await db.execute('DELETE FROM users');
await db.execute(
  'INSERT INTO users (user_id, name, email, phone, password, role, region, city, avatar, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [
    1, 'Alice', 'alice@example.com', '0911111111', 'pw1', 'Tenant', 'Amhara', 'Bahir Dar', null, null,
    2, 'Bob', 'bob@example.com', '0922222222', 'pw2', 'Tenant', 'Amhara', 'Gondar', null, null
  ]
);

const calls = [];
const res = {
  status(code) {
    this.code = code;
    return {
      json(payload) {
        calls.push({ status: code, payload });
      }
    };
  },
  json(payload) {
    calls.push({ payload });
  }
};

await getUserById({ params: { id: '2' }, user: { id: 1, role: 'Tenant' }, headers: {} }, res);
assert.equal(calls[0]?.status ?? 200, 403, 'Non-admin users must not fetch another user profile');

const selfRes = { json(payload) { return payload; }, status(code) { return { json(payload) { return payload; } }; } };
const selfResponse = await getUserById({ params: { id: '1' }, user: { id: 1, role: 'Tenant' }, headers: {} }, selfRes);
assert.ok(selfResponse && selfResponse.user_id === 1 && selfResponse.email === 'alice@example.com', 'Users should still be able to view their own profile');

console.log('USER_ACCESS_REGRESSION: PASS');
