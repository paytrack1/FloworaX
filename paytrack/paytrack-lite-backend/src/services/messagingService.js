const axios = require('axios');

// Abstract messaging service that provides a unified interface for sending messages
// through multiple channels (email, SMS, WhatsApp).
// 
// Each provider is a separate implementation (e.g., ResendProvider, MockSMSProvider).
// The service chooses the right provider based on the channel and customer consent.

class MessagingService {
  constructor() {
    // Providers will be initialized in setProviders()
    this.providers = {};
  }

  // Initialize providers (call this once at app startup)
  setProviders(providers) {
    this.providers = providers;
  }

  // Main method: send a message to a customer through a chosen channel.
  // Returns { status, messageId, errorReason }
  async sendToCustomer(customer, channel, messageContent, options = {}) {
    if (!customer) {
      return { status: 'skipped_no_contact', errorReason: 'Customer not found' };
    }

    // Check consent
    const consentField = `${channel}OptIn`;
    if (customer[consentField] === false) {
      return { status: 'skipped_optout' };
    }

    // Get recipient for this channel
    let recipient = '';
    if (channel === 'email') {
      recipient = customer.email;
    } else if (channel === 'sms') {
      recipient = customer.phone;
    } else if (channel === 'whatsapp') {
      recipient = customer.phone;
    }

    if (!recipient) {
      return { status: 'skipped_no_contact', errorReason: `No valid ${channel} contact on file` };
    }

    // Route to appropriate provider
    const provider = this.providers[channel];
    if (!provider) {
      return { status: 'failed', errorReason: `Provider for channel '${channel}' not configured` };
    }

    try {
      const result = await provider.send({
        recipient,
        messageContent,
        customerId: customer._id,
        ...options,
      });
      return result;
    } catch (err) {
      console.error(`[MessagingService] Send failed for ${channel}:`, err.message);
      return {
        status: 'failed',
        errorReason: err.message || 'Provider error',
      };
    }
  }

  // Utility: generate next reminder date based on schedule
  // For a Sunday 9am reminder with "remind 1 day before", this returns Saturday 10am (next occurrence)
  getNextReminderDate(automation) {
    if (automation.trigger !== 'schedule') return null;

    const { dayOfWeek, reminder, timezone } = automation;
    const [reminderHour, reminderMin] = automation.reminder.atTime.split(':').map(Number);
    const [, daysBefore] = [0, automation.reminder.daysBefore];

    // Get next occurrence of the service day in the user's timezone
    const now = new Date();
    const daysUntilService = (dayOfWeek - now.getDay() + 7) % 7;
    const daysUntilReminder = daysUntilService - daysBefore;

    const date = new Date(now);
    date.setDate(date.getDate() + (daysUntilReminder === 0 && now.getHours() * 60 + now.getMinutes() >= reminderHour * 60 + reminderMin ? 7 : daysUntilReminder));
    date.setHours(reminderHour, reminderMin, 0, 0);

    return date;
  }

  // Substitute template variables in a message
  // Safe variables only: firstName, lastName, fullName, businessName, serviceName, date, startTime, endTime, dayOfWeek
  static interpolateTemplate(template, variables) {
    let result = template;
    const allowedVars = ['firstName', 'lastName', 'fullName', 'businessName', 'serviceName', 'date', 'startTime', 'endTime', 'dayOfWeek'];
    
    for (const varName of allowedVars) {
      const placeholder = `{{${varName}}}`;
      const value = variables[varName] || '';
      result = result.split(placeholder).join(value);
    }

    // Clean up any remaining unfilled placeholders
    result = result.replace(/\{\{[^}]+\}\}/g, '');
    
    return result;
  }
}

module.exports = new MessagingService();
