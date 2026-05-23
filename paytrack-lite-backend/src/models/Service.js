const express = require('express');
const router  = express.Router();
const Service = require('../models/Service');

// ── Create service ──
router.post('/', async (req, res) => {
  const { title, description, duration, price, isFree, category, location } = req.body;
  if (!title || !duration) return res.status(400).json({ error: 'title and duration are required' });
  try {
    const service = await Service.create({
      userId:      req.user.id,
      title,
      description,
      duration,
      price:       isFree ? 0 : (price || 0),
      isFree:      isFree || false,
      category:    category || 'General',
      location:    location || 'Online',
    });
    res.status(201).json({ success: true, service });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ── Get my services ──
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// ── Update service ──
router.patch('/:id', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ success: true, service });
  } catch {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ── Delete service ──
router.delete('/:id', async (req, res) => {
  try {
    await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ── Public: get services by userId ──
router.get('/public/:userId', async (req, res) => {
  try {
    const services = await Service.find({ userId: req.params.userId, isActive: true });
    res.json({ success: true, services });
  } catch {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

module.exports = router;