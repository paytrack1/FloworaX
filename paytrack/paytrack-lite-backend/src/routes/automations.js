const express = require('express');
const router = express.Router();
const Automation = require('../models/Automation');
const AutomationLog = require('../models/AutomationLog');
const AutomationExecution = require('../models/AutomationExecution');
const Customer = require('../models/Customer');
const requireAuth = require('../middleware/auth');
const { requireFeature } = require('../middleware/plan');
const messagingService = require('../services/messagingService');
const { DAY_NAMES } = require('../utils/constants');

// â”€â”€ Helper: substitute template variables â”€â”€
function interpolateTemplate(template, variables) {
  return messagingService.constructor.interpolateTemplate(template, variables);
}

// â”€â”€ GET /api/automations - List automations â”€â”€
router.get('/', requireAuth, async (req, res) => {
  try {
    const automations = await Automation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ automations });
  } catch (err) {
    console.error('Error fetching automations:', err.message);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// â”€â”€ GET /api/automations/logs - Message log â”€â”€
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await AutomationLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customerId', 'name email phone')
      .populate('automationId', 'name');
    res.json({ logs });
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ error: 'Failed to fetch message log' });
  }
});

// â”€â”€ POST /api/automations - Create automation â”€â”€
router.post('/', requireAuth, requireFeature('communications'), async (req, res) => {
  const { name, description, trigger, dayOfWeek, startTime, endTime, timezone, reminder, audience, channel, messageTemplate } = req.body;

  if (!name || !messageTemplate) {
    return res.status(400).json({ error: 'name and messageTemplate are required' });
  }

  try {
    const automation = await Automation.create({
      userId: req.user.id,
      name,
      description,
      trigger: trigger || 'schedule',
      dayOfWeek: dayOfWeek ?? 0,
      startTime: startTime || '09:00',
      endTime: endTime || '',
      timezone: timezone || 'Africa/Lagos',
      reminder: {
        daysBefore: reminder?.daysBefore ?? 1,
        atTime: reminder?.atTime || '10:00',
      },
      audience: {
        mode: audience?.mode || 'all',
        newWithinDays: audience?.newWithinDays || 30,
        tag: audience?.tag || '',
        customerIds: audience?.customerIds || [],
      },
      channel: channel || 'email',
      messageTemplate,
      status: 'active',
    });

    res.status(201).json({ automation });
  } catch (err) {
    console.error('Error creating automation:', err.message);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// â”€â”€ PATCH /api/automations/:id - Update automation â”€â”€
router.patch('/:id', requireAuth, async (req, res) => {
  const { name, description, trigger, dayOfWeek, startTime, endTime, timezone, reminder, audience, channel, messageTemplate } = req.body;

  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    if (automation.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    if (name !== undefined) automation.name = name;
    if (description !== undefined) automation.description = description;
    if (trigger !== undefined) automation.trigger = trigger;
    if (dayOfWeek !== undefined) automation.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) automation.startTime = startTime;
    if (endTime !== undefined) automation.endTime = endTime;
    if (timezone !== undefined) automation.timezone = timezone;
    if (reminder !== undefined) automation.reminder = { ...automation.reminder, ...reminder };
    if (audience !== undefined) automation.audience = { ...automation.audience, ...audience };
    if (channel !== undefined) automation.channel = channel;
    if (messageTemplate !== undefined) automation.messageTemplate = messageTemplate;

    automation.updatedAt = new Date();
    await automation.save();

    res.json({ automation });
  } catch (err) {
    console.error('Error updating automation:', err.message);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// â”€â”€ DELETE /api/automations/:id - Delete automation â”€â”€
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    if (automation.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await Automation.deleteOne({ _id: req.params.id });
    await AutomationLog.deleteMany({ automationId: req.params.id });
    await AutomationExecution.deleteMany({ automationId: req.params.id });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting automation:', err.message);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

// â”€â”€ PATCH /api/automations/:id/pause - Pause automation â”€â”€
router.patch('/:id/pause', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    if (automation.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    automation.status = 'paused';
    automation.updatedAt = new Date();
    await automation.save();

    res.json({ automation });
  } catch (err) {
    console.error('Error pausing automation:', err.message);
    res.status(500).json({ error: 'Failed to pause automation' });
  }
});

// â”€â”€ PATCH /api/automations/:id/resume - Resume automation â”€â”€
router.patch('/:id/resume', requireAuth, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    if (automation.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    automation.status = 'active';
    automation.updatedAt = new Date();
    await automation.save();

    res.json({ automation });
  } catch (err) {
    console.error('Error resuming automation:', err.message);
    res.status(500).json({ error: 'Failed to resume automation' });
  }
});

module.exports = router;
