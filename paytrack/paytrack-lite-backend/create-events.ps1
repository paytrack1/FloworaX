# Creates Event.js, EventTicket.js, events.js, wires them into index.js, and verifies everything.
# Run from inside paytrack-lite-backend.

New-Item -ItemType Directory -Force -Path "src\models" | Out-Null
New-Item -ItemType Directory -Force -Path "src\routes" | Out-Null

@'
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date:        { type: String, required: true },
  time:        { type: String, required: true },
  location:    { type: String, trim: true, default: 'Online' },
  capacity:    { type: Number, default: 0 },
  price:       { type: Number, default: 0 },
  status:      { type: String, enum: ['active', 'cancelled'], default: 'active' },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
'@ | Set-Content -Path "src\models\Event.js" -Encoding UTF8

@'
const mongoose = require('mongoose');

const eventTicketSchema = new mongoose.Schema({
  eventId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  buyerName:    { type: String, required: true, trim: true },
  buyerEmail:   { type: String, required: true, trim: true },
  ticketCode:   { type: String, required: true, unique: true },
  status:       { type: String, enum: ['valid', 'used', 'cancelled'], default: 'valid' },
  paidAmount:   { type: Number, default: 0 },
  usedAt:       { type: Date, default: null },
  purchasedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventTicket', eventTicketSchema);
'@ | Set-Content -Path "src\models\EventTicket.js" -Encoding UTF8

@'
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const axios   = require('axios');
const Event       = require('../models/Event');
const EventTicket = require('../models/EventTicket');
const requireAuth = require('../middleware/auth');
const { requireFeature, requireProviderFeature } = require('../middleware/plan');

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
      const currentCount = await EventTicket.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
      if (currentCount >= event.capacity) return res.status(400).json({ error: 'This event is fully booked' });
    }

    const ticketCode = await generateUniqueTicketCode();
    const ticket = await EventTicket.create({
      eventId: event._id,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      ticketCode,
      paidAmount: event.price || 0,
    });

    await sendEmail(ticket.buyerEmail, `Your ticket for ${event.title}`, ticketHtml(event, ticket));

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    res.status(500).json({ error: 'Failed to register for event' });
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
'@ | Set-Content -Path "src\routes\events.js" -Encoding UTF8

Write-Host "Files created. Verifying syntax..." -ForegroundColor Cyan
node -c "src\models\Event.js"
if ($LASTEXITCODE -eq 0) { Write-Host "Event.js OK" -ForegroundColor Green } else { Write-Host "Event.js FAILED" -ForegroundColor Red }

node -c "src\models\EventTicket.js"
if ($LASTEXITCODE -eq 0) { Write-Host "EventTicket.js OK" -ForegroundColor Green } else { Write-Host "EventTicket.js FAILED" -ForegroundColor Red }

node -c "src\routes\events.js"
if ($LASTEXITCODE -eq 0) { Write-Host "events.js OK" -ForegroundColor Green } else { Write-Host "events.js FAILED" -ForegroundColor Red }

Write-Host ""
Write-Host "Now wiring into index.js..." -ForegroundColor Cyan
$content = Get-Content index.js -Raw
if ($content -notmatch "require\('./src/routes/events'\)") {
  $content = $content -replace "(const waitlistRoutes = require\('\./src/routes/waitlist'\);)", "`$1`nconst eventRoutes = require('./src/routes/events');"
  $content = $content -replace "(app\.use\('/api/waitlist', waitlistRoutes\);)", "`$1`napp.use('/api/events', eventRoutes);"
  Set-Content index.js -Value $content -NoNewline -Encoding UTF8
  Write-Host "index.js updated." -ForegroundColor Green
} else {
  Write-Host "index.js already references events routes, skipped." -ForegroundColor Yellow
}

node -c index.js
if ($LASTEXITCODE -eq 0) { Write-Host "index.js OK" -ForegroundColor Green } else { Write-Host "index.js FAILED" -ForegroundColor Red }

Write-Host ""
Write-Host "Done. If everything above says OK, run: npm start" -ForegroundColor Cyan