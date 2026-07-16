const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

const additionalCss = `
/* DB Tree Styles */
.db-category { margin-bottom: 8px; }
.db-category-header { display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; border-radius: 4px; font-weight: 500; font-size: 0.875rem; }
.db-category-header:hover { background: var(--bg-workspace); }
.db-table { margin-left: 24px; margin-bottom: 4px; }
.db-table-header { display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 0.875rem; color: var(--text-color); }
.db-table-header:hover { background: var(--bg-workspace); }
.db-fields { margin-left: 24px; border-left: 1px solid var(--border-color); padding-left: 12px; margin-top: 4px; }
.db-field-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 0.8125rem; color: var(--text-muted); cursor: pointer; border-radius: 4px; }
.db-field-item:hover { background: var(--bg-workspace); color: var(--text-color); }
.db-field-item.selected { background: #eff6ff; color: #2563eb; font-weight: 500; }
.db-field-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-workspace); border: 1px solid var(--border-color); border-radius: 16px; font-size: 0.75rem; font-weight: 500; }
.db-field-pill .remove-pill { cursor: pointer; color: var(--text-muted); }
.db-field-pill .remove-pill:hover { color: var(--danger); }
.arrange-item { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-panel); gap: 12px; }
.arrange-item:last-child { border-bottom: none; }
.arrange-handle { cursor: grab; color: var(--text-muted); }
.arrange-handle:active { cursor: grabbing; }
`;

fs.appendFileSync('style.css', '\n' + additionalCss);
console.log('Appended to style.css');
