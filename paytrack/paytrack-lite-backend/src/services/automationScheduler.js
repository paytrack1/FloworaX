const Automation = require('../models/Automation');
const AutomationExecution = require('../models/AutomationExecution');
const AutomationLog = require('../models/AutomationLog');
const Customer = require('../models/Customer');
const messagingService = require('./messagingService');
const mongoose = require('mongoose');
const { DAY_NAMES } = require('../utils/constants');

// â”€â”€ Core automation scheduler logic â”€â”€
// This runs periodically (e.g., every 5 minutes via cron) to send due reminders.

class AutomationScheduler {
  constructor(messagingService) {
    this.messagingService = messagingService;
  }

  // Main entry point: run scheduler
  async runScheduler() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // 1. Process recurring ('schedule' trigger) automations
      const scheduleResult = await this.processScheduleAutomations(now);

      // 2. Process new-member ('new_member' trigger) automations
      const newMemberResult = await this.processNewMemberAutomations();

      const total = (scheduleResult.messagesSent || 0) + (newMemberResult.messagesSent || 0);
      if (total > 0) {
        console.log(`[AutomationScheduler] Scheduler completed: sent ${total} message(s)`);
      }

      return {
        success: true,
        schedulesSent: scheduleResult.messagesSent || 0,
        newMembersWelcomed: newMemberResult.messagesSent || 0,
      };
    } catch (err) {
      console.error('[AutomationScheduler] Scheduler failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Process recurring schedule-based automations
  async processScheduleAutomations(now) {
    let messagesSent = 0;

    // Find all active schedule-trigger automations
    const automations = await Automation.find({
      trigger: 'schedule',
      status: 'active',
    });

    for (const automation of automations) {
      try {
        const isSendingNow = this.isScheduleDueNow(now, automation);
        if (!isSendingNow) continue;
        const dateStr = this.getDateParts(now, automation.timezone).date;

        // Check idempotency: has this automation already executed for this occurrence?
        const existing = await AutomationExecution.findOne({
          automationId: automation._id,
          occurrenceDate: dateStr,
        });

        if (existing && existing.status === 'sent') {
          // Already sent for this occurrence, skip
          console.log(`[AutomationScheduler] Skipping duplicate execution for automation ${automation._id} on ${dateStr}`);
          continue;
        }

        // Create or update execution record
        let execution = existing;
        if (!execution) {
          execution = new AutomationExecution({
            userId: automation.userId,
            automationId: automation._id,
            occurrenceDate: dateStr,
            status: 'pending',
          });
        }

        // Retry only recipients that failed in the previous scheduler run.
        const audience = await this.getAudienceCustomers(automation);
        const customers = execution.failedCustomerIds?.length
          ? audience.filter((customer) => execution.failedCustomerIds.some((id) => id.toString() === customer._id.toString()))
          : audience;

        // Send to each customer
        let sentCount = 0;
        const failedCustomerIds = [];
        for (const customer of customers) {
          const sent = await this.sendMessageToCustomer(automation, customer);
          if (sent) {
            sentCount++;
            messagesSent++;
          } else {
            failedCustomerIds.push(customer._id);
          }
        }

        // Keep incomplete executions pending so failed recipients are retried.
        execution.status = failedCustomerIds.length ? 'pending' : 'sent';
        execution.messagesSent = (execution.messagesSent || 0) + sentCount;
        execution.failedCustomerIds = failedCustomerIds;
        execution.executedAt = new Date();
        await execution.save();

        if (!failedCustomerIds.length) {
          automation.lastExecutedAt = new Date();
          await automation.save();
        }

      } catch (err) {
        console.error(`[AutomationScheduler] Error processing automation ${automation._id}:`, err.message);
      }
    }

    return { messagesSent };
  }

  // Process new-member welcome automations
  async processNewMemberAutomations() {
    let messagesSent = 0;

    // Find all active new_member-trigger automations
    const automations = await Automation.find({
      trigger: 'new_member',
      status: 'active',
    });

    for (const automation of automations) {
      try {
        // Find new customers (created since automation was created, and not yet welcomed by this automation)
        const newCustomers = await Customer.find({
          userId: automation.userId,
          welcomedAt: null,
          createdAt: { $gte: new Date(automation.createdAt.getTime() - 24 * 60 * 60 * 1000) }, // Last 24 hours for safety
        });

        for (const customer of newCustomers) {
          try {
            // Check idempotency: has this automation already welcomed this customer?
            const existing = await AutomationExecution.findOne({
              automationId: automation._id,
              customerId: customer._id,
            });

            if (existing) {
              // Already welcomed, skip
              continue;
            }

            // Send welcome message
            const sent = await this.sendMessageToCustomer(automation, customer);

            if (sent) {
              // Mark as welcomed
              customer.welcomedAt = new Date();
              await customer.save();

              // Record execution
              await new AutomationExecution({
                userId: automation.userId,
                automationId: automation._id,
                customerId: customer._id,
                status: 'sent',
                messagesSent: 1,
                executedAt: new Date(),
              }).save();

              messagesSent++;
            }
          } catch (err) {
            console.error(`[AutomationScheduler] Error welcoming customer ${customer._id}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`[AutomationScheduler] Error processing new-member automation ${automation._id}:`, err.message);
      }
    }

    return { messagesSent };
  }

  // â”€â”€ Helper: determine if a schedule is due to send now â”€â”€
  // For a Sunday service at 9am with "remind 1 day before at 10am",
  // this should return true on Saturday at 10am (checking within current hour).
  isScheduleDueNow(now, automation) {
    const { dayOfWeek, reminder } = automation;
    const reminderDay = (dayOfWeek - (automation.reminder.daysBefore || 1) + 7) % 7;
    const localNow = this.getDateParts(now, automation.timezone);
    const currentDay = localNow.weekday;

    // Check if today is the reminder day
    if (currentDay !== reminderDay) return false;

    // Cron runs every five minutes, so allow the configured minute through
    // the next four minutes instead of sending at the beginning of the hour.
    const [reminderHour, reminderMinute] = reminder.atTime.split(':').map(Number);
    const currentMinutes = localNow.hour * 60 + localNow.minute;
    const reminderMinutes = reminderHour * 60 + reminderMinute;
    if (currentMinutes < reminderMinutes || currentMinutes >= reminderMinutes + 5) return false;

    return true;
  }

  getDateParts(date, timezone = process.env.TZ || 'UTC') {
    let parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(date).reduce((result, part) => {
        result[part.type] = part.value;
        return result;
      }, {});
    } catch {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: process.env.TZ || 'UTC',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(date).reduce((result, part) => {
        result[part.type] = part.value;
        return result;
      }, {});
    }

    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      weekday: weekdays[parts.weekday],
      hour: Number(parts.hour),
      minute: Number(parts.minute),
    };
  }

  // â”€â”€ Helper: get customers to send to based on audience mode â”€â”€
  async getAudienceCustomers(automation) {
    const { userId } = automation;
    const { mode, newWithinDays, tag, customerIds } = automation.audience;

    if (mode === 'all') {
      return await Customer.find({ userId });
    }

    if (mode === 'new') {
      const days = newWithinDays || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return await Customer.find({ userId, createdAt: { $gte: since } });
    }

    if (mode === 'group') {
      return await Customer.find({ userId, tags: tag });
    }

    if (mode === 'selected') {
      return await Customer.find({ userId, _id: { $in: customerIds } });
    }

    return [];
  }

  // â”€â”€ Helper: send a single message to a customer â”€â”€
  async sendMessageToCustomer(automation, customer) {
    try {
      // Build template variables
      const dayName = DAY_NAMES[automation.dayOfWeek] || 'Service day';
      const variables = {
        firstName: (customer.name || '').split(' ')[0],
        lastName: (customer.name || '').split(' ').slice(1).join(' '),
        fullName: customer.name || '',
        businessName: '', // Would need to fetch from User model; skip for now
        serviceName: automation.name,
        date: new Date().toISOString().split('T')[0],
        startTime: automation.startTime,
        endTime: automation.endTime,
        dayOfWeek: dayName,
      };

      // Interpolate message
      const messageContent = messagingService.constructor.interpolateTemplate(
        automation.messageTemplate,
        variables
      );

      // Send via messaging service
      let result;
      if (automation.channel === 'sms' || automation.channel === 'whatsapp') {
        const User = mongoose.model('User');
        const owner = await User.findById(automation.userId);
        const creditField = automation.channel === 'sms' ? 'smsCredits' : 'whatsappCredits';
        const credits = owner ? owner[creditField] : null;
        if (credits !== null && credits !== undefined && credits <= 0) {
          result = { status: 'skipped_no_credits', errorReason: `Monthly ${automation.channel.toUpperCase()} credit limit reached` };
        } else {
          result = await this.messagingService.sendToCustomer(customer, automation.channel, messageContent);
          if (result.status === 'sent' && credits !== null && credits !== undefined && owner) {
            owner[creditField] = credits - 1;
            await owner.save();
          }
        }
      } else {
        result = await this.messagingService.sendToCustomer(customer, automation.channel, messageContent);
      }

      // Log result
      await new AutomationLog({
        userId: automation.userId,
        automationId: automation._id,
        customerId: customer._id,
        channel: automation.channel,
        recipient: this.getRecipient(customer, automation.channel),
        messageContent,
        status: result.status,
        failureReason: result.errorReason || null,
        providerMessageId: result.messageId || null,
        providerResponse: result.providerResponse || null,
      }).save();

      return result.status === 'sent';
    } catch (err) {
      console.error(`[AutomationScheduler] Error sending message:`, err.message);
      await new AutomationLog({
        userId: automation.userId,
        automationId: automation._id,
        customerId: customer._id,
        channel: automation.channel,
        recipient: this.getRecipient(customer, automation.channel),
        messageContent: automation.messageTemplate,
        status: 'failed',
        failureReason: err.message,
      }).save();
      return false;
    }
  }

  // â”€â”€ Helper: extract recipient (email/phone) from customer â”€â”€
  getRecipient(customer, channel) {
    if (channel === 'email') return customer.email;
    if (channel === 'sms' || channel === 'whatsapp') return customer.phone;
    return '';
  }
}

module.exports = AutomationScheduler;
