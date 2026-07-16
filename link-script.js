const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('CoreReportSelector.js')) {
    html = html.replace('<script src="js/Managers.js"></script>', '<script src="js/CoreReportSelector.js"></script>\n    <script src="js/Managers.js"></script>');
    fs.writeFileSync('index.html', html);
    console.log('CoreReportSelector.js linked in index.html');
}
