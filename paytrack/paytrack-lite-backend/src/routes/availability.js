const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// requireAuth is passed in from index.js when this router is mounted --
// see the "module.exports = (requireAuth) => {...}" pattern below.
module.exports = (requireAuth) => {

  // -- GET owner's own availability settings --
  router.get('/', requireAuth, async (req, res) => {
    try {
      let availability = await Availability.findOne({ userId: req.user.id });
      if (!availability) {
        availability = await Availability.create({ userId: req.user.id, weeklySlots: [], dateOverrides: [] });
      }
      res.json({ success: true, availability });
    } catch (err) {
      console.error('Get availability error:', err);
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  });

  // -- SAVE owner's weekly schedule + date overrides --
  router.put('/', requireAuth, async (req, res) => {
    const { weeklySlots, dateOverrides, timezone } = req.body;
    try {
      const availability = await Availability.findOneAndUpdate(
        { userId: req.user.id },
        {
          weeklySlots: Array.isArray(weeklySlots) ? weeklySlots : [],
          dateOverrides: Array.isArray(dateOverrides) ? dateOverrides : [],
          timezone: timezone || 'Africa/Lagos',
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      res.json({ success: true, availability });
    } catch (err) {
      console.error('Save availability error:', err);
      res.status(500).json({ error: 'Failed to save availability' });
    }
  });

  // -- PUBLIC: get bookable time slots for a service on a given date --
  // GET /api/availability/public/:serviceId/slots?date=YYYY-MM-DD
  router.get('/public/:serviceId/slots', async (req, res) => {
    const { serviceId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param (YYYY-MM-DD) is required' });

    try {
      const service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ error: 'Service not found' });

      const availability = await Availability.findOne({ userId: service.userId });
      if (!availability) return res.json({ success: true, slots: [] });

      const dayOfWeek = new Date(date + 'T00:00:00').getDay();

      // Check for a date-specific override first (blocks or replaces weekly hours).
      const override = availability.dateOverrides.find((o) => o.date === date);
      let startTime, endTime;
      if (override) {
        if (!override.available) return res.json({ success: true, slots: [] }); // explicitly blocked
        startTime = override.startTime;
        endTime = override.endTime;
      }
      if (!startTime || !endTime) {
        const weekly = availability.weeklySlots.find((w) => w.dayOfWeek === dayOfWeek);
        if (!weekly) return res.json({ success: true, slots: [] }); // no hours set for this day at all
        startTime = weekly.startTime;
        endTime = weekly.endTime;
      }

      // Break the available window into slots sized to this service's duration.
      const durationMinutes = service.duration || 30;
      const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const toTimeStr = (mins) => { const h = Math.floor(mins / 60).toString().padStart(2, '0'); const m = (mins % 60).toString().padStart(2, '0'); return `${h}:${m}`; };

      const startMin = toMinutes(startTime);
      const endMin = toMinutes(endTime);
      const allSlots = [];
      for (let t = startMin; t + durationMinutes <= endMin; t += durationMinutes) {
        allSlots.push(toTimeStr(t));
      }

      // Remove slots already booked (any non-cancelled booking for this provider at this date+time).
      const existingBookings = await Booking.find({
        providerId: service.userId,
        scheduledDate: date,
        status: { $ne: 'cancelled' },
      }, 'scheduledTime');
      const bookedTimes = new Set(existingBookings.map((b) => b.scheduledTime));

      const availableSlots = allSlots.filter((t) => !bookedTimes.has(t));
      res.json({ success: true, slots: availableSlots });
    } catch (err) {
      console.error('Get public slots error:', err);
      res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  });

  return router;
};
