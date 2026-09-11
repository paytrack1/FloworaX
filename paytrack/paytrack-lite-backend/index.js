const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

// â”€â”€ Error monitoring (Sentry) â”€â”€
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  });
  console.log('Sentry error monitoring enabled');
}

// â”€â”€ Security â”€â”€
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const serviceRoutes  = require('./src/routes/services');
const bookingRoutes  = require('./src/routes/bookings');
const invoiceRoutes  = require('./src/routes/invoices');
const customerRoutes = require('./src/routes/customers');
const waitlistRoutes = require('./src/routes/waitlist');
const eventRoutes    = require('./src/routes/events');
const automationRoutes = require('./src/routes/automations');
const staffRoutes = require('./src/routes/staff');
const Invoice        = require('./src/models/Invoice');
const Service        = require('./src/models/Service');
const Booking        = require('./src/models/Booking');
const Event          = require('./src/models/Event');
const EventTicket    = require('./src/models/EventTicket');
const Automation     = require('./src/models/Automation');
const AutomationLog  = require('./src/models/AutomationLog');
const AutomationExecution = require('./src/models/AutomationExecution');
const { ticketHtml } = require('./src/routes/events');
const express        = require('express');
const cors           = require('cors');
const crypto         = require('crypto');
const axios          = require('axios');
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const mongoose       = require('mongoose');
const { getPlan, getPlanList, buildSubscriptionSummary, requireFeature } = require('./src/middleware/plan');
const notificationRoutes = require('./src/routes/notifications');
const notify = require('./src/utils/notify');
const cron = require('node-cron');
const { runReminders, runFollowups } = require('./src/routes/bookings');
const messagingService = require('./src/services/messagingService');
const AutomationScheduler = require('./src/services/automationScheduler');
const ResendProvider = require('./src/services/providers/resendProvider');
const AfricasTalkingProvider = require('./src/services/providers/africasTalkingProvider');
const TwilioWhatsAppProvider = require('./src/services/providers/twilioWhatsAppProvider');

// â”€â”€ Resend Email Configuration â”€â”€
const { Resend } = require('resend');
const resend     = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// â”€â”€ Initialize Messaging Service â”€â”€
const smsProvider = process.env.AFRICAS_TALKING_API_KEY
  ? new AfricasTalkingProvider(process.env.AFRICAS_TALKING_API_KEY, process.env.AFRICAS_TALKING_USERNAME)
  : null;
const whatsappProvider = process.env.TWILIO_ACCOUNT_SID
  ? new TwilioWhatsAppProvider(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_WHATSAPP_NUMBER_SID)
  : null;

messagingService.setProviders({
  email: new ResendProvider(process.env.RESEND_API_KEY, EMAIL_FROM),
  sms: smsProvider,
  whatsapp: whatsappProvider,
});

if (process.env.AFRICAS_TALKING_API_KEY) {
  console.log('[OK] SMS provider: Africa\'s Talking configured');
} else {
  console.log('[OFF] SMS provider: Not configured (AFRICAS_TALKING_API_KEY not set)');
}
if (process.env.TWILIO_ACCOUNT_SID) {
  console.log('[OK] WhatsApp provider: Twilio configured');
} else {
  console.log('[OFF] WhatsApp provider: Not configured (TWILIO_ACCOUNT_SID not set)');
}
console.log('Messaging service initialized');

const app  = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// â”€â”€ Environment guards â”€â”€
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

// â”€â”€ Raw body for Paystack webhook (must be before express.json) â”€â”€
app.use('/webhook/paystack', express.raw({ type: 'application/json' }));

// â”€â”€ Security headers â”€â”€
app.use(helmet());

// â”€â”€ CORS â”€â”€
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://floworax.pxxl.run',
    'https://floworax.vercel.app',
    'https://floworax.com',
    'https://app.floworax.com',
    'https://floworax.com.ng',
    'https://www.floworax.com.ng',
    ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
}));

