import express from 'express';
import crypto from 'crypto';
import { normalizeSmsPhone, sendSMS } from '../services/smsService.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  smsSendIpLimiter,
  smsSendUserLimiter,
  smsWebhookLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();
const MAX_WEBHOOK_MESSAGE_LENGTH = 480;
const WEBHOOK_REPLAY_TTL_MS = 10 * 60 * 1000;
const processedWebhookEvents = new Map();

const safeCompare = (providedSignature, expectedSignature) => {
  if (typeof providedSignature !== 'string') {
    return false;
  }

  const provided = Buffer.from(providedSignature.trim(), 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
};

const verifyTextBeeSignature = (req, res, next) => {
  const webhookSecret = process.env.TEXTBEE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'SMS webhook is not configured' });
    }

    console.warn('[SMS] Webhook signature verification is disabled outside production because TEXTBEE_WEBHOOK_SECRET is missing');
    return next();
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (!safeCompare(req.get('x-signature'), expectedSignature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

const pruneWebhookCaches = (now) => {
  for (const [key, timestamp] of processedWebhookEvents) {
    if (now - timestamp > WEBHOOK_REPLAY_TTL_MS) processedWebhookEvents.delete(key);
  }

};

export const isWebhookReplay = (smsId, now = Date.now()) => {
  pruneWebhookCaches(now);
  return processedWebhookEvents.has(smsId);
};

export const markWebhookProcessed = (smsId, now = Date.now()) => {
  processedWebhookEvents.set(smsId, now);
};

// Webhook for incoming SMS (Textbee.dev)
router.post('/webhook', smsWebhookLimiter, verifyTextBeeSignature, async (req, res) => {
  const { sender, from, message, deviceId, smsId, webhookEvent } = req.body || {};
  const incomingPhone = sender || from;
  const expectedDeviceId = process.env.TEXTBEE_DEVICE_ID?.trim();

  if (webhookEvent && webhookEvent !== 'MESSAGE_RECEIVED') {
    return res.status(200).send('OK');
  }

  if (!smsId || typeof message !== 'string' || !message.trim() || message.trim().length > MAX_WEBHOOK_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  if (!expectedDeviceId || deviceId !== expectedDeviceId) {
    return res.status(401).json({ error: 'Webhook device is not authorized' });
  }

  let normalizedSender;
  try {
    normalizedSender = normalizeSmsPhone(incomingPhone);
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  if (isWebhookReplay(smsId)) {
    return res.status(200).send('OK');
  }

  try {
    // Example: Auto-reply logic
    const lowerMsg = message.trim().toLowerCase();
    if (lowerMsg.includes('hello') || lowerMsg.includes('ሰላም')) {
      await sendSMS(normalizedSender, 'Selam! Thank you for contacting Injibara House Rental platform. How can we help you today?');
    } else if (lowerMsg.includes('price') || lowerMsg.includes('ዋጋ') || lowerMsg.includes('rent')) {
      await sendSMS(normalizedSender, 'Our rental prices vary depending on location and house type. Please visit our app to see full listings and details.');
    } else if (lowerMsg.includes('location') || lowerMsg.includes('ቦታ') || lowerMsg.includes('injibara')) {
      await sendSMS(normalizedSender, 'We focus on houses in Injibara city and surrounding areas. Check our map view in the app!');
    } else {
      await sendSMS(normalizedSender, 'Thank you for your message. An agent will get back to you shortly if needed.');
    }

    markWebhookProcessed(smsId);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[SMS Webhook] Error processing auto-reply:', error.message);
    res.status(500).send('Error');
  }
});

// API to send a custom SMS (admin operational use only)
router.post('/send', protect, authorize('Admin'), smsSendIpLimiter, smsSendUserLimiter, async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required' });
  }

  try {
    const result = await sendSMS(phone, message);
    res.json({ success: true });
  } catch (error) {
    const invalidInput = error.message === 'Invalid SMS recipient phone number' || error.message.startsWith('SMS message must be') || error.message === 'SMS message contains unsupported control characters';
    res.status(invalidInput ? 400 : 502).json({ error: invalidInput ? error.message : 'Failed to send SMS' });
  }
});

export default router;
