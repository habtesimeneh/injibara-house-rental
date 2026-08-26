import 'dotenv/config';
import bcrypt from 'bcryptjs';

const email = process.env.ADMIN_EMAIL;
const pwd = process.env.ADMIN_PASSWORD;

console.log('ADMIN_EMAIL set:', Boolean(email), 'len', email ? email.length : 0);
console.log('ADMIN_PASSWORD set:', Boolean(pwd), 'len', pwd ? pwd.length : 0);
console.log('env email === habtesimeneh30@gmail.com :', email === 'habtesimeneh30@gmail.com');
console.log('env password === kidanemihret16     :', pwd === 'kidanemihret16');

// Replicate the middleware hash derivation exactly, then compare the candidate.
if (pwd) {
  const hash = bcrypt.hashSync(pwd.trim(), 12);
  console.log('compareSync(kidanemihret16, envHash):', bcrypt.compareSync('kidanemihret16', hash));
  console.log('compareSync(envPwd,        envHash):', bcrypt.compareSync(pwd, hash));
}
