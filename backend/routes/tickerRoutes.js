import express from 'express';
import { getTickerItems, addTickerItem, updateTickerItem, deleteTickerItem } from '../controllers/tickerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getTickerItems);
router.post('/', protect, authorize('Admin'), addTickerItem);
router.put('/:id', protect, authorize('Admin'), updateTickerItem);
router.delete('/:id', protect, authorize('Admin'), deleteTickerItem);

export default router;
