const fs = require('fs');
const path = 'paytrack/paytrack-lite-backend/src/routes/bookings.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Add crypto require at top
if (!c.includes("require('crypto')")) {
  c = c.replace(
    "const express = require('express');",
    "const express = require('express');\nconst crypto = require('crypto');"
  );
}

// 2. Add cancelToken to Booking.create
c = c.replace(
  'const booking = await Booking.create({\n      serviceId, providerId: service.userId, clientName, clientEmail, clientPhone,\n      scheduledDate, scheduledTime, amount: service.price,\n      paymentStatus: service.isFree ? \'free\' : \'pending\',',
  "const cancelToken = crypto.randomBytes(32).toString('hex');\n    const booking = await Booking.create({\n      serviceId, providerId: service.userId, clientName, clientEmail, clientPhone,\n      scheduledDate, scheduledTime, amount: service.price,\n      paymentStatus: service.isFree ? 'free' : 'pending',\n      cancelToken,"
);

// 3. Update confirmationHtml to include cancel/reschedule links
c = c.replace(
  `function confirmationHtml(booking) {
  const amountLine = booking.amount
    ? \`<p style="margin:4px 0"><strong>Amount paid:</strong> &#8358;\${booking.amount}</p>\`
    : '';
  return \`<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">Booking confirmed</h2>
    <p style="margin:0 0 16px">Hi \${booking.clientName}, your booking is confirmed. Here are the details:</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Date:</strong> \${booking.scheduledDate}</p>
      <p style="margin:4px 0"><strong>Time:</strong> \${booking.scheduledTime}</p>
      \${amountLine}
    </div>
    <p style="margin:0;color:#64748B;font-size:13px">Powered by Flowora</p>
  </div>\`;\n}`,
  `function confirmationHtml(booking) {
  const amountLine = booking.amount
    ? \`<p style="margin:4px 0"><strong>Amount paid:</strong> &#8358;\${Number(booking.amount).toLocaleString()}</p>\`
    : '';
  const FRONTEND = process.env.FRONTEND_URL || 'https://floworax.vercel.app';
  const cancelLink = booking.cancelToken ? \`\${FRONTEND}/booking/cancel?token=\${booking.cancelToken}\` : '';
  const rescheduleLink = booking.cancelToken ? \`\${FRONTEND}/booking/reschedule?token=\${booking.cancelToken}\` : '';
  const actionLinks = cancelLink ? \`
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748B;">Need to make changes?</p>
      <a href="\${rescheduleLink}" style="display:inline-block;margin-right:12px;padding:8px 16px;background:#2F5FB3;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Reschedule</a>
      <a href="\${cancelLink}" style="display:inline-block;padding:8px 16px;background:#FEF2F2;color:#EF4444;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Cancel Booking</a>
    </div>\` : '';
  return \`<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
    <h2 style="color:#2F5FB3;margin:0 0 12px">Booking confirmed ✓</h2>
    <p style="margin:0 0 16px">Hi \${booking.clientName}, your booking is confirmed. Here are the details:</p>
    <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:4px 0"><strong>Date:</strong> \${booking.scheduledDate}</p>
      <p style="margin:4px 0"><strong>Time:</strong> \${booking.scheduledTime}</p>
      \${amountLine}
    </div>
    \${actionLinks}
    <p style="margin:16px 0 0;color:#64748B;font-size:12px;">Powered by FloworaX · floworax.com</p>
  </div>\`;
}`
);

// 4. Add cancelToken to Booking model update in confirmPaidBooking
// (already handled since we generate cancelToken at creation time)

