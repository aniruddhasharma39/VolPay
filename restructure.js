const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace Summary Panel
const summaryRegex = /<aside class="summary-panel" id="summary-panel">[\s\S]*?<\/aside>/;
html = html.replace(summaryRegex, '');

// Replace Action Bar
const actionBarRegex = /<!-- Action Bar -->[\s\S]*?<\/div>/;
const unifiedBar = `<!-- Unified Bottom Bar -->
                <div class="action-bar" id="unified-bottom-bar" style="display: flex; justify-content: space-between; padding: 0 32px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border-top: 1px solid var(--border-color);">
                    <div style="display: flex; gap: 24px; align-items: center;">
                        <div class="summary-stat" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            <span class="stat-label" style="font-size: 0.7rem; text-transform: uppercase;">Dataset</span>
                            <span class="stat-value" style="color: var(--primary); font-size: 0.875rem;">Payment Hub</span>
                        </div>
                        <div class="summary-stat" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            <span class="stat-label" style="font-size: 0.7rem; text-transform: uppercase;">Fields</span>
                            <span class="stat-value" id="summary-fields-count" style="font-size: 0.875rem;">0</span>
                        </div>
                        <div class="summary-stat" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            <span class="stat-label" style="font-size: 0.7rem; text-transform: uppercase;">Filters</span>
                            <span class="stat-value" id="summary-filters-count" style="font-size: 0.875rem;">0</span>
                        </div>
                        <div class="summary-stat" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            <span class="stat-label" style="font-size: 0.7rem; text-transform: uppercase;">Est. Output</span>
                            <span class="stat-value" style="font-size: 0.875rem;">~1.2M Rows</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn btn-secondary">Reset</button>
                        <button class="btn btn-secondary" id="btn-save-report">Save</button>
                        <button class="btn btn-secondary" id="btn-preview-data"><i data-lucide="play"></i> Preview Data</button>
                        <button class="btn btn-primary" id="btn-generate-report"><i data-lucide="check-circle"></i> Generate Report</button>
                    </div>
                </div>`;
html = html.replace(actionBarRegex, unifiedBar);

// Re-write stage-1-core-db as 2-pane layout
const coreDbRegex = /<div id="stage-1-core-db" style="display: none;">[\s\S]*?<\/div>\s*<div id="stage-1-datasets" style="display: block;">/;
const newCoreDb = `<div id="core-2pane-container" style="display: none; height: calc(100vh - 220px); display: flex; gap: 24px; padding: 0 32px; overflow: hidden; margin-top: 16px;">
    <!-- Left Pane: DBs -->
    <div id="core-left-pane" style="width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-panel);">
            <h3 style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 600;">Data Sources</h3>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.75rem;">Select tables and fields</p>
        </div>
        <div style="flex-grow: 1; overflow-y: auto; padding: 16px;">
            <div id="core-databases-container" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px;"></div>
            <button class="btn btn-secondary" id="btn-add-database" style="width: 100%; border-style: dashed;" onclick="window.appCoreReportSelector.addDatabase()">
                <i data-lucide="plus"></i> Add Database
            </button>
        </div>
    </div>
    
    <!-- Right Pane: Selected Fields & Operations -->
    <div id="core-right-pane" style="flex-grow: 1; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); overflow-y: auto;">
        <!-- The Selected Fields Box -->
        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-panel); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
            <div style="font-weight: 600;">Selected Fields (<span id="core-db-selected-count">0</span>)</div>
            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.appCoreReportSelector.clearAllFields()">Clear All</button>
        </div>
        <div id="core-arrange-list" style="padding: 16px; display: flex; flex-direction: column; gap: 8px; min-height: 100px;">
            <div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 16px;" id="core-db-empty-msg">No fields selected yet.</div>
        </div>
        
        <!-- Operations container will be injected here dynamically -->
        <div id="core-operations-container"></div>
    </div>
</div>
                            <div id="stage-1-datasets" style="display: block;">`;
html = html.replace(coreDbRegex, newCoreDb);

fs.writeFileSync('index.html', html);
console.log('HTML restructured successfully.');
