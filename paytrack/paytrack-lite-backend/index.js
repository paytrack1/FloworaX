const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

// ── Security ──
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const serviceRoutes = require('./src/routes/services');
const bookingRoutes = require('./src/routes/bookings');
const invoiceRoutes = require('./src/routes/invoices');
const customerRoutes = require('./src/routes/customers');
const Invoice  = require('./src/models/Invoice');
const Service  = require('./src/models/Service');
const Booking  = require('./src/models/Booking');
const express  = require('express');
const cors     = require('cors');
const crypto   = require('crypto');
const axios    = require('axios');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getPlanList, buildSubscriptionSummary, requireFeature } = require('./src/middleware/plan');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Environment guards ──
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not set. Refusing to start.');
  process.exit(1);
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';

// ── Raw body for Paystack webhook (must be before express.json) ──
app.use('/webhook/paystack', express.raw({ type: 'application/json' }));

// ── Security headers ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://floworax.com',
    'https://app.floworax.com',
    'https://paytracklite.vercel.app',
    'https://flowora.vercel.app',
    'https://floworax.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// ── Body parser with size limit ──
app.use(express.json({ limit: '10kb' }));

// ── MongoDB injection sanitization ──
app.use(mongoSanitize());

// ── Rate limiters ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/',              apiLimiter);

// ── Connect to MongoDB ──
const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return false;
  }
};

// ── Mongoose Schemas ──
const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  businessName: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  profileImage: { type: String, default: null },
  businessType: { type: String, default: null },
  phone:        { type: String, default: null },
  address:      { type: String, default: null },
  bankAccount:  { type: String, default: null },
  currency:     { type: String, default: null },
  timezone:     { type: String, default: null },
  plan:         { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  modules:      { type: [String], default: ['sales'] },
  createdAt:    { type: Date, default: Date.now },
});

const saleSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  userId:        { type: String, required: true, index: true },
  items:         { type: Array, default: [] },
  itemName:      { type: String },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  reference:     { type: String },
  status:        { type: String, default: 'pending' },
  synced:        { type: Number, default: 0 },
  verified:      { type: Boolean, default: false },
  provider:      { type: String, default: null },
  profit:        { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
  syncedAt:      { type: Date, default: null },
});

const expenseSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      { type: String, required: true, index: true },
  description: { type: String },
  amount:      { type: Number, required: true },
  category:    { type: String, default: 'Other' },
  synced:      { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

const User    = mongoose.model('User', userSchema);
const Sale    = mongoose.model('Sale', saleSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// ── Auth middleware ──
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Paystack verify helper ──
const verifyPaystackTransaction = async (reference) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    return {
      isVerified: data?.data?.status === 'success',
      amount:     data?.data?.amount / 100,
    };
  } catch {
    return { isVerified: false, amount: 0 };
  }
};

const formatUserResponse = (user) => ({
  id:           user._id.toString(),
  email:        user.email,
  businessName: user.businessName,
  businessType: user.businessType || null,
  modules:      user.modules || ['sales'],
  profileImage: user.profileImage || null,
  phone:        user.phone || null,
  address:      user.address || null,
  bankAccount:  user.bankAccount || null,
  currency:     user.currency || null,
  timezone:     user.timezone || null,
  plan:         user.plan || 'free',
});

// ── Health check ──
app.get('/', (req, res) => res.json({ status: 'Flowora API running' }));

