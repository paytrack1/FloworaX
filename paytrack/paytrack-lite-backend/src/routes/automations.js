const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/auth');

// ── Automation Schema ──
const automationSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:            { type: String, required: true, trim: true },
  description:     { type: String, default: '' },
  trigger:         { type: String, enum: ['schedule', 'new_member'], default: 'schedule' },
  dayOfWeek:       { type: Number, default: 0 },
  startTime:       { type: String, default: '09:00' },
  endTime:         { type: String, default: '' },
  timezone:        { type: String, default: 'Africa/Lagos' },
  reminder:        { daysBefore: { type: Number, default: 1 }, atTime: { type: String, default: '10:00' } },
  audience:        {
    mode:          { type: String, default: 'all' },
    newWithinDays: { type: Number, default: 30 },
    tag:           { type: String, default: '' },
    customerIds:   [{ type: mongoose.Schema.Types.ObjectId }],
  },
  channel:         { type: String, enum: ['email', 'whatsapp', 'sms'], default: 'email' },
  messageTemplate: { type: String, default: '' },
  status:          { type: String, enum: ['active', 'paused'], default: 'active' },
  lastRunAt:       { type: Date, default: null },
  nextRunDisplay:  { type: String, default: null },
  createdAt:       { type: Date, default: Date.now },
});

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

const Automation  = mongoose.models.Automation  || mongoose.model('Automation', automationSchema);
const MessageLog  = mongoose.models.MessageLog  || mongoose.model('MessageLog', messageLogSchema);

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
    res.status(500).json({ error: 'Failed to create automation' });
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
