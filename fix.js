const fs = require('fs');
let data = fs.readFileSync('js/reports.data.js', 'utf8');
data = data.replace(/visibility:\s*['"]private['"]/g, "visibility: 'public'");
fs.writeFileSync('js/reports.data.js', data);
console.log('Fixed reports.data.js');
