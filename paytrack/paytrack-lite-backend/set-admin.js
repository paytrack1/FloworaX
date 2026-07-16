// One-time script: set a specific user's role to 'admin'.
// Run with: node set-admin.js
// Safe to delete after running.

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const TARGET_EMAIL = 'floworax2@gmail.com';

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const user = await User.findOne({ email: TARGET_EMAIL.toLowerCase().trim() });

  if (!user) {
    console.log(`No account found with email: ${TARGET_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Found account: ${user.email}, current role: ${user.role || '(none set)'}`);

  if (user.role === 'admin') {
    console.log('Already an admin. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  user.role = 'admin';
  await user.save();

  console.log(`Done. ${user.email} is now role: admin`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
