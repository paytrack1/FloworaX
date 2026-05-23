require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const crypto     = require('crypto');
const axios      = require('axios');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const app        = express();
const PORT       = process.env.PORT || 3000;

// ── Raw body for Paystack webhook ──
app.use('/webhook/paystack', express.raw({ type: 'application/json' }));
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
app.use(express.json());

// ── Environment ──
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const JWT_SECRET          = process.env.JWT_SECRET || 'flowora-jwt-secret-change-in-production';
const MONGODB_URI         = process.env.MONGODB_URI;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';

// ── Connect to MongoDB ──
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ── Mongoose Schemas ──
const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  businessName: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  profileImage: { type: String, default: null },
  createdAt:    { type: Date, default: Date.now },
});

const saleSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      { type: String, required: true, index: true },
  items:       { type: Array, default: [] },
  itemName:    { type: String },
  total:       { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  reference:   { type: String },
  status:      { type: String, default: 'pending' },
  synced:      { type: Number, default: 0 },
  verified:    { type: Boolean, default: false },
  provider:    { type: String, default: null },
  profit:      { type: Number, default: 0 },
  createdAt:   { type: String },
  syncedAt:    { type: String },
});

const expenseSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      { type: String, required: true, index: true },
  description: { type: String },
  amount:      { type: Number, required: true },
  category:    { type: String, default: 'Other' },
  synced:      { type: Number, default: 0 },
  createdAt:   { type: String },
});

const User    = mongoose.model('User', userSchema);
const Sale    = mongoose.model('Sale', saleSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// ── Middleware: Verify JWT ──
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

// ════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    service:   'Flowora Backend',
    status:    'running',
    database:  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    provider:  'Paystack',
    mode:      PAYSTACK_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST',
    version:   '2.0.0',
  });
});

// ════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════

// ── REGISTER ──
app.post('/api/auth/register', async (req, res) => {
  const { email, businessName, password } = req.body;
  if (!email || !businessName || !password)
    return res.status(400).json({ error: 'email, businessName and password are required' });
  if (password.length < 4)
    return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email:        email.toLowerCase().trim(),
      businessName: businessName.trim(),
      passwordHash,
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Registered: ${user.email}`);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id.toString(), email: user.email, businessName: user.businessName },
    });
  } catch (err) {
    console.error('Register error:', err);
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
    if (!user) return res.status(401).json({ error: 'No account found with this email' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login: ${user.email}`);
    res.json({
      success: true,
      token,
      user: { id: user._id.toString(), email: user.email, businessName: user.businessName },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET ME ──
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      success: true,
      user: { id: user._id.toString(), email: user.email, businessName: user.businessName },
    });
  } catch {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ── UPDATE PROFILE ──
app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { businessName, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (businessName) user.businessName = businessName.trim();

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      success: true,
      user: { id: user._id.toString(), email: user.email, businessName: user.businessName },
    });
  } catch {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ════════════════════════════════════════
//  SALES ROUTES
// ════════════════════════════════════════

// ── SYNC SALES ──
app.post('/api/sales/sync', requireAuth, async (req, res) => {
  const { sales } = req.body;
  if (!Array.isArray(sales)) return res.status(400).json({ error: 'sales must be an array' });

  const results = [];
  for (const sale of sales) {
    if (!sale.id || !sale.total) {
      results.push({ id: sale.id, status: 'skipped', reason: 'missing id or total' });
      continue;
    }

    let verified = sale.verified || false;
    let status   = sale.status   || 'pending';

    if (sale.reference && !verified) {
      const { isVerified } = await verifyPaystackTransaction(sale.reference);
      if (isVerified) { verified = true; status = 'completed'; }
    }

    await Sale.findOneAndUpdate(
      { id: sale.id },
      { ...sale, userId: req.user.id, verified, status, synced: 1, syncedAt: new Date().toISOString() },
      { upsert: true, new: true }
    );

    results.push({ id: sale.id, status: 'synced', verified });
  }

  res.json({ success: true, results });
});

// ── GET ALL SALES ──
app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, sales });
  } catch {
    res.status(500).json({ error: 'Failed to get sales' });
  }
});

// ── SYNC EXPENSES ──
app.post('/api/expenses/sync', requireAuth, async (req, res) => {
  const { expenses } = req.body;
  if (!Array.isArray(expenses)) return res.status(400).json({ error: 'expenses must be an array' });

  const results = [];
  for (const expense of expenses) {
    if (!expense.id || !expense.amount) {
      results.push({ id: expense.id, status: 'skipped' });
      continue;
    }

    await Expense.findOneAndUpdate(
      { id: expense.id },
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
    const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: expenses.length, expenses });
  } catch {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// ════════════════════════════════════════
//  PAYMENT ROUTES
// ════════════════════════════════════════

// ── INITIALIZE PAYMENT ──
app.post('/api/payments/initialize', requireAuth, async (req, res) => {
  const { amount, saleId, callbackUrl } = req.body;
  if (!amount || !saleId) return res.status(400).json({ error: 'amount and saleId are required' });

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
    res.json({
      success:          true,
      authorizationUrl: data.data.authorization_url,
      reference:        data.data.reference,
    });
  } catch (err) {
    console.error('Initialize error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// ── VERIFY PAYMENT ──
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
  const sig  = req.headers['x-paystack-signature'];
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
    console.log(`Payment confirmed ₦${amount / 100} ref: ${reference}`);
    await Sale.findOneAndUpdate(
      { id: reference },
      { synced: 1, verified: true, status: 'completed', provider: 'paystack-webhook' }
    );
  }
});

// ════════════════════════════════════════
//  START
// ════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 Flowora Backend v2.0 running on port ${PORT}`);
  console.log(`   Database : MongoDB`);
  console.log(`   Auth     : JWT (bcrypt + 7d expiry)`);
  console.log(`   Mode     : ${PAYSTACK_SECRET_KEY?.startsWith('sk_live') ? 'LIVE 🔴' : 'TEST 🟡'}\n`);
});