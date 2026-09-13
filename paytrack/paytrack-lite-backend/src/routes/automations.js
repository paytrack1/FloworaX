const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/auth');
const { sendSMS, sendWhatsApp, renderTemplate } = require('../utils/termii');

const Automation = require('../models/Automation');

// Lazy-load or create MessageLog model
const messageLogSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  automationId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', default: null },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  messageType:   { type: String, default: 'automation' },
  channel:       { type: String, default: 'email' },
  recipient:     { type: String, default: '' },
  status:        { type: String, enum: ['sent', 'failed', 'skipped_optout', 'skipped_no_contact', 'skipped_no_credits'], default: 'sent' },
  failureReason: { type: String, default: null },
  createdAt:     { type: Date, default: Date.now },
});

const MessageLog = mongoose.models.MessageLog || mongoose.model('MessageLog', messageLogSchema);

// GET all automations
router.get('/', requireAuth, async (req, res) => {
  try {
    const automations = await Automation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, automations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// GET message logs
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await MessageLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('automationId', 'name')
      .populate('customerId', 'name');
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST create automation
router.post('/', requireAuth, async (req, res) => {
  const { name, messageTemplate } = req.body;
  if (!name || !messageTemplate) return res.status(400).json({ error: 'name and messageTemplate are required' });
  try {
    const automation = await Automation.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, automation });
  } catch (err) {
    console.error('Create automation error:', err);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// POST send automation now (manual trigger)
router.post('/:id/send', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const Customer = mongoose.model('Customer');
    let customers = [];

    // Build audience
    if (automation.audience?.mode === 'all') {
      customers = await Customer.find({ userId: req.user.id });
    } else if (automation.audience?.mode === 'new') {
      const since = new Date(Date.now() - (automation.audience.newWithinDays || 30) * 24 * 60 * 60 * 1000);
      customers = await Customer.find({ userId: req.user.id, createdAt: { $gte: since } });
    } else if (automation.audience?.mode === 'specific' && automation.audience.customerIds?.length) {
      customers = await Customer.find({ _id: { $in: automation.audience.customerIds }, userId: req.user.id });
    }

    const User = mongoose.model('User');
    const owner = await User.findById(req.user.id);

    const results = { sent: 0, failed: 0, skipped: 0 };
    const logs = [];

    for (const customer of customers) {
      const vars = {
        firstName: customer.name?.split(' ')[0] || customer.name || '',
        lastName: customer.name?.split(' ').slice(1).join(' ') || '',
        fullName: customer.name || '',
        businessName: owner?.businessName || '',
        serviceName: automation.name || '',
        date: new Date().toLocaleDateString('en-NG'),
        startTime: automation.startTime || '',
        endTime: automation.endTime || '',
        dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()],
      };

      const message = renderTemplate(automation.messageTemplate, vars);
      let status = 'sent';
      let failureReason = null;
      let recipient = '';

      try {
        if (automation.channel === 'sms') {
          if (!customer.phone) { status = 'skipped_no_contact'; results.skipped++; } 
          else {
            recipient = customer.phone;
            await sendSMS(customer.phone, message);
            results.sent++;
          }
        } else if (automation.channel === 'whatsapp') {
          if (!customer.phone) { status = 'skipped_no_contact'; results.skipped++; }
          else {
            recipient = customer.phone;
            await sendWhatsApp(customer.phone, message);
            results.sent++;
          }
        } else if (automation.channel === 'email') {
          if (!customer.email) { status = 'skipped_no_contact'; results.skipped++; }
          else {
            // Email handled by Resend in main index.js
            recipient = customer.email;
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'FloworaX <noreply@floworax.com>',
              to: customer.email,
              subject: automation.name,
              html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
            });
            results.sent++;
          }
        }
      } catch (err) {
        status = 'failed';
        failureReason = err.message;
        results.failed++;
      }

      logs.push({
        userId: req.user.id,
        automationId: automation._id,
        customerId: customer._id,
        messageType: 'automation',
        channel: automation.channel,
        recipient,
        status,
        failureReason,
      });
    }

    // Save all logs
    if (logs.length > 0) await MessageLog.insertMany(logs);

    // Update lastRunAt
    await Automation.findByIdAndUpdate(automation._id, { lastRunAt: new Date() });

    res.json({ success: true, results, totalAudience: customers.length });
  } catch (err) {
    console.error('Send automation error:', err);
    res.status(500).json({ error: 'Failed to send automation' });
  }
});

// PATCH update automation
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true, automation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// PATCH pause automation
router.patch('/:id/pause', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'paused' },
      { new: true }
    );
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true, automation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause automation' });
  }
});

// PATCH resume automation
router.patch('/:id/resume', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'active' },
      { new: true }
    );
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true, automation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resume automation' });
  }
});

// DELETE automation
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

module.exports = router;
