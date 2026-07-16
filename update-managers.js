const fs = require('fs');
let code = fs.readFileSync('js/Managers.js', 'utf8');

const dbSchemas = `
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
`;

code = code.replace('class BuilderManager {', dbSchemas + '\nclass BuilderManager {');

const injectUpdateUI = `
        const s1ds = document.getElementById('stage-1-datasets');
        const s1cdb = document.getElementById('stage-1-core-db');
        const s2fe = document.getElementById('stage-2-field-explorer');
        const s2ca = document.getElementById('stage-2-core-arrange');
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(s1cdb) s1cdb.style.display = 'block';
            if(s2fe) s2fe.style.display = 'none';
            if(s2ca) s2ca.style.display = 'block';
            
            // Render DB Trees
            this.renderDBTree('core-banking', ENTERPRISE_DB.core_banking, state);
            this.renderDBTree('payment-engine', ENTERPRISE_DB.payment_engine, state);
            
            // Render Selected Fields Tray
            const tray = document.getElementById('core-db-selected-tray');
            const count = document.getElementById('core-db-selected-count');
            if(tray && count) {
                count.innerText = state.currentBuilder.fields.length;
                if(state.currentBuilder.fields.length === 0) {
                    tray.innerHTML = '<div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 8px;">Select fields from the databases above...</div>';
                } else {
                    tray.innerHTML = state.currentBuilder.fields.map(f => \`
                        <div class="db-field-pill">
                            <span>\${f.name}</span>
                            <i data-lucide="x" class="remove-pill" onclick="window.appBuilderManager.removeField('\${f.id}')" style="width:14px;"></i>
                        </div>
                    \`).join('');
                }
            }
            
            // Render Arrange List
            const arrangeList = document.getElementById('core-arrange-list');
            if(arrangeList) {
                if(state.currentBuilder.fields.length === 0) {
                    arrangeList.innerHTML = '<div style="padding: 16px; color: var(--text-muted); text-align: center; font-size: 0.875rem;">No fields selected to arrange.</div>';
                } else {
                    arrangeList.innerHTML = state.currentBuilder.fields.map((f, idx) => \`
                        <div class="arrange-item" draggable="true" data-index="\${idx}">
                            <i data-lucide="grip-vertical" class="arrange-handle"></i>
                            <span style="font-size: 0.875rem; font-weight: 500;">\${f.name}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">\${f.category || 'Database Field'}</span>
                        </div>
                    \`).join('');
                }
            }
            lucide.createIcons();
        } else {
            if(s1ds) s1ds.style.display = 'block';
            if(s1cdb) s1cdb.style.display = 'none';
            if(s2fe) s2fe.style.display = 'block';
            if(s2ca) s2ca.style.display = 'none';
        }
`;

const updateUITarget = 'this.renderFiltersUI(state);';
code = code.replace(updateUITarget, updateUITarget + '\n' + injectUpdateUI);

const injectMethods = `
    clearAllFields() {
        window.appState.update(state => ({
            ...state,
            currentBuilder: { ...state.currentBuilder, fields: [] }
        }));
    }

    renderDBTree(dbId, dbData, state) {
        const container = document.getElementById('tree-' + dbId);
        if(!container) return;
        
        let html = '';
        dbData.forEach(cat => {
            html += \`
                <div class="db-category">
                    <div class="db-category-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                        <i data-lucide="folder" style="width: 16px;"></i> \${cat.name}
                    </div>
                    <div class="db-category-content" style="display: none;">
            \`;
            
            cat.tables.forEach(table => {
                html += \`
                    <div class="db-table">
                        <div class="db-table-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                            <i data-lucide="table" style="width: 14px;"></i> \${table.name}
                        </div>
                        <div class="db-fields" style="display: none;">
                \`;
                
                table.fields.forEach(field => {
                    const fieldId = table.name + '.' + field;
                    const isSelected = state.currentBuilder.fields.some(f => f.id === fieldId);
                    
                    html += \`
                        <div class="db-field-item \${isSelected ? 'selected' : ''}" onclick="window.appBuilderManager.toggleDBField('\${fieldId}', '\${field}', '\${table.name}')">
                            <i data-lucide="\${isSelected ? 'check-circle' : 'circle'}" style="width: 12px;"></i> \${field}
                        </div>
                    \`;
                });
                
                html += \`
                        </div>
                    </div>
                \`;
            });
            
            html += \`
                    </div>
                </div>
            \`;
        });
        
        // Only update innerHTML if it's empty to preserve open/close state of tree, or we just redraw for simplicity
        // But redrawing collapses everything. To fix this, we can store expanded state, but for a prototype, we just render.
        // Actually, we shouldn't re-render the whole tree on every field click if we want to keep it expanded.
        // We will just do a lightweight update instead of full HTML replace if it already has content.
        if (container.innerHTML.trim() === '' || container.dataset.rendered !== 'true') {
            container.innerHTML = html;
            container.dataset.rendered = 'true';
        } else {
            // Just update selected states
            container.querySelectorAll('.db-field-item').forEach(item => {
                const match = item.getAttribute('onclick').match(/'([^']+)'/);
                if (match && match[1]) {
                    const fid = match[1];
                    const isSel = state.currentBuilder.fields.some(f => f.id === fid);
                    if (isSel) {
                        item.classList.add('selected');
                        item.querySelector('i').setAttribute('data-lucide', 'check-circle');
                    } else {
                        item.classList.remove('selected');
                        item.querySelector('i').setAttribute('data-lucide', 'circle');
                    }
                }
            });
        }
    }
    
    toggleDBField(id, name, tableName) {
        const state = window.appState.get();
        const exists = state.currentBuilder.fields.some(f => f.id === id);
        if (exists) {
            this.removeField(id);
        } else {
            const newField = {
                id: id,
                name: name,
                category: tableName,
                type: 'string', // default
                format: 'Text'
            };
            window.appState.update(s => {
                return { ...s, currentBuilder: { ...s.currentBuilder, fields: [...s.currentBuilder.fields, newField] } };
            });
        }
    }
`;

code = code.replace('startNewReport(mode = \'template\', baseReportName = \'\') {', injectMethods + '\n    startNewReport(mode = \'template\', baseReportName = \'\') {');

fs.writeFileSync('js/Managers.js', code);
console.log('Managers.js updated.');
