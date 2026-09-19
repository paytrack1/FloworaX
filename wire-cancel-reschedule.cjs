const fs = require('fs');

// 1. Add cancelToken to Booking model
let bookingModel = fs.readFileSync('paytrack/paytrack-lite-backend/src/models/Booking.js', 'utf8');
if (!bookingModel.includes('cancelToken')) {
  bookingModel = bookingModel.replace(
    "  notes:         { type: String },",
    "  notes:         { type: String },\n  cancelToken:   { type: String, default: null, index: true },"
  );
  fs.writeFileSync('paytrack/paytrack-lite-backend/src/models/Booking.js', bookingModel, 'utf8');
  console.log('✓ cancelToken added to Booking model');
} else {
  console.log('✓ cancelToken already in Booking model');
}

// 2. Add routes to App.jsx
let app = fs.readFileSync('paytrack/src/App.jsx', 'utf8');
if (!app.includes('CancelBooking')) {
  app = app.replace(
    "import UpgradeVerify from './pages/UpgradeVerify';",
    "import UpgradeVerify from './pages/UpgradeVerify';\nimport CancelBooking from './pages/CancelBooking';\nimport RescheduleBooking from './pages/RescheduleBooking';"
  );
  // Add routes - find a good place
  app = app.replace(
    "<Route path='/upgrade/verify' element={<UpgradeVerify />} />",
    "<Route path='/upgrade/verify' element={<UpgradeVerify />} />\n        <Route path='/booking/cancel' element={<CancelBooking />} />\n        <Route path='/booking/reschedule' element={<RescheduleBooking />} />"
  );
  fs.writeFileSync('paytrack/src/App.jsx', app, 'utf8');
  console.log('✓ CancelBooking and RescheduleBooking routes added to App.jsx');
} else {
  console.log('✓ Routes already in App.jsx');
}

console.log('\nAll done!');
