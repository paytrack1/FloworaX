const fs = require('fs');
const path = './index.js';
let code = fs.readFileSync(path, 'utf8');

const anchor1 = `const PAYSTACK_BASE_URL   = 'https://api.paystack.co';`;
const insert1 = `

// -- Resend (OTP email) --
const { Resend } = require('resend');
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Flowora <onboarding@resend.dev>';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;`;

if (!code.includes(anchor1)) throw new Error('Edit 1 anchor not found.');
if (code.includes('const { Resend } = require')) {
  console.log('Edit 1 already applied, skipping.');
} else {
  code = code.replace(anchor1, anchor1 + insert1);
  console.log('Edit 1 applied: Resend client added.');
}

const anchor2 = `const isDisposableEmail = (email) => {
  const domain = (email || '').split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
};`;
const insert2 = `

// -- OTP helpers --
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const sendOTPEmail = async (email, otp) => {
  if (!resend) {
    console.log(\`[DEV] OTP for \${email}: \${otp}\`);
    return;
  }
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Your Flowora verification code',
    html: \`<p>Your verification code is <strong>\${otp}</strong>. It expires in 10 minutes.</p>\`,
  });
};`;

if (!code.includes(anchor2)) throw new Error('Edit 2 anchor not found.');
if (code.includes('const generateOTP')) {
  console.log('Edit 2 already applied, skipping.');
} else {
  code = code.replace(anchor2, anchor2 + insert2);
  console.log('Edit 2 applied: OTP helpers added.');
}

const anchor3 = `    const user = await User.create({
      email:        email.toLowerCase().trim(),
      businessName: businessName.trim(),
      passwordHash,
      plan: 'free',
    });

    const token = jwt.sign(`;
const insert3replacement = `    const user = await User.create({
      email:        email.toLowerCase().trim(),
      businessName: businessName.trim(),
      passwordHash,
      plan: 'free',
    });

    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(user.email, otp);

    const token = jwt.sign(`;

if (!code.includes(anchor3)) throw new Error('Edit 3 anchor not found.');
if (code.includes('const otp = generateOTP()')) {
  console.log('Edit 3 already applied, skipping.');
} else {
  code = code.replace(anchor3, insert3replacement);
  console.log('Edit 3 applied: OTP wired into register.');
}

const anchor4 = `app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Get me error:', err.stack || err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});`;
const insert4 = `

// -- VERIFY EMAIL (OTP) --
app.post('/api/auth/verify-email', requireAuth, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'otp is required' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.json({ success: true, message: 'Already verified' });
    if (!user.otpHash || !user.otpExpiry || user.otpExpiry < new Date())
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    if (hashOTP(otp) !== user.otpHash)
      return res.status(400).json({ error: 'Invalid code' });

    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpiry = null;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Verify email error:', err.stack || err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// -- RESEND OTP --
app.post('/api/auth/resend-otp', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.json({ success: true, message: 'Already verified' });

    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: 'Code sent' });
  } catch (err) {
    console.error('Resend OTP error:', err.stack || err);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});`;

if (!code.includes(anchor4)) throw new Error('Edit 4 anchor not found.');
if (code.includes("app.post('/api/auth/verify-email'")) {
  console.log('Edit 4 already applied, skipping.');
} else {
  code = code.replace(anchor4, anchor4 + insert4);
  console.log('Edit 4 applied: verify-email + resend-otp routes added.');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Done. index.js updated.');
