const express = require('express');
const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// Meta's webhook verification uses dotted query param names (hub.mode, etc.)
// which Express's default query parser does not handle -- so we parse the raw
// query string ourselves instead of relying on req.query.
router.get('/', (req, res) => {
  const rawQuery = req.url.split('?')[1] || '';
  const params = new URLSearchParams(rawQuery);

  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }
  console.error('WhatsApp webhook verification failed -- token mismatch');
  return res.sendStatus(403);
});

router.post('/', (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    const incomingMessages = change?.messages;
    if (incomingMessages) {
      for (const msg of incomingMessages) {
        console.log(`WhatsApp message from ${msg.from}: ${msg.text?.body || '(non-text message)'}`);
      }
    }

    const statuses = change?.statuses;
    if (statuses) {
      for (const status of statuses) {
        console.log(`WhatsApp message ${status.id} is now: ${status.status}`);
      }
    }
  } catch (err) {
    console.error('Error processing WhatsApp webhook:', err.stack || err);
  }
});

module.exports = router;
