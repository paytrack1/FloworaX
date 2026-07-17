const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const axios   = require('axios');
const Event       = require('../models/Event');
const EventTicket = require('../models/EventTicket');
const requireAuth = require('../middleware/auth');
const { requireFeature, requireProviderFeature } = require('../middleware/plan');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://floworax.vercel.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) { console.log(`[DEV] Email to ${to}: ${subject}`); return; }
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

function ticketHtml(event, ticket) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">You're registered!</h2>
    <p style="margin:0 0 16px">Hi ${ticket.buyerName}, your spot for <strong>${event.title}</strong> is confirmed.</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Date:</strong> ${event.date}</p>
      <p style="margin:4px 0"><strong>Time:</strong> ${event.time}</p>
      <p style="margin:4px 0"><strong>Location:</strong> ${event.location}</p>
      <p style="margin:12px 0 0;font-size:24px;font-weight:bold;letter-spacing:2px">${ticket.ticketCode}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.ticketCode)}" alt="Ticket QR code" style="margin:16px auto 0;display:block" />
    </div>
    <p style="margin:0;color:#64748B;font-size:13px">Show this code at check-in. Powered by Flowora</p>
  </div>`;
}

async function generateUniqueTicketCode() {
  for (let i = 0; i < 5; i++) {
    const code = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const exists = await EventTicket.findOne({ ticketCode: code });
    if (!exists) return code;
  }
  throw new Error('Failed to generate a unique ticket code');
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const withCounts = await Promise.all(events.map(async (ev) => {
      const [ticketCount, usedCount] = await Promise.all([
        EventTicket.countDocuments({ eventId: ev._id, status: { $ne: 'cancelled' } }),
        EventTicket.countDocuments({ eventId: ev._id, status: 'used' }),
      ]);
      return { ...ev.toObject(), ticketCount, usedCount };
    }));
    res.json({ success: true, events: withCounts });
  } catch (err) {
    console.error('List events error:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', requireAuth, requireFeature('events'), async (req, res) => {
  const { title, description, date, time, location, capacity, price } = req.body;
  if (!title || !date || !time)
    return res.status(400).json({ error: 'title, date and time are required' });

  try {
    const event = await Event.create({
      userId: req.user.id,
      title: title.trim(),
      description: description || '',
      date,
      time,
      location: location || 'Online',
      capacity: typeof capacity === 'number' ? capacity : 0,
      price: Number(price) || 0,
    });
    res.status(201).json({ success: true, event });
  } catch (err) {
    console.error('Create event error:', err.stack || err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to edit this event' });

    const { title, description, date, time, location, capacity, price } = req.body;
    if (title)        event.title = title.trim();
    if (description !== undefined) event.description = description;
    if (date)          event.date = date;
    if (time)          event.time = time;
    if (location)      event.location = location;
    if (typeof capacity === 'number') event.capacity = capacity;
    if (price !== undefined) event.price = Number(price) || 0;

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error('Update event error:', err.stack || err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to cancel this event' });

    event.status = 'cancelled';
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error('Cancel event error:', err.stack || err);
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

router.get('/:id/tickets', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to view this event' });

    const tickets = await EventTicket.find({ eventId: event._id }).sort({ purchasedAt: -1 });
    const usedCount = tickets.filter(t => t.status === 'used').length;
    res.json({ success: true, tickets, stats: { total: tickets.length, used: usedCount } });
  } catch (err) {
    console.error('List tickets error:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/public/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'active') return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(404).json({ error: 'Event not found' });
  }
});

async function confirmPaidTicket(ticketId, reference) {
  const ticket = await EventTicket.findOneAndUpdate(
    { _id: ticketId, paymentStatus: { $ne: 'paid' } },
    { paymentStatus: 'paid', status: 'valid', paymentRef: reference },
    { new: true }
  );
  if (ticket) {
    const event = await Event.findById(ticket.eventId);
    if (event) await sendEmail(ticket.buyerEmail, `Your ticket for ${event.title}`, ticketHtml(event, ticket));
  }
  return ticket;
}

router.post('/public/:id/register', async (req, res) => {
  const { buyerName, buyerEmail } = req.body;
  if (!buyerName || !buyerEmail)
    return res.status(400).json({ error: 'buyerName and buyerEmail are required' });

  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'active') return res.status(404).json({ error: 'Event not found' });

    const providerAllowed = await requireProviderFeature(event.userId, 'events');
    if (!providerAllowed.allowed) return res.status(providerAllowed.status).json({ error: providerAllowed.error });

    if (event.capacity > 0) {
      const currentCount = await EventTicket.countDocuments({ eventId: event._id, status: { $nin: ['cancelled'] } });
      if (currentCount >= event.capacity) return res.status(400).json({ error: 'This event is fully booked' });
    }

    const ticketCode = await generateUniqueTicketCode();
    const isFree = !event.price || event.price <= 0;

    const ticket = await EventTicket.create({
      eventId: event._id,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      ticketCode,
      paidAmount: event.price || 0,
      paymentStatus: isFree ? 'free' : 'pending',
      status: isFree ? 'valid' : 'pending',
    });

    if (isFree) {
      await sendEmail(ticket.buyerEmail, `Your ticket for ${event.title}`, ticketHtml(event, ticket));
      return res.status(201).json({ success: true, ticket, paymentRequired: false });
    }

    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: ticket.buyerEmail,
        amount: Math.round(event.price * 100),
        reference: `event-ticket-${ticket._id}`,
        callback_url: `${FRONTEND_URL}/events/ticket-success`,
        metadata: { ticketId: ticket._id.toString(), eventId: event._id.toString(), buyerName: ticket.buyerName },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.status(201).json({
      success: true, ticket, paymentRequired: true,
      authorizationUrl: data.data.authorization_url, reference: data.data.reference,
    });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

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
          const ticketId = data.data.metadata && data.data.metadata.ticketId;
          if (ticketId) await confirmPaidTicket(ticketId, reference);
        }
      }
    }
  } catch (err) {
    console.error('Event webhook error:', err.message);
  }
  res.sendStatus(200);
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${req.params.reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    if (data?.data?.status === 'success') {
      const ticketId = data.data.metadata?.ticketId;
      if (ticketId) await confirmPaidTicket(ticketId, req.params.reference);
      res.json({ success: true, message: 'Payment verified and ticket confirmed' });
    } else {
      res.json({ success: false, message: 'Payment not verified' });
    }
  } catch {
    res.status(500).json({ error: 'Verification failed' });
  }
});
router.post('/:id/checkin', requireAuth, async (req, res) => {
  const { ticketCode } = req.body;
  if (!ticketCode) return res.status(400).json({ error: 'ticketCode is required' });

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized for this event' });

    const ticket = await EventTicket.findOne({ eventId: event._id, ticketCode });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found for this event' });
    if (ticket.status === 'used')
      return res.status(400).json({ error: 'This ticket has already been used', usedAt: ticket.usedAt });
    if (ticket.status === 'cancelled')
      return res.status(400).json({ error: 'This ticket was cancelled' });

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Checkin error:', err.stack || err);
    res.status(500).json({ error: 'Failed to check in ticket' });
  }
});

module.exports = router;
module.exports.ticketHtml = ticketHtml;
