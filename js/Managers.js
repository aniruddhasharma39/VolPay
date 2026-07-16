// Builder and Report Managers

class BuilderManager {
    constructor() {
        this.currentCategory = 'All Fields';
        this.searchQuery = '';
        
        this.availableFields = [
            // Identifiers
            { id: 'trn', label: 'Transaction Reference (TRN)', type: 'string', key: true, category: 'Identifiers' },
            { id: 'uetr', label: 'UETR', type: 'string', key: true, category: 'Identifiers' },
            { id: 'endToEndId', label: 'End-to-End ID', type: 'string', category: 'Identifiers' },
            { id: 'instructionId', label: 'Instruction ID', type: 'string', category: 'Identifiers' },
            { id: 'clearingSystemRef', label: 'Clearing System Ref', type: 'string', category: 'Identifiers' },
            
            // Amounts & Currency
            { id: 'instructedAmount', label: 'Instructed Amount', type: 'number', category: 'Amounts & Currency' },
            { id: 'instructedCurrency', label: 'Instructed Currency', type: 'string', category: 'Amounts & Currency' },
            { id: 'settlementAmount', label: 'Settlement Amount', type: 'number', category: 'Amounts & Currency' },
            { id: 'settlementCurrency', label: 'Settlement Currency', type: 'string', category: 'Amounts & Currency' },
            { id: 'exchangeRate', label: 'Exchange Rate', type: 'number', category: 'Amounts & Currency' },
            { id: 'chargeAmount', label: 'Charge Amount', type: 'number', category: 'Amounts & Currency' },
            
            // Parties
            { id: 'debtorName', label: 'Debtor Name', type: 'string', pii: true, category: 'Parties' },
            { id: 'debtorAccount', label: 'Debtor Account', type: 'string', pii: true, category: 'Parties' },
            { id: 'debtorAgent', label: 'Debtor Agent (BIC)', type: 'string', category: 'Parties' },
            { id: 'creditorName', label: 'Creditor Name', type: 'string', pii: true, category: 'Parties' },
            { id: 'creditorAccount', label: 'Creditor Account', type: 'string', pii: true, category: 'Parties' },
            { id: 'creditorAgent', label: 'Creditor Agent (BIC)', type: 'string', category: 'Parties' },
            { id: 'instructingAgent', label: 'Instructing Agent', type: 'string', category: 'Parties' },
            { id: 'instructedAgent', label: 'Instructed Agent', type: 'string', category: 'Parties' },
            
            // Status & Routing
            { id: 'rail', label: 'Payment Rail', type: 'string', category: 'Status & Routing' },
            { id: 'status', label: 'Status', type: 'string', category: 'Status & Routing' },
            { id: 'reasonCode', label: 'Reason Code', type: 'string', category: 'Status & Routing' },
            { id: 'messageType', label: 'Message Type', type: 'string', category: 'Status & Routing' },
            { id: 'direction', label: 'Direction', type: 'string', category: 'Status & Routing' },
            { id: 'priority', label: 'Priority', type: 'string', category: 'Status & Routing' },
            { id: 'repairQueue', label: 'Repair Queue', type: 'string', category: 'Status & Routing' },
            
            // Dates & Timestamps
            { id: 'valueDate', label: 'Value Date', type: 'date', category: 'Dates & Timestamps' },
            { id: 'businessDate', label: 'Business Date', type: 'date', category: 'Dates & Timestamps' },
            { id: 'settlementDate', label: 'Settlement Date', type: 'date', category: 'Dates & Timestamps' },
            { id: 'creationTimestamp', label: 'Creation Timestamp', type: 'date', category: 'Dates & Timestamps' },
            { id: 'lastUpdateTimestamp', label: 'Last Update Timestamp', type: 'date', category: 'Dates & Timestamps' }
        ];
    }

    init() {
        // Subscribe to state changes to update builder UI
        window.appState.subscribe(state => this.updateUI(state));
        this.bindEvents();
        this.renderFieldsList();
        
        // Ensure builder mode state defaults
        if(!window.appState.get().currentBuilder.mode) {
            window.appState.update(s => ({
                currentBuilder: { ...s.currentBuilder, mode: 'core' }
            }));
        } else {
            this.updateUI(window.appState.get());
        }
    }

