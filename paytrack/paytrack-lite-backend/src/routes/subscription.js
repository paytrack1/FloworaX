const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://floworax.vercel.app';

const MODULE_PRICE = 7000; // ₦7,000 per module per month

const MODULE_NAMES = {
  sales: 'Sales',
  bookings: 'Bookings',
  invoices: 'Invoices',
  events: 'Events',
  services: 'Services',
  customers: 'Customers',
  automations: 'Automations',
  communications: 'Communications',
};

const requireAuth = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /api/subscription/initialize
// Initialize Paystack payment for a specific module
router.post('/initialize', requireAuth, async (req, res) => {
  const { module } = req.body;
  if (!module || !MODULE_NAMES[module]) {
    return res.status(400).json({ error: 'Invalid module' });
  }

  const User = mongoose.model('User');
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check if already unlocked
  const unlockedModules = user.unlockedModules || [];
  if (unlockedModules.includes(module)) {
    return res.status(400).json({ error: `${MODULE_NAMES[module]} is already unlocked` });
  }

  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: user.email,
        amount: MODULE_PRICE * 100, // Paystack uses kobo
        currency: 'NGN',
        reference: `floworax_${module}_${user._id}_${Date.now()}`,
        metadata: {
          userId: user._id.toString(),
          module,
          businessName: user.businessName,
        },
        callback_url: `${FRONTEND_URL}/upgrade/verify?module=${module}`,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      module,
      amount: MODULE_PRICE,
    });
  } catch (err) {
    console.error('Paystack initialize error:', err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// POST /api/subscription/verify
// Verify payment and unlock the module
router.post('/verify', requireAuth, async (req, res) => {
  const { reference, module } = req.body;
  if (!reference || !module) {
    return res.status(400).json({ error: 'reference and module are required' });
  }

  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const txn = data?.data;
    if (!txn || txn.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Validate amount
    const paidAmount = txn.amount / 100;
    if (paidAmount < MODULE_PRICE) {
      return res.status(400).json({ error: 'Incorrect payment amount' });
    }

    // Validate metadata
    const meta = txn.metadata || {};
    if (meta.userId !== req.user.id || meta.module !== module) {
      return res.status(400).json({ error: 'Payment metadata mismatch' });
    }

    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Unlock the module
    const unlockedModules = user.unlockedModules || [];
    if (!unlockedModules.includes(module)) {
      unlockedModules.push(module);
    }

    // Also update plan to 'paid' if not already
    await User.findByIdAndUpdate(req.user.id, {
      unlockedModules,
      plan: 'paid',
    });

    res.json({
      success: true,
      message: `${MODULE_NAMES[module]} has been unlocked`,
      unlockedModules,
      module,
    });
  } catch (err) {
    console.error('Paystack verify error:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// GET /api/subscription/status
// Get user's current unlocked modules
router.get('/status', requireAuth, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      plan: user.plan || 'free',
      unlockedModules: user.unlockedModules || [],
      modulePriceNGN: MODULE_PRICE,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

module.exports = router;
