const fs = require('fs');
let html = fs.readFileSync('c:/Users/PC/Desktop/Volant/index.html', 'utf8');

// Add CDN for jspdf and mockReports
html = html.replace('<script src=\"js/mockDbData.js\"></script>', '<script src=\"js/mockDbData.js\"></script>\n    <script src=\"js/reports.data.js\"></script>\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js\"></script>');

// Update current user dropdown
html = html.replace(/<select id=\"user-role-selector\"[\\s\\S]*?<\\/select>/, `<select id=\"current-user-selector\" onchange=\"window.appBuilderManager.setCurrentUser(this.value)\"
                    style=\"padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #fff; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #334155;\">
                    <option value=\"Rahul Mehta\">Rahul Mehta</option>
                    <option value=\"Ananya Sharma\">Ananya Sharma</option>
                    <option value=\"Michael Carter\">Michael Carter</option>
                    <option value=\"Emma Wilson\">Emma Wilson</option>
                    <option value=\"David Johnson\">David Johnson</option>
                </select>`);

// Remove import button
html = html.replace('<button class=\"btn btn-secondary\"><i data-lucide=\"download\"></i> Import Definition</button>', '');

// Update user profile
html = html.replace('<div class=\"avatar\">JS</div>', '<div class=\"avatar\" id=\"current-user-avatar\">RM</div>');
html = html.replace('<div style=\"font-size: 0.875rem; font-weight: 600;\">John Smith</div>', '<div style=\"font-size: 0.875rem; font-weight: 600;\" id=\"current-user-name\">Rahul Mehta</div>');
html = html.replace('<div style=\"font-size: 0.75rem; color: #94a3b8;\" id=\"current-user-role-text\">Payment Ops</div>', '<div style=\"font-size: 0.75rem; color: #94a3b8;\" id=\"current-user-role-text\">Report Author</div>');

// Remove static core reports section
html = html.replace(/<!-- Core Reports Section -->[\\s\\S]*?<!-- User-created Core Reports appear here dynamically -->/, '<!-- User-created Core Reports appear here dynamically -->');
html = html.replace(/<!-- Template Reports Section -->[\\s\\S]*?<\\/div>\\s*<\\/div>\\s*<div id=\"view-centre\"/, '</div></div><div id=\"view-centre\"');

// Re-write catalogue grid sections to have Public and Private
const publicPrivateTabs = `
<!-- Catalogue Filters -->
<div style=\"display: flex; gap: 12px; align-items: center; margin-bottom: 32px; flex-wrap: wrap;\">
    <div class=\"search-box\" style=\"flex-shrink: 0;\">
        <i data-lucide=\"search\"></i>
        <input type=\"text\" id=\"catalogue-search\" placeholder=\"Search by Name or ID...\" onkeyup=\"window.appBuilderManager.renderCatalogue()\">
    </div>
    <select id=\"catalogue-filter-rail\" class=\"form-control\" onchange=\"window.appBuilderManager.renderCatalogue()\" style=\"padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 140px;\">
        <option value=\"\">All Rails</option>
        <option value=\"FedNow\">FedNow</option>
        <option value=\"Fedwire\">Fedwire</option>
        <option value=\"ACH\">ACH</option>
        <option value=\"SEPA SCT\">SEPA SCT</option>
        <option value=\"SCT Inst\">SCT Inst</option>
        <option value=\"SDD Core\">SDD Core</option>
        <option value=\"System\">System</option>
    </select>
    <select id=\"catalogue-filter-category\" class=\"form-control\" onchange=\"window.appBuilderManager.renderCatalogue()\" style=\"padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 140px;\">
        <option value=\"\">All Categories</option>
        <option value=\"Payment Transactions\">Payment Transactions</option>
        <option value=\"Exceptions\">Exceptions</option>
        <option value=\"Users\">Users</option>
        <option value=\"Entitlements\">Entitlements</option>
    </select>
    <select id=\"catalogue-filter-region\" class=\"form-control\" onchange=\"window.appBuilderManager.renderCatalogue()\" style=\"padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 140px;\">
        <option value=\"\">All Regions</option>
        <option value=\"US\">US</option>
        <option value=\"Europe\">Europe</option>
        <option value=\"Global\">Global</option>
    </select>
    <select id=\"catalogue-filter-frequency\" class=\"form-control\" onchange=\"window.appBuilderManager.renderCatalogue()\" style=\"padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 140px;\">
        <option value=\"\">All Frequencies</option>
        <option value=\"Daily\">Daily</option>
        <option value=\"Weekly\">Weekly</option>
        <option value=\"Monthly\">Monthly</option>
        <option value=\"Quarterly\">Quarterly</option>
        <option value=\"Hourly\">Hourly</option>
        <option value=\"Ad Hoc\">Ad Hoc</option>
    </select>
    <select id=\"catalogue-filter-author\" class=\"form-control\" onchange=\"window.appBuilderManager.renderCatalogue()\" style=\"padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 140px;\">
        <option value=\"\">All Authors</option>
        <option value=\"Rahul Mehta\">Rahul Mehta</option>
        <option value=\"Ananya Sharma\">Ananya Sharma</option>
        <option value=\"Michael Carter\">Michael Carter</option>
        <option value=\"Emma Wilson\">Emma Wilson</option>
        <option value=\"David Johnson\">David Johnson</option>
    </select>
    <div style=\"flex-grow: 1;\"></div>
    <button class=\"btn btn-primary\" style=\"flex-shrink:0;\" onclick=\"window.appBuilderManager.startNewReport('core'); typeof switchView === 'function' ? switchView('builder') : null;\"><i data-lucide=\"plus\"></i> Create New Report</button>
</div>

<!-- Tabs -->
<div class=\"tabs\" style=\"display:flex; gap: 24px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;\">
    <div class=\"tab active\" id=\"tab-public\" style=\"cursor:pointer; font-weight: 600; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 4px;\" onclick=\"window.appBuilderManager.switchCatalogueTab('public')\">Public Reports</div>
    <div class=\"tab\" id=\"tab-private\" style=\"cursor:pointer; font-weight: 500; color: var(--text-muted); padding-bottom: 4px;\" onclick=\"window.appBuilderManager.switchCatalogueTab('private')\">My Private Reports</div>
</div>

<div class=\"report-grid\" id=\"catalogue-reports-grid\" style=\"margin-bottom:40px;\"></div>
`;

html = html.replace(/<div style=\"display: flex; gap: 12px; align-items: center; margin-bottom: 32px; flex-wrap: nowrap;\">[\s\S]*?<div class=\"report-grid\" id=\"catalogue-core-dynamic\" style=\"margin-bottom:40px;\"><\/div>/, publicPrivateTabs);

// We need to add step 7 UI to the wizard
const schedulingStep = `
<!-- Step 7: Scheduling (Core) -->
<div id=\"step-7-content\" class=\"wizard-step-content\" style=\"display: none; padding: 24px; overflow-y: auto; height: 100%;\">
    <h3 style=\"margin-top:0; margin-bottom: 8px;\">Scheduling & Delivery</h3>
    <p style=\"color: var(--text-muted); font-size: 0.875rem; margin-bottom: 24px;\">Configure when and how this report should be delivered.</p>
    
    <div style=\"display: flex; flex-direction: column; gap: 20px; max-width: 600px;\">
        <div class=\"form-group\">
            <label class=\"form-label\">Report Type</label>
            <select class=\"form-control\" id=\"schedule-type\" onchange=\"window.appBuilderManager.updateScheduleState('type', this.value)\">
                <option value=\"Ad Hoc\">Ad Hoc</option>
                <option value=\"Scheduled\">Scheduled</option>
            </select>
        </div>
        
        <div id=\"schedule-config\" style=\"display: none; flex-direction: column; gap: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;\">
            <div class=\"form-group\">
                <label class=\"form-label\">Frequency</label>
                <select class=\"form-control\" id=\"schedule-frequency\" onchange=\"window.appBuilderManager.updateScheduleState('frequency', this.value)\">
                    <option value=\"Daily\">Daily</option>
                    <option value=\"Weekly\">Weekly</option>
                    <option value=\"Monthly\">Monthly</option>
                    <option value=\"Quarterly\">Quarterly</option>
                    <option value=\"Yearly\">Yearly</option>
                    <option value=\"Custom\" disabled>Custom (coming soon)</option>
                </select>
            </div>
            
            <div style=\"display: flex; gap: 16px;\">
                <div class=\"form-group\" style=\"flex: 1;\">
                    <label class=\"form-label\">Start Date</label>
                    <input type=\"date\" class=\"form-control\" id=\"schedule-start\" onchange=\"window.appBuilderManager.updateScheduleState('startDate', this.value)\">
                </div>
                <div class=\"form-group\" style=\"flex: 1;\">
                    <label class=\"form-label\">End Date (Optional)</label>
                    <input type=\"date\" class=\"form-control\" id=\"schedule-end\" onchange=\"window.appBuilderManager.updateScheduleState('endDate', this.value)\">
                </div>
            </div>
            
            <div style=\"display: flex; gap: 16px;\">
                <div class=\"form-group\" style=\"flex: 1;\">
                    <label class=\"form-label\">Run Time</label>
                    <input type=\"time\" class=\"form-control\" id=\"schedule-time\" onchange=\"window.appBuilderManager.updateScheduleState('runTime', this.value)\">
                </div>
                <div class=\"form-group\" style=\"flex: 1;\">
                    <label class=\"form-label\">Timezone</label>
                    <select class=\"form-control\" id=\"schedule-timezone\" onchange=\"window.appBuilderManager.updateScheduleState('timezone', this.value)\">
                        <option value=\"UTC\">UTC</option>
                        <option value=\"EST\">EST</option>
                        <option value=\"CET\">CET</option>
                        <option value=\"IST\">IST</option>
                    </select>
                </div>
            </div>
        </div>

        <div class=\"form-group\">
            <label class=\"form-label\">Output Format</label>
            <select class=\"form-control\" id=\"schedule-format\" onchange=\"window.appBuilderManager.updateScheduleState('format', this.value)\">
                <option value=\"PDF\">PDF Only</option>
            </select>
        </div>
        
        <div class=\"form-group\">
            <label class=\"form-label\">Delivery Method</label>
            <select class=\"form-control\" id=\"schedule-delivery\" onchange=\"window.appBuilderManager.updateScheduleState('delivery', this.value)\">
                <option value=\"Download\">Download</option>
                <option value=\"Save to Report Center\">Save to Report Center</option>
                <option value=\"Email\" disabled>Email (coming soon)</option>
                <option value=\"SFTP\" disabled>SFTP (coming soon)</option>
                <option value=\"API\" disabled>API (coming soon)</option>
            </select>
        </div>
        
        <div class=\"form-group\">
            <label class=\"form-label\">Retention</label>
            <select class=\"form-control\" id=\"schedule-retention\" onchange=\"window.appBuilderManager.updateScheduleState('retention', this.value)\">
                <option value=\"30 days\">30 days</option>
                <option value=\"60 days\">60 days</option>
                <option value=\"90 days\">90 days</option>
                <option value=\"Forever\">Forever</option>
            </select>
        </div>
        
        <div style=\"padding: 16px; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; border-radius: 8px; font-weight: 500; font-size: 0.875rem;\">
            <i data-lucide=\"info\" style=\"width: 16px; margin-right: 8px; vertical-align: middle;\"></i>
            <span id=\"schedule-summary\">Ad Hoc generation on demand.</span>
        </div>
    </div>
</div>
`;

html = html.replace('<!-- Step 7: Preview (Final) -->', schedulingStep + '\n\n                        <!-- Step 8: Preview (Final) -->');

// Also update the sidebar steps
html = html.replace('<li class=\"wizard-step\" data-mode=\"core\" data-step=\"7\" onclick=\"window.appBuilderManager.setWizardStep(\\\'core\\\', 7)\">Preview</li>', '<li class=\"wizard-step\" data-mode=\"core\" data-step=\"7\" onclick=\"window.appBuilderManager.setWizardStep(\\\'core\\\', 7)\">Scheduling</li>\n                                <li class=\"wizard-step\" data-mode=\"core\" data-step=\"8\" onclick=\"window.appBuilderManager.setWizardStep(\\\'core\\\', 8)\">Preview</li>');
html = html.replace(/<li class=\"wizard-step\" data-mode=\"template\".*?>Preview<\/li>/, ''); // we delete template anyway

// Replace step-7-content id to step-8-content for final preview
html = html.replace(/<div id=\"step-7-content\" class=\"wizard-step-content\"([\s\S]*?<h2.*?Final Report Preview)/, '<div id=\"step-8-content\" class=\"wizard-step-content\"$1');

// Update preview data button
html = html.replace('window.appBuilderManager.setWizardStep(window.appState.get().currentBuilder.mode, 7)', 'window.appBuilderManager.setWizardStep(window.appState.get().currentBuilder.mode, 8)');

// Remove clone report card from landing page
html = html.replace(/<a href=\"#\" class=\"nav-item sub-item\" id=\"nav-template-report\"[\s\S]*?<\/a>/, '');
// Remove template report section from sidebar
html = html.replace(/<!-- Template Report Section -->[\s\S]*?<!-- Wizard Main Content Area -->/, '<!-- Wizard Main Content Area -->');
// Remove step 0 and step 2
html = html.replace(/<!-- Step 0: Choose Core Report \(Template only\) -->[\s\S]*?<!-- Step 1: Core DB Fields \(Core only\) -->/, '<!-- Step 1: Core DB Fields (Core only) -->');
html = html.replace(/<!-- Step 2: Template Fields Selection \(Template only\) -->[\s\S]*?<!-- Step 3: Filters \(Shared\) -->/, '<!-- Step 3: Filters (Shared) -->');

// Also need to set the padding bottom on the preview scroll container.
html = html.replace(/<div id=\"preview-container\">/, '<div id=\"preview-container\" style=\"padding-bottom: 60px;\">');

fs.writeFileSync('c:/Users/PC/Desktop/Volant/index.html', html);
console.log('done');
