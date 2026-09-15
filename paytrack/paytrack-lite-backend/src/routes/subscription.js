const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://floworax.vercel.app';

const FLAT_PRICE = 7000; // ₦7,000 flat regardless of modules selected

const VALID_MODULES = ['sales', 'bookings', 'invoices', 'events', 'services', 'customers', 'expenses', 'automations', 'communications'];

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
router.post('/initialize', requireAuth, async (req, res) => {
  let { modules, module } = req.body;

  // Support both single module and array of modules
  if (module && !modules) modules = [module];
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({ error: 'Please select at least one module' });
  }

  // Validate modules
  const invalidModules = modules.filter(m => !VALID_MODULES.includes(m));
  if (invalidModules.length > 0) {
    return res.status(400).json({ error: `Invalid modules: ${invalidModules.join(', ')}` });
  }

  const User = mongoose.model('User');
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: user.email,
        amount: FLAT_PRICE * 100, // Paystack uses kobo
        currency: 'NGN',
        reference: `floworax_upgrade_${user._id}_${Date.now()}`,
        metadata: {
          userId: user._id.toString(),
          modules: modules,
          businessName: user.businessName,
        },
        callback_url: `${FRONTEND_URL}/upgrade/verify?modules=${modules.join(',')}`,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      modules,
      amount: FLAT_PRICE,
    });
  } catch (err) {
    console.error('Paystack initialize error:', err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// POST /api/subscription/verify
router.post('/verify', requireAuth, async (req, res) => {
  const { reference, modules: modulesParam, module } = req.body;
  let modules = modulesParam;

  // Support both string (comma-separated) and array
  if (typeof modules === 'string') modules = modules.split(',');
  if (module && !modules) modules = [module];

  if (!reference || !modules || modules.length === 0) {
    return res.status(400).json({ error: 'reference and modules are required' });
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
    if (paidAmount < FLAT_PRICE) {
      return res.status(400).json({ error: 'Incorrect payment amount' });
    }

    // Validate metadata
    const meta = txn.metadata || {};
    if (meta.userId !== req.user.id) {
      return res.status(400).json({ error: 'Payment metadata mismatch' });
    }

    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Merge with existing unlocked modules
    const existing = user.unlockedModules || [];
    const merged = [...new Set([...existing, ...modules])];

    await User.findByIdAndUpdate(req.user.id, {
      unlockedModules: merged,
      plan: 'paid',
    });

    res.json({
      success: true,
      message: `${modules.join(', ')} unlocked successfully`,
      unlockedModules: merged,
      modules,
    });
  } catch (err) {
    console.error('Paystack verify error:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// GET /api/subscription/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      plan: user.plan || 'free',
      unlockedModules: user.unlockedModules || [],
      priceNGN: FLAT_PRICE,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

module.exports = router;
