import express from 'express';
import { purchaseGems, getMyTransactions } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/purchase-gems', purchaseGems);
router.get('/history', getMyTransactions);

export default router;
