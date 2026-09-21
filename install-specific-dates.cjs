const fs = require('fs');

// 1. Replace Service model
fs.copyFileSync('downloads-v2/Service-v2.js', 'paytrack/paytrack-lite-backend/src/models/Service.js');
console.log('✓ Service model updated with specificDates');

// 2. Replace AvailabilitySetup component
fs.copyFileSync('downloads-v2/AvailabilitySetup-v2.jsx', 'paytrack/src/components/AvailabilitySetup.jsx');
console.log('✓ AvailabilitySetup updated with specific dates mode');

// 3. Update slots route to handle specificDates mode
let servicesRoute = fs.readFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', 'utf8');

const oldSlotsRoute = `router.get('/:id/slots', async (req, res) => {
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
    }`;

const newSlotsRoute = `router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) return res.status(404).json({ error: 'Service not found' });

    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    // Determine availability hours based on mode
    let startTime, endTime;

    if (service.availabilityMode === 'specific') {
      const specificDate = service.specificDates?.find(d => d.date === date);
      if (!specificDate) {
        return res.json({ slots: [], message: 'No availability on this date' });
      }
      startTime = specificDate.startTime;
      endTime = specificDate.endTime;
    } else {
      // Weekly mode
      const dayAvailability = service.availability.find(a => a.day === dayOfWeek);
      if (!dayAvailability) {
        return res.json({ slots: [], message: 'No availability on this day' });
      }
      startTime = dayAvailability.startTime;
      endTime = dayAvailability.endTime;
    }`;

if (servicesRoute.includes(oldSlotsRoute)) {
  servicesRoute = servicesRoute.replace(oldSlotsRoute, newSlotsRoute);
  // Fix the variable references below
  servicesRoute = servicesRoute.replace(
    'const startMins = startH * 60 + startM;\n  const endMins = endH * 60 + endM;',
    'const startMins = startH * 60 + startM;\n    const endMins = endH * 60 + endM;'
  );
  fs.writeFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', servicesRoute, 'utf8');
  console.log('✓ Slots route updated for specific dates mode');
} else {
  // Try simpler replacement - just add specificDates check
  const simpleOld = `    const dayAvailability = service.availability.find(a => a.day === dayOfWeek);
    if (!dayAvailability) {
      return res.json({ slots: [], message: 'No availability on this day' });
    }

    // Generate all possible slots
    const duration = service.duration || 60;
    const buffer = service.bufferTime || 0;
    const slotInterval = duration + buffer;

    const [startH, startM] = dayAvailability.startTime.split(':').map(Number);
    const [endH, endM] = dayAvailability.endTime.split(':').map(Number);`;
  
  const simpleNew = `    let startTimeStr, endTimeStr;
    if (service.availabilityMode === 'specific') {
      const specificDate = service.specificDates?.find(d => d.date === date);
      if (!specificDate) return res.json({ slots: [], message: 'No availability on this date' });
      startTimeStr = specificDate.startTime;
      endTimeStr = specificDate.endTime;
    } else {
      const dayAvailability = service.availability.find(a => a.day === dayOfWeek);
      if (!dayAvailability) return res.json({ slots: [], message: 'No availability on this day' });
      startTimeStr = dayAvailability.startTime;
      endTimeStr = dayAvailability.endTime;
    }

    // Generate all possible slots
    const duration = service.duration || 60;
    const buffer = service.bufferTime || 0;
    const slotInterval = duration + buffer;

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);`;

  if (servicesRoute.includes(simpleOld)) {
    servicesRoute = servicesRoute.replace(simpleOld, simpleNew);
    fs.writeFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', servicesRoute, 'utf8');
    console.log('✓ Slots route updated (simple replacement)');
  } else {
    console.log('⚠ Could not auto-update slots route - check manually');
  }
}

console.log('\nAll done! Now run:');
console.log('git add -A && git commit -m "Add specific dates availability mode" && git push');
