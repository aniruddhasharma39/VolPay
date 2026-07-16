const fs = require('fs');

// 1. UPDATE index.html
let html = fs.readFileSync('index.html', 'utf8');

// Change sidebar Report Builder default to template
html = html.replace(
    /onclick="if\(\!this\.classList\.contains\('disabled'\)\) { window\.appBuilderManager\.startNewReport\('core'\); switchView\('builder'\); }"/g,
    `onclick="if(!this.classList.contains('disabled')) { window.appBuilderManager.startNewReport('template'); switchView('builder'); }"`
);

// We need to find the core-2pane-container and replace it with core-wizard-container
const core2PaneRegex = /<div id="core-2pane-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const coreWizardHtml = `
<div id="core-wizard-container" style="display: none; height: calc(100vh - 160px); display: flex; margin-top: -16px;">
    <!-- Wizard Sidebar -->
    <div style="width: 240px; background: #fff; border-right: 1px solid var(--border-color); flex-shrink: 0; display: flex; flex-direction: column;">
        <div style="padding: 24px; font-weight: 600; border-bottom: 1px solid var(--border-color); background: var(--bg-panel);">Core Report Steps</div>
        <ul id="core-wizard-nav" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column;">
            <li class="wizard-step active" data-step="1" onclick="window.appBuilderManager.setCoreWizardStep(1)">Select Fields</li>
            <li class="wizard-step" data-step="3" onclick="window.appBuilderManager.setCoreWizardStep(3)">Filters</li>
            <li class="wizard-step" data-step="4" onclick="window.appBuilderManager.setCoreWizardStep(4)">Conditions</li>
            <li class="wizard-step" data-step="5" onclick="window.appBuilderManager.setCoreWizardStep(5)">Grouping & Sorting</li>
            <li class="wizard-step" data-step="6" onclick="window.appBuilderManager.setCoreWizardStep(6)">Preview</li>
        </ul>
    </div>
    
    <!-- Wizard Main Content Area -->
    <div id="core-wizard-content" style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; background: var(--bg-workspace);">
        <div id="core-step-1-content" style="display: flex; height: 100%; gap: 16px; padding: 24px; box-sizing: border-box;">
            <!-- Left Pane: DBs -->
            <div style="width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
                <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-panel);">
                    <h3 style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 600;">Data Sources</h3>
                </div>
                <div style="flex-grow: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column;">
                    <div id="core-databases-container" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px;"></div>
                    <button class="btn btn-secondary" id="btn-add-database" style="width: 100%; border-style: dashed; flex-shrink: 0;" onclick="window.appCoreReportSelector.addDatabase()">
                        <i data-lucide="plus"></i> Add Database
                    </button>
                </div>
            </div>
            
            <!-- Right Pane: Selected Fields -->
            <div style="flex-grow: 1; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
                <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-panel); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div style="font-weight: 600;">Selected Fields (<span id="core-db-selected-count">0</span>)</div>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.appCoreReportSelector.clearAllFields()">Clear All</button>
                </div>
                <div id="core-arrange-list" style="flex-grow: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 16px;" id="core-db-empty-msg">No fields selected yet.</div>
                </div>
            </div>
        </div>
        
        <div id="core-step-dynamic-content" style="display: none; height: 100%; overflow-y: auto; padding: 24px;"></div>
    </div>
</div>
`;
html = html.replace(core2PaneRegex, coreWizardHtml);
fs.writeFileSync('index.html', html);


// 2. UPDATE style.css
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.wizard-step')) {
    css += `\n
/* Core Report Wizard Styles */
.wizard-step {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    transition: all 0.2s;
}
.wizard-step:hover {
    background: #f8fafc;
}
.wizard-step.active {
    background: #eff6ff;
    color: var(--primary);
    border-left: 3px solid var(--primary);
    font-weight: 600;
}
`;
    fs.writeFileSync('style.css', css);
}

// 3. UPDATE CoreReportSelector.js
let coreJs = fs.readFileSync('js/CoreReportSelector.js', 'utf8');
// Change badge from "${selectedCount} selected" to just "${selectedCount}"
coreJs = coreJs.replace(/\$\{selectedCount\} selected/g, '${selectedCount}');

fs.writeFileSync('js/CoreReportSelector.js', coreJs);


console.log('Script completed phase 1 (HTML, CSS, CoreReportSelector)');
