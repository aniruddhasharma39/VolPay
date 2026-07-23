// Builder and Report Managers


const ENTERPRISE_DB = {
    core_banking: [
        { name: 'Customer Management', tables: [{ name: 'CUSTOMER_MASTER', fields: ['CUSTOMER_ID', 'FIRST_NAME', 'LAST_NAME', 'DOB', 'KYC_STATUS'] }, { name: 'CUSTOMER_ADDRESS', fields: ['ADDRESS_ID', 'CUSTOMER_ID', 'CITY', 'COUNTRY'] }, { name: 'CUSTOMER_RISK_PROFILE', fields: ['CUSTOMER_ID', 'RISK_SCORE', 'AML_STATUS'] }] },
        { name: 'Account Management', tables: [{ name: 'ACCOUNT_MASTER', fields: ['ACCOUNT_ID', 'CUSTOMER_ID', 'ACCOUNT_TYPE', 'CURRENCY'] }, { name: 'ACCOUNT_BALANCE', fields: ['ACCOUNT_ID', 'AVAILABLE_BALANCE', 'LEDGER_BALANCE'] }, { name: 'ACCOUNT_STATUS_HISTORY', fields: ['ACCOUNT_ID', 'STATUS', 'TIMESTAMP'] }] },
        { name: 'Transaction Processing', tables: [{ name: 'ACCOUNT_TRANSACTION', fields: ['TRX_ID', 'ACCOUNT_ID', 'AMOUNT', 'DR_CR', 'TIMESTAMP'] }, { name: 'TRANSACTION_CHARGE', fields: ['TRX_ID', 'FEE_AMOUNT', 'TAX_AMOUNT'] }] },
        { name: 'General Ledger', tables: [{ name: 'GL_MASTER', fields: ['GL_CODE', 'DESCRIPTION', 'CATEGORY'] }, { name: 'GL_TRANSACTION', fields: ['GL_CODE', 'AMOUNT', 'POSTING_DATE'] }] }
    ],
    payment_engine: [
        { name: 'Payment Instructions', tables: [{ name: 'PAYMENT_MESSAGE', fields: ['MESSAGE_ID', 'SENDER_BIC', 'RECEIVER_BIC', 'AMOUNT', 'CURRENCY'] }, { name: 'PAYMENT_QUEUE', fields: ['MESSAGE_ID', 'QUEUE_NAME', 'PRIORITY'] }] },
        { name: 'Payment Processing', tables: [{ name: 'PAYMENT_TRANSACTION', fields: ['TRX_ID', 'MESSAGE_ID', 'EXECUTION_DATE', 'STATUS'] }, { name: 'PAYMENT_EVENT', fields: ['TRX_ID', 'EVENT_TYPE', 'TIMESTAMP'] }] },
        { name: 'Exceptions & Repairs', tables: [{ name: 'EXCEPTION_CASE', fields: ['CASE_ID', 'MESSAGE_ID', 'ERROR_CODE', 'SEVERITY'] }, { name: 'REPAIR_QUEUE', fields: ['CASE_ID', 'ASSIGNED_TO', 'STATUS'] }] },
        { name: 'Compliance', tables: [{ name: 'SANCTION_SCREENING', fields: ['MESSAGE_ID', 'MATCH_SCORE', 'RESULT'] }, { name: 'AML_ALERT', fields: ['ALERT_ID', 'MESSAGE_ID', 'RISK_LEVEL'] }] }
    ]
};

class BuilderManager {
    constructor() {
        this.currentCategory = 'All Fields';
        this.searchQuery = '';
        
        this.availableFields = window.VOLPAY_AVAILABLE_FIELDS || [];
    }

    init() {
        // Subscribe to state changes
        window.appState.subscribe(state => this.updateUI(state));
        this.bindEvents();
        this.renderFieldsList();
        if (window.appCoreReportSelector) window.appCoreReportSelector.init();
        
        // Ensure builder mode state defaults
        if(!window.appState.get().currentBuilder.mode) {
            window.appState.update(s => ({
                ...s,
                currentBuilder: { ...s.currentBuilder, mode: 'core' }
            }));
        }
    }

            startNewReport(mode, baseReportName = null) {
        window.appHistory.pushState();
        
        if (mode === 'template' && !baseReportName) {
            // Clear available fields so we don't show core fields
            this.availableFields = [];
            this.renderFieldsList();
        } else if (mode === 'core') {
            // Re-populate original mock available fields just in case it was overwritten (if needed, but core mode uses CoreReportSelector)
        }

        window.appState.update(s => ({
            ...s,
            currentBuilder: {
                dataset: baseReportName || null,
                fields: [],
                pinnedFields: [],
                filters: {},
                conditions: [],
                sorts: [],
                groups: [],
                summaries: [],
                calculatedColumns: [],
                mode: mode,
                wizardStep: mode === 'core' ? 1 : 0
            }
        }));
        
        const nameInput = document.getElementById('report-name-input');
        if(nameInput) nameInput.value = '';
        
        if (typeof switchView === 'function') switchView('builder');
        
        if (mode === 'template' && baseReportName) {
            this.setDataset(baseReportName);
        }
        
        this.renderWizardUI(mode, mode === 'core' ? 1 : 0);
    }

    editReport(reportId, isClone = false) {
        const state = window.appState.get();
        const baseReports = (window.mockReports || []).concat(state.catalogue || []);
        const report = baseReports.find(r => r.id === reportId);
        if (!report) {
            window.appToast.show('Report not found.', 'warning');
            return;
        }

        window.appHistory.pushState();

        let fields = [];
        if (report.config && report.config.fields && report.config.fields.length > 0) {
            fields = report.config.fields;
        } else if (report.selectedFields && Array.isArray(report.selectedFields)) {
            fields = report.selectedFields.map(f => {
                if (typeof f === 'object') return f;
                
                let foundDb = 'Volpay_Payment_Engine';
                let foundTable = 'AckTrace';
                let foundType = 'string';
                
                if (window.VOLPAY_DB_SCHEMA) {
                    let found = false;
                    for (const db in window.VOLPAY_DB_SCHEMA) {
                        for (const tb of window.VOLPAY_DB_SCHEMA[db]) {
                            if (tb.fields.includes(f)) {
                                foundDb = db;
                                foundTable = tb.name;
                                const ln = f.toLowerCase();
                                if (/date|dob|timestamp|open_date|onboarding|value_date|business_date|as_of_date|cutoff_time/.test(ln)) foundType = 'date';
                                else if (/amount|amt|balance|bal|fee|tax|charge|rate|score|risk|priority|age|settlement_amt|ledger_bal|avail_bal|match_score/.test(ln)) foundType = 'number';
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                }
                
                return {
                    id: `${foundDb}.${foundTable}.${f}`,
                    name: f,
                    tableName: foundTable,
                    dbName: foundDb,
                    category: foundTable,
                    label: f,
                    type: foundType,
                    format: 'Text'
                };
            });
        }

        let parsedFields = fields;
        const mode = report.type || 'core';

        const config = report.config || {
            dataset: report.dataset || null,
            fields: isClone ? [] : fields,
            filters: isClone ? {} : (report.filters || {}),
            conditions: isClone ? [] : (report.conditions || []),
            sorts: isClone ? [] : (report.sorts || []),
            groups: isClone ? [] : (report.groups || []),
            summaries: isClone ? [] : (report.summaries || []),
            calculatedColumns: isClone ? [] : (report.calculatedColumns || [])
        };

        window.appState.update(s => ({
            ...s,
            currentBuilder: {
                ...config,
                pinnedFields: s.currentBuilder.pinnedFields || [],
                mode: mode,
                wizardStep: mode === 'core' ? 1 : 0,
                editingId: isClone ? null : report.id,
                cloneAvailableFields: isClone ? parsedFields : null
            }
        }));

        const nameInput = document.getElementById('report-name-input');
        if (nameInput) nameInput.value = isClone ? `Copy of ${report.name || report.reportName}` : (report.name || report.reportName);

        if (typeof switchView === 'function') switchView('builder');
        
        // Also populate active databases in core selector based on parsedFields (only if not clone)
        if (mode === 'core' && window.appCoreReportSelector) {
            if (!isClone) {
                const uniqueDbs = [...new Set(parsedFields.map(f => f.dbName).filter(Boolean))];
                if (uniqueDbs.length > 0) {
                    window.appCoreReportSelector.activeDatabaseSections = uniqueDbs.map(db => ({ dbName: db, instanceId: 'db_sect_' + Math.random().toString(36).substr(2, 9) }));
                }
            }
            window.appCoreReportSelector.renderDatabaseSections();
        }
        
        this.renderWizardUI(mode, mode === 'core' ? 1 : 0);
    }

    exportReport(reportId) {
        const state = window.appState.get();
        const report = (state.catalogue || []).find(r => r.id === reportId);
        if (!report) {
            window.appToast.show('Static demo reports cannot be exported.', 'warning');
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", report.name.replace(/\s+/g, '_') + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        window.appToast.show('Report exported successfully', 'success');
    }

    shareReport(reportId) {
        window.appModal.show('Share / Access', 'Sharing features will be integrated when connected to the backend. Currently running in local offline mode.', [{label: 'Close', primary: true}]);
    }

    setWizardStep(mode, step) {
        window.appState.update(state => ({
            ...state,
            currentBuilder: { ...state.currentBuilder, mode: mode, wizardStep: step }
        }));
        this.renderWizardUI(mode, step);
    }

    renderWizardUI(mode, step) {
        // Hide all step contents
        document.querySelectorAll('.wizard-step-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show target step content
        const targetContent = document.getElementById(`step-${step}-content`);
        if (targetContent) {
            if (targetContent.id === 'step-1-content' || targetContent.id === 'step-6-content') {
                targetContent.style.display = 'flex';
            } else {
                targetContent.style.display = 'block';
            }
        }

        // Update active class on sidebar
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.remove('active');
            if (parseInt(el.dataset.step) === step) {
                el.classList.add('active');
            }
        });
    }

    updateScheduleState(key, value) {
        window.appState.update(state => ({
            ...state,
            currentBuilder: {
                ...state.currentBuilder,
                schedule: {
                    ...(state.currentBuilder.schedule || {}),
                    [key]: value
                }
            }
        }));
        
        // Update summary text
        const state = window.appState.get();
        const schedule = state.currentBuilder.schedule || {};
        const summary = document.getElementById('schedule-summary');
        if (summary) {
            if (schedule.frequency && schedule.frequency !== 'Ad Hoc') {
                summary.innerText = `Scheduled to run ${schedule.frequency} at ${schedule.runTime || '12:00'} ${schedule.timezone || 'UTC'}, delivered via ${schedule.delivery || 'Download'} with ${schedule.retention || '30 days'} retention.`;
            } else {
                summary.innerText = 'Ad Hoc generation on demand.';
            }
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.renderCatalogue();
    }

    switchCatalogueTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tabs .tab').forEach(t => {
            t.classList.remove('active');
            t.style.fontWeight = '500';
            t.style.color = 'var(--text-muted)';
            t.style.borderBottom = 'none';
            t.style.paddingBottom = '4px';
        });
        const activeTab = document.getElementById('tab-' + tab);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.fontWeight = '600';
            activeTab.style.color = 'var(--primary)';
            activeTab.style.borderBottom = '2px solid var(--primary)';
        }
        this.renderCatalogue();
    }

