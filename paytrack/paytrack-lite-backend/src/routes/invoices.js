const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const requireAuth = require('../middleware/auth');
const { requireFeature } = require('../middleware/plan');

router.post('/', requireAuth, requireFeature('invoices'), async (req, res) => {
  const { clientName, clientEmail, items, amount, dueDate, notes } = req.body;
  if (!clientName || typeof amount !== 'number') {
    return res.status(400).json({ error: 'clientName and amount are required' });
  }
  try {
    const count = await Invoice.countDocuments({ userId: req.user.id });
    const invoice = await Invoice.create({
      userId: req.user.id,
      invoiceNumber: `INV-${Date.now()}-${count + 1}`,
      clientName,
      clientEmail,
      items: items || [],
      amount,
      dueDate: dueDate || null,
      notes,
      status: 'sent',
    });
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.get('/', requireAuth, requireFeature('invoices'), async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, invoices });
  } catch {
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

router.patch('/:id/pay', requireAuth, requireFeature('invoices'), async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.patch('/:id', requireAuth, requireFeature('invoices'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.dueDate) updates.dueDate = req.body.dueDate;
    if (typeof req.body.notes === 'string') updates.notes = req.body.notes;
    if (req.body.status === 'paid') updates.paidAt = new Date();

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:id', requireAuth, requireFeature('invoices'), async (req, res) => {
  try {
    await Invoice.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
