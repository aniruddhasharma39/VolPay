const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `onclick="if(!this.classList.contains('disabled')) switchView('builder')"`;
const replacement = `onclick="if(!this.classList.contains('disabled')) { window.appBuilderManager.startNewReport('core'); switchView('builder'); }"`;

html = html.replace(target, replacement);

fs.writeFileSync('index.html', html);
console.log('Fixed index.html sidebar link');