    renderCatalogue() {
        const grid = document.getElementById('catalogue-reports-grid');
        if (!grid) return;

        // Ensure we load mockReports if they are available
        const baseReports = (window.mockReports || []).concat(window.appState.get().catalogue || []);
        // Deduplicate just in case
        const reportsMap = new Map();
        baseReports.forEach(r => reportsMap.set(r.id, r));
        let reports = Array.from(reportsMap.values());

        // Setup filter values
        const searchInput = document.getElementById('catalogue-search');
        const railSelect = document.getElementById('catalogue-filter-rail');
        const catSelect = document.getElementById('catalogue-filter-category');
        const regionSelect = document.getElementById('catalogue-filter-region');
        const freqSelect = document.getElementById('catalogue-filter-frequency');
        const authSelect = document.getElementById('catalogue-filter-author');

        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const rail = railSelect ? railSelect.value : '';
        const category = catSelect ? catSelect.value : '';
        const region = regionSelect ? regionSelect.value : '';
        const frequency = freqSelect ? freqSelect.value : '';
        const authorFilter = authSelect ? authSelect.value : '';
        const currentUser = this.currentUser || 'Rahul Mehta';
        const currentTab = this.currentTab || 'public';

        // Apply filters
        reports = reports.filter(r => {
            const isPrivate = r.visibility === 'private' || r.access === 'private';
            if (currentTab === 'public' && isPrivate) return false;
            if (currentTab === 'private' && (!isPrivate || r.author !== currentUser)) return false;
            if (search && !(r.reportName || r.name || '').toLowerCase().includes(search) && !(r.id || '').toLowerCase().includes(search)) return false;
            if (rail && r.paymentRail !== rail) return false;
            if (category && r.category !== category) return false;
            if (region && r.region !== region) return false;
            if (frequency && r.frequency !== frequency) return false;
            if (authorFilter && r.author !== authorFilter) return false;
            return true;
        });

        if (reports.length === 0) {
            grid.innerHTML = '<div style="color: var(--text-muted); padding: 24px;">No reports match your filters.</div>';
            return;
        }

        grid.innerHTML = reports.map(r => {
            const name = r.reportName || r.name;
            const desc = r.description || r.desc || 'Custom created report definition.';
            const railTag = r.paymentRail ? `<span class="tag" style="background:#dbeafe; color:#2563eb; border:1px solid #bfdbfe;">${r.paymentRail}</span>` : '';
            const catTag = r.category ? `<span class="tag" style="background:#fef3c7; color:#d97706; border:1px solid #fde68a;">${r.category}</span>` : '';

            return `
            <div class="report-card" id="catalogue-card-${r.id}" style="position:relative;">
                <div class="report-card-header">
                    <div class="report-title">${name}</div>
                    <div style="position:relative;">
                        <button class="icon-btn" onclick="event.stopPropagation(); document.querySelectorAll('.card-menu-wrap').forEach(el => { if(el !== this.nextElementSibling) { el.style.display='none'; const p=el.closest('.report-card'); if(p) p.style.zIndex=''; } }); var m = this.nextElementSibling; var p = this.closest('.report-card'); if(m.style.display === 'block'){ m.style.display='none'; if(p) p.style.zIndex=''; } else { m.style.display='block'; if(p) p.style.zIndex='50'; } document.addEventListener('click', function _closeMenu(e){ if(!e.target.closest('.card-menu-wrap')){ m.style.display='none'; if(p) p.style.zIndex=''; document.removeEventListener('click', _closeMenu); } });" style="color:#94a3b8;">
                            <i data-lucide="more-vertical"></i>
                        </button>
                        <div class="card-menu-wrap" style="display:none; position:absolute; right:0; top:100%; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.12); z-index:100; min-width:160px; overflow:hidden;">
                            <button onclick="window.appBuilderManager.editReport('${r.id}', true); this.closest('.card-menu-wrap').style.display='none';" style="display:block;width:100%;text-align:left;padding:10px 16px;border:none;background:none;color:#475569;cursor:pointer;font-size:0.875rem;"><i data-lucide="copy" style="width:14px;margin-right:6px;"></i>Clone</button>
                            <button onclick="window.appBuilderManager.exportReport('${r.id}'); this.closest('.card-menu-wrap').style.display='none';" style="display:block;width:100%;text-align:left;padding:10px 16px;border:none;background:none;color:#475569;cursor:pointer;font-size:0.875rem;"><i data-lucide="download" style="width:14px;margin-right:6px;"></i>Export JSON</button>
                            <hr style="border:none;border-top:1px solid #e2e8f0;margin:4px 0;">
                            <button onclick="if(confirm('Delete this report?')){const el=document.getElementById('catalogue-card-${r.id}');if(el)el.remove();}" style="display:block;width:100%;text-align:left;padding:10px 16px;border:none;background:none;color:#ef4444;cursor:pointer;font-size:0.875rem;"><i data-lucide="trash-2" style="width:14px;margin-right:6px;"></i>Delete</button>
                        </div>
                    </div>
                </div>
                <div class="report-desc">${desc}</div>
                <div style="margin-bottom: 16px;">
                    ${railTag} ${catTag}
                </div>
                <div class="report-footer">
                    <div class="report-author">
                        <div class="avatar-sm" style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">${(r.author || 'JS').split(' ').map(n=>n[0]).join('')}</div>
                        Updated ${r.updatedAt || 'Just now'}
                    </div>
                    <div class="report-actions">
                        <button class="icon-btn icon-btn-primary" onclick="window.appReportManager.openRunModal('${name}')" title="Run"><i data-lucide="play"></i></button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        lucide.createIcons();
    }

    cloneReport(reportId) {
        const baseReports = (window.mockReports || []).concat(window.appState.get().catalogue || []);
        const original = baseReports.find(r => r.id === reportId);
        if(!original) {
            window.appToast.show('Report not found for cloning', 'error');
            return;
        }

        const clone = JSON.parse(JSON.stringify(original));
        clone.id = 'CAT-' + Math.floor(Math.random() * 10000);
        clone.reportName = (clone.reportName || clone.name) + ' (Copy)';
        clone.name = clone.reportName;
        clone.author = this.currentUser || 'Rahul Mehta';
        clone.updatedAt = new Date().toISOString().split('T')[0];
        // Ensure clone belongs to current user so it appears in private tab
        clone.visibility = 'private';
        
        window.appState.update(s => {
            const newCatalogue = [clone, ...(s.catalogue || [])];
            return {
                ...s,
                catalogue: newCatalogue
            };
        });
        
        this.renderCatalogue();
        window.appToast.show('Report Cloned Successfully', 'success');
        
        // Switch to private tab to see the clone
        this.switchCatalogueTab('private');
    }

    exportReport(reportId) {
        const baseReports = (window.mockReports || []).concat(window.appState.get().catalogue || []);
        const original = baseReports.find(r => r.id === reportId);
        if(!original) {
            window.appToast.show('Report not found for export', 'error');
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(original, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", (original.reportName || original.name).replace(/\s+/g, '_') + ".json");
        dlAnchorElem.click();
        window.appToast.show('Report JSON Exported', 'success');
    }

    nextWizardStep() {
        const state = window.appState.get();
        const mode = state.currentBuilder.mode;
        const currentStep = state.currentBuilder.wizardStep;
        let nextStep = 8;
        
        if (mode === 'core') {
            if (currentStep === 1) nextStep = 3;
            else if (currentStep === 3) nextStep = 4;
            else if (currentStep === 4) nextStep = 6;
            else if (currentStep === 6) nextStep = 7;
            else if (currentStep === 7) nextStep = 8;
        } else {
            // template
            if (currentStep === 0) nextStep = 2;
            else if (currentStep === 2) nextStep = 3;
            else if (currentStep === 3) nextStep = 4;
            else if (currentStep === 4) nextStep = 6;
            else if (currentStep === 6) nextStep = 7;
            else if (currentStep === 7) nextStep = 8;
        }
        
        this.setWizardStep(mode, nextStep);
    }

    prevWizardStep() {
        const state = window.appState.get();
        const mode = state.currentBuilder.mode;
        const currentStep = state.currentBuilder.wizardStep;
        let prevStep = 0;
        
        if (mode === 'core') {
            if (currentStep === 8) prevStep = 7;
            else if (currentStep === 7) prevStep = 6;
            else if (currentStep === 6) prevStep = 4;
            else if (currentStep === 4) prevStep = 3;
            else if (currentStep === 3) prevStep = 1;
            else prevStep = 1;
        } else {
            // template
            if (currentStep === 8) prevStep = 7;
            else if (currentStep === 7) prevStep = 6;
            else if (currentStep === 6) prevStep = 4;
            else if (currentStep === 4) prevStep = 3;
            else if (currentStep === 3) prevStep = 2;
            else if (currentStep === 2) prevStep = 0;
            else prevStep = 0;
        }
        
        this.setWizardStep(mode, prevStep);
    }

    bindEvents() {

        // Add all fields button
        const addAllBtn = document.getElementById('btn-add-all');
        if (addAllBtn) {
            addAllBtn.addEventListener('click', () => {
                window.appHistory.pushState();
                window.appState.update(state => {
                    const currentBuilder = { ...state.currentBuilder, fields: [...this.availableFields] };
                    return { ...state, currentBuilder };
                });
            });
        }

        // Clear all fields button
        const clearAllBtn = document.getElementById('btn-clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                window.appHistory.pushState();
                window.appState.update(state => {
                    const currentBuilder = { ...state.currentBuilder, fields: [] };
                    return { ...state, currentBuilder };
                });
            });
        }
        
        // Setup Event Delegation for adding/pinning fields
        const availableContainer = document.getElementById('available-fields-container');
        if (availableContainer) {
            availableContainer.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.add-field-btn');
                const pinBtn = e.target.closest('.pin-field-btn');
                
                if (addBtn) {
                    const fieldId = addBtn.closest('.field-item').dataset.id;
                    const field = this.availableFields.find(f => f.id === fieldId);
                    if (field) this.addField(field);
                } else if (pinBtn) {
                    const fieldId = pinBtn.closest('.field-item').dataset.id;
                    this.togglePin(fieldId);
                }
            });
        }

        // Setup Event Delegation for removing fields
        const selectedContainer = document.getElementById('selected-fields-list');
        if (selectedContainer) {
            selectedContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-field-btn');
                if (removeBtn) {
                    const fieldId = removeBtn.closest('.selected-card').dataset.id;
                    this.removeField(fieldId);
                }
            });
        }
        
        // Setup Category Filtering
        document.querySelectorAll('.folder-item').forEach(folder => {
            folder.addEventListener('click', (e) => {
                if (folder.style.fontWeight === '600') return; // It's a header
                this.currentCategory = folder.innerText.trim();
                this.renderFieldsList();
            });
        });

        // Setup Field Searching
        const searchInput = document.querySelector('.search-input');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderFieldsList();
            });
        }

        // Event delegation for Stage 4 Conditions
        const conditionsContainer = document.getElementById('conditions-container');
        if (conditionsContainer) {
            conditionsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.add-cond-btn')) {
                    this.addCondition('group_1');
                }
                if (e.target.closest('.remove-cond-btn')) {
                    const id = e.target.closest('.filter-condition').dataset.id;
                    this.removeCondition(id);
                }
            });
            conditionsContainer.addEventListener('change', (e) => {
                const row = e.target.closest('.filter-condition');
                if(!row) return;
                const id = row.dataset.id;
                if(e.target.classList.contains('cond-op')) this.updateCondition(id, 'logicalOp', e.target.value);
                if(e.target.classList.contains('cond-field')) this.updateCondition(id, 'fieldId', e.target.value);
                if(e.target.classList.contains('cond-comparison')) this.updateCondition(id, 'operator', e.target.value);
                if(e.target.classList.contains('cond-val')) this.updateCondition(id, 'value', e.target.value);
            });
        }
        
        // Event delegation for Stage 5 Sorting
        const sortingContainer = document.querySelector('#stage-5 .stage-content');
        if (sortingContainer) {
            sortingContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('sort-field')) {
                    this.updateSort('fieldId', e.target.value);
                }
                if (e.target.classList.contains('sort-dir')) {
                    this.updateSort('direction', e.target.value);
                }
            });
            sortingContainer.addEventListener('click', (e) => {
                if (e.target.closest('.clear-sort-btn')) {
                    this.clearSort();
                }
            });
        }

        // Preview buttons
        const previewBtn = document.getElementById('btn-preview-data');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                const state = window.appState.get();
                window.appPreviewEngine.render('preview-container', state.currentBuilder.fields, state.currentBuilder.filters, state.currentBuilder.conditions, state.currentBuilder.sorts);
                toggleStage(6); // Open preview stage (it's stage 6 now)
                window.appToast.show('Preview generated successfully', 'success');
            });
        }
        
        // Action Bar Buttons
        document.querySelectorAll('.action-bar .btn-secondary').forEach(btn => {
            if (btn.innerText.includes('Reset')) {
                btn.addEventListener('click', () => {
                    window.appHistory.pushState();
                    window.appState.update(s => ({ ...s, currentBuilder: { dataset: null, fields: [], pinnedFields: s.currentBuilder.pinnedFields, filters: {}, conditions: [], sorts: [], groups: [] } }));
                    window.appToast.show('Builder Reset', 'info');
                });
            }
        });

        // Save Report Button Explicit Binding
        const saveBtn = document.getElementById('btn-save-report');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const state = window.appState.get();
                if(state.currentBuilder.fields.length === 0) {
                    window.appToast.show('Select fields before saving', 'error');
                    return;
                }
                const reportNameInput = document.getElementById('report-name-input');
                const repName = reportNameInput && reportNameInput.value.trim() !== '' ? reportNameInput.value.trim() : 'Saved Report';
                const accessSelect = document.getElementById('report-access-select');
                const access = accessSelect ? accessSelect.value : 'private';
                const type = state.currentBuilder.mode === 'core' ? 'core' : 'template';
                
                const newReport = {
                    id: state.currentBuilder.editingId || ('CAT-' + Math.floor(Math.random() * 10000)),
                    name: repName,
                    type: type,
                    access: access,
                    updatedAt: 'Just now',
                    author: 'JS',
                    desc: 'Custom created report definition.',
                    config: {
                        dataset: state.currentBuilder.dataset,
                        fields: state.currentBuilder.fields,
                        filters: state.currentBuilder.filters,
                        conditions: state.currentBuilder.conditions,
                        sorts: state.currentBuilder.sorts,
                        groups: state.currentBuilder.groups
                    }
                };
                
                window.appState.update(s => {
                    const existingIndex = s.catalogue.findIndex(r => r.id === newReport.id);
                    let newCatalogue = [...(s.catalogue || [])];
                    if (existingIndex >= 0) {
                        newCatalogue[existingIndex] = newReport;
                    } else {
                        newCatalogue = [newReport, ...newCatalogue];
                    }
                    return {
                        ...s,
                        catalogue: newCatalogue,
                        currentBuilder: { ...s.currentBuilder, editingId: newReport.id }
                    };
                });
                
                window.appToast.show('Report Saved successfully to Catalogue', 'success');
            });
        }
        
        // Generate Report Button
        const generateBtn = document.getElementById('btn-generate-report');
        if(generateBtn) {
            generateBtn.addEventListener('click', () => {
                const state = window.appState.get();
                if(state.currentBuilder.fields.length === 0) {
                    window.appModal.show('Validation Error', 'Please select at least one field before generating a report.', [{label: 'OK', primary: true}]);
                    return;
                }
                
                const reportNameInput = document.getElementById('report-name-input');
                let repName = reportNameInput && reportNameInput.value.trim() !== '' ? reportNameInput.value.trim() : 'Ad-hoc Payment Report';
                const type = state.currentBuilder.mode === 'core' ? 'core' : 'template';
                
                window.appModal.show(
                    'Generate Report', 
                    'Are you sure you want to queue this report for execution? It will process approximately 1.2M rows.', 
                    [
                        {label: 'Cancel', primary: false},
                        {label: 'Generate', primary: true, onClick: () => window.appReportManager.queueReport(repName, type)}
                    ]
                );
            });
        }
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if(e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                if(window.appHistory.undo()) window.appToast.show('Undo successful', 'info');
            }
            if(e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                if(window.appHistory.redo()) window.appToast.show('Redo successful', 'info');
            }
        });

        // Event delegation for Stage 3 Filters
        const filtersContainer = document.getElementById('filters-container');
        if (filtersContainer) {
            filtersContainer.addEventListener('click', (e) => {
                if (e.target.closest('.add-filter-val-btn')) {
                    const fieldId = e.target.closest('.filter-row').dataset.id;
                    const input = e.target.closest('.filter-row').querySelector('.filter-input');
                    if(input && input.value) {
                        this.addFilterValue(fieldId, input.value);
                        input.value = '';
                    }
                }
                if (e.target.closest('.remove-filter-val-btn')) {
                    const fieldId = e.target.closest('.filter-row').dataset.id;
                    const val = e.target.closest('.chip').dataset.val;
                    this.removeFilterValue(fieldId, val);
                }
                if (e.target.closest('.remove-all-filters-btn')) {
                    const fieldId = e.target.closest('.filter-row').dataset.id;
                    this.clearFieldFilters(fieldId);
                }
            });
        }

        // Initialize Drag and Drop on the selected fields container ONCE
        window.appDragDrop.init('#selected-fields-list', (newOrder) => {
            window.appHistory.pushState();
            window.appState.update(s => {
                const sortedFields = newOrder.map(id => s.currentBuilder.fields.find(f => f.id === id)).filter(Boolean);
                return { ...s, currentBuilder: { ...s.currentBuilder, fields: sortedFields } };
            });
        });
    }

    renderFieldsList() {
        const container = document.getElementById('available-fields-container');
        if (!container) return;
        
        const state = window.appState.get();
        const fields = state.currentBuilder.fields || [];
        const selectedIds = new Set(fields.map(f => f.id));
        const pinnedIds = new Set(state.currentBuilder.pinnedFields || []);
        
        let filteredFields = this.availableFields;
        
        if (this.currentCategory === 'Pinned') {
            filteredFields = filteredFields.filter(f => pinnedIds.has(f.id));
        } else if (this.currentCategory !== 'All Fields' && this.currentCategory !== 'Recently Used') {
            filteredFields = filteredFields.filter(f => f.category === this.currentCategory);
        }
        
        if (this.searchQuery) {
            filteredFields = filteredFields.filter(f => f.label.toLowerCase().includes(this.searchQuery) || f.id.toLowerCase().includes(this.searchQuery));
        }
        
        if (filteredFields.length === 0) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">No fields found matching criteria.</div>`;
            return;
        }

        container.innerHTML = filteredFields.map(f => {
            const isSelected = selectedIds.has(f.id);
            const isPinned = pinnedIds.has(f.id);
            return `
                <div class="field-item" data-id="${f.id}" style="${isSelected ? 'opacity: 0.5; background: var(--bg-workspace);' : ''}">
                    <div class="field-info">
                        <i data-lucide="${f.type === 'number' ? 'hash' : f.type === 'date' ? 'calendar' : 'type'}" style="color: var(--text-muted); width: 16px;"></i>
                        <span class="field-name">${f.label}</span>
                        <div class="field-badges">
                            ${f.key ? '<span class="badge badge-key">Key</span>' : ''}
                            ${f.pii ? '<span class="badge badge-pii">PII</span>' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <i data-lucide="pin" class="pin-field-btn" style="width: 14px; cursor: pointer; color: ${isPinned ? 'var(--primary)' : 'var(--text-muted)'}; fill: ${isPinned ? 'currentColor' : 'none'}"></i>
                        ${isSelected 
                            ? '<i data-lucide="check-circle-2" style="color: var(--success); width: 16px;"></i>' 
                            : '<i data-lucide="plus-circle" class="add-field-btn" style="color: var(--primary); cursor: pointer; width: 16px;"></i>'}
                    </div>
                </div>
            `;
        }).join('');

        // Re-init lucide
        lucide.createIcons();
    }

    addField(field) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            if(fields.find(f => f.id === field.id)) return state; // Prevent duplicates
            const currentBuilder = { ...state.currentBuilder, fields: [...fields, field] };
            return { ...state, currentBuilder };
        });
    }

    removeField(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            const currentBuilder = { 
                ...state.currentBuilder, 
                fields: fields.filter(f => f.id !== fieldId) 
            };
            return { ...state, currentBuilder };
        });
    }

    togglePin(fieldId) {
        window.appState.update(state => {
            let pinned = state.currentBuilder.pinnedFields || [];
            if(pinned.includes(fieldId)) pinned = pinned.filter(id => id !== fieldId);
            else pinned = [...pinned, fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, pinnedFields: pinned } };
        });
    }

    addFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(!filters[fieldId]) filters[fieldId] = [];
            if(!filters[fieldId].includes(value)) filters[fieldId].push(value);
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    removeFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(filters[fieldId]) {
                filters[fieldId] = filters[fieldId].filter(v => v !== value);
            }
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    clearFieldFilters(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            delete filters[fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    addCondition(groupId) {
        window.appState.update(state => {
            const conditions = [...(state.currentBuilder.conditions || [])];
            conditions.push({
                id: 'cond_' + Math.random().toString(36).substr(2, 9),
                groupId: groupId || 'group_1',
                logicalOp: conditions.length > 0 ? 'AND' : 'IF',
                fieldId: state.currentBuilder.fields[0]?.id || '',
                operator: 'Equals',
                value: ''
            });
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateCondition(condId, key, value) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).map(c => 
                c.id === condId ? { ...c, [key]: value } : c
            );
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    removeCondition(condId) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).filter(c => c.id !== condId);
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateSort(key, value) {
        window.appState.update(state => {
            let sorts = [...(state.currentBuilder.sorts || [])];
            if (sorts.length === 0) sorts.push({ fieldId: state.currentBuilder.fields[0]?.id || '', direction: 'asc' });
            sorts[0][key] = value;
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts } };
        });
    }

    clearSort() {
        window.appState.update(state => {
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts: [] } };
        });
    }