// â”€â”€ Body parser with size limit â”€â”€
app.use(express.json({ limit: '10kb' }));

// â”€â”€ MongoDB injection sanitization â”€â”€
app.use(mongoSanitize());

// â”€â”€ Rate limiters â”€â”€
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id || decoded.staffId || req.ip;
      } catch {
        // invalid/expired token -- fall through to IP
      }
    }
    return req.ip;
  },
});

app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/resend-otp',      authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/',                     apiLimiter);

// â”€â”€ Connect to MongoDB â”€â”€
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

// â”€â”€ Mongoose Schemas â”€â”€
const userSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  businessName:     { type: String, required: true, trim: true },
  slug:             { type: String, unique: true, sparse: true, index: true }, // readable join-link id, e.g. "gracecommunity" - sparse so old accounts without one don't collide on null
  passwordHash:     { type: String, required: true },
  emailVerified:    { type: Boolean, default: false },
  otpHash:          { type: String, default: null },
  otpExpiry:        { type: Date,   default: null },
  resetTokenHash:   { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },
  profileImage:     { type: String, default: null },
  businessType:     { type: String, default: null },
  phone:            { type: String, default: null },
  address:          { type: String, default: null },
  bankAccount:      { type: String, default: null },
  currency:         { type: String, default: null },
  timezone:         { type: String, default: null },
  plan:             { type: String, enum: ['free', 'pro', 'business', 'paid'], default: 'free' },
  modules:          { type: [String], default: ['sales'] },
  role:             { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLoginAt:      { type: Date, default: null },
  payoutBankCode:         { type: String, default: null },
  payoutBankName:         { type: String, default: null },
  payoutAccountNumber:    { type: String, default: null },
  payoutAccountName:      { type: String, default: null },
  paystackSubaccountCode: { type: String, default: null },
  smsCredits:             { type: Number, default: null }, // null = unmetered; set to a number on Paid-plan activation
  whatsappCredits:        { type: Number, default: null }, // null = unmetered; set to a number on Paid-plan activation
  createdAt:        { type: Date, default: Date.now },
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

// â”€â”€ Church/business join-link slugs â”€â”€
// Turns "Grace Community Church" into "gracecommunity", checking for
// collisions and appending a number if needed. Existing accounts keep
// working via their raw ObjectId link (see findOwnerByIdentifier below);
// this only assigns a slug going forward / when one is missing.
const slugify = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30) || 'church';

const generateUniqueSlug = async (businessName, excludeUserId) => {
  const base = slugify(businessName);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ slug, _id: { $ne: excludeUserId } })) {
    slug = `${base}${counter}`;
    counter += 1;
  }
  return slug;
};

// Looks an owner up by their slug first, falling back to raw ObjectId so
// links shared before slugs existed keep working forever.
const findOwnerByIdentifier = async (identifier, projection) => {
  const bySlug = await User.findOne({ slug: identifier }, projection);
  if (bySlug) return bySlug;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return User.findById(identifier, projection);
  }
  return null;
};

// â”€â”€ Auth middleware â”€â”€
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

// â”€â”€ Paystack verify helper â”€â”€
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

// â”€â”€ Disposable email check â”€â”€
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'fakeinbox.com',
  'getnada.com', 'sharklasers.com', 'dispostable.com', 'maildrop.cc',
]);

const isDisposableEmail = (email) => {
  const domain = (email || '').split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
};

// â”€â”€ Email sending helper â”€â”€
const sendOTPEmail = async (email, otp) => {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Your Flowora verification code',
    html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
  if (result.error) {
    console.error('Resend send failed:', result.error);
    console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
  } else {
    console.log(`Resend accepted email for ${email}, id: ${result.data?.id}`);
  }
};

