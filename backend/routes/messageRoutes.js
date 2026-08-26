import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  getConversations,
  getChatThread,
  sendMessage,
  getUnreadCount,
  getAdminAllConversations,
  getAdminThread
} from '../controllers/messageController.js';

const router = express.Router();

// GET /api/messages/conversations - List active chat conversations for authenticated user
router.get('/conversations', protect, authorize('Tenant', 'Landlord', 'Admin'), getConversations);

// GET /api/messages/chat/:otherUserId - Retrieve thread messages with a landlord or tenant
router.get('/chat/:otherUserId', protect, authorize('Tenant', 'Landlord', 'Admin'), getChatThread);

// POST /api/messages/send - Send real-time message (restricted to Amhara region properties & users)
router.post('/send', protect, authorize('Tenant', 'Landlord', 'Admin'), apiLimiter, sendMessage);

// GET /api/messages/unread-count - Total unread message badge count
router.get('/unread-count', protect, getUnreadCount);

// Admin Routes for conversation oversight
router.get('/admin/all-conversations', protect, authorize('Admin'), getAdminAllConversations);
router.get('/admin/thread/:u1/:u2', protect, authorize('Admin'), getAdminThread);

export default router;

