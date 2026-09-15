const fs = require('fs');

const pages = [
  {
    file: 'src/pages/Bookings.jsx',
    module: 'bookings',
    errorPatterns: [
      "setError(data.error || 'Failed to create service')",
      "setError(data.error || 'Failed to save service')",
      "setError(err.message || 'Failed')",
    ],
    limitMessage: "You've reached your free bookings limit.",
  },
  {
    file: 'src/pages/Events.jsx',
    module: 'events',
    errorPatterns: [
      "setError(data.error || 'Failed to save event')",
      "setError(data.error || 'Failed to create event')",
      "setError(err.message)",
    ],
    limitMessage: "You've reached your free events limit.",
  },
  {
    file: 'src/pages/NewSale.jsx',
    module: 'sales',
    errorPatterns: [
      "setSaleError(data.error || 'Failed to record sale')",
      "setSaleError(err.message || 'Failed to record sale')",
      "setError(data.error || 'Failed')",
    ],
    limitMessage: "You've reached your free sales limit.",
  },
];

pages.forEach(({ file, module, limitMessage }) => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }

  let c = fs.readFileSync(file, 'utf8');

  // Add UpgradeModal import if not present
  if (!c.includes('UpgradeModal')) {
    c = c.replace(
      "import FSpinner from '../components/FSpinner';",
      "import FSpinner from '../components/FSpinner';\nimport UpgradeModal from '../components/UpgradeModal';"
    );
    // fallback if FSpinner import not found
    if (!c.includes('UpgradeModal')) {
      c = c.replace(
        "import FAlert from '../components/FAlert';",
        "import FAlert from '../components/FAlert';\nimport UpgradeModal from '../components/UpgradeModal';"
      );
    }
  }

  // Add upgrade state if not present
  if (!c.includes('upgradeModule')) {
    // Try common state patterns
    const statePatterns = [
      "const [error, setError] = useState('');",
      "const [saleError, setSaleError] = useState('');",
      "const [saving, setSaving] = useState(false);",
    ];
    for (const pattern of statePatterns) {
      if (c.includes(pattern)) {
        c = c.replace(
          pattern,
          `${pattern}\n  const [upgradeModule, setUpgradeModule] = useState(null);\n  const [upgradeMessage, setUpgradeMessage] = useState('');`
        );
        break;
      }
    }
  }

  // Add 403 handling before fetch error handling
  // Look for res.status check patterns
  if (!c.includes('setUpgradeModule')) {
    // Add after any !res.ok check in POST requests
    c = c.replace(
      /if \(!res\.ok\) \{([^}]+)\}/g,
      (match) => {
        if (match.includes('throw') || match.includes('return')) {
          return `if (res.status === 403) {\n        setUpgradeMessage(data.error || '${limitMessage}');\n        setUpgradeModule('${module}');\n        return;\n      }\n      ${match}`;
        }
        return match;
      }
    );
  }

  // Add UpgradeModal to JSX - wrap return in fragment
  if (!c.includes('<UpgradeModal')) {
    c = c.replace(
      '  return (',
      `  return (\n    <>\n      {upgradeModule && (\n        <UpgradeModal\n          module={upgradeModule}\n          limitMessage={upgradeMessage}\n          onClose={() => { setUpgradeModule(null); setUpgradeMessage(''); }}\n        />\n      )}`
    );

    // Close fragment before export
    const exportMatch = `export default ${file.split('/').pop().replace('.jsx', '')};`;
    c = c.replace(
      /(\s*\);\s*\n)(export default)/,
      '\n    </>\n  );\n\nexport default'
    );
  }

  fs.writeFileSync(file, c, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All done!');
