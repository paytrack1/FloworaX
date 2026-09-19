const express = require('express');
const crypto = require('crypto');
const router  = express.Router();
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Service = require('../models/Service');
const axios   = require('axios');
const requireAuth = require('../middleware/auth');
const { requireFeature, requireProviderFeature } = require('../middleware/plan');
const notify = require('../utils/notify');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://floworax.vercel.app';
const RESEND_API_KEY      = process.env.RESEND_API_KEY;
const EMAIL_FROM          = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';
const REMINDER_SECRET     = process.env.REMINDER_SECRET;

async function sendEmail(to, subject, html, retries = 2) {
  if (!RESEND_API_KEY) return { ok: false, skipped: true };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await axios.post(
        'https://api.resend.com/emails',
        { from: EMAIL_FROM, to, subject, html },
        { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
      );
      return { ok: true };
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600) || !status; // network errors have no status
      const isLastAttempt = attempt === retries;
      if (!isRetryable || isLastAttempt) {
        console.error(`Email error (to ${to}, attempt ${attempt + 1}/${retries + 1}):`, err.response?.data || err.message);
        return { ok: false, error: err.response?.data?.message || err.message };
      }
      // Exponential backoff: 500ms, 1000ms, 2000ms... plus jitter, so a burst of
      // failures doesn't retry in lockstep and hit the rate limit again together.
      const delay = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Runs `worker` over `items` with at most `concurrency` in flight at once —
// fast enough to not take minutes at scale, gentle enough not to trip Resend's
// rate limits the way a fully-parallel Promise.all(...) would. One item failing
// never stops the rest; failures are collected and returned instead of just logged.
async function runBatched(items, worker, concurrency = 5) {
  const results = { sent: 0, failed: 0, errors: [] };
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      try {
        const outcome = await worker(item);
        if (outcome?.ok === false) {
          results.failed++;
          results.errors.push({ item: item?.clientEmail || item?._id, error: outcome.error });
        } else {
          results.sent++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ item: item?.clientEmail || item?._id, error: err.message });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(workers);
  return results;
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

function followupHtml(booking) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">Thanks for your booking</h2>
    <p style="margin:0 0 16px">Hi ${booking.clientName}, thank you for your recent booking on ${booking.scheduledDate}. We hope it went well.</p>
    <p style="margin:0 0 16px">We would love to see you again, book another time whenever you are ready.</p>
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

    const providerAllowed = await requireProviderFeature(service.userId, 'bookings');
    if (!providerAllowed.allowed) return res.status(providerAllowed.status).json({ error: providerAllowed.error });

    // Check if slot is already taken
    const existingBooking = await Booking.findOne({
      serviceId,
      scheduledDate,
      scheduledTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existingBooking) {
      return res.status(409).json({
        error: 'This time slot has been booked. Please select another time.',
      });
    }

    const booking = await Booking.create({
      serviceId, providerId: service.userId, clientName, clientEmail, clientPhone,
      scheduledDate, scheduledTime, amount: service.price,
      paymentStatus: service.isFree ? 'free' : 'pending',
      status: service.isFree ? 'confirmed' : 'pending', notes,
    });
    if (service.isFree) {
      await sendEmail(clientEmail, 'Your booking is confirmed', confirmationHtml(booking));
      await notify(
        service.userId,
        'New booking confirmed',
        `${clientName} booked ${service.title || 'a service'} for ${scheduledDate} at ${scheduledTime}.`,
        'booking'
      );
      return // Auto-create invoice for free booking
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      const owner = await User.findById(booking.providerId);
      await createBookingInvoice(booking, service, owner);
    } catch (invErr) { console.error('Free invoice auto-create error:', invErr.message); }
    res.status(201).json({ success: true, booking, paymentRequired: false });
    }

    await notify(
      service.userId,
      'New booking request',
      `${clientName} requested ${service.title || 'a service'} for ${scheduledDate} at ${scheduledTime}. Awaiting payment.`,
      'booking'
    );
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


async function createBookingInvoice(booking, service, owner) {
  try {
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const amount = service?.price || booking.amount || 0;
    const isFree = amount === 0 || service?.isFree;

    const invoice = await Invoice.create({
      userId: booking.providerId,
      invoiceNumber,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: booking.scheduledDate,
      items: [{
        description: service?.title || 'Booking',
        quantity: 1,
        unitPrice: amount,
      }],
      amount,
      status: isFree ? 'paid' : 'paid',
      notes: `Booking on ${booking.scheduledDate} at ${booking.scheduledTime}. Auto-generated.`,
    });

    // Send invoice email to client
    if (booking.clientEmail) {
      const ownerName = owner?.businessName || 'Your Service Provider';
      await sendEmail(
        booking.clientEmail,
        `Invoice ${invoiceNumber} from ${ownerName}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0F172A;">Invoice ${invoiceNumber}</h2>
          <p style="color:#64748B;">From: <strong>${ownerName}</strong></p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#F8FAFC;">
              <th style="padding:8px;text-align:left;font-size:12px;color:#94A3B8;">Description</th>
              <th style="padding:8px;text-align:right;font-size:12px;color:#94A3B8;">Amount</th>
            </tr>
            <tr>
              <td style="padding:12px 8px;font-size:14px;color:#0F172A;">${service?.title || 'Booking'} — ${booking.scheduledDate} at ${booking.scheduledTime}</td>
              <td style="padding:12px 8px;font-size:14px;font-weight:700;color:#185FA5;text-align:right;">${isFree ? 'Free' : '₦' + Number(amount).toLocaleString()}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
          <div style="text-align:right;">
            <p style="font-size:16px;font-weight:900;color:#0F172A;">Total: ${isFree ? 'Free' : '₦' + Number(amount).toLocaleString()}</p>
            <p style="font-size:12px;color:#22C55E;font-weight:700;">✓ Paid</p>
          </div>
          <p style="font-size:11px;color:#CBD5E1;margin-top:24px;">Generated by FloworaX · floworax.com</p>
        </div>`
      );
    }

    return invoice;
  } catch (err) {
    console.error('Auto-invoice creation failed:', err.message);
    // Non-fatal — booking still succeeds even if invoice fails
  }
}

async function confirmPaidBooking(bookingId, reference) {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, paymentStatus: { $ne: 'paid' } },
    { paymentStatus: 'paid', status: 'confirmed', paymentRef: reference },
    { new: true }
  );
  if (booking) {
    await sendEmail(booking.clientEmail, 'Your booking is confirmed', confirmationHtml(booking));
    await notify(
      booking.providerId,
      'Booking confirmed',
      `Payment received — ${booking.clientName}'s booking for ${booking.scheduledDate} is now confirmed.`,
      'booking'
    );
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

router.get('/', requireAuth, requireFeature('bookings'), async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id })
      .populate('serviceId', 'title duration price isFree').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.patch('/:id', requireAuth, requireFeature('bookings'), async (req, res) => {
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

// ── Core reminder/follow-up logic, reusable by both the HTTP endpoints
//    below (for external/serverless cron pings) and the in-process
//    node-cron scheduler wired up in index.js (for always-on hosting). ──
async function runReminders() {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);
  const bookings = await Booking.find({ scheduledDate: tomorrow, status: 'confirmed' });
  const { sent, failed, errors } = await runBatched(
    bookings,
    (b) => sendEmail(b.clientEmail, 'Reminder: your booking is tomorrow', reminderHtml(b)),
    5 // concurrency — 5 emails in flight at once
  );
  if (failed > 0) console.error(`[reminders] ${failed} failed:`, errors);
  return { sent, failed, date: tomorrow };
}

async function runFollowups() {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() - 1);
  const yesterday = t.toISOString().slice(0, 10);
  const bookings = await Booking.find({ scheduledDate: yesterday, status: 'confirmed' });
  const { sent, failed, errors } = await runBatched(
    bookings,
    (b) => sendEmail(b.clientEmail, 'Thanks for your booking', followupHtml(b)),
    5
  );
  if (failed > 0) console.error(`[followups] ${failed} failed:`, errors);
  return { sent, failed, date: yesterday };
}

router.get('/run-reminders', async (req, res) => {
  if (!REMINDER_SECRET || req.query.key !== REMINDER_SECRET) return res.sendStatus(403);
  try {
    const result = await runReminders();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Reminder error:', err.message);
    res.status(500).json({ error: 'Failed to run reminders' });
  }
});

router.get('/run-followups', async (req, res) => {
  if (!REMINDER_SECRET || req.query.key !== REMINDER_SECRET) return res.sendStatus(403);
  try {
    const result = await runFollowups();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Follow-up error:', err.message);
    res.status(500).json({ error: 'Failed to run follow-ups' });
  }
});


// PUBLIC: Cancel booking via token
router.get('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed booking' });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    // Check cancellation policy (default: free cancellation up to 24 hours before)
    const cancelHoursAllowed = owner?.cancellationHours || 24;
    const bookingDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}:00`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    const withinPolicy = hoursUntilBooking >= cancelHoursAllowed;

    res.json({
      success: true,
      booking: {
        clientName: booking.clientName,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        serviceName: service?.title || 'Service',
        amount: booking.amount,
        paymentStatus: booking.paymentStatus,
      },
      withinPolicy,
      cancelHoursAllowed,
      hoursUntilBooking: Math.round(hoursUntilBooking),
      refundMessage: booking.paymentStatus === 'paid'
        ? withinPolicy
          ? 'You are eligible for a refund. The business will process it within 3–5 business days.'
          : `Cancellation policy: free cancellation up to ${cancelHoursAllowed} hours before. No refund applies at this time.`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking details' });
  }
});

router.post('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed booking' });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    const bookingDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}:00`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    const cancelHoursAllowed = owner?.cancellationHours || 24;
    const withinPolicy = hoursUntilBooking >= cancelHoursAllowed;

    await Booking.findByIdAndUpdate(booking._id, {
      status: 'cancelled',
      cancelToken: null, // invalidate token after use
    });

    // Notify owner
    await notify(
      booking.providerId,
      'Booking cancelled',
      `${booking.clientName} cancelled their ${service?.title || 'booking'} for ${booking.scheduledDate} at ${booking.scheduledTime}.${withinPolicy && booking.paymentStatus === 'paid' ? ' Refund may be required.' : ''}`,
      'booking'
    );

    // Email client confirmation of cancellation
    await sendEmail(
      booking.clientEmail,
      'Your booking has been cancelled',
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="color:#EF4444;margin:0 0 12px">Booking Cancelled</h2>
        <p>Hi ${booking.clientName}, your booking has been cancelled.</p>
        <div style="background:#FEF2F2;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0"><strong>Service:</strong> ${service?.title || 'Booking'}</p>
          <p style="margin:4px 0"><strong>Date:</strong> ${booking.scheduledDate}</p>
          <p style="margin:4px 0"><strong>Time:</strong> ${booking.scheduledTime}</p>
        </div>
        ${booking.paymentStatus === 'paid' ? `<div style="background:#FFF7ED;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:0;font-size:13px;color:#92400E;">${withinPolicy
            ? '💰 You are eligible for a refund. The business will process it within 3–5 business days.'
            : `⚠️ Cancellation policy: free cancellation up to ${cancelHoursAllowed} hours before. No refund applies.`}</p>
        </div>` : ''}
        <p style="color:#64748B;font-size:12px;margin-top:16px;">Powered by FloworaX · floworax.com</p>
      </div>`
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refundMessage: booking.paymentStatus === 'paid'
        ? withinPolicy
          ? 'Refund will be processed by the business within 3–5 business days.'
          : 'No refund applies based on cancellation policy.'
        : null,
    });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// PUBLIC: Get reschedule details
router.get('/reschedule/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${booking.status} booking` });
    }

    const service = await Service.findById(booking.serviceId);
    res.json({
      success: true,
      booking: {
        clientName: booking.clientName,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        serviceId: booking.serviceId,
        serviceName: service?.title || 'Service',
        duration: service?.duration,
        availability: service?.availability || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking details' });
  }
});

