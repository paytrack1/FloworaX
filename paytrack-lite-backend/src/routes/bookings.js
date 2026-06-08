const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const axios   = require('axios');
const requireAuth = require('../middleware/auth');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://floworax.vercel.app';
const RESEND_API_KEY      = process.env.RESEND_API_KEY;
const EMAIL_FROM          = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';
const REMINDER_SECRET     = process.env.REMINDER_SECRET;

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) return;
  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from: EMAIL_FROM, to, subject, html },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
    );
  } catch (err) {
    console.error('Email error:', (err.response && err.response.data) || err.message);
  }
}

function confirmationHtml(booking) {
  const amountLine = booking.amount
    ? `<p style="margin:4px 0"><strong>Amount paid:</strong> &#8358;${booking.amount}</p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">Booking confirmed</h2>
    <p style="margin:0 0 16px">Hi ${booking.clientName}, your booking is confirmed. Here are the details:</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Date:</strong> ${booking.scheduledDate}</p>
      <p style="margin:4px 0"><strong>Time:</strong> ${booking.scheduledTime}</p>
      ${amountLine}
    </div>
    <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
  </div>`;
}


function reminderHtml(booking) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">Reminder: your booking is tomorrow</h2>
    <p style="margin:0 0 16px">Hi ${booking.clientName}, this is a friendly reminder about your upcoming booking.</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Date:</strong> ${booking.scheduledDate}</p>
      <p style="margin:4px 0"><strong>Time:</strong> ${booking.scheduledTime}</p>
    </div>
    <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
  </div>`;
}

router.post('/public', async (req, res) => {
  const { serviceId, clientName, clientEmail, clientPhone, scheduledDate, scheduledTime, notes } = req.body;
  if (!serviceId || !clientName || !clientEmail || !scheduledDate || !scheduledTime)
    return res.status(400).json({ error: 'serviceId, clientName, clientEmail, scheduledDate and scheduledTime are required' });
  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    const booking = await Booking.create({
      serviceId, providerId: service.userId, clientName, clientEmail, clientPhone,
      scheduledDate, scheduledTime, amount: service.price,
      paymentStatus: service.isFree ? 'free' : 'pending',
      status: service.isFree ? 'confirmed' : 'pending', notes,
    });
    if (service.isFree) {
      await sendEmail(clientEmail, 'Your booking is confirmed', confirmationHtml(booking));
      return res.status(201).json({ success: true, booking, paymentRequired: false });
    }
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: clientEmail, amount: Math.round(service.price * 100),
        reference: `booking-${booking._id}`,
        callback_url: `${FRONTEND_URL}/booking/success`,
        metadata: { bookingId: booking._id.toString(), serviceId, clientName },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    res.status(201).json({
      success: true, booking, paymentRequired: true,
      authorizationUrl: data.data.authorization_url, reference: data.data.reference,
    });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

async function confirmPaidBooking(bookingId, reference) {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, paymentStatus: { $ne: 'paid' } },
    { paymentStatus: 'paid', status: 'confirmed', paymentRef: reference },
    { new: true }
  );
  if (booking) {
    await sendEmail(booking.clientEmail, 'Your booking is confirmed', confirmationHtml(booking));
  }
  return booking;
}

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event && event.event === 'charge.success') {
      const reference = event.data && event.data.reference;
      if (reference) {
        const { data } = await axios.get(
          `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
          { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        if (data && data.data && data.data.status === 'success') {
          const bookingId = data.data.metadata && data.data.metadata.bookingId;
          if (bookingId) await confirmPaidBooking(bookingId, reference);
        }
      }
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
  res.sendStatus(200);
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id })
      .populate('serviceId', 'title duration price isFree').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id }, req.body, { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true, booking });
  } catch {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${req.params.reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    if (data?.data?.status === 'success') {
      const bookingId = data.data.metadata?.bookingId;
      if (bookingId) await confirmPaidBooking(bookingId, req.params.reference);
      res.json({ success: true, message: 'Payment verified and booking confirmed' });
    } else {
      res.json({ success: false, message: 'Payment not verified' });
    }
  } catch {
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/run-reminders', async (req, res) => {
  if (!REMINDER_SECRET || req.query.key !== REMINDER_SECRET) return res.sendStatus(403);
  try {
    const t = new Date();
    t.setUTCDate(t.getUTCDate() + 1);
    const tomorrow = t.toISOString().slice(0, 10);
    const bookings = await Booking.find({ scheduledDate: tomorrow, status: 'confirmed' });
    for (const b of bookings) {
      await sendEmail(b.clientEmail, 'Reminder: your booking is tomorrow', reminderHtml(b));
    }
    res.json({ success: true, sent: bookings.length, date: tomorrow });
  } catch (err) {
    console.error('Reminder error:', err.message);
    res.status(500).json({ error: 'Failed to run reminders' });
  }
});

module.exports = router;
