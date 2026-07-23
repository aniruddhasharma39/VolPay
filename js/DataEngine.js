// Fake Data Generator and Preview Engine

class FakeDataGenerator {
    static generate(count = 100) {
        const data = [];
        const rails = ['FedNow', 'RTP', 'CHIPS', 'SWIFT', 'SEPA'];
        const statuses = ['Completed', 'Pending', 'Failed', 'Repair', 'Rejected'];
        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'INR', 'AUD'];
        const directions = ['Inbound', 'Outbound', 'Internal'];
        const messageTypes = ['pacs.008', 'pacs.004', 'pacs.002', 'camt.054', 'MT103', 'MT202'];
        const queues = ['STP', 'Repair', 'Compliance', 'Sanctions', 'Manual'];
        
        for (let i = 0; i < count; i++) {
            const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
            data.push({
                trn: 'TRN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                uetr: crypto.randomUUID ? crypto.randomUUID() : 'UETR-' + Math.random().toString(36).substr(2, 9),
                endToEndId: 'E2E-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                instructionId: 'INSTR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                clearingSystemRef: 'CLR-' + Math.floor(Math.random() * 1000000),
                rail: rails[Math.floor(Math.random() * rails.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                reasonCode: 'RC' + Math.floor(Math.random() * 99),
                messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
                direction: directions[Math.floor(Math.random() * directions.length)],
                priority: Math.random() > 0.5 ? 'High' : 'Normal',
                repairQueue: queues[Math.floor(Math.random() * queues.length)],
                instructedAmount: (Math.random() * 100000).toFixed(2),
                instructedCurrency: currencies[Math.floor(Math.random() * currencies.length)],
                settlementAmount: (Math.random() * 100000).toFixed(2),
                settlementCurrency: currencies[Math.floor(Math.random() * currencies.length)],
                exchangeRate: (Math.random() * 2).toFixed(4),
                chargeAmount: (Math.random() * 50).toFixed(2),
                debtorName: 'Corp ' + Math.floor(Math.random() * 1000),
                debtorAccount: 'ACC' + Math.floor(Math.random() * 1000000000),
                debtorAgent: 'BIC' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                creditorName: 'Vendor ' + Math.floor(Math.random() * 1000),
                creditorAccount: 'ACC' + Math.floor(Math.random() * 1000000000),
                creditorAgent: 'BIC' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                instructingAgent: 'BIC' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                instructedAgent: 'BIC' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                valueDate: date.toISOString().split('T')[0],
                businessDate: date.toISOString().split('T')[0],
                settlementDate: new Date(date.getTime() + 86400000).toISOString().split('T')[0],
                creationTimestamp: date.toISOString(),
                lastUpdateTimestamp: new Date(date.getTime() + 3600000).toISOString()
            });
        }
        return data;
    }

    static getUniqueValues(data, fieldId) {
        if (!data || !data.length) return [];
        const unique = new Set(data.map(item => item[fieldId]).filter(Boolean));
        return Array.from(unique).sort();
    }
}

class PreviewEngine {
    constructor() {
        this.dataset = null;
    }

    loadData() {
        if (!this.dataset) {
            // cache data generation for fallback
            this.dataset = FakeDataGenerator.generate(100);
        }

        const state = window.appState ? window.appState.get() : null;
        if (!state || !state.currentBuilder || !state.currentBuilder.fields || state.currentBuilder.fields.length === 0) return [];
        
        const fields = state.currentBuilder.fields;
        const combinedData = [];
        
        for (let i = 0; i < 100; i++) {
            let row = {};
            let hasData = false;
            
            fields.forEach(f => {
                if (f.tableName && window.VOLPAY_DB_DATA && window.VOLPAY_DB_DATA[f.tableName]) {
                    const tableData = window.VOLPAY_DB_DATA[f.tableName];
                    if (i < tableData.length) {
                        row[f.id] = tableData[i][f.name];
                        hasData = true;
                    }
                } else {
                    // For non-core fields or missing data, fallback to generated
                    if (this.dataset[i] && this.dataset[i][f.id] !== undefined) {
                        row[f.id] = this.dataset[i][f.id];
                        hasData = true;
                    } else if (this.dataset[i]) {
                        if (f.type === 'number') row[f.id] = (Math.random() * 100000).toFixed(2);
                        else if (f.type === 'date') row[f.id] = new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0];
                        else row[f.id] = 'Sample ' + i;
                        hasData = true;
                    }
                }
            });
            if (hasData) combinedData.push(row);
        }
        
        return combinedData;
    }

