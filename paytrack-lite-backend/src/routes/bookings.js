const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const axios   = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://paytracklite.vercel.app';

// ── Public: Create booking ──
router.post('/public', async (req, res) => {
  const { serviceId, clientName, clientEmail, clientPhone, scheduledDate, scheduledTime, notes } = req.body;
  if (!serviceId || !clientName || !clientEmail || !scheduledDate || !scheduledTime)
    return res.status(400).json({ error: 'serviceId, clientName, clientEmail, scheduledDate and scheduledTime are required' });

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const booking = await Booking.create({
      serviceId,
      providerId:    service.userId,
      clientName,
      clientEmail,
      clientPhone,
      scheduledDate,
      scheduledTime,
      amount:        service.price,
      paymentStatus: service.isFree ? 'free' : 'pending',
      status:        service.isFree ? 'confirmed' : 'pending',
      notes,
    });

    // If free — confirm immediately
    if (service.isFree) {
      return res.status(201).json({ success: true, booking, paymentRequired: false });
    }

    // If paid — initialize Paystack
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email:        clientEmail,
        amount:       Math.round(service.price * 100),
        reference:    `booking-${booking._id}`,
        callback_url: `${FRONTEND_URL}/booking/success`,
        metadata:     { bookingId: booking._id.toString(), serviceId, clientName },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.status(201).json({
      success:          true,
      booking,
      paymentRequired:  true,
      authorizationUrl: data.data.authorization_url,
      reference:        data.data.reference,
    });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ── Get my bookings (provider) ──
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id })
      .populate('serviceId', 'title duration price isFree')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ── Update booking status ──
router.patch('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id },
      req.body,
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true, booking });
  } catch {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ── Verify booking payment ──
router.get('/verify/:reference', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${req.params.reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    if (data?.data?.status === 'success') {
      const bookingId = data.data.metadata?.bookingId;
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          paymentStatus: 'paid',
          status:        'confirmed',
          paymentRef:    req.params.reference,
        });
      }
      res.json({ success: true, message: 'Payment verified and booking confirmed' });
    } else {
      res.json({ success: false, message: 'Payment not verified' });
    }
  } catch {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
