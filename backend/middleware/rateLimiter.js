import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login or registration attempts. Please try again in a few minutes.'
  }
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many OTP verification attempts. Please try again later.'
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP address. Please try again later.'
  }
});

export const smsSendIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many SMS send requests. Please try again later.'
  }
});

export const smsSendUserLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Daily SMS send limit reached. Please try again tomorrow.'
  }
});

export const smsWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many webhook requests.'
  }
});

export const contractCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many contract creation requests. Please try again later.'
  }
});

export const reminderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many reminder creation requests. Please try again later.'
  }
});

export const reminderNotifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many notification requests. Please try again later.'
  }
});

export const reminderMarkPaidLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many payment status requests. Please try again later.'
  }
});

export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI assistant requests. Please try again later.'
  }
});

export const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI chat requests. Please try again later.'
  }
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many password reset attempts. Please try again later.'
  }
});

export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many token refresh attempts. Please try again later.'
  }
});

export const seekingAdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many seeking ad submissions. Please try again later.'
  }
});

export const paymentSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many payment submissions. Please try again later.'
  }
});