    applyFiltersAndConditions(data, filtersMap, conditions) {
        let result = data;
        
        // 1. Apply simple filters (Map)
        if (filtersMap && Object.keys(filtersMap).length > 0) {
            result = result.filter(row => {
                for (const [fieldId, activeValues] of Object.entries(filtersMap)) {
                    if (!activeValues || activeValues.length === 0) continue;
                    const val = row[fieldId];
                    if (val === undefined || val === null) return false;
                    
                    let fieldMatch = false;
                    for (const filterVal of activeValues) {
                        if (filterVal.includes(' - ')) {
                            const [min, max] = filterVal.split(' - ').map(Number);
                            if (parseFloat(val) >= min && parseFloat(val) <= max) { fieldMatch = true; break; }
                        } else if (String(val).toLowerCase() === String(filterVal).toLowerCase()) {
                            fieldMatch = true; break;
                        } else if (String(val).toLowerCase().includes(String(filterVal).toLowerCase())) {
                            fieldMatch = true; break;
                        }
                    }
                    if (!fieldMatch) return false;
                }
                return true;
            });
        }
        
        // 2. Apply Conditions (Array of rules)
        if (conditions && conditions.length > 0) {
            result = result.filter(row => {
                let rowMatch = true;
                for (let i = 0; i < conditions.length; i++) {
                    const c = conditions[i];
                    if (!c.value && c.operator !== 'Is Empty' && c.operator !== 'Is Not Empty') continue;
                    
                    const val = row[c.fieldId];
                    let condMatch = false;
                    
                    if (c.operator === 'Equals') condMatch = String(val).toLowerCase() === String(c.value).toLowerCase();
                    else if (c.operator === 'Not Equals') condMatch = String(val).toLowerCase() !== String(c.value).toLowerCase();
                    else if (c.operator === 'Contains') condMatch = String(val).toLowerCase().includes(String(c.value).toLowerCase());
                    else if (c.operator === 'Starts With') condMatch = String(val).toLowerCase().startsWith(String(c.value).toLowerCase());
                    else if (c.operator === 'Ends With') condMatch = String(val).toLowerCase().endsWith(String(c.value).toLowerCase());
                    else if (c.operator === 'Is Empty') condMatch = val === undefined || val === null || String(val).trim() === '';
                    else if (c.operator === 'Is Not Empty') condMatch = val !== undefined && val !== null && String(val).trim() !== '';
                    else if (c.operator === 'Greater Than') condMatch = parseFloat(val) > parseFloat(c.value);
                    else if (c.operator === 'Greater Than or Equals') condMatch = parseFloat(val) >= parseFloat(c.value);
                    else if (c.operator === 'Less Than') condMatch = parseFloat(val) < parseFloat(c.value);
                    else if (c.operator === 'Less Than or Equals') condMatch = parseFloat(val) <= parseFloat(c.value);
                    else if (c.operator === 'Before') condMatch = new Date(val) < new Date(c.value);
                    else if (c.operator === 'Before or Equals') condMatch = new Date(val) <= new Date(c.value);
                    else if (c.operator === 'After') condMatch = new Date(val) > new Date(c.value);
                    else if (c.operator === 'After or Equals') condMatch = new Date(val) >= new Date(c.value);
                    
                    if (i === 0 || c.logicalOp === 'IF' || c.logicalOp === 'AND') {
                        rowMatch = rowMatch && condMatch;
                    } else if (c.logicalOp === 'OR') {
                        rowMatch = rowMatch || condMatch;
                    }
                }
                return rowMatch;
            });
        }
        
        return result;
    }

    render(containerId, fields, filters, conditions, sorts) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!fields || fields.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:#64748b;">No fields selected. Please select fields in Stage 2 to preview data.</div>';
            return;
        }

        const data = this.loadData();
        let filteredData = this.applyFiltersAndConditions(data, filters, conditions);
        
        if (sorts && sorts.length > 0) {
            const sort = sorts[0]; // currently supporting single sort
            filteredData.sort((a, b) => {
                let valA = a[sort.fieldId];
                let valB = b[sort.fieldId];
                if(valA === undefined || valA === null) valA = '';
                if(valB === undefined || valB === null) valB = '';
                
                if (typeof valA === 'number' || !isNaN(valA)) {
                    valA = parseFloat(valA); valB = parseFloat(valB);
                }
                
                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        // Render top 100
        const displayData = filteredData.slice(0, 100);

        let tableHtml = `<div style="padding: 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size:0.875rem; color:#64748b;">
            Showing first ${displayData.length} of ${filteredData.length} records matching criteria.
        </div>`;
        
        tableHtml += '<div style="overflow: auto; max-height: 400px; padding-bottom: 80px;"><table class="data-table" id="preview-data-table" style="min-width: 100%;">';
        tableHtml += '<thead style="position: sticky; top: 0; background: #f8fafc; box-shadow: 0 1px 2px rgba(0,0,0,0.05); z-index:1;"><tr>';
        
        fields.forEach(f => {
            tableHtml += `<th>${f.label}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        displayData.forEach(row => {
            tableHtml += '<tr>';
            fields.forEach(f => {
                let cellValue = row[f.id] || '-';
                if (f.id === 'amount') {
                    cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD' }).format(cellValue);
                }
                tableHtml += `<td>${cellValue}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table></div>';
        container.innerHTML = tableHtml;
    }

    exportPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            window.appToast && window.appToast.show('PDF Export library not loaded.', 'error');
            return;
        }

        const state = window.appState ? window.appState.get() : null;
        if (!state || !state.currentBuilder || !state.currentBuilder.fields || state.currentBuilder.fields.length === 0) {
            window.appToast && window.appToast.show('No fields selected to export.', 'error');
            return;
        }

        const fields = state.currentBuilder.fields;
        const data = this.loadData();
        let filteredData = this.applyFiltersAndConditions(data, state.currentBuilder.filters, state.currentBuilder.conditions);

        // Limit to 1000 for PDF
        filteredData = filteredData.slice(0, 1000);

        const doc = new window.jspdf.jsPDF('landscape');
        
        const reportName = state.currentBuilder.reportName || 'Custom_Report';
        doc.setFontSize(16);
        doc.text(reportName, 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);

        const head = [fields.map(f => f.label)];
        const body = filteredData.map(row => {
            return fields.map(f => {
                let cellValue = row[f.id] || '-';
                if (f.id === 'amount') {
                    cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD' }).format(cellValue);
                }
                return cellValue;
            });
        });

        doc.autoTable({
            startY: 30,
            head: head,
            body: body,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`${reportName.replace(/\\s+/g, '_')}_Preview.pdf`);
        window.appToast && window.appToast.show('PDF Downloaded successfully', 'success');
    }
}

window.appPreviewEngine = new PreviewEngine();
window.appFakeData = FakeDataGenerator;
