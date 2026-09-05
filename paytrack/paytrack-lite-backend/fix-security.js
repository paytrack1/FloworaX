const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

// Fix 1 - Remove old Vercel URLs from CORS
c = c.replace("    'https://paytracklite.vercel.app',\n", '');
c = c.replace("    'https://flowora.vercel.app',\n", '');

// Fix 2 - Add verifiedUsers to admin metrics
c = c.replace(
  "const premiumUsers = users.filter(u => u.plan !== 'free' && u.plan !== 'basic').length;",
  "const premiumUsers = users.filter(u => u.plan !== 'free' && u.plan !== 'basic').length;\n    const verifiedUsers = users.filter(u => u.emailVerified).length;"
);
c = c.replace(
  '        premiumUsers,',
  '        premiumUsers,\n        verifiedUsers,'
);

// Fix 3 - Input length limits
c = c.replace(
  'if (businessName !== undefined) user.businessName = businessName.trim();',
  'if (businessName !== undefined) user.businessName = businessName.trim().slice(0, 100);'
);
c = c.replace(
  'if (phone)                      user.phone        = phone.trim();',
  'if (phone)                      user.phone        = phone.trim().slice(0, 20);'
);
c = c.replace(
  'if (address)                    user.address      = address.trim();',
  'if (address)                    user.address      = address.trim().slice(0, 300);'
);

// Fix 4 - Validate profileImage is a URL
c = c.replace(
  'if (profileImage)               user.profileImage = profileImage;',
  "if (profileImage && (profileImage.startsWith('http://') || profileImage.startsWith('https://'))) user.profileImage = profileImage.slice(0, 500);"
);

fs.writeFileSync('index.js', c, 'utf8');
console.log('All security fixes applied!');
