const fetch = require('node-fetch');

const GRAPH_API_VERSION = 'v21.0';

/**
 * WhatsApp provider backed by Meta's official Cloud API.
 * Matches the interface expected by messagingService (same shape as TwilioWhatsAppProvider).
 */
class MetaWhatsAppProvider {
  constructor(accessToken, phoneNumberId) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  }

  /**
   * Send a freeform text message. Only works within a 24-hour customer-service
   * window (i.e. the customer messaged you recently) — otherwise Meta requires
   * a pre-approved template message instead (see sendTemplate below).
   */
  async sendMessage(to, body) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: this._normalizeNumber(to),
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Meta WhatsApp send failed:', data);
      throw new Error(data?.error?.message || 'Failed to send WhatsApp message');
    }
    return data;
  }

  /**
   * Send a pre-approved template message. Required for the FIRST message to a
   * customer, or any message sent outside the 24-hour window. Template names
   * must already be approved in Meta Business Manager.
   */
  async sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: this._normalizeNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Meta WhatsApp template send failed:', data);
      throw new Error(data?.error?.message || 'Failed to send WhatsApp template');
    }
    return data;
  }

  // Meta expects numbers in international format without a leading '+' (e.g. 2348101341223).
  _normalizeNumber(number) {
    return number.replace(/^\+/, '').replace(/\s/g, '');
  }
}

module.exports = MetaWhatsAppProvider;
