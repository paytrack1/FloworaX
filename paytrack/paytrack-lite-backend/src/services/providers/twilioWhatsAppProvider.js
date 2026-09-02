const axios = require('axios');

// Twilio WhatsApp provider
class TwilioWhatsAppProvider {
  constructor(accountSid, authToken, phoneNumberSid) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumberSid = phoneNumberSid;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  }

  async send({ recipient, messageContent, ...options }) {
    if (!this.accountSid || !this.authToken || !this.phoneNumberSid) {
      return {
        status: 'failed',
        errorReason: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER_SID)',
      };
    }

    try {
      // Format phone number: ensure it starts with + and country code
      const formattedPhone = recipient.startsWith('+') ? recipient : `+${recipient}`;

      const response = await axios.post(
        this.baseUrl,
        new URLSearchParams({
          To: `whatsapp:${formattedPhone}`,
          From: `whatsapp:${this.phoneNumberSid}`,
          Body: messageContent,
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.sid) {
        return {
          status: 'sent',
          messageId: response.data.sid,
        };
      }

      return {
        status: 'failed',
        errorReason: 'Failed to get Twilio message ID',
        providerResponse: response.data,
      };
    } catch (err) {
      console.error('[TwilioWhatsAppProvider] Error:', err.message);

      // Handle specific Twilio errors
      const errorCode = err.response?.data?.code;
      if (errorCode === 21211 || errorCode === 21212) {
        return {
          status: 'skipped_no_contact',
          errorReason: 'Invalid phone number',
        };
      }

      return {
        status: 'failed',
        errorReason: err.response?.data?.message || err.message || 'Twilio API error',
        providerResponse: err.response?.data,
      };
    }
  }
}

module.exports = TwilioWhatsAppProvider;
