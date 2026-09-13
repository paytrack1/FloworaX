// Termii messaging utility — SMS, WhatsApp, Email
// Docs: https://developers.termii.com

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_BASE_URL = process.env.TERMII_BASE_URL || 'https://v4.api.termii.com';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'FloworaX';

// Format Nigerian phone number to international format
function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  if (digits.startsWith('+')) return digits.slice(1);
  return '234' + digits;
}

// Send SMS via Termii
async function sendSMS(to, message) {
  if (!TERMII_API_KEY) throw new Error('TERMII_API_KEY not set');
  const phone = formatPhone(to);
  if (!phone) throw new Error('Invalid phone number');

  const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TERMII_API_KEY,
      to: phone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.code === 'error') {
    throw new Error(data.message || 'Termii SMS failed');
  }
  return data;
}

// Send WhatsApp via Termii
async function sendWhatsApp(to, message) {
  if (!TERMII_API_KEY) throw new Error('TERMII_API_KEY not set');
  const phone = formatPhone(to);
  if (!phone) throw new Error('Invalid phone number');

  const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TERMII_API_KEY,
      to: phone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'whatsapp',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.code === 'error') {
    throw new Error(data.message || 'Termii WhatsApp failed');
  }
  return data;
}

// Send Email via Termii
async function sendTermiiEmail(to, subject, body) {
  if (!TERMII_API_KEY) throw new Error('TERMII_API_KEY not set');

  const res = await fetch(`${TERMII_BASE_URL}/api/email/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TERMII_API_KEY,
      email_address: to,
      code: body,
      email_configuration_id: process.env.TERMII_EMAIL_CONFIG_ID || '',
    }),
  });

  const data = await res.json();
  return data;
}

// Universal send — picks channel automatically
async function sendMessage(channel, recipient, message, subject = 'Message from FloworaX') {
  if (!recipient) throw new Error('No recipient');
  
  switch (channel) {
    case 'sms':
      return sendSMS(recipient, message);
    case 'whatsapp':
      return sendWhatsApp(recipient, message);
    case 'email':
      // Fall back to Resend for email (already configured)
      return { skipped: true, reason: 'email handled by Resend' };
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

// Replace template variables with actual values
function renderTemplate(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

module.exports = { sendSMS, sendWhatsApp, sendMessage, renderTemplate, formatPhone };
