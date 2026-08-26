import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testSmtp() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  console.log('Testing Gmail SMTP...');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('Secure:', secure);
  console.log('User:', user);
  console.log('From:', from);
  console.log('Password:', pass ? 'Set (hidden)' : 'MISSING');

  if (!host || !user || !pass) {
    console.error('Missing required SMTP environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified.');

    const sendTest = process.argv.includes('--send');
    if (sendTest) {
      const info = await transporter.sendMail({
        from,
        to: user,
        subject: 'Injibara House Rental - SMTP Test',
        text: 'This is a test email from the Injibara House Rental backend.',
        html: '<p>This is a test email from the <strong>Injibara House Rental</strong> backend.</p>',
      });

      console.log('Test email sent successfully. Message ID:', info.messageId);
    } else {
      console.log('Connection is working. Add --send to deliver a test email to the configured SMTP_USER.');
    }
  } catch (error) {
    console.error('SMTP test failed:', error.message);
    process.exit(1);
  } finally {
    transporter.close();
  }
}

testSmtp();
