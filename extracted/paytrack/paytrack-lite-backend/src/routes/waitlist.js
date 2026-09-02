const express = require('express');
const router = express.Router();
const axios = require('axios');
const Waitlist = require('../models/Waitlist');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';

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

function confirmationHtml(name) {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">You are on the list!</h2>
    <p style="margin:0 0 16px">Hi ${name}, thanks for joining the Flowora waitlist. We will email you as soon as we are ready to bring you on board.</p>
    <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
  </div>`;
}

router.post('/', async (req, res) => {
  try {
    const { name, email, businessType } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const existing = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already on the waitlist' });
    }
    const entry = await Waitlist.create({ name, email, businessType });
    await sendEmail(entry.email, 'You are on the Flowora waitlist', confirmationHtml(entry.name));
    res.json({ success: true });
  } catch (err) {
    console.error('Waitlist signup error:', err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

module.exports = router;
