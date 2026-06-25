import { findUserById, updateUser, createTransaction } from '../services/db.service.js';

const GEM_PACKAGES = {
  gems_500: { name: '500 Gems Pack', gems: 500, price: 4.99 },
  gems_1000: { name: '1000 Gems Pack', gems: 1000, price: 8.99 },
  gems_2500: { name: '2500 Gems Pack', gems: 2500, price: 19.99 },
  gems_5000: { name: '5000 Gems Pack', gems: 5000, price: 34.99 }
};

// Mask card number for security
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return '****';
  return `**** **** **** ${cardNumber.slice(-4)}`;
};

// @desc   Purchase a gems package using Paystack
// @route  POST /api/payments/purchase-gems
export const purchaseGems = async (req, res) => {
  try {
    const { packageId, reference } = req.body;
    const userId = req.user._id || req.user.id;

    if (!packageId || !GEM_PACKAGES[packageId]) {
      return res.status(400).json({ success: false, message: 'Invalid or missing package selection.' });
    }

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required.' });
    }

    const selectedPack = GEM_PACKAGES[packageId];
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log(`[Paystack Gateway] Verifying charge for package ${packageId} with reference: ${reference}...`);
    
    // Call Paystack API to verify the transaction
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Check if Paystack verification succeeded
    const verificationSucceeded = response.ok && data.status === true && data.data?.status === 'success';
    
    if (!verificationSucceeded) {
      // Log Failed Transaction
      await createTransaction({
        userId,
        packageId,
        gemsAmount: selectedPack.gems,
        price: selectedPack.price,
        currency: 'NGN',
        paymentMethod: 'Paystack',
        cardNumber: 'Unknown',
        cardHolder: user.username,
        reference: reference,
        status: 'Failed'
      });
      
      const errorMsg = data.data?.gateway_response || data.message || 'Transaction verification failed with Paystack.';
      console.log(`[Paystack Gateway] Verification FAILED: ${errorMsg}`);
      return res.status(400).json({ success: false, message: errorMsg });
    }
    
    console.log(`[Paystack Gateway] Transaction verified successfully. Amount: ${data.data.amount / 100} ${data.data.currency}`);

    // 1. Create Transaction Log for Success
    const transaction = await createTransaction({
      userId,
      packageId,
      gemsAmount: selectedPack.gems,
      price: selectedPack.price,
      currency: data.data?.currency || 'NGN',
      paymentMethod: data.data?.channel || 'Paystack',
      cardNumber: data.data?.authorization?.last4 ? maskCardNumber(data.data.authorization.last4) : 'Paystack',
      cardHolder: user.username,
      reference: reference, // Save reference
      status: 'Completed'
    });

    // 2. Add Gems to User Wallet
    const currentGems = user.gems || 0;
    const updatedUser = await updateUser(userId, {
      gems: currentGems + selectedPack.gems
    });

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${selectedPack.gems} Gems!`,
      gems: updatedUser.gems,
      user: updatedUser,
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get purchase transactions for current user
// @route  GET /api/payments/history
export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // For simplicity, retrieve populated transactions and filter
    const allTx = await import('../services/db.service.js').then(m => m.getTransactions());
    const myTx = allTx.filter(tx => 
      (tx.userId && tx.userId._id && tx.userId._id.toString() === userId.toString()) || 
      (tx.userId && tx.userId.toString() === userId.toString())
    );

    res.status(200).json({
      success: true,
      transactions: myTx
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
