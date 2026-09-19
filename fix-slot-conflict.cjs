const fs = require('fs');
const path = 'paytrack/paytrack-lite-backend/src/routes/bookings.js';
let c = fs.readFileSync(path, 'utf8');

// Add slot conflict check before Booking.create
const oldText = `const booking = await Booking.create({`;
const newText = `// Check if slot is already taken
    const existingBooking = await Booking.findOne({
      serviceId,
      scheduledDate,
      scheduledTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existingBooking) {
      return res.status(409).json({
        error: 'This time slot was just booked by someone else. Please select another time.',
      });
    }

    const booking = await Booking.create({`;

if (c.includes(oldText)) {
  c = c.replace(oldText, newText);
  fs.writeFileSync(path, c, 'utf8');
  console.log('Done - slot conflict check added');
} else {
  console.log('Pattern not found - check bookings.js manually');
}