renderFieldsList() {
        const container = document.getElementById('available-fields-container');
        if (!container) return;
        
        const state = window.appState.get();
        const fields = state.currentBuilder.fields || [];
        const selectedIds = new Set(fields.map(f => f.id));
        const pinnedIds = new Set(state.currentBuilder.pinnedFields || []);
        
        let filteredFields = this.availableFields;
        
        if (this.currentCategory === 'Pinned') {
            filteredFields = filteredFields.filter(f => pinnedIds.has(f.id));
        } else if (this.currentCategory !== 'All Fields' && this.currentCategory !== 'Recently Used') {
            filteredFields = filteredFields.filter(f => f.category === this.currentCategory);
        }
        
        if (this.searchQuery) {
            filteredFields = filteredFields.filter(f => f.label.toLowerCase().includes(this.searchQuery) || f.id.toLowerCase().includes(this.searchQuery));
        }
        
        if (filteredFields.length === 0) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">No fields found matching criteria.</div>`;
            return;
        }

        container.innerHTML = filteredFields.map(f => {
            const isSelected = selectedIds.has(f.id);
            const isPinned = pinnedIds.has(f.id);
            return `
                <div class="field-item" data-id="${f.id}" style="${isSelected ? 'opacity: 0.5; background: var(--bg-workspace);' : ''}">
                    <div class="field-info">
                        <i data-lucide="${f.type === 'number' ? 'hash' : f.type === 'date' ? 'calendar' : 'type'}" style="color: var(--text-muted); width: 16px;"></i>
                        <span class="field-name">${f.label}</span>
                        <div class="field-badges">
                            ${f.key ? '<span class="badge badge-key">Key</span>' : ''}
                            ${f.pii ? '<span class="badge badge-pii">PII</span>' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <i data-lucide="pin" class="pin-field-btn" style="width: 14px; cursor: pointer; color: ${isPinned ? 'var(--primary)' : 'var(--text-muted)'}; fill: ${isPinned ? 'currentColor' : 'none'}"></i>
                        ${isSelected 
                            ? '<i data-lucide="check-circle-2" style="color: var(--success); width: 16px;"></i>' 
                            : '<i data-lucide="plus-circle" class="add-field-btn" style="color: var(--primary); cursor: pointer; width: 16px;"></i>'}
                    </div>
                </div>
            `;
        }).join('');

        // Re-init lucide
        lucide.createIcons();
    }

    addField(field) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            if(fields.find(f => f.id === field.id)) return state; // Prevent duplicates
            const currentBuilder = { ...state.currentBuilder, fields: [...fields, field] };
            return { ...state, currentBuilder };
        });
    }

    removeField(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            const currentBuilder = { 
                ...state.currentBuilder, 
                fields: fields.filter(f => f.id !== fieldId) 
            };
            return { ...state, currentBuilder };
        });
    }

    togglePin(fieldId) {
        window.appState.update(state => {
            let pinned = state.currentBuilder.pinnedFields || [];
            if(pinned.includes(fieldId)) pinned = pinned.filter(id => id !== fieldId);
            else pinned = [...pinned, fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, pinnedFields: pinned } };
        });
    }

    addFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(!filters[fieldId]) filters[fieldId] = [];
            if(!filters[fieldId].includes(value)) filters[fieldId].push(value);
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    removeFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(filters[fieldId]) {
                filters[fieldId] = filters[fieldId].filter(v => v !== value);
            }
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    clearFieldFilters(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            delete filters[fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    addCondition(groupId) {
        window.appState.update(state => {
            const conditions = [...(state.currentBuilder.conditions || [])];
            conditions.push({
                id: 'cond_' + Math.random().toString(36).substr(2, 9),
                groupId: groupId || 'group_1',
                logicalOp: conditions.length > 0 ? 'AND' : 'IF',
                fieldId: state.currentBuilder.fields[0]?.id || '',
                operator: 'Equals',
                value: ''
            });
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateCondition(condId, key, value) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).map(c => 
                c.id === condId ? { ...c, [key]: value } : c
            );
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    removeCondition(condId) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).filter(c => c.id !== condId);
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateSort(key, value) {
        window.appState.update(state => {
            let sorts = [...(state.currentBuilder.sorts || [])];
            if (sorts.length === 0) sorts.push({ fieldId: state.currentBuilder.fields[0]?.id || '', direction: 'asc' });
            sorts[0][key] = value;
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts } };
        });
    }

    clearSort() {
        window.appState.update(state => {
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts: [] } };
        });
    }

