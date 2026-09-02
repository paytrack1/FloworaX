const axios = require('axios');

// Africa's Talking SMS provider
class AfricasTalkingProvider {
  constructor(apiKey, username) {
    this.apiKey = apiKey;
    this.username = username;
    this.baseUrl = 'https://api.sandbox.africastalking.com/version1/messaging';
  }

  async send({ recipient, messageContent, ...options }) {
    if (!this.apiKey || !this.username) {
      return {
        status: 'failed',
        errorReason: 'Africa\'s Talking credentials not configured (AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME)',
      };
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          username: this.username,
          message: messageContent,
          recipients: [recipient],
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      // Check Africa's Talking response
      if (response.data.SMSMessageData?.Recipients?.[0]) {
        const result = response.data.SMSMessageData.Recipients[0];
        if (result.statusCode === 101) {
          // 101 = Invalid phone number
          return {
            status: 'skipped_no_contact',
            errorReason: 'Invalid phone number',
          };
        }
        if (result.statusCode === 100) {
          // 100 = Success
          return {
            status: 'sent',
            messageId: result.messageId,
          };
        }
        return {
          status: 'failed',
          errorReason: `Africa's Talking error: ${result.status}`,
        };
      }

      return {
        status: 'failed',
        errorReason: 'Unexpected response from Africa\'s Talking',
        providerResponse: response.data,
      };
    } catch (err) {
      console.error('[AfricasTalkingProvider] Error:', err.message);
      return {
        status: 'failed',
        errorReason: err.response?.data?.error || err.message || 'Africa\'s Talking API error',
        providerResponse: err.response?.data,
      };
    }
  }
}

module.exports = AfricasTalkingProvider;
