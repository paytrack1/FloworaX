const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/auth');

// ── GET /api/notifications — list mine, most recent first ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// ── POST /api/notifications — create one (used internally, but exposed for flexibility) ──
router.post('/', requireAuth, async (req, res) => {
  const { title, message, type, link } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message are required' });
  try {
    const notification = await Notification.create({
      userId: req.user.id,
      title,
      message,
      type: type || 'system',
      link: link || null,
    });
    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error('Create notification error:', err.message);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ── PATCH /api/notifications/:id/read — mark one as read ──
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ── PATCH /api/notifications/read-all — mark all as read ──
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err.message);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// ── DELETE /api/notifications/:id ──
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err.message);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
