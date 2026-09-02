const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const requireAuth = require('../middleware/auth');

// Aggregate unique customers from this provider's bookings
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

module.exports = router;
