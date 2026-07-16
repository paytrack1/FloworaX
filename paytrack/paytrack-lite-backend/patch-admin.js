// --- DNS BYPASS FOR WINDOWS NODE.JS SRV BUG ---
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ Error: MONGODB_URI is not defined in your .env file!');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(mongoURI);
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const db = client.db('flowora');
    const userCollection = db.collection('users');

    const targetEmail = 'floworax2@gmail.com';
    console.log(`🔍 Checking if "${targetEmail}" already exists...`);

    // Find the existing floworax2@gmail.com user
    const existingUser = await userCollection.findOne({ email: targetEmail });

    if (existingUser) {
      console.log(`⚙️ Found existing account for "${targetEmail}". Upgrading role to admin...`);

      await userCollection.updateOne(
        { _id: existingUser._id },
        { $set: { role: 'admin' } }
      );

      console.log('\n🎉 SUCCESS! Existing account updated to Admin.');
    } else {
      // If it wasn't found (highly unlikely given the error, but as a backup), we upgrade the other one
      console.log(`🔍 "${targetEmail}" not found. Upgrading "chibuezeego48@gmail.com" instead...`);

      await userCollection.updateOne(
        { email: 'chibuezeego48@gmail.com' },
        { $set: { email: targetEmail, role: 'admin' } }
      );

      console.log('\n🎉 SUCCESS! "chibuezeego48@gmail.com" has been renamed and upgraded.');
    }

    console.log('------------------------------------');
    console.log('📧 Registered Login Email:', targetEmail);
    console.log('🛡️  Assigned Role          :', 'admin');
    console.log('------------------------------------');
    console.log('👉 Head to your browser, log out, log back in using floworax2@gmail.com, and visit /admin!');

  } catch (err) {
    console.error('\n❌ Runtime Error:', err.message);
  } finally {
    await client.close();
  }
}

run();