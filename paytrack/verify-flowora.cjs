const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [];

function readFile(p) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function check(label, filePath, testFn) {
  const content = readFile(filePath);
  if (content === null) {
    checks.push({ label, status: 'MISSING FILE', detail: filePath });
    return;
  }
  const result = testFn(content);
  checks.push({ label, status: result ? 'PASS' : 'FAIL', detail: filePath });
}

// --- Task 1: Events module ---
check('Backend: /api/events registered', 'paytrack-lite-backend/index.js',
  c => /app\.use\(\s*['"]\/api\/events['"]/.test(c));

check('Frontend: modules.js includes events', 'src/store/modules.js',
  c => /['"]events['"]/.test(c));

check('Frontend: Sidebar.jsx has events tab', 'Sidebar.jsx',
  c => /id:\s*['"]events['"]/.test(c) && /getModulesForBusinessType/.test(c));

check('Frontend: BottomNav.jsx has events tab', 'BottomNav.jsx',
  c => /id:\s*['"]events['"]/.test(c) && /getModulesForBusinessType/.test(c));

check('Frontend: App.jsx has events case', 'src/App.jsx',
  c => /case\s*['"]events['"]/.test(c));

check('Frontend: Events.jsx has fetch logic', 'src/pages/Events.jsx',
  c => /fetch\(`\$\{BACKEND_URL\}\/api\/events/.test(c));

// --- Corruption check: unescaped template literals anywhere ---
['src/store/useStore.js', 'src/pages/AdminDashboard.jsx', 'src/pages/Events.jsx'].forEach(f => {
  check(`No broken template literals in ${f}`, f,
    c => !/fetch\(\$\{/.test(c) && !/className=\{[a-zA-Z]/.test(c));
});

// --- Task 3: Admin dashboard groundwork ---
check('Backend: /api/admin/dashboard route exists', 'paytrack-lite-backend/index.js',
  c => /['"]\/api\/admin\/dashboard['"]/.test(c));

check('Backend: User model has role/admin field', 'src/models/User.js',
  c => /role/.test(c));

check('Frontend: useStore has fetchAdminDashboard', 'src/store/useStore.js',
  c => /fetchAdminDashboard/.test(c));

check('Frontend: AdminDashboard.jsx exists', 'src/pages/AdminDashboard.jsx',
  c => c.length > 0);

check('Frontend: App.jsx routes to AdminDashboard', 'src/App.jsx',
  c => /AdminDashboard/.test(c));

// --- Print results ---
console.log('\n=== FLOWORA VERIFICATION SCAN ===\n');
const maxLabel = Math.max(...checks.map(c => c.label.length));
checks.forEach(c => {
  const icon = c.status === 'PASS' ? '✅' : c.status === 'FAIL' ? '❌' : '⚠️ ';
  console.log(`${icon} ${c.label.padEnd(maxLabel)}  [${c.status}]  ${c.detail}`);
});

const failCount = checks.filter(c => c.status !== 'PASS').length;
console.log(`\n${checks.length - failCount}/${checks.length} checks passed.`);
if (failCount > 0) console.log(`${failCount} item(s) need attention — see FAIL/MISSING above.`);