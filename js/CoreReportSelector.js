class CoreReportSelector {
    constructor() {
        this.databases = {
            'Master Data': [
                { name: 'CUSTOMER_MASTER', fields: ['CUSTOMER_ID', 'FIRST_NAME', 'LAST_NAME', 'DOB', 'KYC_STATUS', 'ONBOARDING_DATE', 'RISK_SCORE'] },
                { name: 'ACCOUNT_MASTER', fields: ['ACCOUNT_ID', 'CUSTOMER_ID', 'ACCOUNT_TYPE', 'CURRENCY', 'STATUS', 'OPEN_DATE'] },
                { name: 'BANK_DIRECTORY', fields: ['BIC', 'BANK_NAME', 'COUNTRY', 'REGION'] }
            ],
            'Payments': [
                { name: 'PAYMENT_TRANSACTION', fields: ['TRX_ID', 'MESSAGE_ID', 'DEBTOR_ACCOUNT', 'CREDITOR_ACCOUNT', 'AMOUNT', 'CURRENCY', 'STATUS', 'VALUE_DATE'] },
                { name: 'PAYMENT_CHARGE', fields: ['TRX_ID', 'FEE_AMOUNT', 'TAX_AMOUNT', 'CHARGE_BEARER'] }
            ],
            'Payment Messages': [
                { name: 'PACS008', fields: ['MSG_ID', 'INSTR_ID', 'END_TO_END_ID', 'SETTLEMENT_AMT', 'SETTLEMENT_CUR', 'CHARGE_BEARER', 'INSTR_PRTY'] },
                { name: 'PACS009', fields: ['MSG_ID', 'INSTR_ID', 'END_TO_END_ID', 'SETTLEMENT_AMT', 'SETTLEMENT_CUR'] },
                { name: 'CAMT054', fields: ['MSG_ID', 'ACCT_ID', 'NTFCTN_ID', 'AMT', 'CRDT_DBT_IND'] }
            ],
            'Routing': [
                { name: 'ROUTING_RULE', fields: ['RULE_ID', 'PRIORITY', 'CHANNEL', 'CUTOFF_TIME', 'NETWORK'] },
                { name: 'DELIVERY_LOG', fields: ['DELIVERY_ID', 'TRX_ID', 'STATUS', 'TIMESTAMP', 'ACK_NACK'] }
            ],
            'Settlement': [
                { name: 'SETTLEMENT_POSITION', fields: ['POSITION_ID', 'ACCOUNT', 'BALANCE', 'AS_OF_DATE'] },
                { name: 'NOSTRO_VOSTRO', fields: ['ACCT_ID', 'BANK_BIC', 'TYPE', 'LEDGER_BAL', 'AVAIL_BAL'] }
            ],
            'Exceptions': [
                { name: 'REPAIR_QUEUE', fields: ['CASE_ID', 'TRX_ID', 'ERROR_CODE', 'ASSIGNED_TO', 'STATUS', 'AGE'] },
                { name: 'EXCEPTION_LOG', fields: ['LOG_ID', 'TRX_ID', 'SEVERITY', 'DESCRIPTION', 'TIMESTAMP'] }
            ],
            'Compliance': [
                { name: 'SANCTION_SCREENING', fields: ['SCREENING_ID', 'TRX_ID', 'MATCH_SCORE', 'HIT_TYPE', 'RESULT', 'ANALYST'] },
                { name: 'AML_ALERT', fields: ['ALERT_ID', 'TRX_ID', 'RISK_LEVEL', 'STATUS'] }
            ]
        };
        
        // e.g. [{ dbName: 'Payments', instanceId: 'db_xyz' }]
        this.activeDatabaseSections = [];
    }

    init() {
        this.container = document.getElementById('core-databases-container');
        this.selectedCountEl = document.getElementById('core-db-selected-count');
        this.arrangeList = document.getElementById('core-arrange-list');
        this.emptyMsg = document.getElementById('core-db-empty-msg');

        if (this.arrangeList) {
            let draggedIndex = null;
            this.arrangeList.addEventListener('dragstart', (e) => {
                const item = e.target.closest('.arrange-item');
                if(!item) return;
                draggedIndex = parseInt(item.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
                item.style.opacity = '0.4';
            });
            this.arrangeList.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const item = e.target.closest('.arrange-item');
                if(item) {
                    item.style.borderTop = '2px solid var(--primary)';
                }
            });
            this.arrangeList.addEventListener('dragleave', (e) => {
                const item = e.target.closest('.arrange-item');
                if(item) {
                    item.style.borderTop = 'none';
                }
            });
            this.arrangeList.addEventListener('drop', (e) => {
                e.preventDefault();
                const item = e.target.closest('.arrange-item');
                if(item) item.style.borderTop = 'none';
                
                if(draggedIndex === null) return;
                const dropIndex = item ? parseInt(item.dataset.index) : window.appState.get().currentBuilder.fields.length;
                if(draggedIndex === dropIndex) return;
                
                const state = window.appState.get();
                const fields = [...(state.currentBuilder.fields || [])];
                const [moved] = fields.splice(draggedIndex, 1);
                fields.splice(dropIndex, 0, moved);
                
                window.appState.update(s => ({ ...s, currentBuilder: { ...s.currentBuilder, fields } }));
            });
            this.arrangeList.addEventListener('dragend', (e) => {
                const item = e.target.closest('.arrange-item');
                if(item) item.style.opacity = '1';
                this.arrangeList.querySelectorAll('.arrange-item').forEach(el => el.style.borderTop = 'none');
            });
        }

    }

    addDatabase() {
        if (!this.container) return;
        const availableDbNames = Object.keys(this.databases);
        if (availableDbNames.length === 0) return;
        
        const instanceId = 'db_sect_' + Math.random().toString(36).substr(2, 9);
        // Default to the first DB
        this.activeDatabaseSections.push({ dbName: '', instanceId });
        this.renderDatabaseSections();
    }

    changeDatabaseSelection(instanceId, newDbName) {
        const section = this.activeDatabaseSections.find(s => s.instanceId === instanceId);
        if (section) {
            section.dbName = newDbName;
            this.renderDatabaseSections();
        }
    }

    removeDatabase(instanceId) {
        this.activeDatabaseSections = this.activeDatabaseSections.filter(s => s.instanceId !== instanceId);
        this.renderDatabaseSections();
    }

    renderDatabaseSections() {
        if (!this.container) return;
        
        let html = '';
        const allDbNames = Object.keys(this.databases);
        const state = window.appState.get();
        const selectedFields = state.currentBuilder.fields || [];

        this.activeDatabaseSections.forEach((section) => {
            const tables = section.dbName ? (this.databases[section.dbName] || []) : [];
            
            // Generate DB Select options
            const dbOptions = '<option value="" disabled ' + (!section.dbName ? 'selected' : '') + '>Select Database...</option>' + 
                allDbNames.filter(name => {
                    return name === section.dbName || !this.activeDatabaseSections.some(s => s.instanceId !== section.instanceId && s.dbName === name);
                }).map(name => {
                    return `<option value="${name}" ${name === section.dbName ? 'selected' : ''}>${name}</option>`;
                }).join('');

            html += `
                <div class="db-section-card" data-instance-id="${section.instanceId}" style="border: 1px solid var(--border-color); border-radius: 8px; background: #fff; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: box-shadow 0.2s;">
                    <!-- Header with Dropdown -->
                    <div style="padding: 12px 16px; border-bottom: ${tables.length > 0 ? '1px solid var(--border-color)' : 'none'}; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                            <div style="background: #e0e7ff; color: #4338ca; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="database" style="width: 16px; height: 16px;"></i>
                            </div>
                            <select class="form-control" style="font-weight: 500; flex-grow: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #fff; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; font-size: 0.9rem;" onchange="window.appCoreReportSelector.changeDatabaseSelection('${section.instanceId}', this.value)">
                                ${dbOptions}
                            </select>
                        </div>
                        <button class="icon-btn" style="margin-left: 12px; color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2;" onclick="window.appCoreReportSelector.removeDatabase('${section.instanceId}')" title="Remove Database"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                    </div>

                    <!-- Tables Accordion -->
                    ${tables.length > 0 ? `
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        ${tables.map(table => {
                            let selectedCount = 0;
                            table.fields.forEach(f => {
                                if (selectedFields.some(sf => sf.id === section.dbName + '.' + table.name + '.' + f)) {
                                    selectedCount++;
                                }
                            });

                            return `
                                <div class="table-accordion-card" data-table="${table.name}" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s;">
                                    <div class="table-accordion-header" style="padding: 12px 16px; background: #fcfcfd; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;" onclick="window.appCoreReportSelector.toggleTable(this)">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <i data-lucide="chevron-right" class="chevron-icon" style="transition: transform 0.2s; color: #94a3b8; width: 16px; height: 16px;"></i>
                                            <i data-lucide="table" style="width: 16px; color: #64748b;"></i>
                                            <span style="font-weight: 600; font-size: 0.875rem; color: #334155;">${table.name}</span>
                                        </div>
                                        ${selectedCount > 0 ? `<span class="badge" style="background: #3b82f6; color: #ffffff; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: 600; flex-shrink: 0;">${selectedCount}</span>` : ''}
                                    </div>
                                    <div class="table-accordion-content" style="display: none; padding: 12px 16px 16px 42px; border-top: 1px solid #e2e8f0; background: #ffffff;">
                                        <div style="display: flex; flex-direction: column; gap: 6px;">
                                            ${table.fields.map(field => {
                                                const fieldId = section.dbName + '.' + table.name + '.' + field;
                                                const isSelected = selectedFields.some(sf => sf.id === fieldId);
                                                return `
                                                    <div class="db-field-pill ${isSelected ? 'selected' : ''}" style="cursor: pointer; user-select: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 6px 10px; border-radius: 6px; border: 1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}; background: ${isSelected ? '#eff6ff' : '#f8fafc'}; color: ${isSelected ? '#1d4ed8' : '#475569'}; font-size: 0.85rem; font-weight: 500; transition: all 0.15s;" onclick="window.appCoreReportSelector.toggleField('${section.dbName}', '${table.name}', '${field}')" title="${field}">
                                                        ${field}
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        this.container.innerHTML = html;
        lucide.createIcons();
    }
    toggleTable(headerEl) {
        const content = headerEl.nextElementSibling;
        const icon = headerEl.querySelector('.chevron-icon');
        const card = headerEl.closest('.table-accordion-card');
        const container = headerEl.closest('.db-section-card').querySelector('div[style*="flex-direction: column"]');
        
        const isCurrentlyOpen = content.style.display === 'block';
        
        // Close all other tables in THIS database section
        container.querySelectorAll('.table-accordion-content').forEach(c => c.style.display = 'none');
        container.querySelectorAll('.chevron-icon').forEach(i => i.style.transform = 'rotate(0deg)');
        container.querySelectorAll('.table-accordion-card').forEach(c => c.style.borderColor = 'var(--border-color)');
        container.querySelectorAll('.table-accordion-header').forEach(h => h.style.background = 'var(--bg-panel)');
        
        if (!isCurrentlyOpen) {
            content.style.display = 'block';
            icon.style.transform = 'rotate(90deg)';
            card.style.borderColor = 'var(--primary)';
            headerEl.style.background = '#eff6ff';
        }
    }

    toggleField(dbName, tableName, fieldName) {
        const state = window.appState.get();
        const fieldId = dbName + '.' + tableName + '.' + fieldName;
        const fields = state.currentBuilder.fields || [];
        
        const existsIndex = fields.findIndex(f => f.id === fieldId);
        let newFields;
        if (existsIndex >= 0) {
            newFields = [...fields];
            newFields.splice(existsIndex, 1);
        } else {
            const newField = {
                id: fieldId,
                name: fieldName,
                tableName: tableName,
                dbName: dbName,
                category: tableName,
                label: fieldName,
                type: (function() {
                    const ln = fieldName.toLowerCase();
                    if (ln.includes('date') || ln.includes('dob') || ln.includes('timestamp')) return 'date';
                    if (ln.includes('amount') || ln.includes('tax') || ln.includes('fee') || ln.includes('bal') || ln.includes('score')) return 'number';
                    return 'string';
                })(),
                format: 'Text'
            };
            newFields = [...fields, newField];
        }
        
        window.appState.update(s => ({
            ...s,
            currentBuilder: { ...s.currentBuilder, fields: newFields }
        }));
    }

    clearAllFields() {
        window.appState.update(s => ({
            ...s,
            currentBuilder: { ...s.currentBuilder, fields: [] }
        }));
    }

    // Called from BuilderManager.updateUI whenever state changes
    updateUI(state) {
        if (state.currentBuilder.mode !== 'core') return;
        
        const fields = state.currentBuilder.fields || [];
        
        // 1. Re-render the database sections (preserves structure but we need a smarter way if we don't want accordions to collapse)
        // To prevent full collapse on every click, we will ONLY update the pills and badges.
        this.activeDatabaseSections.forEach((section) => {
            const sectionCard = this.container.querySelector(`.db-section-card[data-instance-id="${section.instanceId}"]`);
            if (sectionCard) {
                // Update table badges
                const tables = this.databases[section.dbName] || [];
                tables.forEach(table => {
                    const tableCard = sectionCard.querySelector(`.table-accordion-card[data-table="${table.name}"]`);
                    if (tableCard) {
                        const header = tableCard.querySelector('.table-accordion-header');
                        let selectedCount = 0;
                        table.fields.forEach(f => {
                            const fid = section.dbName + '.' + table.name + '.' + f;
                            const pill = tableCard.querySelector(`[onclick*="'${f}'"]`); // simplistic selector
                            const isSelected = fields.some(sf => sf.id === fid);
                            
                            if (isSelected) {
                                selectedCount++;
                                if(pill) {
                                    pill.classList.add('selected');
                                    pill.style.background = '#eff6ff';
                                    pill.style.color = '#1d4ed8';
                                    pill.style.borderColor = '#bfdbfe';
                                }
                            } else {
                                if(pill) {
                                    pill.classList.remove('selected');
                                    pill.style.background = '#f8fafc';
                                    pill.style.color = '#475569';
                                    pill.style.borderColor = '#e2e8f0';
                                }
                            }
                        });
                        
                        // Update badge
                        let badge = header.querySelector('.badge');
                        if (selectedCount > 0) {
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.className = 'badge';
                                badge.style.cssText = 'background: #3b82f6; color: #ffffff; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: 600; flex-shrink: 0;';
                                header.appendChild(badge);
                            }
                            badge.textContent = `${selectedCount}`;
                        } else if (badge) {
                            badge.remove();
                        }
                    }
                });
            }
        });
        
        // 2. Render bottom "Selected Fields" list
        if (this.selectedCountEl) this.selectedCountEl.innerText = fields.length;
        
        if (this.arrangeList) {
            if (fields.length === 0) {
                this.arrangeList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 16px;" id="core-db-empty-msg">No fields selected yet.</div>';
            } else {
                this.arrangeList.innerHTML = fields.map((f, idx) => `
                    <div class="arrange-item" draggable="true" data-index="${idx}" onmouseover="window.appCoreReportSelector.highlightTable('${f.dbName}', '${f.tableName}')" onmouseout="window.appCoreReportSelector.unhighlightTable('${f.dbName}', '${f.tableName}')">
                        <i data-lucide="grip-vertical" class="arrange-handle"></i>
                        <div style="flex-grow: 1;">
                            <div style="font-weight: 500; font-size: 0.875rem;">${f.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);"><i data-lucide="database" style="width: 10px; margin-right: 2px;"></i>${f.dbName} <i data-lucide="chevron-right" style="width: 10px; margin: 0 2px;"></i> <i data-lucide="table" style="width: 10px; margin-right: 2px;"></i>${f.tableName}</div>
                        </div>
                        <i data-lucide="x" class="remove-pill" style="cursor: pointer; color: var(--text-muted);" onclick="window.appBuilderManager.removeField('${f.id}')"></i>
                    </div>
                `).join('');
                lucide.createIcons();
            }
        }
    }

    highlightTable(dbName, tableName) {
        this.activeDatabaseSections.forEach((section) => {
            if (section.dbName === dbName) {
                const sectionCard = this.container.querySelector(`.db-section-card[data-instance-id="${section.instanceId}"]`);
                if (sectionCard) {
                    const tableCard = sectionCard.querySelector(`.table-accordion-card[data-table="${tableName}"]`);
                    if (tableCard) {
                        tableCard.style.boxShadow = '0 0 0 2px var(--primary)';
                        tableCard.style.backgroundColor = '#fef08a'; // light yellow highlight
                        tableCard.style.transition = 'all 0.2s';
                    }
                }
            }
        });
    }

    unhighlightTable(dbName, tableName) {
        this.activeDatabaseSections.forEach((section) => {
            if (section.dbName === dbName) {
                const sectionCard = this.container.querySelector(`.db-section-card[data-instance-id="${section.instanceId}"]`);
                if (sectionCard) {
                    const tableCard = sectionCard.querySelector(`.table-accordion-card[data-table="${tableName}"]`);
                    if (tableCard) {
                        tableCard.style.boxShadow = 'none';
                        tableCard.style.backgroundColor = '';
                    }
                }
            }
        });
    }
}

window.appCoreReportSelector = new CoreReportSelector();
