const fs = require('fs');
const path = require('path');

console.log('Installing availability feature...');

// 1. Replace Service model
fs.copyFileSync(
  'downloads/Service-with-availability.js',
  'paytrack/paytrack-lite-backend/src/models/Service.js'
);
console.log('✓ Service model updated');

// 2. Replace PublicBooking page
fs.copyFileSync(
  'downloads/PublicBooking-with-slots.jsx',
  'paytrack/src/pages/PublicBooking.jsx'
);
console.log('✓ PublicBooking page updated');

// 3. Copy AvailabilitySetup component
fs.copyFileSync(
  'downloads/AvailabilitySetup.jsx',
  'paytrack/src/components/AvailabilitySetup.jsx'
);
console.log('✓ AvailabilitySetup component added');

// 4. Add slots route to services routes
let servicesRoute = fs.readFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', 'utf8');
if (!servicesRoute.includes('/slots')) {
  const slotsCode = fs.readFileSync('downloads/slots-route.js', 'utf8');
  // Extract just the router.get part
  const routerGetMatch = slotsCode.match(/router\.get\('\/\:id\/slots'[\s\S]+?^}\);/m);
  if (routerGetMatch) {
    // Add before module.exports
    servicesRoute = servicesRoute.replace(
      /module\.exports\s*=\s*router;/,
      routerGetMatch[0] + '\n\nmodule.exports = router;'
    );
    fs.writeFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', servicesRoute, 'utf8');
    console.log('✓ Slots route added to services');
  }
} else {
  console.log('✓ Slots route already exists');
}

// 5. Add PATCH endpoint to services routes for saving availability
if (!servicesRoute.includes('availability')) {
  servicesRoute = fs.readFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', 'utf8');
  const patchCode = `
// PATCH /api/services/:id - update service including availability
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});
`;
  servicesRoute = servicesRoute.replace(
    /module\.exports\s*=\s*router;/,
    patchCode + '\nmodule.exports = router;'
  );
  fs.writeFileSync('paytrack/paytrack-lite-backend/src/routes/services.js', servicesRoute, 'utf8');
  console.log('✓ PATCH service route added');
} else {
  console.log('✓ PATCH service route already exists');
}

console.log('\nAll done! Now run:');
console.log('git add -A && git commit -m "Add availability calendar and time slot booking" && git push');
