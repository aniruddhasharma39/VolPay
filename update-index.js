const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The section to replace starts at <div id="stage-1-core-db" and ends before <div id="stage-1-datasets"
const startCoreDB = html.indexOf('<div id="stage-1-core-db"');
const endCoreDB = html.indexOf('<div id="stage-1-datasets"');

if (startCoreDB !== -1 && endCoreDB !== -1) {
    const newCoreDBHtml = `
                            <div id="stage-1-core-db" style="display: none;">
                                <div style="margin-bottom: 24px;">
                                    <h3 style="margin: 0 0 8px 0; font-size: 1.125rem; font-weight: 600;">Data Sources</h3>
                                    <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">Select databases and tables from the Payment Hub to add fields to your report.</p>
                                </div>
                                
                                <div id="core-databases-container" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
                                    <!-- Dynamic DB Sections will be injected here -->
                                </div>
                                
                                <button class="btn btn-secondary" id="btn-add-database" style="margin-bottom: 32px; width: 100%; border-style: dashed;" onclick="window.appCoreReportSelector.addDatabase()">
                                    <i data-lucide="plus"></i> Add Database
                                </button>
                                
                                <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel);">
                                    <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-workspace); display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                        <div style="font-weight: 600;">Selected Fields (<span id="core-db-selected-count">0</span>)</div>
                                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.appCoreReportSelector.clearAllFields()">Clear All</button>
                                    </div>
                                    <div id="core-arrange-list" style="padding: 16px; display: flex; flex-direction: column; gap: 8px; min-height: 100px;">
                                        <div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 16px;" id="core-db-empty-msg">No fields selected yet.</div>
                                    </div>
                                </div>
                            </div>
`;
    html = html.substring(0, startCoreDB) + newCoreDBHtml + html.substring(endCoreDB);
}

const startCoreArrange = html.indexOf('<div id="stage-2-core-arrange"');
const endCoreArrange = html.indexOf('<div class="field-explorer" id="stage-2-field-explorer">');

if (startCoreArrange !== -1 && endCoreArrange !== -1) {
    html = html.substring(0, startCoreArrange) + html.substring(endCoreArrange);
}

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully.');
