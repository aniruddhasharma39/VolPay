class SummaryCalculationsManager {
    constructor() {
        this.availableFunctions = [
            { id: 'ABS', label: 'ABS( )', type: 'math' },
            { id: 'ROUND', label: 'ROUND( )', type: 'math' },
            { id: 'IF', label: 'IF( , , )', type: 'logic' }
        ];
        this.availableOperators = ['+', '-', '×', '÷', '(', ')'];
    }

    renderRightPanel() {
        const state = window.appState.get();
        const container = document.getElementById('calc-config-container');
        if (!container) return;

        let html = '';

        // Summaries Section
        html += `
            <div style="border: 1px solid var(--border-color); border-radius: 8px; background: #fff; overflow: hidden; box-shadow: var(--shadow-sm);">
                <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                    <div style="font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="sigma" style="width: 16px; color: var(--primary);"></i> Summary Statistics
                    </div>
                    <i data-lucide="chevron-down" style="width: 16px; color: #64748b;"></i>
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <div id="summaries-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <!-- Summary chips will go here -->
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; justify-content: center; border-style: dashed;" onclick="window.appSummaryCalc.openAddSummaryForm()">
                        <i data-lucide="plus"></i> Add Summary
                    </button>
                    <div id="add-summary-form" style="display: none; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                        <select id="sum-operation" class="form-control">
                            <option value="SUM">Sum</option>
                            <option value="AVG">Average</option>
                            <option value="COUNT">Count Rows</option>
                            <option value="MIN">Minimum</option>
                            <option value="MAX">Maximum</option>
                        </select>
                        <select id="sum-column" class="form-control">
                            <option value="">Select Column...</option>
                            ${state.currentBuilder.fields.map(f => `<option value="${f.id}">${f.label}</option>`).join('')}
                        </select>
                        <input type="text" id="sum-label" class="form-control" placeholder="Label (e.g. Total Amount)">
                        <select id="sum-position" class="form-control">
                            <option value="bottom">Bottom of Report</option>
                            <option value="top">Top of Report</option>
                        </select>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary" style="flex: 1;" onclick="window.appSummaryCalc.saveSummary()">Apply</button>
                            <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('add-summary-form').style.display='none'">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Calculated Columns Section
        html += `
            <div style="border: 1px solid var(--border-color); border-radius: 8px; background: #fff; overflow: hidden; box-shadow: var(--shadow-sm);">
                <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                    <div style="font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="function-square" style="width: 16px; color: #10b981;"></i> Calculated Columns
                    </div>
                    <i data-lucide="chevron-down" style="width: 16px; color: #64748b;"></i>
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <div id="calc-cols-list" style="display: flex; flex-direction: column; gap: 8px;">
                        <!-- Col cards will go here -->
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; justify-content: center; border-style: dashed;" onclick="window.appSummaryCalc.openAddCalcColForm()">
                        <i data-lucide="plus"></i> Add Calculated Column
                    </button>
                    <div id="add-calccol-form" style="display: none; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                        <input type="text" id="calccol-name" class="form-control" placeholder="Column Name (e.g. Net Amount)">
                        <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; min-height: 80px; background: #f8fafc; display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start;" id="calccol-expression-canvas">
                            <span style="color: #94a3b8; font-size: 0.875rem;">Build expression by clicking buttons below...</span>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Fields</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                ${state.currentBuilder.fields.map(f => `<button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 4px;" onclick="window.appSummaryCalc.addToken('field', '${f.id}', '${f.label}')">${f.label}</button>`).join('')}
                            </div>
                            
                            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 4px;">Operators</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                ${this.availableOperators.map(op => `<button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 4px; font-weight: bold;" onclick="window.appSummaryCalc.addToken('operator', '${op}', '${op}')">${op}</button>`).join('')}
                                <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 4px;" onclick="window.appSummaryCalc.addToken('number', null, null)">Number...</button>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn btn-primary" style="flex: 1;" onclick="window.appSummaryCalc.saveCalcCol()">Apply</button>
                            <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('add-calccol-form').style.display='none'">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        this.renderSummariesList();
        this.renderCalcColsList();
    }

    openAddSummaryForm() {
        document.getElementById('add-summary-form').style.display = 'flex';
        document.getElementById('sum-label').value = '';
        document.getElementById('sum-column').value = '';
    }

    saveSummary() {
        const op = document.getElementById('sum-operation').value;
        const col = document.getElementById('sum-column').value;
        let label = document.getElementById('sum-label').value;
        const pos = document.getElementById('sum-position').value;

        if (!col && op !== 'COUNT') {
            window.appToast.show('Please select a column', 'error');
            return;
        }
        if (!label) label = `${op} of ${col}`;

        const summary = {
            id: 'sum_' + Date.now(),
            operation: op,
            column: col,
            label: label,
            position: pos
        };

        window.appState.update(s => {
            const current = s.currentBuilder;
            return {
                ...s,
                currentBuilder: {
                    ...current,
                    summaries: [...(current.summaries || []), summary]
                }
            };
        });

        document.getElementById('add-summary-form').style.display = 'none';
        this.renderSummariesList();
        this.renderLivePreview();
    }

    deleteSummary(id) {
        window.appState.update(s => {
            const current = s.currentBuilder;
            return {
                ...s,
                currentBuilder: {
                    ...current,
                    summaries: (current.summaries || []).filter(sum => sum.id !== id)
                }
            };
        });
        this.renderSummariesList();
        this.renderLivePreview();
    }

    renderSummariesList() {
        const state = window.appState.get();
        const container = document.getElementById('summaries-list');
        if (!container) return;

        const summaries = state.currentBuilder.summaries || [];
        if (summaries.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = summaries.map(sum => `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 16px; font-size: 0.75rem; font-weight: 600;">
                <span>${sum.label}</span>
                <i data-lucide="x" style="width: 12px; cursor: pointer;" onclick="window.appSummaryCalc.deleteSummary('${sum.id}')"></i>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    // --- Calculated Columns Logic ---
    openAddCalcColForm() {
        document.getElementById('add-calccol-form').style.display = 'flex';
        document.getElementById('calccol-name').value = '';
        this.currentExpressionTokens = [];
        this.renderExpressionCanvas();
    }

    addToken(type, value, label) {
        if (!this.currentExpressionTokens) this.currentExpressionTokens = [];
        
        if (type === 'number') {
            const num = prompt("Enter number:");
            if (num !== null && num.trim() !== '' && !isNaN(num)) {
                this.currentExpressionTokens.push({ type: 'number', value: num, label: num });
            }
        } else {
            this.currentExpressionTokens.push({ type, value, label });
        }
        this.renderExpressionCanvas();
    }

    removeToken(index) {
        if (this.currentExpressionTokens) {
            this.currentExpressionTokens.splice(index, 1);
            this.renderExpressionCanvas();
        }
    }

    renderExpressionCanvas() {
        const canvas = document.getElementById('calccol-expression-canvas');
        if (!canvas) return;

        if (!this.currentExpressionTokens || this.currentExpressionTokens.length === 0) {
            canvas.innerHTML = '<span style="color: #94a3b8; font-size: 0.875rem;">Build expression by clicking buttons below...</span>';
            return;
        }

        canvas.innerHTML = this.currentExpressionTokens.map((t, idx) => {
            let bg = '#e2e8f0';
            let color = '#334155';
            if (t.type === 'field') { bg = '#dbeafe'; color = '#1d4ed8'; }
            if (t.type === 'operator') { bg = '#f1f5f9'; color = '#0f172a'; }
            
            return `
                <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: ${bg}; color: ${color}; border-radius: 4px; font-size: 0.875rem; font-weight: 500;">
                    ${t.label}
                    <i data-lucide="x" style="width: 12px; cursor: pointer; opacity: 0.6;" onclick="window.appSummaryCalc.removeToken(${idx})"></i>
                </div>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    saveCalcCol() {
        const name = document.getElementById('calccol-name').value;
        if (!name) {
            window.appToast.show('Please enter a column name', 'error');
            return;
        }
        if (!this.currentExpressionTokens || this.currentExpressionTokens.length === 0) {
            window.appToast.show('Expression cannot be empty', 'error');
            return;
        }

        const col = {
            id: 'cc_' + Date.now(),
            name: name,
            tokens: [...this.currentExpressionTokens]
        };

        window.appState.update(s => {
            const current = s.currentBuilder;
            return {
                ...s,
                currentBuilder: {
                    ...current,
                    calculatedColumns: [...(current.calculatedColumns || []), col]
                }
            };
        });

        document.getElementById('add-calccol-form').style.display = 'none';
        this.renderCalcColsList();
        this.renderLivePreview();
    }

    deleteCalcCol(id) {
        window.appState.update(s => {
            const current = s.currentBuilder;
            return {
                ...s,
                currentBuilder: {
                    ...current,
                    calculatedColumns: (current.calculatedColumns || []).filter(c => c.id !== id)
                }
            };
        });
        this.renderCalcColsList();
        this.renderLivePreview();
    }

    renderCalcColsList() {
        const state = window.appState.get();
        const container = document.getElementById('calc-cols-list');
        if (!container) return;

        const cols = state.currentBuilder.calculatedColumns || [];
        if (cols.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = cols.map(c => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.875rem; font-weight: 600; color: #0f172a;">ƒx ${c.name}</span>
                    <span style="font-size: 0.7rem; color: #64748b;">${c.tokens.map(t=>t.label).join(' ')}</span>
                </div>
                <button class="icon-btn" onclick="window.appSummaryCalc.deleteCalcCol('${c.id}')"><i data-lucide="trash-2" style="width: 14px; color: #ef4444;"></i></button>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    // --- Live Preview ---
    
    evaluateExpression(row, tokens) {
        // Very basic evaluator for demo purposes (+, -, *, /)
        if (!tokens || tokens.length === 0) return '';
        let expr = '';
        for (let t of tokens) {
            if (t.type === 'number') {
                expr += t.value;
            } else if (t.type === 'field') {
                let val = row[t.value] || 0;
                expr += val;
            } else if (t.type === 'operator') {
                if (t.value === '×') expr += '*';
                else if (t.value === '÷') expr += '/';
                else expr += t.value;
            }
        }
        try {
            // Unsafe eval for frontend mock purposes ONLY
            const result = new Function(`return ${expr}`)();
            return typeof result === 'number' ? parseFloat(result.toFixed(2)) : result;
        } catch (e) {
            return 'ERR';
        }
    }

    renderLivePreview() {
        const state = window.appState.get();
        const fields = state.currentBuilder.fields || [];
        const calcs = state.currentBuilder.calculatedColumns || [];
        const summaries = state.currentBuilder.summaries || [];

        const th = document.getElementById('calc-preview-th');
        const tb = document.getElementById('calc-preview-tb');
        const tf = document.getElementById('calc-preview-tf');
        if (!th || !tb || !tf) return;

        // Render Badges
        const badges = document.getElementById('calc-preview-badges');
        if (badges) {
            let html = `<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Fields: ${fields.length}</span>`;
            if (summaries.length) html += `<span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Summaries: ${summaries.length}</span>`;
            if (calcs.length) html += `<span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Calculated: ${calcs.length}</span>`;
            badges.innerHTML = html;
        }

        // Headers
        let thHtml = '';
        fields.forEach(f => {
            thHtml += `<th>${f.label}</th>`;
        });
        calcs.forEach(c => {
            thHtml += `<th style="background: #f0fdf4; color: #166534;"><i data-lucide="function-square" style="width:12px; margin-right:4px;"></i>${c.name}</th>`;
        });
        th.innerHTML = thHtml;

        // Data
        const data = window.appPreviewEngine.loadData();
        const filteredData = window.appPreviewEngine.applyFiltersAndConditions(data, state.currentBuilder.filters, state.currentBuilder.conditions).slice(0, 50);

        let tbHtml = '';
        filteredData.forEach(row => {
            tbHtml += '<tr>';
            fields.forEach(f => {
                tbHtml += `<td>${row[f.id] || '-'}</td>`;
            });
            calcs.forEach(c => {
                const val = this.evaluateExpression(row, c.tokens);
                tbHtml += `<td style="background: #f0fdf4; font-weight: 500;">${val}</td>`;
            });
            tbHtml += '</tr>';
        });
        tb.innerHTML = tbHtml;

        // Footer Summaries (Top/Bottom)
        // For simplicity, showing all at bottom right now
        let tfHtml = '';
        if (summaries.length > 0) {
            summaries.forEach(s => {
                tfHtml += `<tr style="background: #e0e7ff; font-weight: bold;">`;
                
                // Find column index
                let colIdx = -1;
                let isCalc = false;
                fields.forEach((f, i) => { if (f.id === s.column) colIdx = i; });
                if (colIdx === -1) {
                    calcs.forEach((c, i) => { if (c.name === s.column) { colIdx = fields.length + i; isCalc = true; } });
                }

                const totalCols = fields.length + calcs.length;
                
                if (colIdx === -1 && s.operation === 'COUNT') {
                    // Span all cols
                    tfHtml += `<td colspan="${totalCols}" style="color: #4338ca;">${s.label}: ${filteredData.length}</td>`;
                } else if (colIdx !== -1) {
                    // Calculate value
                    let val = 0;
                    if (s.operation === 'SUM') {
                        filteredData.forEach(row => {
                            let v = isCalc ? this.evaluateExpression(row, calcs.find(c=>c.name===s.column).tokens) : row[s.column];
                            if(!isNaN(parseFloat(v))) val += parseFloat(v);
                        });
                    } else if (s.operation === 'AVG') {
                        let sum = 0;
                        filteredData.forEach(row => {
                            let v = isCalc ? this.evaluateExpression(row, calcs.find(c=>c.name===s.column).tokens) : row[s.column];
                            if(!isNaN(parseFloat(v))) sum += parseFloat(v);
                        });
                        val = filteredData.length ? (sum / filteredData.length) : 0;
                    } else if (s.operation === 'MIN') {
                        let min = Infinity;
                        filteredData.forEach(row => {
                            let v = isCalc ? this.evaluateExpression(row, calcs.find(c=>c.name===s.column).tokens) : row[s.column];
                            if(!isNaN(parseFloat(v)) && parseFloat(v) < min) min = parseFloat(v);
                        });
                        val = min === Infinity ? '-' : min;
                    } else if (s.operation === 'MAX') {
                        let max = -Infinity;
                        filteredData.forEach(row => {
                            let v = isCalc ? this.evaluateExpression(row, calcs.find(c=>c.name===s.column).tokens) : row[s.column];
                            if(!isNaN(parseFloat(v)) && parseFloat(v) > max) max = parseFloat(v);
                        });
                        val = max === -Infinity ? '-' : max;
                    }
                    if(typeof val === 'number') val = val.toFixed(2);

                    for (let i = 0; i < totalCols; i++) {
                        if (i === 0 && colIdx !== 0) tfHtml += `<td style="color: #4338ca;">${s.label}</td>`;
                        else if (i === colIdx) tfHtml += `<td style="color: #4338ca;">${val}</td>`;
                        else tfHtml += `<td></td>`;
                    }
                }
                
                tfHtml += `</tr>`;
            });
        }
        tf.innerHTML = tfHtml;

        if (window.lucide) window.lucide.createIcons();
    }
}

window.appSummaryCalc = new SummaryCalculationsManager();
