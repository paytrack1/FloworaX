const express     = require('express');
const router      = express.Router();
const mongoose    = require('mongoose');
const requireAuth = require('../middleware/auth');
const Customer    = require('../models/Customer');

router.get('/', requireAuth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const Sale    = mongoose.model('Sale');
    const Booking = mongoose.model('Booking');
    const Invoice = mongoose.model('Invoice');
    const enriched = await Promise.all(customers.map(async (c) => {
      const [sales, bookings, invoices] = await Promise.all([
        Sale.find({ userId: req.user.id, status: 'completed' }),
        Booking.find({ providerId: req.user.id, clientEmail: c.email }),
        Invoice.find({ userId: req.user.id, clientEmail: c.email }),
      ]);
      const totalSpent     = sales.reduce((s, sale) => s + (sale.total || 0), 0);
      const outstandingInv = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0);
      return { ...c.toObject(), stats: { totalSpent, totalSales: sales.length, totalBookings: bookings.length, totalInvoices: invoices.length, outstanding: outstandingInv } };
    }));
    res.json({ success: true, count: enriched.length, customers: enriched });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const Sale    = mongoose.model('Sale');
    const Booking = mongoose.model('Booking');
    const Invoice = mongoose.model('Invoice');
    const [sales, bookings, invoices] = await Promise.all([
      Sale.find({ userId: req.user.id }).sort({ createdAt: -1 }),
      Booking.find({ providerId: req.user.id, clientEmail: customer.email }).sort({ createdAt: -1 }),
      Invoice.find({ userId: req.user.id, clientEmail: customer.email }).sort({ createdAt: -1 }),
    ]);
    const totalSpent  = sales.filter(s => s.status === 'completed').reduce((s, sale) => s + (sale.total || 0), 0);
    const outstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0);
    res.json({ success: true, customer: { ...customer.toObject(), stats: { totalSpent, totalSales: sales.length, totalBookings: bookings.length, totalInvoices: invoices.length, outstanding }, sales, bookings, invoices } });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name, email, phone, address, notes, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    if (email) {
      const existing = await Customer.findOne({ userId: req.user.id, email: email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ error: 'A customer with this email already exists' });
    }
    const customer = await Customer.create({
      userId: req.user.id, name: name.trim(),
      email: email?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes || null,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { name, email, phone, address, notes, tags } = req.body;
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (name)    customer.name    = name.trim();
    if (email)   customer.email   = email.toLowerCase().trim();
    if (phone)   customer.phone   = phone.trim();
    if (address) customer.address = address.trim();
    if (notes !== undefined) customer.notes = notes;
    if (Array.isArray(tags)) customer.tags  = tags;
    await customer.save();
    res.json({ success: true, customer });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Customer.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
