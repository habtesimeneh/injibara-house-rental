import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const missingEnvVars = [];
if (!SMTP_HOST) missingEnvVars.push('SMTP_HOST');
if (!SMTP_PORT) missingEnvVars.push('SMTP_PORT');
if (!SMTP_USER) missingEnvVars.push('SMTP_USER');
if (!SMTP_PASS) missingEnvVars.push('SMTP_PASS');
if (!SMTP_FROM) missingEnvVars.push('SMTP_FROM');

if (missingEnvVars.length > 0) {
  console.error(`[EMAIL SERVICE] Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const verifySmtpConnection = async () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
  }

  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', formatEmailError(error));
    throw error;
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return { status: info.response || 'sent' };
};

export const sendAdmin2FAEmail = async (toEmail, toName, otpCode, expiryMinutes = 5) => {
  const subject = 'Injibara House Rental - Admin 2FA Verification Code';

  const text = `[Injibara House Rental] Your Admin 2FA verification code is ${otpCode}. It expires in ${expiryMinutes} minutes. Do not share this code with anyone. If you did not request this code, please ignore this email and investigate.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Injibara House Rental</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Admin Two-Factor Authentication</p>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${toName || 'Admin'},</h2>
        <p style="color: #555; line-height: 1.6;">You attempted to sign in to the <strong>Injibara House Rental</strong> admin dashboard. Your verification code is:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otpCode}</span>
        </div>
        <p style="color: #555; line-height: 1.6;">This code expires in <strong>${expiryMinutes} minutes</strong>. Do not share this code with anyone.</p>
        <p style="color: #888; font-size: 14px; margin-top: 30px;">If you did not request this code, please ignore this email and investigate the activity on your account.</p>
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">Injibara House Rental Platform</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
  });
};

export const formatEmailError = (error) => {
  if (!error) {
    return { name: 'UnknownError', message: 'Unknown email error' };
  }

  if (typeof error === 'string') {
    return { name: 'StringError', message: error };
  }

  if (typeof error !== 'object') {
    return { name: 'UnknownError', message: String(error) };
  }

  const result = {
    name: error.name || 'EmailError',
    message: error.message || 'An email delivery error occurred',
    code: error.code || undefined,
    command: error.command || undefined,
    responseCode: error.responseCode || undefined,
  };

  if (error.response && typeof error.response === 'string') {
    result.response = error.response;
  }

  return result;
};
