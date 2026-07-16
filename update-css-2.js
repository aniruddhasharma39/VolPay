const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

const additionalCss = `
/* DB Accordion Styles */
.table-accordion-header:hover { background: #f8fafc !important; }
.db-field-pill { padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 16px; font-size: 0.75rem; font-weight: 500; background: var(--bg-workspace); transition: all 0.2s; }
.db-field-pill:hover:not(.selected) { background: #f1f5f9; border-color: #cbd5e1; }
`;

fs.appendFileSync('style.css', '\n' + additionalCss);
console.log('Appended to style.css');
