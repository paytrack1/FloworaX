// Mock provider for SMS and WhatsApp (for testing/development)
// In production, this would integrate with Twilio, Africa's Talking, Termii, etc.
class MockMessagingProvider {
  constructor(channel = 'sms') {
    this.channel = channel; // 'sms' or 'whatsapp'
  }

  async send({ recipient, messageContent, customerId, ...options }) {
    // Simulate a 5% failure rate for testing
    const isFailure = Math.random() < 0.05;

    if (isFailure) {
      return {
        status: 'failed',
        errorReason: `Simulated ${this.channel} provider error`,
      };
    }

    // Simulate successful send
    const mockMessageId = `mock_${this.channel}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[MockMessagingProvider] ${this.channel.toUpperCase()} sent to ${recipient}`);
    console.log(`  Message: ${messageContent.substring(0, 100)}...`);
    console.log(`  Message ID: ${mockMessageId}`);

    return {
      status: 'sent',
      messageId: mockMessageId,
    };
  }
}

module.exports = MockMessagingProvider;
