const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const mongoose = require('mongoose'); // User model is registered by index.js, not a separate file
const requireAuth = require('../middleware/auth');

// Aggregate unique customers from this provider's bookings.
// Note: this is separate from the Customer model below -- it's a virtual
// view derived from Booking records, kept for the existing Customers.jsx
// page. Actual Customer documents (used by automations/consent/CRM) are
// created via public self-registration or manual add, not from here.
router.get('/', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id }).sort({ createdAt: -1 });

    const customerMap = new Map();
    for (const b of bookings) {
      const key = b.clientEmail.toLowerCase().trim();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: b.clientName,
          email: b.clientEmail,
          phone: b.clientPhone || null,
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.scheduledDate,
        });
      }
      const customer = customerMap.get(key);
      customer.totalBookings += 1;
      if (b.paymentStatus === 'paid' || b.paymentStatus === 'free') {
        customer.totalSpent += b.amount || 0;
      }
      if (b.scheduledDate > customer.lastBookingDate) {
        customer.lastBookingDate = b.scheduledDate;
      }
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => (b.lastBookingDate > a.lastBookingDate ? 1 : -1)
    );

    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    console.error('Failed to get customers:', err);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// Rate limit public self-registration to protect against abuse -- this
// route has no auth, so it needs its own protection.
const publicJoinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/customers/public/:ownerId -- lets the public Join page confirm
// the link is valid and show the business/church name before the form.
router.get('/public/:ownerId', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const owner = await User.findById(req.params.ownerId).select('businessName businessType');
    if (!owner) return res.status(404).json({ error: 'This registration link is invalid.' });
    res.json({ success: true, businessName: owner.businessName, businessType: owner.businessType });
  } catch {
    res.status(404).json({ error: 'This registration link is invalid.' });
  }
});

// POST /api/customers/public/:ownerId -- public, no-auth self-registration
// (church member / customer "Join" form). Consent is explicit and
// opt-in only for SMS/WhatsApp; email defaults to opted-in to match
// existing behavior elsewhere in the app (e.g. booking confirmations).
router.post('/public/:ownerId', publicJoinLimiter, async (req, res) => {
  const { name, email, phone, address, emailOptIn, smsOptIn, whatsappOptIn, howHeard, invitedBy, wantsVisit } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if ((!email || !email.trim()) && (!phone || !phone.trim())) {
    return res.status(400).json({ error: 'Please provide an email or phone number.' });
  }

  try {
    const User = mongoose.model('User');
    const owner = await User.findById(req.params.ownerId);
    if (!owner) return res.status(404).json({ error: 'This registration link is invalid.' });

    const customer = await Customer.create({
      userId: owner._id,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      emailOptIn: emailOptIn !== false,
      smsOptIn: !!smsOptIn,
      whatsappOptIn: !!whatsappOptIn,
      consentUpdatedAt: new Date(),
      source: 'public_join',
      howHeard: howHeard ? howHeard.trim() : null,
      invitedBy: invitedBy ? invitedBy.trim() : null,
      wantsVisit: !!wantsVisit,
    });

    res.status(201).json({ success: true, customerId: customer._id });
  } catch (err) {
    console.error('Public registration failed:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// GET /api/customers/members -- actual Customer/member documents (not the
// booking-derived virtual view above). Powers CRM/audience views.
router.get('/members', requireAuth, async (req, res) => {
  try {
    const members = await Customer.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: members.length, members });
  } catch (err) {
    console.error('Failed to get members:', err);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// POST /api/customers/members -- owner manually adds a member/customer.
router.post('/members', requireAuth, async (req, res) => {
  const { name, email, phone, address, emailOptIn, smsOptIn, whatsappOptIn, tags } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });

  try {
    const customer = await Customer.create({
      userId: req.user.id,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      emailOptIn: emailOptIn !== false,
      smsOptIn: !!smsOptIn,
      whatsappOptIn: !!whatsappOptIn,
      consentUpdatedAt: new Date(),
      source: 'manual',
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error('Failed to add member:', err.message);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

module.exports = router;