// PUBLIC: Reschedule booking
router.post('/reschedule/:token', async (req, res) => {
  try {
    const { newDate, newTime } = req.body;
    if (!newDate || !newTime) return res.status(400).json({ error: 'newDate and newTime are required' });

    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${booking.status} booking` });
    }

    // Check new slot is available
    const conflict = await Booking.findOne({
      serviceId: booking.serviceId,
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: booking._id },
    });
    if (conflict) return res.status(409).json({ error: 'This time slot has been booked. Please select another time.' });

    const oldDate = booking.scheduledDate;
    const oldTime = booking.scheduledTime;

    await Booking.findByIdAndUpdate(booking._id, {
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: 'confirmed',
    });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    // Notify owner
    await notify(
      booking.providerId,
      'Booking rescheduled',
      `${booking.clientName} rescheduled ${service?.title || 'booking'} from ${oldDate} ${oldTime} to ${newDate} ${newTime}.`,
      'booking'
    );

    // Email client new confirmation
    await sendEmail(
      booking.clientEmail,
      'Booking rescheduled — new confirmation',
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="color:#2F5FB3;margin:0 0 12px">Booking Rescheduled ✓</h2>
        <p>Hi ${booking.clientName}, your booking has been rescheduled.</p>
        <div style="background:#F0FFF4;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;color:#64748B;text-decoration:line-through;font-size:13px;">Was: ${oldDate} at ${oldTime}</p>
          <p style="margin:8px 0 4px 0;font-weight:700;color:#0F172A;">Now: ${newDate} at ${newTime}</p>
          <p style="margin:4px 0"><strong>Service:</strong> ${service?.title || 'Booking'}</p>
        </div>
        <p style="color:#64748B;font-size:12px;margin-top:16px;">Powered by FloworaX · floworax.com</p>
      </div>`
    );

    res.json({ success: true, message: 'Booking rescheduled successfully', newDate, newTime });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});


module.exports = router;
module.exports.runReminders = runReminders;
module.exports.runFollowups = runFollowups;
