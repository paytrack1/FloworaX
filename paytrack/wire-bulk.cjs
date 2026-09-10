const fs = require('fs');

// Add import to App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');
if (!app.includes('BulkOffering')) {
  app = app.replace(
    "import BusinessTypeOnboarding from './pages/BusinessTypeOnboarding';",
    "import BusinessTypeOnboarding from './pages/BusinessTypeOnboarding';\nimport BulkOffering from './pages/BulkOffering';"
  );
  fs.writeFileSync('src/App.jsx', app, 'utf8');
  console.log('Added BulkOffering import to App.jsx');
} else {
  console.log('BulkOffering already imported');
}

// Add bulk offering button to Home.jsx dashboard
let home = fs.readFileSync('src/pages/Home.jsx', 'utf8');
if (!home.includes('BulkOffering') && !home.includes('bulkOffering')) {
  home = home.replace(
    "import { useStore } from '../store/useStore';",
    "import { useStore } from '../store/useStore';\nimport { useState } from 'react';\nimport BulkOffering from './BulkOffering';"
  );
  home = home.replace(
    "const Home = () => {",
    "const Home = () => {\n  const [showBulk, setShowBulk] = useState(false);\n  if (showBulk) return <BulkOffering onBack={() => setShowBulk(false)} />;"
  );
  // Add button after welcome section
  home = home.replace(
    '<div className="px-6 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">',
    `{/* Bulk Offering Button - visible for Church business type */}
      {user?.businessType?.toLowerCase() === 'church' && (
        <div className="px-6 mt-4">
          <button
            onClick={() => setShowBulk(true)}
            className="w-full bg-[#185FA5] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <span className="text-xl">🙏</span> Bulk Offering Entry
          </button>
        </div>
      )}
      <div className="px-6 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">`
  );
  fs.writeFileSync('src/pages/Home.jsx', home, 'utf8');
  console.log('Added BulkOffering button to Home.jsx');
} else {
  console.log('BulkOffering already in Home.jsx');
}

console.log('All done!');
