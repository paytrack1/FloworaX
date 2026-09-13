const express = require('express');
const router = express.Router();

// Set this to any random string you make up — it must match exactly what you
// enter as the "Verify token" in Meta's Configure Webhooks screen.
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// ── Meta's one-time verification handshake ──
// When you enter your Callback URL + Verify token in Meta's dashboard and
// click "Verify and save", Meta sends a GET request here to confirm you own
// this endpoint. You must echo back the hub.challenge value exactly.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('DEBUG full query:', JSON.stringify(req.query));
console.log('DEBUG received token:', JSON.stringify(token));
console.log('DEBUG expected token:', JSON.stringify(VERIFY_TOKEN));
if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }
  console.error('WhatsApp webhook verification failed — token mismatch');
  return res.sendStatus(403);
});

// ── Incoming messages and status updates ──
// Meta POSTs here whenever a customer replies, or a message you sent
// changes status (sent/delivered/read/failed).
router.post('/', (req, res) => {
  // Always respond 200 quickly — Meta will retry (and eventually disable
  // your webhook) if you don't acknowledge within a few seconds.
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    const incomingMessages = change?.messages;
    if (incomingMessages) {
      for (const msg of incomingMessages) {
        console.log(`WhatsApp message from ${msg.from}: ${msg.text?.body || '(non-text message)'}`);
        // TODO: handle incoming replies here — e.g. save to DB, trigger a notification
      }
    }

    const statuses = change?.statuses;
    if (statuses) {
      for (const status of statuses) {
        console.log(`WhatsApp message ${status.id} is now: ${status.status}`);
        // TODO: update delivery status in your DB if you track it
      }
    }
  } catch (err) {
    console.error('Error processing WhatsApp webhook:', err.stack || err);
  }
});

module.exports = router;
