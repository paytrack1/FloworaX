const axios = require('axios');

// Email provider using Resend API
class ResendProvider {
  constructor(apiKey, fromEmail) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail || 'onboarding@resend.dev';
  }

  async send({ recipient, messageContent, customerId, ...options }) {
    if (!this.apiKey) {
      return {
        status: 'failed',
        errorReason: 'Resend API key not configured',
      };
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: recipient,
          subject: options.subject || 'Message from Flowora',
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
            <p style="margin:0 0 16px;line-height:1.5">${messageContent}</p>
            <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
          </div>`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        status: 'sent',
        messageId: response.data.id,
      };
    } catch (err) {
      console.error('[ResendProvider] Error:', err.response?.data || err.message);
      return {
        status: 'failed',
        errorReason: err.response?.data?.message || err.message || 'Failed to send email',
        providerResponse: err.response?.data,
      };
    }
  }
}

module.exports = ResendProvider;