    startNewReport(mode, baseReportName = null) {
        window.appHistory.pushState();
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
                mode: mode
            }
        }));
        
        const nameInput = document.getElementById('report-name-input');
        if(nameInput) nameInput.value = '';
        
        if (typeof switchView === 'function') switchView('builder');
        if (typeof toggleStage === 'function') toggleStage(1);
    }

    bindEvents() {
        // Dataset selection
        document.querySelectorAll('.dataset-card').forEach(card => {
            card.addEventListener('click', (e) => {
                try {
                    if (e.target.closest('[data-lucide="star"]')) return;
                    const datasetName = card.querySelector('.dataset-title').textContent.trim();
                    window.appHistory.pushState();
                    window.appState.update(state => {
                        const currentBuilder = { ...state.currentBuilder, dataset: datasetName };
                        return { ...state, currentBuilder };
                    });
                    window.appToast.show(`Dataset changed to ${datasetName}`);
                    if (typeof toggleStage === 'function') toggleStage(2); // Auto open Fields Stage
                } catch(err) {
                    alert('Error selecting dataset: ' + err.message + '\n' + err.stack);
                }
            });
        });

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
            } else if (btn.innerText.includes('Save Draft')) {
                btn.addEventListener('click', () => window.appToast.show('Draft Saved successfully', 'success'));
            }
        });
        
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

    updateUI(state) {
        // Update Builder Header Mode
        const modeBadge = document.getElementById('builder-mode-badge');
        const dsSection = document.getElementById('stage-1-datasets');
        const tmplSection = document.getElementById('stage-1-templates');
        
        if (state.currentBuilder.mode === 'core') {
            if (modeBadge) {
                modeBadge.innerText = 'Core Report';
                modeBadge.style.color = 'var(--primary)';
                modeBadge.style.background = '#eff6ff';
                modeBadge.style.padding = '2px 8px';
                modeBadge.style.borderRadius = '12px';
            }
            if (dsSection) dsSection.style.display = 'block';
            if (tmplSection) tmplSection.style.display = 'none';
        } else {
            if (modeBadge) {
                modeBadge.innerText = 'Template';
                modeBadge.style.color = 'var(--warning)';
                modeBadge.style.background = '#fef3c7';
                modeBadge.style.padding = '2px 8px';
                modeBadge.style.borderRadius = '12px';
            }
            if (dsSection) dsSection.style.display = 'none';
            if (tmplSection) tmplSection.style.display = 'block';
            
            // Populate Template Grid dynamically
            const grid = document.getElementById('core-reports-grid');
            if (grid) {
                const coreReportsList = ['Daily SWIFT Outbound', 'Repair Queue Aging', 'Nostro Balance Projections'];
                grid.innerHTML = coreReportsList.map(name => `
                    <div class="dataset-card ${state.currentBuilder.dataset === name ? 'selected' : ''}" onclick="window.appBuilderManager.setDataset('${name}')">
                        <div class="dataset-header">
                            <div class="dataset-icon" style="color: var(--primary); background: #eff6ff;"><i data-lucide="file-bar-chart-2"></i></div>
                        </div>
                        <div class="dataset-title">${name}</div>
                    </div>
                `).join('');
                lucide.createIcons();
            }
        }

        // Render available fields to reflect pinning changes
        this.renderFieldsList();

        // Update Dataset Selection visually
        const datasetCards = document.querySelectorAll('#stage-1-datasets .dataset-card');
        if(datasetCards.length > 0 && state.currentBuilder.dataset && state.currentBuilder.mode === 'core') {
            datasetCards.forEach(c => c.classList.remove('selected'));
            const selectedCard = Array.from(datasetCards).find(c => {
                const title = c.querySelector('.dataset-title');
                return title && title.textContent.trim() === state.currentBuilder.dataset;
            });
            if(selectedCard) selectedCard.classList.add('selected');
        }

        const fields = state.currentBuilder.fields || [];

        // Update Selected Fields UI
        const selectedContainer = document.getElementById('selected-fields-list');
        if (selectedContainer) {
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

            // Bind Removes
            selectedContainer.querySelectorAll('.remove-field-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const fieldId = e.target.closest('.selected-card').dataset.id;
                    this.removeField(fieldId);
                });
            });

            // Update counts in UI
            const countEl = document.getElementById('selected-fields-count');
            if(countEl) countEl.innerText = fields.length;
            
            // Render Stage 3 Filters UI
            this.renderFiltersUI(state);
            
            // Render Stage 4 Conditions UI
            this.renderConditionsUI(state);

            // Render Stage 5 Sorting UI
            this.renderSortingUI(state);

            // Update Summary Panel
            const summaryFieldsCount = document.getElementById('summary-fields-count');
            if(summaryFieldsCount) summaryFieldsCount.innerText = `${fields.length} Columns`;
            
            const summaryFiltersCount = document.getElementById('summary-filters-count');
            const totalFilters = Object.values(state.currentBuilder.filters || {}).reduce((acc, arr) => acc + arr.length, 0);
            if(summaryFiltersCount) summaryFiltersCount.innerText = `${totalFilters} Active`;
            
            const summaryConditionsCount = document.getElementById('summary-conditions-count');
            if(summaryConditionsCount) summaryConditionsCount.innerText = `${(state.currentBuilder.conditions || []).length} Rules`;
            
            const summarySortsCount = document.getElementById('summary-sorts-count');
            if(summarySortsCount) {
                const activeSort = (state.currentBuilder.sorts || [])[0];
                summarySortsCount.innerText = activeSort && activeSort.fieldId ? 'Active' : 'None';
            }
        }
        
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
                inputHtml = `
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <input type="number" class="range-num-min" value="0" style="width: 70px; padding: 4px; border: 1px solid var(--border-color); border-radius: 4px;" oninput="
                            const range = this.parentNode.querySelector('.filter-input-min');
                            range.value = this.value;
                            this.parentNode.querySelector('#fill-${f.id}').style.left = (this.value / range.max * 100) + '%';
                        ">
                        <div class="range-slider-container">
                            <div class="range-slider-track"></div>
                            <div class="range-slider-fill" id="fill-${f.id}"></div>
                            <input type="range" class="range-slider-input filter-input-min" min="0" max="${maxVal}" value="0" oninput="
                                const max = this.parentNode.querySelector('.filter-input-max');
                                const numMin = this.parentNode.querySelector('.range-num-min');
                                if(parseFloat(this.value) > parseFloat(max.value)) this.value = max.value;
                                numMin.value = this.value;
                                this.parentNode.querySelector('#fill-${f.id}').style.left = (this.value / this.max * 100) + '%';
                            ">
                            <input type="range" class="range-slider-input filter-input-max" min="0" max="${maxVal}" value="${maxVal}" oninput="
                                const min = this.parentNode.querySelector('.filter-input-min');
                                const numMax = this.parentNode.querySelector('.range-num-max');
                                if(parseFloat(this.value) < parseFloat(min.value)) this.value = min.value;
                                numMax.value = this.value;
                                this.parentNode.querySelector('#fill-${f.id}').style.right = (100 - (this.value / this.max * 100)) + '%';
                            ">
                            <input type="hidden" class="filter-input">
                        </div>
                        <input type="number" class="range-num-max" value="${maxVal}" style="width: 70px; padding: 4px; border: 1px solid var(--border-color); border-radius: 4px;" oninput="
                            const range = this.parentNode.querySelector('.filter-input-max');
                            range.value = this.value;
                            this.parentNode.querySelector('#fill-${f.id}').style.right = (100 - (this.value / range.max * 100)) + '%';
                        ">
                    </div>
                `;
            } else if (f.type === 'date') {
                inputHtml = `<input type="date" class="filter-input" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">`;
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
                <div class="filter-row" data-id="${f.id}" style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="${f.type === 'number' ? 'hash' : f.type === 'date' ? 'calendar' : 'type'}" style="color: var(--text-muted); width: 16px;"></i>
                            <span style="font-weight: 600;">${f.label}</span>
                            <span class="badge badge-type">${f.type}</span>
                        </div>
                        <button class="btn btn-secondary remove-all-filters-btn" style="font-size: 0.75rem; padding: 4px 8px;">Clear</button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: var(--bg-workspace); padding: 12px; border-radius: 8px; min-height: 50px;">
                        ${pillsHtml}
                        <div style="display: flex; gap: 8px; margin-left: 8px; align-items: center;">
                            ${inputHtml}
                            <button class="btn btn-primary add-filter-val-btn" style="padding: 6px 12px;" onclick="
                                const row = this.closest('.filter-row');
                                const minInp = row.querySelector('.range-num-min');
                                const maxInp = row.querySelector('.range-num-max');
                                const inp = row.querySelector('.filter-input');
                                let val = '';
                                if(minInp && maxInp) {
                                    val = minInp.value + ' - ' + maxInp.value;
                                } else if (inp) {
                                    val = inp.value;
                                }
                                if(val) {
                                    window.appBuilderManager.addFilterValue('${f.id}', val);
                                    if(inp) inp.value = '';
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
                    operatorOptions = '<option>Equals</option><option>Greater Than</option><option>Less Than</option>';
                    valueInput = `<input type="number" class="cond-val" value="${cond.value || ''}" placeholder="0" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">`;
                } else if(selectedField.type === 'date') {
                    operatorOptions = '<option>Equals</option><option>Before</option><option>After</option>';
                    valueInput = `<input type="date" class="cond-val" value="${cond.value || ''}" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">`;
                } else {
                    operatorOptions = '<option>Equals</option><option>Not Equals</option><option>Contains</option>';
                    valueInput = `<input type="text" class="cond-val" value="${cond.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">`;
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

    openRunModal(reportName) {
        this.activeRunReport = reportName;
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
        this.queueReport(this.activeRunReport || 'Scheduled Report', 'core');
        this.closeRunModal();
        if (typeof switchView === 'function') switchView('centre');
    }

    queueReport(name = 'Ad-hoc Payment Report', type = 'core') {
        const report = {
            id: '#RP-' + Math.floor(Math.random() * 100000),
            name: name,
            type: type,
            status: 'queued',
            progress: 0,
            startTime: new Date().toLocaleTimeString(),
            duration: '--'
        };
        
        window.appState.update(state => ({
            generatedReports: [report, ...state.generatedReports]
        }));
        
        window.appToast.show('Report queued for execution', 'info');
        window.appNotification.add('Report Queued', `Job ${report.id} has been added to the queue.`);
        
        // Simulate execution
        setTimeout(() => this.startExecution(report.id), 2000);
    }
    
    startExecution(id) {
        window.appState.update(state => {
            const reports = state.generatedReports.map(r => 
                r.id === id ? { ...r, status: 'running', progress: 10 } : r
            );
            return { ...state, generatedReports: reports };
        });
        
        let progress = 10;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 10;
            if(progress >= 100) {
                progress = 100;
                clearInterval(interval);
                this.completeExecution(id);
            }
            window.appState.update(state => {
                const reports = state.generatedReports.map(r => 
                    r.id === id ? { ...r, progress } : r
                );
                return { ...state, generatedReports: reports };
            });
        }, 1000);
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
                                ${r.status === 'success' ? `<button class="icon-btn" onclick="window.appToast.show('Downloading...', 'info')"><i data-lucide="download"></i></button>` : ''}
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
        
        lucide.createIcons();
    }
}

// Add this helper method to BuilderManager outside the replace chunks since it needs to be an instance method
BuilderManager.prototype.setDataset = function(datasetName) {
    window.appHistory.pushState();
    window.appState.update(state => ({
        ...state,
        currentBuilder: { ...state.currentBuilder, dataset: datasetName }
    }));
    window.appToast.show(`Base report changed to ${datasetName}`);
    if (typeof toggleStage === 'function') toggleStage(2);
};

window.appBuilderManager = new BuilderManager();
window.appReportManager = new ReportManager();
