const fs = require('fs');

const filePath = './index.js';
let content = fs.readFileSync(filePath, 'utf8');

fs.writeFileSync('./index.js.backup', content);
console.log('Backup saved as index.js.backup');

const routeMarker = '// ── GET ME ──';
const newRoute = `// ── RESEND OTP ──
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });
    if (user.emailVerified) return res.status(400).json({ error: 'This email is already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpHash = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();
    await sendOTPEmail(user.email, otp);
    console.log(\`Resent OTP to: \${user.email}\`);
    res.json({ success: true, message: 'A new verification code has been sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err.stack || err);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

`;

if (content.includes("/api/auth/resend-otp")) {
  console.log('Route already exists - skipping route insertion.');
} else if (!content.includes(routeMarker)) {
  console.error('ERROR: Could not find GET ME marker. No changes made to route.');
  process.exit(1);
} else {
  content = content.replace(routeMarker, newRoute + routeMarker);
  console.log('Inserted resend-otp route.');
}

const limiterMarker = "app.use('/api/auth/login',    authLimiter);";
const newLimiterLine = "app.use('/api/auth/resend-otp', authLimiter);\n";

if (content.includes("/api/auth/resend-otp', authLimiter")) {
  console.log('Rate limiter line already exists - skipping.');
} else if (!content.includes(limiterMarker)) {
  console.error('ERROR: Could not find the login rate-limiter line. Skipped that part.');
} else {
  content = content.replace(limiterMarker, limiterMarker + '\n' + newLimiterLine);
  console.log('Added rate limiter line.');
}

fs.writeFileSync(filePath, content);
console.log('Done. index.js updated.');