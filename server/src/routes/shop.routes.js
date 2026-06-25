import express from 'express';
import { getShop, buyItem } from '../controllers/shop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getShop);
router.post('/buy', protect, buyItem);

export default router;
