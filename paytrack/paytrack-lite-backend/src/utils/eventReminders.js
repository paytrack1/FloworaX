const axios = require('axios');
const mongoose = require('mongoose');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';

// Cron runs every 5 minutes, so a +/- window slightly wider than that
// guarantees each trigger is caught exactly once without needing
// minute-perfect alignment.
const WINDOW_MS = 3 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const THANK_YOU_DELAY_MS = 3 * HOUR_MS; // sent 3h after the event starts

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) { console.log(`[DEV] Event reminder email to ${to}: ${subject}`); return; }
  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from: EMAIL_FROM, to, subject, html },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
    );
  } catch (err) {
    console.error('Event reminder email error:', (err.response && err.response.data) || err.message);
  }
}

// Converts a wall-clock date+time in a given IANA timezone to the correct
// UTC instant, using the JS engine's real timezone database (handles DST
// correctly) - no external library needed. Verified against known
// reference points (Africa/Lagos, America/New_York) before use.
function eventDateTimeToUTC(dateStr, timeStr, timezone) {
  const naiveUTC = new Date(`${dateStr}T${timeStr}:00.000Z`);
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(naiveUTC).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  } catch {
    return naiveUTC; // invalid/unknown timezone - fall back to treating it as UTC rather than crashing the cron job
  }
  const asIfLocal = new Date(Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  ));
  const offsetMs = naiveUTC.getTime() - asIfLocal.getTime();
  return new Date(naiveUTC.getTime() + offsetMs);
}

function isWithinWindow(now, target) {
  return Math.abs(now.getTime() - target.getTime()) <= WINDOW_MS;
}

function reminderHtml({ heading, body, event }) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">${heading}</h2>
    <p style="margin:0 0 16px">${body}</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Event:</strong> ${event.title}</p>
      <p style="margin:4px 0"><strong>Date:</strong> ${event.date}</p>
      <p style="margin:4px 0"><strong>Time:</strong> ${event.time}</p>
      <p style="margin:4px 0"><strong>Location:</strong> ${event.location}</p>
    </div>
    <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
  </div>`;
}

async function sendToAttendees(event, tickets, heading, body) {
  const html = reminderHtml({ heading, body, event });
  await Promise.all(
    tickets.map((t) => sendEmail(t.buyerEmail, `${heading}: ${event.title}`, html))
  );
}

async function runEventReminders() {
  const Event = mongoose.model('Event');
  const EventTicket = mongoose.model('EventTicket');
  const User = mongoose.model('User');

  const now = new Date();
  const events = await Event.find({ status: 'active' });
  let dayBeforeSent = 0;
  let hourBeforeSent = 0;
  let thankYouSent = 0;

  for (const event of events) {
    // eslint-disable-next-line no-await-in-loop
    const owner = await User.findById(event.userId).select('timezone');
    const timezone = owner?.timezone || process.env.TZ || 'Africa/Lagos';
    // eslint-disable-next-line no-await-in-loop
    const eventUTC = eventDateTimeToUTC(event.date, event.time, timezone);

    const reminders = event.remindersSent || {};

    if (!reminders.dayBefore && isWithinWindow(now, new Date(eventUTC.getTime() - DAY_MS))) {
      // eslint-disable-next-line no-await-in-loop
      const claimed = await Event.findOneAndUpdate(
        { _id: event._id, 'remindersSent.dayBefore': { $ne: true } },
        { $set: { 'remindersSent.dayBefore': true } }
      );
      if (claimed) {
        // eslint-disable-next-line no-await-in-loop
        const tickets = await EventTicket.find({ eventId: event._id, status: { $in: ['valid', 'used'] } });
        // eslint-disable-next-line no-await-in-loop
        await sendToAttendees(event, tickets, 'See you tomorrow!', `This is a reminder that <strong>${event.title}</strong> is happening tomorrow.`);
        dayBeforeSent += tickets.length;
      }
    }

    if (!reminders.hourBefore && isWithinWindow(now, new Date(eventUTC.getTime() - HOUR_MS))) {
      // eslint-disable-next-line no-await-in-loop
      const claimed = await Event.findOneAndUpdate(
        { _id: event._id, 'remindersSent.hourBefore': { $ne: true } },
        { $set: { 'remindersSent.hourBefore': true } }
      );
      if (claimed) {
        // eslint-disable-next-line no-await-in-loop
        const tickets = await EventTicket.find({ eventId: event._id, status: { $in: ['valid', 'used'] } });
        // eslint-disable-next-line no-await-in-loop
        await sendToAttendees(event, tickets, 'Starting soon', `<strong>${event.title}</strong> starts in about an hour. We look forward to seeing you!`);
        hourBeforeSent += tickets.length;
      }
    }

    if (!reminders.thankYou && isWithinWindow(now, new Date(eventUTC.getTime() + THANK_YOU_DELAY_MS))) {
      // eslint-disable-next-line no-await-in-loop
      const claimed = await Event.findOneAndUpdate(
        { _id: event._id, 'remindersSent.thankYou': { $ne: true } },
        { $set: { 'remindersSent.thankYou': true } }
      );
      if (claimed) {
        // eslint-disable-next-line no-await-in-loop
        const tickets = await EventTicket.find({ eventId: event._id, status: { $in: ['valid', 'used'] } });
        // eslint-disable-next-line no-await-in-loop
        await sendToAttendees(event, tickets, 'Thank you for attending!', `Thank you for being part of <strong>${event.title}</strong>. We hope to see you again soon.`);
        thankYouSent += tickets.length;
      }
    }
  }

  return { dayBeforeSent, hourBeforeSent, thankYouSent };
}

module.exports = { runEventReminders, eventDateTimeToUTC };
