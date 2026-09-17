// Add this route to your services routes file
// GET /api/services/:id/slots?date=YYYY-MM-DD
// Returns available time slots for a given date

const router = require('express').Router();
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) return res.status(404).json({ error: 'Service not found' });

    // Get day of week for the requested date (0=Sun, 6=Sat)
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    // Find availability for this day
    const dayAvailability = service.availability.find(a => a.day === dayOfWeek);
    if (!dayAvailability) {
      return res.json({ slots: [], message: 'No availability on this day' });
    }

    // Generate all possible slots
    const duration = service.duration || 60;
    const buffer = service.bufferTime || 0;
    const slotInterval = duration + buffer;

    const [startH, startM] = dayAvailability.startTime.split(':').map(Number);
    const [endH, endM] = dayAvailability.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const allSlots = [];
    for (let m = startMins; m + duration <= endMins; m += slotInterval) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }

    // Get already booked slots for this date
    const existingBookings = await Booking.find({
      serviceId: service._id,
      scheduledDate: date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('scheduledTime');

    const bookedTimes = new Set(existingBookings.map(b => b.scheduledTime));

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

    res.json({
      success: true,
      date,
      dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek],
      slots: availableSlots,
      duration,
      totalSlots: allSlots.length,
      bookedSlots: allSlots.length - availableSlots.length,
    });
  } catch (err) {
    console.error('Slots error:', err);
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

module.exports = router;
