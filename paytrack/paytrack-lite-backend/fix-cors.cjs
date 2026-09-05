const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
c = c.replace(
  "    'https://floworax.pxxl.run',",
  "    'https://floworax.pxxl.run',\n    'https://floworax.vercel.app',"
);
fs.writeFileSync('index.js', c, 'utf8');
console.log('done');
