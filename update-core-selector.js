const fs = require('fs');
let code = fs.readFileSync('js/CoreReportSelector.js', 'utf8');

// Update validation logic for dropdowns to disable already selected DBs
const renderDbReplacement = `            // Generate DB Select options
            const dbOptions = allDbNames.map(name => {
                const isSelectedElsewhere = this.activeDatabaseSections.some(s => s.instanceId !== section.instanceId && s.dbName === name);
                return \`<option value="\${name}" \${name === section.dbName ? 'selected' : ''} \${isSelectedElsewhere ? 'disabled' : ''}>\${name}</option>\`;
            }).join('');`;

code = code.replace(/            \/\/ Generate DB Select options[\s\S]*?            \)\.join\(''\);/, renderDbReplacement);

// Update highlight logic
const highlightReplacement = `    highlightTable(dbName, tableName) {
        this.activeDatabaseSections.forEach((section) => {
            if (section.dbName === dbName) {
                const sectionCard = this.container.querySelector(\`.db-section-card[data-instance-id="\${section.instanceId}"]\`);
                if (sectionCard) {
                    const tableCard = sectionCard.querySelector(\`.table-accordion-card[data-table="\${tableName}"]\`);
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
                const sectionCard = this.container.querySelector(\`.db-section-card[data-instance-id="\${section.instanceId}"]\`);
                if (sectionCard) {
                    const tableCard = sectionCard.querySelector(\`.table-accordion-card[data-table="\${tableName}"]\`);
                    if (tableCard) {
                        tableCard.style.boxShadow = 'none';
                        tableCard.style.backgroundColor = '';
                    }
                }
            }
        });
    }`;

code = code.replace(/    highlightTable\(dbName, tableName\) \{[\s\S]*?    \}\n\n    unhighlightTable\(dbName, tableName\) \{[\s\S]*?    \}/, highlightReplacement);

fs.writeFileSync('js/CoreReportSelector.js', code);
console.log('Updated CoreReportSelector validation and highlighting');