const formatUserResponse = (user) => ({
  id:            user._id.toString(),
  email:         user.email,
  emailVerified: user.emailVerified,
  businessName:  user.businessName,
  slug:          user.slug || null,
  businessType:  user.businessType || null,
  modules:       user.modules || ['sales'],
  profileImage:  user.profileImage || null,
  phone:         user.phone || null,
  address:       user.address || null,
  bankAccount:   user.bankAccount || null,
  currency:      user.currency || null,
  timezone:      user.timezone || null,
  plan:          user.plan || 'free',
  role:          user.role || 'user',
  payoutBankName:      user.payoutBankName || null,
  payoutAccountNumber: user.payoutAccountNumber || null,
  payoutAccountName:   user.payoutAccountName || null,
  payoutActive:        !!user.paystackSubaccountCode,
});

// â”€â”€ Health check â”€â”€
app.get('/', (req, res) => res.json({ status: 'Flowora API running' }));

// â”€â”€ REGISTER â”€â”€
app.post('/api/auth/register', async (req, res) => {
  const { email, businessName, password } = req.body;
  if (!email || !businessName || !password)
    return res.status(400).json({ error: 'email, businessName and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    if (isDisposableEmail(email))
      return res.status(400).json({ error: 'Disposable email addresses are not allowed. Please use a real email.' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash   = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = await generateUniqueSlug(businessName);
    const user = await User.create({
      email:        email.toLowerCase().trim(),
      businessName: businessName.trim(),
      slug,
      passwordHash,
      plan: 'free',
      otpHash,
      otpExpiry,
    });

    await sendOTPEmail(user.email, otp);

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`Registered: ${user.email}`);
    res.status(201).json({ success: true, token, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// â”€â”€ LOGIN â”€â”€
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    // â”€â”€ Update lastLoginAt â”€â”€
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    if (!user.slug) {
      user.slug = await generateUniqueSlug(user.businessName, user._id);
      await User.findByIdAndUpdate(user._id, { slug: user.slug }); // backfill for accounts predating slugs, without triggering full validation
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`Login: ${user.email}`);
    res.json({ success: true, token, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Login error:', err.stack || err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// â”€â”€ VERIFY EMAIL â”€â”€
app.post('/api/auth/verify-email', requireAuth, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'Verification code is required' });
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email is already verified' });
    if (!user.otpHash || !user.otpExpiry) return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });

    const match = await bcrypt.compare(otp, user.otpHash);
    if (!match) return res.status(400).json({ error: 'Invalid verification code' });

    user.emailVerified = true;
    user.otpHash       = null;
    user.otpExpiry     = null;
    await user.save();

    console.log(`Email verified: ${user.email}`);
    res.json({ success: true, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Verify email error:', err.stack || err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// â”€â”€ RESEND OTP â”€â”€
app.post('/api/auth/resend-otp', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'This email is already verified' });

    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash   = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpHash   = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();
    await sendOTPEmail(user.email, otp);

    console.log(`Resent OTP to: ${user.email}`);
    res.json({ success: true, message: 'A new verification code has been sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err.stack || err);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// â”€â”€ FORGOT PASSWORD â”€â”€
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const tokenHash   = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.resetTokenHash   = tokenHash;
    user.resetTokenExpiry = tokenExpiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    if (!resend) {
      console.log(`[DEV] Password reset link for ${user.email}: ${resetLink}`);
    } else {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'Reset your Flowora password',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
      });
      if (result.error) {
        console.error('Resend send failed:', result.error);
        console.log(`[FALLBACK] Password reset link for ${user.email}: ${resetLink}`);
      } else {
        console.log(`Reset email sent to ${user.email}, id: ${result.data?.id}`);
      }
    }

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.stack || err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// â”€â”€ RESET PASSWORD â”€â”€
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetTokenHash:   tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    user.passwordHash     = await bcrypt.hash(newPassword, 12);
    user.resetTokenHash   = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`Password reset for: ${user.email}`);
    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.stack || err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// â”€â”€ GET ME â”€â”€
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.slug) {
      user.slug = await generateUniqueSlug(user.businessName, user._id);
      await User.findByIdAndUpdate(user._id, { slug: user.slug });
    }
    res.json({ success: true, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Get me error:', err.stack || err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// â”€â”€ UPDATE PROFILE â”€â”€
app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { businessName, businessType, modules, phone, address, bankAccount, currency, timezone, profileImage, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (businessName !== undefined) user.businessName = businessName.trim().slice(0, 100);
    if (!user.slug) user.slug = await generateUniqueSlug(user.businessName, user._id); // backfill for accounts created before slugs existed
    if (businessType !== undefined) user.businessType = businessType ? businessType.trim() : null;
    if (Array.isArray(modules))      user.modules      = modules;
    if (phone)                      user.phone        = phone.trim().slice(0, 20);
    if (address)                    user.address      = address.trim().slice(0, 300);
    if (bankAccount)                user.bankAccount  = bankAccount.trim();
    if (currency)                   user.currency     = currency.trim();
    if (timezone)                   user.timezone     = timezone.trim();
    if (profileImage && (profileImage.startsWith('http://') || profileImage.startsWith('https://'))) user.profileImage = profileImage.slice(0, 500);

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

// â”€â”€ PAYOUTS: List Banks â”€â”€
app.get('/api/payouts/banks', requireAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${PAYSTACK_BASE_URL}/bank?currency=NGN`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    res.json({ success: true, banks: data.data });
  } catch (err) {
    console.error('List banks error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch bank list' });
  }
});

// â”€â”€ PAYOUTS: Resolve Account Number â”€â”€
app.post('/api/payouts/resolve-account', requireAuth, async (req, res) => {
  const { accountNumber, bankCode } = req.body;
  if (!accountNumber || !bankCode) return res.status(400).json({ error: 'accountNumber and bankCode are required' });
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    res.json({ success: true, accountName: data.data.account_name });
  } catch (err) {
    console.error('Resolve account error:', err.response?.data || err.message);
    res.status(400).json({ error: 'Could not verify this account number. Please check the details and try again.' });
  }
});

// â”€â”€ PAYOUTS: Create Subaccount â”€â”€
app.post('/api/payouts/subaccount', requireAuth, async (req, res) => {
  const { accountNumber, bankCode, bankName } = req.body;
  if (!accountNumber || !bankCode || !bankName) return res.status(400).json({ error: 'accountNumber, bankCode and bankName are required' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resolveRes = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    const accountName = resolveRes.data.data.account_name;

    const subRes = await axios.post(
      `${PAYSTACK_BASE_URL}/subaccount`,
      {
        business_name:     user.businessName,
        settlement_bank:   bankCode,
        account_number:    accountNumber,
        percentage_charge: 0,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    user.payoutBankCode         = bankCode;
    user.payoutBankName         = bankName;
    user.payoutAccountNumber    = accountNumber;
    user.payoutAccountName      = accountName;
    user.paystackSubaccountCode = subRes.data.data.subaccount_code;
    await user.save();

    console.log(`Subaccount created for ${user.email}: ${user.paystackSubaccountCode}`);
    res.json({ success: true, accountName, subaccountCode: user.paystackSubaccountCode });
  } catch (err) {
    console.error('Create subaccount error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to set up payout account. Please double-check your bank details.' });
  }
});

// â”€â”€ PAYOUTS: Get Status â”€â”€
app.get('/api/payouts/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      success: true,
      payout: {
        bankName:       user.payoutBankName || null,
        accountNumber:  user.payoutAccountNumber || null,
        accountName:    user.payoutAccountName || null,
        subaccountCode: user.paystackSubaccountCode || null,
        active:         !!user.paystackSubaccountCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payout status' });
  }
});

// â”€â”€ ADMIN DASHBOARD â”€â”€
app.get('/api/admin/dashboard', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrators only.' });
  }
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.plan !== 'free' && u.plan !== 'basic').length;
    const verifiedUsers = users.filter(u => u.emailVerified).length;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSalesCount,
      totalBookingsCount,
      totalEventsCount,
      newSignupsThisMonth,
      activeUsers,
      revenueAgg,
      planBreakdownAgg,
      topBusinessTypesAgg
    ] = await Promise.all([
      Sale.countDocuments({}),
      Booking.countDocuments({}),
      Event.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { businessType: { $ne: null } } },
        { $group: { _id: '$businessType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const planBreakdown = planBreakdownAgg.reduce((acc, p) => {
      acc[p._id || 'free'] = p.count;
      return acc;
    }, {});
    const topBusinessTypes = topBusinessTypesAgg.map(t => ({ type: t._id, count: t.count }));
    const recentSignups = users.slice(0, 10);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        newSignupsThisMonth,
        premiumUsers,
        verifiedUsers,
        totalRevenue,
        totalSales: totalSalesCount,
        totalBookings: totalBookingsCount,
        totalEvents: totalEventsCount,
        planBreakdown,
        topBusinessTypes
      },
      recentSignups,
      users
    });
  } catch (err) {
    console.error('Admin Fetch Error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin system metrics.' });
  }
});

// â”€â”€ CREATE SALE â”€â”€
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
      verified:      paymentMethod === 'cash' || !!(reference && status === 'completed'),
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

// â”€â”€ SYNC SALES â”€â”€
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

// â”€â”€ GET ALL SALES â”€â”€
app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, count: sales.length, sales });
  } catch {
    res.status(500).json({ error: 'Failed to get sales' });
  }
});

app.delete('/api/sales', requireAuth, async (req, res) => {
  try {
    const result = await Sale.deleteMany({ userId: req.user.id });
    res.json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (err) {
    console.error('Clear sales error:', err);
    res.status(500).json({ error: 'Failed to clear sales' });
  }
});

// â”€â”€ CREATE EXPENSE â”€â”€
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

// â”€â”€ DELETE EXPENSE â”€â”€
app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    await Expense.deleteOne({ id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// â”€â”€ SYNC EXPENSES â”€â”€
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

// â”€â”€ GET ALL EXPENSES â”€â”€
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, count: expenses.length, expenses });
  } catch {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// â”€â”€ FINANCIAL SUMMARY â”€â”€
const buildFinancialSummary = async (userId) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [completedSales, expenses, invoices] = await Promise.all([
    Sale.find({ userId, status: 'completed', verified: true, createdAt: { $gte: monthStart } }),
    Expense.find({ userId, createdAt: { $gte: monthStart } }),
    Invoice.find({ userId }),
  ]);
  const totalRevenue  = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit      = totalRevenue - totalExpenses;
  const invoiceTotal       = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const invoicePaid        = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const invoiceOutstanding = invoiceTotal - invoicePaid;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    cashFlow:         netProfit,
    transactionCount: completedSales.length,
    invoiceTotals:    { total: invoiceTotal, paid: invoicePaid, outstanding: invoiceOutstanding },
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

// â”€â”€ DASHBOARD â”€â”€
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [summary, subscription, recentTransactions, upcomingAppointments, upcomingEvents, latestInvoices, topServices] = await Promise.all([
      buildFinancialSummary(req.user.id),
      buildSubscriptionSummary(req.user.id),
      Sale.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10),
      Booking.find({ providerId: req.user.id, type: 'appointment', scheduledDate: { $gte: today }, status: { $in: ['pending', 'confirmed'] } }).sort({ scheduledDate: 1 }).limit(5),
      Booking.find({ providerId: req.user.id, type: 'event', scheduledDate: { $gte: today }, status: { $in: ['pending', 'confirmed'] } }).sort({ scheduledDate: 1 }).limit(5),
      Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5),
      Service.find({ userId: req.user.id, isActive: true }).limit(5),
    ]);

    res.json({ success: true, dashboard: { summary, subscription, recentTransactions, upcomingAppointments, upcomingEvents, latestInvoices, topServices } });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// â”€â”€ PLANS â”€â”€
app.get('/api/plans', (req, res) => {
  res.json({ success: true, plans: getPlanList() });
});

// â”€â”€ SUBSCRIPTION â”€â”€
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
  const { planId, callbackUrl } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });
  const plan = getPlanList().find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Invalid plan selected' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (plan.price === 0) {
      user.plan = planId;
      await user.save();
      await notify(user._id, 'Subscription updated', `You're now on the ${plan.name || planId} plan.`, 'subscription');
      return res.json({ success: true, subscription: await buildSubscriptionSummary(req.user.id), user: formatUserResponse(user) });
    }

    const reference = `sub-${user._id}-${Date.now()}`;
    const payload = {
      email:        user.email,
      amount:       Math.round(plan.price * 100),
      reference,
      callback_url: callbackUrl || process.env.FRONTEND_URL,
      metadata:     { type: 'subscription', planId, userId: user._id.toString() },
    };

    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    res.json({
      success:          true,
      requiresPayment:  true,
      authorizationUrl: data.data.authorization_url,
      reference:        data.data.reference,
    });
  } catch (err) {
    console.error('Upgrade error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to start subscription upgrade' });
  }
});

// â”€â”€ VERIFY SUBSCRIPTION PAYMENT â”€â”€
app.get('/api/subscription/verify/:reference', requireAuth, async (req, res) => {
  const { reference } = req.params;
  try {
    const { isVerified } = await verifyPaystackTransaction(reference);
    if (isVerified && reference.startsWith(`sub-${req.user.id}-`)) {
      const { data } = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const planId = data?.data?.metadata?.planId;
      if (planId) {
        const user = await User.findById(req.user.id);
        user.plan = planId;
        if (planId === 'paid') {
          user.smsCredits = 150;
          user.whatsappCredits = 60;
        }
        await user.save();
        const plan = getPlanList().find((p) => p.id === planId);
        await notify(user._id, 'Subscription upgraded', `Payment received - you're now on the ${plan?.name || planId} plan.`, 'subscription');
        return res.json({ success: true, subscription: await buildSubscriptionSummary(req.user.id), user: formatUserResponse(user) });
      }
    }
    res.json({ success: false, verified: false });
  } catch (err) {
    console.error('Subscription verify error:', err);
    res.status(500).json({ error: 'Failed to verify subscription payment' });
  }
});

// â”€â”€ PAYMENTS â”€â”€
app.post('/api/payments/initialize', requireAuth, async (req, res) => {
  const { amount, saleId, callbackUrl } = req.body;
  if (!amount || !saleId) return res.status(400).json({ error: 'amount and saleId are required' });
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ error: 'Paystack is not configured. Add a test secret key (sk_test_...) to the backend environment.' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amountInKobo = Math.round(amount * 100);
    const payload = {
      email:        req.user.email,
      amount:       amountInKobo,
      reference:    saleId,
      callback_url: callbackUrl || process.env.FRONTEND_URL,
      metadata:     { saleId, userId: req.user.id, businessName: req.user.businessName },
    };

    if (user.paystackSubaccountCode) {
      const plan = getPlan(user.plan);
      const feePercent = typeof plan.platformFeePercent === 'number' ? plan.platformFeePercent : 0;
      payload.subaccount = user.paystackSubaccountCode;
      payload.bearer = 'subaccount';
      if (feePercent > 0) {
        payload.transaction_charge = Math.round(amountInKobo * (feePercent / 100));
      }
    }

    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
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
  } else {
    await notify(req.user.id, 'Payment failed', `We couldn't verify payment for sale reference ${reference}.`, 'payment');
  }

  res.json({ success: isVerified, verified: isVerified, amount, reference });
});

// â”€â”€ WEBHOOK â”€â”€
app.post('/webhook/paystack', (req, res, next) => {
  const sig = req.headers['x-paystack-signature'];
  if (!sig) return res.status(400).end();
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.body).digest('hex');
  const sigBuffer  = Buffer.from(sig, 'utf8');
  const hashBuffer = Buffer.from(hash, 'utf8');
  if (sigBuffer.length !== hashBuffer.length || !crypto.timingSafeEqual(sigBuffer, hashBuffer)) {
    return res.status(400).end();
  }
  req.body = JSON.parse(req.body);
  next();
}, async (req, res) => {
  res.sendStatus(200);
  try {
    const { event, data } = req.body;
    if (event === 'charge.success') {
      const { reference, amount, metadata } = data;
      console.log(`Payment confirmed: ${amount / 100} ref: ${reference}`);

      if (metadata?.type === 'subscription' && metadata?.userId && metadata?.planId) {
        await User.findByIdAndUpdate(metadata.userId, { plan: metadata.planId });
        console.log(`Subscription upgraded via webhook: user ${metadata.userId} -> ${metadata.planId}`);

      } else if (metadata?.ticketId || (reference && reference.startsWith('event-ticket-'))) {
        const ticketId = metadata?.ticketId || reference.replace('event-ticket-', '');
        const ticket = await EventTicket.findOneAndUpdate(
          { _id: ticketId, paymentStatus: { $ne: 'paid' } },
          { paymentStatus: 'paid', status: 'valid', paymentRef: reference },
          { new: true }
        );
        if (ticket && resend) {
          const ev = await Event.findById(ticket.eventId);
          if (ev) {
            await resend.emails.send({
              from: EMAIL_FROM,
              to: ticket.buyerEmail,
              subject: `Your ticket for ${ev.title}`,
              html: ticketHtml(ev, ticket),
            });
          }
        }

      } else if (metadata?.bookingId || (reference && reference.startsWith('booking-'))) {
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
  } catch (err) {
    console.error('Webhook processing error:', err.stack || err);
  }
});

// â”€â”€ CONNECT ADDITIONAL DELEGATED ROUTERS â”€â”€
app.use('/api/services',  serviceRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/invoices',  invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/waitlist',  waitlistRoutes);
app.use('/api/events',    eventRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);

// â”€â”€ Sentry error handler â€” must be registered after all routes â”€â”€
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// â”€â”€ SCHEDULED REMINDERS â”€â”€
if (process.env.ENABLE_CRON === 'true') {
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await runReminders();
      if (result.sent > 0) console.log(`[cron] Sent ${result.sent} reminder email(s) for ${result.date}`);
    } catch (err) {
      console.error('[cron] Reminder job failed:', err.message);
    }
  });

  cron.schedule('30 * * * *', async () => {
    try {
      const result = await runFollowups();
      if (result.sent > 0) console.log(`[cron] Sent ${result.sent} follow-up email(s) for ${result.date}`);
    } catch (err) {
      console.error('[cron] Follow-up job failed:', err.message);
    }
  });

  // â”€â”€ Automation scheduler: runs every minute for exact reminder times â”€â”€
  const automationScheduler = new AutomationScheduler(messagingService);
  cron.schedule('* * * * *', async () => {
    try {
      const result = await automationScheduler.runScheduler();
      if (result.success && (result.schedulesSent > 0 || result.newMembersWelcomed > 0)) {
        console.log(`[cron] Automations: ${result.schedulesSent} scheduled, ${result.newMembersWelcomed} welcomes`);
      }
    } catch (err) {
      console.error('[cron] Automation scheduler job failed:', err.message);
    }
  });

    // Monthly messaging-credit reset for Paid-plan users, checked daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      if (now.getDate() !== 1) return;
      const result = await User.updateMany(
        { plan: 'paid' },
        { $set: { smsCredits: 150, whatsappCredits: 60 } }
      );
      console.log(`[cron] Reset messaging credits for ${result.modifiedCount} Paid-plan user(s)`);
    } catch (err) {
      console.error('[cron] Credit reset job failed:', err.message);
    }
  });

  console.log('Cron scheduler enabled: reminders hourly, follow-ups hourly (offset 30m), automations every minute');
}

// Start Server Listen Setup
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend Application listening securely on port ${PORT}`);
  });
});