renderFieldsList() {
        const container = document.getElementById('available-fields-container');
        if (!container) return;
        
        const state = window.appState.get();
        const fields = state.currentBuilder.fields || [];
        const selectedIds = new Set(fields.map(f => f.id));
        const pinnedIds = new Set(state.currentBuilder.pinnedFields || []);
        
        let filteredFields = this.availableFields;
        
        if (this.currentCategory === 'Pinned') {
            filteredFields = filteredFields.filter(f => pinnedIds.has(f.id));
        } else if (this.currentCategory !== 'All Fields' && this.currentCategory !== 'Recently Used') {
            filteredFields = filteredFields.filter(f => f.category === this.currentCategory);
        }
        
        if (this.searchQuery) {
            filteredFields = filteredFields.filter(f => f.label.toLowerCase().includes(this.searchQuery) || f.id.toLowerCase().includes(this.searchQuery));
        }
        
        if (filteredFields.length === 0) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">No fields found matching criteria.</div>`;
            return;
        }

        container.innerHTML = filteredFields.map(f => {
            const isSelected = selectedIds.has(f.id);
            const isPinned = pinnedIds.has(f.id);
            return `
                <div class="field-item" data-id="${f.id}" style="${isSelected ? 'opacity: 0.5; background: var(--bg-workspace);' : ''}">
                    <div class="field-info">
                        <i data-lucide="${f.type === 'number' ? 'hash' : f.type === 'date' ? 'calendar' : 'type'}" style="color: var(--text-muted); width: 16px;"></i>
                        <span class="field-name">${f.label}</span>
                        <div class="field-badges">
                            ${f.key ? '<span class="badge badge-key">Key</span>' : ''}
                            ${f.pii ? '<span class="badge badge-pii">PII</span>' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <i data-lucide="pin" class="pin-field-btn" style="width: 14px; cursor: pointer; color: ${isPinned ? 'var(--primary)' : 'var(--text-muted)'}; fill: ${isPinned ? 'currentColor' : 'none'}"></i>
                        ${isSelected 
                            ? '<i data-lucide="check-circle-2" style="color: var(--success); width: 16px;"></i>' 
                            : '<i data-lucide="plus-circle" class="add-field-btn" style="color: var(--primary); cursor: pointer; width: 16px;"></i>'}
                    </div>
                </div>
            `;
        }).join('');

        // Re-init lucide
        lucide.createIcons();
    }

    addField(field) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            if(fields.find(f => f.id === field.id)) return state; // Prevent duplicates
            const currentBuilder = { ...state.currentBuilder, fields: [...fields, field] };
            return { ...state, currentBuilder };
        });
    }

    removeField(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const fields = state.currentBuilder.fields || [];
            const currentBuilder = { 
                ...state.currentBuilder, 
                fields: fields.filter(f => f.id !== fieldId) 
            };
            return { ...state, currentBuilder };
        });
    }

    togglePin(fieldId) {
        window.appState.update(state => {
            let pinned = state.currentBuilder.pinnedFields || [];
            if(pinned.includes(fieldId)) pinned = pinned.filter(id => id !== fieldId);
            else pinned = [...pinned, fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, pinnedFields: pinned } };
        });
    }

    addFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(!filters[fieldId]) filters[fieldId] = [];
            if(!filters[fieldId].includes(value)) filters[fieldId].push(value);
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    removeFilterValue(fieldId, value) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            if(filters[fieldId]) {
                filters[fieldId] = filters[fieldId].filter(v => v !== value);
            }
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    clearFieldFilters(fieldId) {
        window.appHistory.pushState();
        window.appState.update(state => {
            const filters = { ...state.currentBuilder.filters };
            delete filters[fieldId];
            return { ...state, currentBuilder: { ...state.currentBuilder, filters } };
        });
    }

    addCondition(groupId) {
        window.appState.update(state => {
            const conditions = [...(state.currentBuilder.conditions || [])];
            conditions.push({
                id: 'cond_' + Math.random().toString(36).substr(2, 9),
                groupId: groupId || 'group_1',
                logicalOp: conditions.length > 0 ? 'AND' : 'IF',
                fieldId: state.currentBuilder.fields[0]?.id || '',
                operator: 'Equals',
                value: ''
            });
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateCondition(condId, key, value) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).map(c => 
                c.id === condId ? { ...c, [key]: value } : c
            );
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    removeCondition(condId) {
        window.appState.update(state => {
            const conditions = (state.currentBuilder.conditions || []).filter(c => c.id !== condId);
            return { ...state, currentBuilder: { ...state.currentBuilder, conditions } };
        });
    }

    updateSort(key, value) {
        window.appState.update(state => {
            let sorts = [...(state.currentBuilder.sorts || [])];
            if (sorts.length === 0) sorts.push({ fieldId: state.currentBuilder.fields[0]?.id || '', direction: 'asc' });
            sorts[0][key] = value;
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts } };
        });
    }

    clearSort() {
        window.appState.update(state => {
            return { ...state, currentBuilder: { ...state.currentBuilder, sorts: [] } };
        });
    }

    updateUI(state) {
        // Update Builder Header Mode
        const modeBadge = document.getElementById('builder-mode-badge');
        if (state.currentBuilder.mode === 'core') {
            if (modeBadge) {
                modeBadge.innerText = 'Create Report';
                modeBadge.style.color = 'var(--primary)';
                modeBadge.style.background = '#eff6ff';
            }
        } else {
            if (modeBadge) {
                modeBadge.innerText = 'Clone Report';
                modeBadge.style.color = 'var(--warning)';
                modeBadge.style.background = '#fef3c7';
            }
        }

                // Toggle Sidebar Sections based on mode
        const coreSection = document.getElementById('core-sidebar-section');
        const templateSection = document.getElementById('template-sidebar-section');
        if (state.currentBuilder.mode === 'core') {
            if (coreSection) coreSection.style.display = 'block';
            if (templateSection) templateSection.style.display = 'none';
        } else {
            if (coreSection) coreSection.style.display = 'none';
            if (templateSection) templateSection.style.display = 'block';
        }

        // Sidebar Active States
        document.querySelectorAll('.wizard-step').forEach(li => li.classList.remove('active'));
        const activeNav = document.querySelector(`#${state.currentBuilder.mode}-wizard-nav .wizard-step[data-step="${state.currentBuilder.wizardStep}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Hide all step contents
        document.querySelectorAll('.wizard-step-content').forEach(el => el.style.display = 'none');
        
        // Show active step content
        const stepContent = document.getElementById(`step-${state.currentBuilder.wizardStep}-content`);
        if (stepContent) {
            stepContent.style.display = (state.currentBuilder.wizardStep === 1 || state.currentBuilder.wizardStep === 6) ? 'flex' : 'block';
        }

        if (state.currentBuilder.mode === 'template' && state.currentBuilder.wizardStep === 0) {
            // Populate Template Grid dynamically
            const grid = document.getElementById('core-reports-grid');
            if (grid) {
                const coreReportsList = (state.catalogue || []).filter(r => r.type === 'core').map(r => r.name);
                grid.innerHTML = coreReportsList.map(name => `
                    <div class="dataset-card ${state.currentBuilder.dataset === name ? 'selected' : ''}" onclick="window.appBuilderManager.setDataset('${name}')">
                        <div class="dataset-header">
                            <div class="dataset-icon" style="color: var(--primary); background: #eff6ff;"><i data-lucide="file-bar-chart-2"></i></div>
                        </div>
                        <div class="dataset-title">${name}</div>
                    </div>
                `).join('');
                if (coreReportsList.length === 0) {
                    grid.innerHTML = '<div style="color: var(--text-muted); font-size: 0.875rem;">No created reports available. Create one first.</div>';
                }
            }
        }

        // Toggle action buttons based on step
        const btnPreviewData = document.getElementById('btn-preview-data');
        const btnGenerateReport = document.getElementById('btn-generate-report');
        const btnNextStep = document.getElementById('btn-next-step');
        const btnPrevStep = document.getElementById('btn-prev-step');
        
        // Next, Preview, and Generate toggles
        if (state.currentBuilder.wizardStep === 7) {
            if (btnPreviewData) btnPreviewData.style.display = 'inline-flex';
            if (btnGenerateReport) btnGenerateReport.style.display = 'inline-flex';
            if (btnNextStep) btnNextStep.style.display = 'none';
        } else {
            if (btnPreviewData) btnPreviewData.style.display = 'none';
            if (btnGenerateReport) btnGenerateReport.style.display = 'none';
            if (btnNextStep) btnNextStep.style.display = 'inline-flex';
        }

        // Previous button toggle
        if ((state.currentBuilder.mode === 'core' && state.currentBuilder.wizardStep === 1) ||
            (state.currentBuilder.mode === 'template' && state.currentBuilder.wizardStep === 0)) {
            if (btnPrevStep) btnPrevStep.style.display = 'none';
        } else {
            if (btnPrevStep) btnPrevStep.style.display = 'inline-flex';
        }

        // Auto-initialize components if needed based on active step
        if (state.currentBuilder.mode === 'core' && state.currentBuilder.wizardStep === 1) {
            if (window.appCoreReportSelector) {
                if (window.appCoreReportSelector.activeDatabaseSections.length === 0) {
                    window.appCoreReportSelector.addDatabase();
                }
                window.appCoreReportSelector.updateUI(state);
            }
        }

        // Render fields to reflect pinning changes
        if (state.currentBuilder.wizardStep === 2) {
            this.renderFieldsList();
        }

        // Render Summary & Calculations Panel
        if (state.currentBuilder.wizardStep === 6) {
            if (window.appSummaryCalc) {
                window.appSummaryCalc.renderRightPanel();
                window.appSummaryCalc.renderLivePreview();
            }
        }

        const fields = state.currentBuilder.fields || [];

        // Update Selected Fields UI in Template Mode (step 2)
        const selectedContainer = document.getElementById('selected-fields-list');
        if (selectedContainer && state.currentBuilder.mode === 'template') {
            selectedContainer.innerHTML = fields.map(f => `
                <div class="selected-card draggable-item" data-id="${f.id}" draggable="true">
                    <i data-lucide="grip-vertical" class="drag-handle"></i>
                    <div style="flex-grow: 1;">
                        <div style="font-size: 0.875rem; font-weight: 600;">${f.label}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${f.id}</div>
                    </div>
                    <i data-lucide="x" class="remove-field-btn" style="color: var(--text-muted); cursor: pointer; width: 16px;"></i>
                </div>
            `).join('');
        }

        if (state.currentBuilder.wizardStep === 3) this.renderFiltersUI(state);
        if (state.currentBuilder.wizardStep === 4) this.renderConditionsUI(state);
        if (state.currentBuilder.wizardStep === 5) this.renderSortingUI(state);
        if (state.currentBuilder.wizardStep === 6) {
            if (window.appPreviewEngine) window.appPreviewEngine.render('preview-container', fields, state.currentBuilder.filters, state.currentBuilder.conditions, state.currentBuilder.sorts);
        }

        // Update Summary Panel
        const summaryDataset = document.getElementById('summary-dataset');
        if (summaryDataset) summaryDataset.innerText = state.currentBuilder.dataset || 'None';
        
        const summaryFieldsCount = document.getElementById('summary-fields-count-bottom');
        if(summaryFieldsCount) summaryFieldsCount.innerText = `${fields.length} Columns`;
        
        const summaryFiltersCount = document.getElementById('summary-filters-count-bottom');
        const totalFilters = Object.values(state.currentBuilder.filters || {}).reduce((acc, arr) => acc + arr.length, 0);
        if(summaryFiltersCount) summaryFiltersCount.innerText = `${totalFilters} Active`;
        
        // Update Catalogue UI via the centralized method
        this.renderCatalogue();
        
        lucide.createIcons();
    }
    renderFiltersUI(state) {
        const container = document.getElementById('filters-container');
        if (!container) return;
        
        const fields = state.currentBuilder.fields || [];
        
        if (fields.length === 0) {
            container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">Select fields in Stage 2 to apply filters.</div>';
            return;
        }

        // We need dummy data to extract unique values
        const dummyData = window.appPreviewEngine.loadData();

        container.innerHTML = fields.map(f => {
            const activeValues = state.currentBuilder.filters[f.id] || [];
            let inputHtml = '';
            
            // Auto detect input type
            if (f.type === 'number') {
                const maxVal = dummyData.length ? Math.ceil(Math.max(...dummyData.map(d => parseFloat(d[f.id]) || 0))) : 100000;
                const minVal = dummyData.length ? Math.floor(Math.min(...dummyData.map(d => parseFloat(d[f.id]) || 0))) : 0;
                inputHtml = `
                    <div style="display:flex; align-items:center; gap: 8px; width: 100%;">
                        <input type="number" class="range-num-min" value="${minVal}" min="${minVal}" max="${maxVal}" style="width: 80px; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;" oninput="
                            const row = this.closest('.filter-row');
                            const range = row.querySelector('.filter-input-min');
                            const maxNum = row.querySelector('.range-num-max');
                            if(parseFloat(this.value) > parseFloat(maxNum.value)) this.value = maxNum.value;
                            range.value = this.value;
                            const percent = ((this.value - ${minVal}) / (${maxVal} - ${minVal})) * 100 || 0;
                            row.querySelector('.range-slider-fill').style.left = percent + '%';
                        ">
                        <div class="range-slider-container" style="flex-grow: 1; max-width: 300px;">
                            <div class="range-slider-track"></div>
                            <div class="range-slider-fill" id="fill-${f.id}"></div>
                            <input type="range" class="range-slider-input filter-input-min" min="${minVal}" max="${maxVal}" value="${minVal}" oninput="
                                const row = this.closest('.filter-row');
                                const max = row.querySelector('.filter-input-max');
                                const numMin = row.querySelector('.range-num-min');
                                if(parseFloat(this.value) > parseFloat(max.value)) this.value = max.value;
                                numMin.value = this.value;
                                const percent = ((this.value - ${minVal}) / (${maxVal} - ${minVal})) * 100 || 0;
                                row.querySelector('.range-slider-fill').style.left = percent + '%';
                            ">
                            <input type="range" class="range-slider-input filter-input-max" min="${minVal}" max="${maxVal}" value="${maxVal}" oninput="
                                const row = this.closest('.filter-row');
                                const min = row.querySelector('.filter-input-min');
                                const numMax = row.querySelector('.range-num-max');
                                if(parseFloat(this.value) < parseFloat(min.value)) this.value = min.value;
                                numMax.value = this.value;
                                const percent = 100 - (((this.value - ${minVal}) / (${maxVal} - ${minVal})) * 100 || 0);
                                row.querySelector('.range-slider-fill').style.right = percent + '%';
                            ">
                        </div>
                        <input type="number" class="range-num-max" value="${maxVal}" min="${minVal}" max="${maxVal}" style="width: 80px; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;" oninput="
                            const row = this.closest('.filter-row');
                            const range = row.querySelector('.filter-input-max');
                            const minNum = row.querySelector('.range-num-min');
                            if(parseFloat(this.value) < parseFloat(minNum.value)) this.value = minNum.value;
                            range.value = this.value;
                            const percent = 100 - (((this.value - ${minVal}) / (${maxVal} - ${minVal})) * 100 || 0);
                            row.querySelector('.range-slider-fill').style.right = percent + '%';
                        ">
                    </div>
                `;
            } else if (f.type === 'date') {
                let minDate = '', maxDate = '';
                if(dummyData.length) {
                    const dates = dummyData.map(d => new Date(d[f.id])).filter(d => !isNaN(d.getTime()));
                    if(dates.length) {
                        minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
                        maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
                    }
                }
                if(!minDate) { minDate = '2020-01-01'; maxDate = new Date().toISOString().split('T')[0]; }
                
                inputHtml = `
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <input type="date" class="filter-date-min" min="${minDate}" max="${maxDate}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                        <span style="color: var(--text-muted); font-size: 0.875rem;">to</span>
                        <input type="date" class="filter-date-max" min="${minDate}" max="${maxDate}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                `;
            } else {
                const uniqueValues = window.appFakeData.getUniqueValues(dummyData, f.id);
                if (uniqueValues.length > 0 && uniqueValues.length <= 15) {
                    // Enum dropdown
                    inputHtml = `<select class="filter-input" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="">Select Value...</option>
                        ${uniqueValues.map(v => `<option value="${v}">${v}</option>`).join('')}
                    </select>`;
                } else {
                    // Free text with Datalist
                    const dlId = 'dl-' + f.id;
                    inputHtml = `
                        <input type="text" list="${dlId}" class="filter-input datalist-input" placeholder="Search or type..." style="width: 160px; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                        <datalist id="${dlId}">
                            ${uniqueValues.map(v => `<option value="${v}">`).join('')}
                        </datalist>
                    `;
                }
            }

            const pillsHtml = activeValues.map(v => 
                `<div class="chip" data-val="${v}">
                    <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v}</span>
                    <i data-lucide="x" class="remove-filter-val-btn" style="width:14px; cursor:pointer;"></i>
                </div>`
            ).join('');

            return `
                <div class="filter-row" data-id="${f.id}" style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 14px 16px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: nowrap;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink:0; min-width:160px;">
                            <i data-lucide="${f.type === 'number' ? 'hash' : f.type === 'date' ? 'calendar' : 'type'}" style="color: var(--text-muted); width: 14px;"></i>
                            <span style="font-weight: 600; font-size:0.875rem;">${f.label}</span>
                            <span class="badge badge-type" style="font-size:0.7rem;">${f.type}</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; flex-grow:1;">
                            ${inputHtml}
                            <button class="btn btn-primary add-filter-val-btn" style="padding: 6px 12px; height: 34px;" onclick="
                                const row = this.closest('.filter-row');
                                const minInp = row.querySelector('.range-num-min');
                                const maxInp = row.querySelector('.range-num-max');
                                const minDate = row.querySelector('.filter-date-min');
                                const maxDate = row.querySelector('.filter-date-max');
                                const inp = row.querySelector('.filter-input, .datalist-input');
                                let val = '';
                                if(minInp && maxInp) {
                                    val = minInp.value + ' - ' + maxInp.value;
                                } else if(minDate && maxDate) {
                                    if(minDate.value && maxDate.value) val = minDate.value + ' to ' + maxDate.value;
                                } else if (inp) {
                                    val = inp.value;
                                }
                                if(val) {
                                    window.appBuilderManager.addFilterValue('${f.id}', val);
                                    if(inp) inp.value = '';
                                    if(minDate) minDate.value = '';
                                    if(maxDate) maxDate.value = '';
                                }
                            ">Add</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderConditionsUI(state) {
        const container = document.getElementById('conditions-container');
        if (!container) return;
        
        const conditions = state.currentBuilder.conditions || [];
        const fields = state.currentBuilder.fields || [];
        
        if (fields.length === 0) {
            container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">Select fields in Stage 2 to build logical conditions.</div>';
            return;
        }

        const fieldOptions = fields.map(f => `<option value="${f.id}">${f.label}</option>`).join('');

        let conditionsHtml = '';
        if (conditions.length === 0) {
            conditionsHtml = '<div style="padding: 16px; color: var(--text-muted); font-size: 0.875rem;">No conditions applied. Add a rule below.</div>';
        } else {
            conditionsHtml = conditions.map((cond, i) => {
                const selectedField = fields.find(f => f.id === cond.fieldId) || fields[0];
                let operatorOptions = '';
                let valueInput = '';

                if(selectedField.type === 'number') {
                    operatorOptions = '<option>Equals</option><option>Not Equals</option><option>Greater Than</option><option>Greater Than or Equals</option><option>Less Than</option><option>Less Than or Equals</option><option>Is Empty</option><option>Is Not Empty</option>';
                    valueInput = `<input type="number" class="cond-val" value="${cond.value || ''}" placeholder="0" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; display: ${['Is Empty', 'Is Not Empty'].includes(cond.operator) ? 'none' : 'inline-block'};">`;
                } else if(selectedField.type === 'date') {
                    operatorOptions = '<option>Equals</option><option>Not Equals</option><option>Before</option><option>Before or Equals</option><option>After</option><option>After or Equals</option><option>Is Empty</option><option>Is Not Empty</option>';
                    valueInput = `<input type="date" class="cond-val" value="${cond.value || ''}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; display: ${['Is Empty', 'Is Not Empty'].includes(cond.operator) ? 'none' : 'inline-block'};">`;
                } else {
                    operatorOptions = '<option>Equals</option><option>Not Equals</option><option>Contains</option><option>Starts With</option><option>Ends With</option><option>Is Empty</option><option>Is Not Empty</option>';
                    valueInput = `<input type="text" class="cond-val" value="${cond.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; display: ${['Is Empty', 'Is Not Empty'].includes(cond.operator) ? 'none' : 'inline-block'};">`;
                }

                return `
                <div class="filter-condition" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;" data-id="${cond.id}">
                    <select class="cond-op" style="font-weight: 600; font-size: 0.875rem; width: 70px; color: var(--primary); border:none; background:transparent;">
                        <option ${cond.logicalOp === 'IF' ? 'selected' : ''}>IF</option>
                        <option ${cond.logicalOp === 'AND' ? 'selected' : ''}>AND</option>
                        <option ${cond.logicalOp === 'OR' ? 'selected' : ''}>OR</option>
                    </select>
                    <select class="cond-field" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                        ${fields.map(f => `<option value="${f.id}" ${cond.fieldId === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
                    </select>
                    <select class="cond-comparison" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                        ${operatorOptions.replace(`>${cond.operator}<`, ` selected>${cond.operator}<`)}
                    </select>
                    ${valueInput}
                    <div style="flex-grow: 1;"></div>
                    <i data-lucide="trash-2" class="remove-cond-btn" style="color: var(--text-muted); cursor: pointer; width: 16px;"></i>
                </div>
                `;
            }).join('');
        }

        container.innerHTML = `
            <div class="filter-group" style="border-left: 3px solid var(--primary); padding-left: 12px;">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--primary); margin-bottom: 8px;">RULE GROUP 1</div>
                ${conditionsHtml}
                <button class="btn btn-secondary add-cond-btn" style="margin-top: 16px; font-size: 0.75rem;"><i data-lucide="plus"></i> Add Condition</button>
            </div>
        `;
    }

    renderSortingUI(state) {
        const sortingContainer = document.querySelector('#stage-5 .stage-content');
        if (!sortingContainer) return;

        const fields = state.currentBuilder.fields || [];

        if (fields.length === 0) {
            sortingContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">Select fields in Stage 2 to apply grouping and sorting.</div>';
            return;
        }

        const sorts = state.currentBuilder.sorts || [];
        const activeSort = sorts.length > 0 ? sorts[0] : null;

        sortingContainer.innerHTML = `
            <div class="filter-row" style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow-sm);">
                <div style="font-size: 0.875rem; font-weight: 600; margin-bottom: 12px;">Primary Sort</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <select class="sort-field" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; min-width: 200px;">
                        <option value="">-- Select Field to Sort --</option>
                        ${fields.map(f => `<option value="${f.id}" ${activeSort && activeSort.fieldId === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
                    </select>
                    <select class="sort-dir" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; min-width: 150px;">
                        <option value="asc" ${activeSort && activeSort.direction === 'asc' ? 'selected' : ''}>Ascending</option>
                        <option value="desc" ${activeSort && activeSort.direction === 'desc' ? 'selected' : ''}>Descending</option>
                    </select>
                    <i data-lucide="x" class="clear-sort-btn" style="cursor: pointer; color: var(--text-muted); width: 16px;"></i>
                </div>
            </div>
        `;
    }
}