// ── REGISTER ──
app.post('/api/auth/register', async (req, res) => {
  const { email, businessName, password } = req.body;
  if (!email || !businessName || !password)
    return res.status(400).json({ error: 'email, businessName and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email:        email.toLowerCase().trim(),
      businessName: businessName.trim(),
      passwordHash,
      plan: 'free',
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Registered: ${user.email}`);
    res.status(201).json({ success: true, token, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── LOGIN ──
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login: ${user.email}`);
    res.json({ success: true, token, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Login error:', err.stack || err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET ME ──
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Get me error:', err.stack || err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ── UPDATE PROFILE ──
app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const ALLOWED_FIELDS = ['businessName','businessType','modules','phone','address','bankAccount','currency','timezone','profileImage','currentPassword','newPassword'];
  const { businessName, businessType, modules, phone, address, bankAccount, currency, timezone, profileImage, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (businessName) user.businessName = businessName.trim();
    if (businessType) user.businessType = businessType.trim();
    if (Array.isArray(modules)) user.modules = modules;
    if (phone)        user.phone        = phone.trim();
    if (address)      user.address      = address.trim();
    if (bankAccount)  user.bankAccount  = bankAccount.trim();
    if (currency)     user.currency     = currency.trim();
    if (timezone)     user.timezone     = timezone.trim();
    if (profileImage) user.profileImage = profileImage;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    res.json({ success: true, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Profile update error:', err.stack || err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ── CREATE SALE ──
app.post('/api/sales', requireAuth, requireFeature('sales'), async (req, res) => {
  const { items, itemName, total, paymentMethod, reference, status, profit } = req.body;
  if (typeof total !== 'number' || total < 0)
    return res.status(400).json({ error: 'total is required and must be a non-negative number' });

  try {
    const sale = await Sale.create({
      id:            `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId:        req.user.id,
      items:         Array.isArray(items) ? items : [],
      itemName:      itemName || 'General Sale',
      total,
      paymentMethod: paymentMethod || 'cash',
      reference:     reference || null,
      status:        status || (reference ? 'pending' : 'completed'),
      synced:        reference ? 0 : 1,
      verified:      !!(reference && status === 'completed'),
      provider:      reference ? 'paystack' : 'cash',
      profit:        typeof profit === 'number' ? profit : 0,
      createdAt:     new Date(),
      syncedAt:      reference ? null : new Date(),
    });
    res.status(201).json({ success: true, sale });
  } catch (err) {
    console.error('Create sale error:', err);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// ── SYNC SALES ──
app.post('/api/sales/sync', requireAuth, requireFeature('sales'), async (req, res) => {
  const { sales } = req.body;
  if (!Array.isArray(sales)) return res.status(400).json({ error: 'sales must be an array' });
  if (sales.length > 100) return res.status(400).json({ error: 'Cannot sync more than 100 sales at once' });

  const results = [];
  for (const sale of sales) {
    if (!sale.id || typeof sale.total !== 'number') {
      results.push({ id: sale.id, status: 'skipped', reason: 'missing id or invalid total' });
      continue;
    }

    let verified = sale.verified || false;
    let status   = sale.status   || 'pending';

    if (sale.reference && !verified) {
      const { isVerified } = await verifyPaystackTransaction(sale.reference);
      if (isVerified) { verified = true; status = 'completed'; }
    }

    await Sale.findOneAndUpdate(
      { id: sale.id, userId: req.user.id },
      { ...sale, userId: req.user.id, verified, status, synced: 1, syncedAt: new Date() },
      { upsert: true, new: true }
    );

    results.push({ id: sale.id, status: 'synced', verified });
  }

  res.json({ success: true, results });
});

// ── GET ALL SALES ──
app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, count: sales.length, sales });
  } catch {
    res.status(500).json({ error: 'Failed to get sales' });
  }
});

// ── CREATE EXPENSE ──
app.post('/api/expenses', requireAuth, async (req, res) => {
  const { description, amount, category } = req.body;
  if (typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ error: 'amount is required and must be a positive number' });

  try {
    const expense = await Expense.create({
      id:          `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId:      req.user.id,
      description: description || 'Expense',
      amount,
      category:    category || 'Other',
      synced:      1,
      createdAt:   new Date(),
    });
    res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// ── DELETE EXPENSE ──
app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    await Expense.deleteOne({ id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ── SYNC EXPENSES ──
app.post('/api/expenses/sync', requireAuth, async (req, res) => {
  const { expenses } = req.body;
  if (!Array.isArray(expenses)) return res.status(400).json({ error: 'expenses must be an array' });
  if (expenses.length > 100) return res.status(400).json({ error: 'Cannot sync more than 100 expenses at once' });

  const results = [];
  for (const expense of expenses) {
    if (!expense.id || typeof expense.amount !== 'number') {
      results.push({ id: expense.id, status: 'skipped' });
      continue;
    }
    await Expense.findOneAndUpdate(
      { id: expense.id, userId: req.user.id },
      { ...expense, userId: req.user.id, synced: 1 },
      { upsert: true, new: true }
    );
    results.push({ id: expense.id, status: 'synced' });
  }

  res.json({ success: true, results });
});

// ── GET ALL EXPENSES ──
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, count: expenses.length, expenses });
  } catch {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// ── FINANCIAL SUMMARY ──
const buildFinancialSummary = async (userId) => {
  const [completedSales, expenses, invoices] = await Promise.all([
    Sale.find({ userId, status: 'completed', verified: true }),
    Expense.find({ userId }),
    Invoice.find({ userId }),
  ]);

  const totalRevenue  = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit     = totalRevenue - totalExpenses;

  const invoiceTotal       = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const invoicePaid        = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const invoiceOutstanding = invoiceTotal - invoicePaid;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    cashFlow: netProfit,
    transactionCount: completedSales.length,
    invoiceTotals: { total: invoiceTotal, paid: invoicePaid, outstanding: invoiceOutstanding },
  };
};

app.get('/api/finance/summary', requireAuth, async (req, res) => {
  try {
    const summary = await buildFinancialSummary(req.user.id);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Finance summary error:', err);
    res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
});

app.get('/api/financial-summary', requireAuth, async (req, res) => {
  try {
    const summary = await buildFinancialSummary(req.user.id);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Financial summary error:', err);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// ── DASHBOARD ──
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [summary, subscription, recentTransactions, upcomingAppointments, upcomingEvents, latestInvoices, topServices] = await Promise.all([
      buildFinancialSummary(req.user.id),
      buildSubscriptionSummary(req.user.id),
      Sale.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10),
      Booking.find({ providerId: req.user.id, type: 'appointment', scheduledDate: { $gte: today }, status: { $in: ['pending','confirmed'] } }).sort({ scheduledDate: 1 }).limit(5),
      Booking.find({ providerId: req.user.id, type: 'event', scheduledDate: { $gte: today }, status: { $in: ['pending','confirmed'] } }).sort({ scheduledDate: 1 }).limit(5),
      Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5),
      Service.find({ userId: req.user.id, isActive: true }).limit(5),
    ]);

    res.json({ success: true, dashboard: { summary, subscription, recentTransactions, upcomingAppointments, upcomingEvents, latestInvoices, topServices } });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ── PLANS ──
app.get('/api/plans', (req, res) => {
  res.json({ success: true, plans: getPlanList() });
});

// ── SUBSCRIPTION ──
app.get('/api/subscription', requireAuth, async (req, res) => {
  try {
    const subscription = await buildSubscriptionSummary(req.user.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription unavailable' });
    res.json({ success: true, subscription });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

app.post('/api/subscription/upgrade', requireAuth, async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });
  const plan = getPlanList().find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Invalid plan selected' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = planId;
    await user.save();
    res.json({ success: true, subscription: await buildSubscriptionSummary(req.user.id), user: formatUserResponse(user) });
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// ── PAYMENTS ──
app.post('/api/payments/initialize', requireAuth, async (req, res) => {
  const { amount, saleId, callbackUrl } = req.body;
  if (!amount || !saleId) return res.status(400).json({ error: 'amount and saleId are required' });
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number' });

  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email:        req.user.email,
        amount:       Math.round(amount * 100),
        reference:    saleId,
        callback_url: callbackUrl || process.env.FRONTEND_URL,
        metadata:     { saleId, userId: req.user.id, businessName: req.user.businessName },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, authorizationUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    console.error('Payment init error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

app.get('/api/payments/verify/:reference', requireAuth, async (req, res) => {
  const { reference }          = req.params;
  const { isVerified, amount } = await verifyPaystackTransaction(reference);

  if (isVerified) {
    await Sale.findOneAndUpdate(
      { id: reference, userId: req.user.id },
      { synced: 1, verified: true, status: 'completed', provider: 'paystack' }
    );
  }

  res.json({ success: isVerified, verified: isVerified, amount, reference });
});

// ── WEBHOOK ──
app.post('/webhook/paystack', (req, res, next) => {
  const sig = req.headers['x-paystack-signature'];
  if (!sig) return res.status(400).end();
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.body).digest('hex');
  if (hash !== sig) return res.status(400).end();
  req.body = JSON.parse(req.body);
  next();
}, async (req, res) => {
  res.sendStatus(200);
  const { event, data } = req.body;
  if (event === 'charge.success') {
    const { reference, amount, metadata } = data;
    console.log(`Payment confirmed: ${amount / 100} ref: ${reference}`);
    if (metadata?.bookingId || (reference && reference.startsWith('booking-'))) {
      const bookingId = metadata?.bookingId || reference.replace('booking-', '');
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid', status: 'confirmed', paymentRef: reference,
      });
    } else {
      await Sale.findOneAndUpdate(
        { id: reference },
        { synced: 1, verified: true, status: 'completed', provider: 'paystack-webhook' }
      );
    }
  }
});

// ── Feature routes ──
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ──
const startServer = async () => {
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.error('Server startup aborted: MongoDB connection failed.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\nFlowora Backend v2.0 running on port ${PORT}`);
    console.log(`  Database : MongoDB`);
    console.log(`  Auth     : JWT (bcrypt + 7d expiry)`);
    console.log(`  Mode     : ${PAYSTACK_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST'}\n`);
  });
};

startServer();
