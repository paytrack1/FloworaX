const Notification = require('../models/Notification');

/**
 * Create a notification for a user. Fails silently (logs only) so a
 * notification failure never breaks the actual booking/invoice/payment flow.
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {'booking'|'invoice'|'event'|'subscription'|'payment'|'system'} type
 * @param {string|null} link
 */
async function notify(userId, title, message, type = 'system', link = null) {
  try {
    if (!userId) return;
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.error('notify() failed:', err.message);
  }
}

module.exports = notify;
