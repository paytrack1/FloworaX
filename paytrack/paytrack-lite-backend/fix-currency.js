// One-time migration: force all existing users to Nigeria-only currency/timezone.
// Run once with: node fix-currency.js
// Safe to delete after running.

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  currency: String,
  timezone: String,
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

  const wrongUsers = await User.find({
    $or: [
      { currency: { $ne: 'NGN' } },
      { timezone: { $ne: 'Africa/Lagos' } },
    ],
  });

  console.log(`Found ${wrongUsers.length} user(s) with a non-Nigeria currency or timezone:`);
  wrongUsers.forEach((u) => {
    console.log(`  - ${u.email || u._id}: currency=${u.currency || '(none)'}, timezone=${u.timezone || '(none)'}`);
  });

  if (wrongUsers.length === 0) {
    console.log('Nothing to fix. All users are already on NGN / Africa/Lagos.');
    await mongoose.disconnect();
    return;
  }

  console.log('\nUpdating all of the above to currency=NGN, timezone=Africa/Lagos...');
  const result = await User.updateMany(
    {
      $or: [
        { currency: { $ne: 'NGN' } },
        { timezone: { $ne: 'Africa/Lagos' } },
      ],
    },
    {
      $set: { currency: 'NGN', timezone: 'Africa/Lagos' },
    }
  );

  console.log(`Done. Matched ${result.matchedCount}, modified ${result.modifiedCount}.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
