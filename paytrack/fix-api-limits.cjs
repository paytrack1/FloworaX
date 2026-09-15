const fs = require('fs');
const path = require('path');

const apiFiles = [
  { file: 'src/api/invoices.js', module: 'invoices', methods: ['createInvoice'] },
  { file: 'src/api/bookings.js', module: 'bookings', methods: ['createBooking'] },
  { file: 'src/api/sales.js', module: 'sales', methods: ['createSale', 'addSale'] },
  { file: 'src/api/expenses.js', module: 'expenses', methods: ['addExpense', 'createExpense'] },
];

apiFiles.forEach(({ file, module }) => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let c = fs.readFileSync(file, 'utf8');
  
  // Replace generic error throw after POST with limit-aware version
  const before = `  if (!res.ok) throw new Error(data.error || 'Unable to create`;
  const after = `  if (res.status === 403) {
    const err = new Error(data.error || 'Limit reached');
    err.isLimitError = true;
    err.module = '${module}';
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Unable to create`;

  if (c.includes(before)) {
    c = c.replace(before, after);
    fs.writeFileSync(file, c, 'utf8');
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Pattern not found in ${file} - check manually`);
  }
});

console.log('Done');
