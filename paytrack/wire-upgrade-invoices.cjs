const fs = require('fs');
let c = fs.readFileSync('src/pages/Invoices.jsx', 'utf8');

// 1. Add UpgradeModal import
if (!c.includes('UpgradeModal')) {
  c = c.replace(
    "import FSpinner from '../components/FSpinner';",
    "import FSpinner from '../components/FSpinner';\nimport UpgradeModal from '../components/UpgradeModal';"
  );
}

// 2. Add upgrade state after error state
if (!c.includes('upgradeModule')) {
  c = c.replace(
    "  const [error, setError]           = useState('');",
    "  const [error, setError]           = useState('');\n  const [upgradeModule, setUpgradeModule] = useState(null);\n  const [upgradeMessage, setUpgradeMessage] = useState('');"
  );
}

// 3. Handle 403 in handleCreate
c = c.replace(
  "} else { setError(data.error || 'Failed to create invoice'); }",
  "} else if (res.status === 403) {\n        setUpgradeMessage(data.error || 'You have reached your free invoice limit.');\n        setUpgradeModule('invoices');\n      } else { setError(data.error || 'Failed to create invoice'); }"
);

// 4. Add UpgradeModal before export default
c = c.replace(
  'export default Invoices;',
  `export default Invoices;`
);

// 5. Add UpgradeModal inside return - find the last closing div before export
c = c.replace(
  "  return (",
  `  return (\n    <>\n      {upgradeModule && (\n        <UpgradeModal\n          module={upgradeModule}\n          limitMessage={upgradeMessage}\n          onClose={() => { setUpgradeModule(null); setUpgradeMessage(''); }}\n        />\n      )}`
);

// Close the fragment - find the last ); before export
c = c.replace(
  /(\s*\);\s*\n)(export default Invoices;)/,
  '\n    </>\n  );\n\nexport default Invoices;'
);

fs.writeFileSync('src/pages/Invoices.jsx', c, 'utf8');
console.log('Done - UpgradeModal wired into Invoices');