class ReportManager {
    constructor() {
        this.init();
    }
    
    init() {
        window.appState.subscribe(state => this.updateCentreUI(state));
        this.activeRunReport = null;
    }

    generatePDF() {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                window.appToast.show('PDF Library not loaded properly', 'error');
                return;
            }
            
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(18);
            doc.text('VolPay Payment Report', 14, 22);
            
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
            
            const previewTable = document.querySelector('#preview-container table');
            
            if (previewTable) {
                doc.autoTable({
                    html: previewTable,
                    startY: 40,
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235] }, // matches var(--primary)
                    styles: { fontSize: 8, cellPadding: 4 }
                });
            } else {
                doc.text('No tabular data available for this report preview.', 14, 45);
            }
            
            doc.save('VolPay_Report_Export.pdf');
            window.appToast.show('PDF Generated Successfully', 'success');
        } catch (e) {
            console.error(e);
            window.appToast.show('Error generating PDF', 'error');
        }
    }

    openRunModal(reportName) {
        this.activeRunReport = reportName;
        
        // Infer type from catalogue
        const state = window.appState.get();
        const report = (state.catalogue || []).find(r => r.name === reportName);
        this.activeRunReportType = report ? report.type : 'core';
        
        const nameEl = document.getElementById('run-modal-report-name');
        if(nameEl) nameEl.innerText = reportName;
        
        const modal = document.getElementById('run-report-modal');
        if(modal) modal.classList.add('active');
    }

    closeRunModal() {
        this.activeRunReport = null;
        const modal = document.getElementById('run-report-modal');
        if(modal) modal.classList.remove('active');
    }

    confirmRunModal() {
        const formatSelect = document.getElementById('run-modal-format');
        const format = formatSelect ? formatSelect.value : 'csv';
        const frequencySelect = document.getElementById('run-modal-frequency');
        const frequency = frequencySelect ? frequencySelect.value : 'ad-hoc';
        
        this.queueReport(this.activeRunReport || 'Scheduled Report', this.activeRunReportType || 'core', format, frequency);
        this.closeRunModal();
        if (typeof switchView === 'function') switchView('centre');
    }

    queueReport(name = 'Ad-hoc Payment Report', type = 'core', format = 'csv', frequency = 'ad-hoc') {
        const report = {
            id: '#RP-' + Math.floor(Math.random() * 100000),
            name: name,
            type: type,
            format: format,
            frequency: frequency,
            status: frequency === 'ad-hoc' ? 'running' : 'queued',
            progress: frequency === 'ad-hoc' ? 10 : 0,
            startTime: new Date().toLocaleTimeString(),
            duration: '--'
        };
        
        window.appState.update(state => ({
            ...state,
            generatedReports: [report, ...state.generatedReports]
        }));
        
        if (frequency === 'ad-hoc') {
            window.appToast.show('Report execution started', 'info');
            window.appNotification.add('Report Running', `Job ${report.id} has started execution.`);
            this.startExecution(report.id);
        } else {
            window.appToast.show('Report queued for schedule', 'info');
            window.appNotification.add('Report Queued', `Job ${report.id} has been added to the queue.`);
        }
    }
    
    startExecution(id) {
        let progress = 10;
        const willFail = Math.random() < 0.2; // 20% chance of failure
        
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 10;
            if(progress >= 100) {
                progress = 100;
                clearInterval(interval);
                if (willFail) {
                    this.failExecution(id);
                } else {
                    this.completeExecution(id);
                }
            } else {
                window.appState.update(state => {
                    const reports = state.generatedReports.map(r => 
                        r.id === id ? { ...r, progress } : r
                    );
                    return { ...state, generatedReports: reports };
                });
            }
        }, 1000);
    }
    
    failExecution(id) {
        window.appState.update(state => {
            const reports = state.generatedReports.map(r => 
                r.id === id ? { ...r, status: 'failed', duration: '--', progress: 100 } : r
            );
            return { ...state, generatedReports: reports };
        });
        window.appToast.show(`Report ${id} execution failed`, 'error');
        window.appNotification.add('Report Failed', `Job ${id} failed to complete.`, 'error');
    }
    
    completeExecution(id) {
        window.appState.update(state => {
            const reports = state.generatedReports.map(r => 
                r.id === id ? { ...r, status: 'success', duration: '01:24', progress: 100 } : r
            );
            return { ...state, generatedReports: reports };
        });
        window.appToast.show(`Report ${id} completed successfully`, 'success');
        window.appNotification.add('Report Completed', `Job ${id} is ready for download.`, 'success');
    }
    
    updateCentreUI(state) {
        const coreTbody = document.getElementById('reports-centre-core-tbody');
        const templateTbody = document.getElementById('reports-centre-template-tbody');
        if(!coreTbody || !templateTbody) return;
        
        const generateRows = (reports) => {
            if(reports.length === 0) {
                return '<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">No executions found.</td></tr>';
            }
            return reports.map(r => {
                let statusHtml = '';
                if(r.status === 'running') statusHtml = `<span class="status-badge status-running"><i data-lucide="loader" style="width: 12px; animation: spin 2s linear infinite;"></i> Running</span>`;
                else if(r.status === 'success') statusHtml = `<span class="status-badge status-success"><i data-lucide="check" style="width: 12px;"></i> Completed</span>`;
                else if(r.status === 'queued') statusHtml = `<span class="status-badge status-queued"><i data-lucide="clock" style="width: 12px;"></i> Queued</span>`;
                else if(r.status === 'failed') statusHtml = `<span class="status-badge status-failed"><i data-lucide="alert-circle" style="width: 12px;"></i> Failed</span>`;
                
                return `
                    <tr>
                        <td style="font-family: monospace; color: var(--text-muted);">${r.id}</td>
                        <td style="font-weight: 500;">${r.name}</td>
                        <td>${statusHtml}</td>
                        <td>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${r.progress}%;"></div>
                            </div>
                        </td>
                        <td>${r.startTime}</td>
                        <td>${r.duration}</td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                ${r.status === 'success' ? `<button class="icon-btn" onclick="window.appToast.show('Downloading ${(r.format || 'csv').toUpperCase()}...', 'info')" title="Download ${(r.format || 'csv').toUpperCase()}"><i data-lucide="download"></i></button>` : ''}
                                <button class="icon-btn"><i data-lucide="file-text"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        };

        const coreReports = state.generatedReports.filter(r => r.type === 'core');
        const templateReports = state.generatedReports.filter(r => r.type === 'template');

        coreTbody.innerHTML = generateRows(coreReports);
        templateTbody.innerHTML = generateRows(templateReports);
        
        // Update Stats
        const statRunning = document.getElementById('stat-running');
        if(statRunning) statRunning.innerText = state.generatedReports.filter(r => r.status === 'running').length;
        const statQueued = document.getElementById('stat-queued');
        if(statQueued) statQueued.innerText = state.generatedReports.filter(r => r.status === 'queued').length;
        const statCompleted = document.getElementById('stat-completed');
        if(statCompleted) statCompleted.innerText = state.generatedReports.filter(r => r.status === 'success').length;
        const statFailed = document.getElementById('stat-failed');
        if(statFailed) statFailed.innerText = state.generatedReports.filter(r => r.status === 'failed').length;

        lucide.createIcons();
    }
}

// Add this helper method to BuilderManager outside the replace chunks since it needs to be an instance method
BuilderManager.prototype.setDataset = function(datasetName) {
    window.appHistory.pushState();
    
    // Find the core report
    const state = window.appState.get();
    const coreReport = (state.catalogue || []).find(r => r.name === datasetName && r.type === 'core');
    
    let loadedFields = [];
    if (coreReport && coreReport.fields && coreReport.fields.length > 0) {
        loadedFields = [...coreReport.fields];
        this.availableFields = [...coreReport.fields];
    } else {
        // Fallback for mock datasets - generate some mock fields to show
        const mockFields = [
            { id: 'mock1', label: 'Transaction Reference', type: 'string', category: 'Identifiers' },
            { id: 'mock2', label: 'Amount', type: 'number', category: 'Amounts' },
            { id: 'mock3', label: 'Currency', type: 'string', category: 'Amounts' },
            { id: 'mock4', label: 'Value Date', type: 'date', category: 'Dates' },
            { id: 'mock5', label: 'Status', type: 'string', category: 'Status' }
        ];
        loadedFields = []; // None selected by default
        this.availableFields = mockFields;
    }

    // Force re-render of fields list
    this.renderFieldsList();

    window.appState.update(s => ({
        ...s,
        currentBuilder: { 
            ...s.currentBuilder, 
            dataset: datasetName,
            fields: loadedFields
        }
    }));
    window.appToast.show(`Base report changed to ${datasetName}`);
    this.setWizardStep('template', 2);
};







window.appBuilderManager = new BuilderManager();
window.appReportManager = new ReportManager();