// 5. Add cancel and reschedule public routes
const newRoutes = `
// PUBLIC: Cancel booking via token
router.get('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed booking' });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    // Check cancellation policy (default: free cancellation up to 24 hours before)
    const cancelHoursAllowed = owner?.cancellationHours || 24;
    const bookingDateTime = new Date(\`\${booking.scheduledDate}T\${booking.scheduledTime}:00\`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    const withinPolicy = hoursUntilBooking >= cancelHoursAllowed;

    res.json({
      success: true,
      booking: {
        clientName: booking.clientName,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        serviceName: service?.title || 'Service',
        amount: booking.amount,
        paymentStatus: booking.paymentStatus,
      },
      withinPolicy,
      cancelHoursAllowed,
      hoursUntilBooking: Math.round(hoursUntilBooking),
      refundMessage: booking.paymentStatus === 'paid'
        ? withinPolicy
          ? 'You are eligible for a refund. The business will process it within 3–5 business days.'
          : \`Cancellation policy: free cancellation up to \${cancelHoursAllowed} hours before. No refund applies at this time.\`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking details' });
  }
});

router.post('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed booking' });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    const bookingDateTime = new Date(\`\${booking.scheduledDate}T\${booking.scheduledTime}:00\`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    const cancelHoursAllowed = owner?.cancellationHours || 24;
    const withinPolicy = hoursUntilBooking >= cancelHoursAllowed;

    await Booking.findByIdAndUpdate(booking._id, {
      status: 'cancelled',
      cancelToken: null, // invalidate token after use
    });

    // Notify owner
    await notify(
      booking.providerId,
      'Booking cancelled',
      \`\${booking.clientName} cancelled their \${service?.title || 'booking'} for \${booking.scheduledDate} at \${booking.scheduledTime}.\${withinPolicy && booking.paymentStatus === 'paid' ? ' Refund may be required.' : ''}\`,
      'booking'
    );

    // Email client confirmation of cancellation
    await sendEmail(
      booking.clientEmail,
      'Your booking has been cancelled',
      \`<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="color:#EF4444;margin:0 0 12px">Booking Cancelled</h2>
        <p>Hi \${booking.clientName}, your booking has been cancelled.</p>
        <div style="background:#FEF2F2;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0"><strong>Service:</strong> \${service?.title || 'Booking'}</p>
          <p style="margin:4px 0"><strong>Date:</strong> \${booking.scheduledDate}</p>
          <p style="margin:4px 0"><strong>Time:</strong> \${booking.scheduledTime}</p>
        </div>
        \${booking.paymentStatus === 'paid' ? \`<div style="background:#FFF7ED;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:0;font-size:13px;color:#92400E;">\${withinPolicy
            ? '💰 You are eligible for a refund. The business will process it within 3–5 business days.'
            : \`⚠️ Cancellation policy: free cancellation up to \${cancelHoursAllowed} hours before. No refund applies.\`}</p>
        </div>\` : ''}
        <p style="color:#64748B;font-size:12px;margin-top:16px;">Powered by FloworaX · floworax.com</p>
      </div>\`
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refundMessage: booking.paymentStatus === 'paid'
        ? withinPolicy
          ? 'Refund will be processed by the business within 3–5 business days.'
          : 'No refund applies based on cancellation policy.'
        : null,
    });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// PUBLIC: Get reschedule details
router.get('/reschedule/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: \`Cannot reschedule a \${booking.status} booking\` });
    }

    const service = await Service.findById(booking.serviceId);
    res.json({
      success: true,
      booking: {
        clientName: booking.clientName,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        serviceId: booking.serviceId,
        serviceName: service?.title || 'Service',
        duration: service?.duration,
        availability: service?.availability || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking details' });
  }
});

// PUBLIC: Reschedule booking
router.post('/reschedule/:token', async (req, res) => {
  try {
    const { newDate, newTime } = req.body;
    if (!newDate || !newTime) return res.status(400).json({ error: 'newDate and newTime are required' });

    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found or link expired' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: \`Cannot reschedule a \${booking.status} booking\` });
    }

    // Check new slot is available
    const conflict = await Booking.findOne({
      serviceId: booking.serviceId,
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: booking._id },
    });
    if (conflict) return res.status(409).json({ error: 'This time slot has been booked. Please select another time.' });

    const oldDate = booking.scheduledDate;
    const oldTime = booking.scheduledTime;

    await Booking.findByIdAndUpdate(booking._id, {
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: 'confirmed',
    });

    const service = await Service.findById(booking.serviceId);
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const owner = await User.findById(booking.providerId);

    // Notify owner
    await notify(
      booking.providerId,
      'Booking rescheduled',
      \`\${booking.clientName} rescheduled \${service?.title || 'booking'} from \${oldDate} \${oldTime} to \${newDate} \${newTime}.\`,
      'booking'
    );

    // Email client new confirmation
    await sendEmail(
      booking.clientEmail,
      'Booking rescheduled — new confirmation',
      \`<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
        <h2 style="color:#2F5FB3;margin:0 0 12px">Booking Rescheduled ✓</h2>
        <p>Hi \${booking.clientName}, your booking has been rescheduled.</p>
        <div style="background:#F0FFF4;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;color:#64748B;text-decoration:line-through;font-size:13px;">Was: \${oldDate} at \${oldTime}</p>
          <p style="margin:8px 0 4px 0;font-weight:700;color:#0F172A;">Now: \${newDate} at \${newTime}</p>
          <p style="margin:4px 0"><strong>Service:</strong> \${service?.title || 'Booking'}</p>
        </div>
        <p style="color:#64748B;font-size:12px;margin-top:16px;">Powered by FloworaX · floworax.com</p>
      </div>\`
    );

    res.json({ success: true, message: 'Booking rescheduled successfully', newDate, newTime });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

`;

// Add before module.exports
c = c.replace('module.exports = router;', newRoutes + '\nmodule.exports = router;');

fs.writeFileSync(path, c, 'utf8');
console.log('Done - cancel and reschedule routes added');
