const fs = require('fs');
let c = fs.readFileSync('src/redesign.js', 'utf8');
c = c.replace(/lf_/g, 'fz_');
fs.writeFileSync('src/redesign.js', c);
