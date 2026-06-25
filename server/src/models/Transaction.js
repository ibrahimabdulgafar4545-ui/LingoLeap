import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: String, required: true },
  gemsAmount: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { type: String, default: 'Credit Card' },
  status: { type: String, default: 'Completed', enum: ['Completed', 'Failed', 'Pending'] },
  cardNumber: { type: String, required: true },
  cardHolder: { type: String, required: true },
  reference: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
