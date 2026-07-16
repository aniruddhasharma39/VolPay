const fs = require('fs');
let code = fs.readFileSync('js/Managers.js', 'utf8');

// I will just wipe out the manual `renderDBTree` calls and let CoreReportSelector handle it.
// The code to replace inside updateUI:
/*
        const s1ds = document.getElementById('stage-1-datasets');
        const s1cdb = document.getElementById('stage-1-core-db');
...
        } else {
...
        }
*/

const searchStrStart = "const s1ds = document.getElementById('stage-1-datasets');";
const searchStrEnd = "if(s2ca) s2ca.style.display = 'none';\n        }";

const startIndex = code.indexOf(searchStrStart);
const endIndex = code.indexOf(searchStrEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `
        const s1ds = document.getElementById('stage-1-datasets');
        const s1cdb = document.getElementById('stage-1-core-db');
        
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(s1cdb) s1cdb.style.display = 'block';
            
            // Delegate core rendering to the new CoreReportSelector
            if (window.appCoreReportSelector) {
                if (window.appCoreReportSelector.activeDatabaseSections.length === 0) {
                    window.appCoreReportSelector.addDatabase(); // Auto add first DB
                }
                window.appCoreReportSelector.updateUI(state);
            }
            lucide.createIcons();
        } else {
            if(s1ds) s1ds.style.display = 'block';
            if(s1cdb) s1cdb.style.display = 'none';
        }
`;
    
    code = code.substring(0, startIndex) + replacement + code.substring(endIndex + searchStrEnd.length);
}

// Remove the old `renderDBTree` and `toggleDBField` and `clearAllFields` from BuilderManager, as they are now in CoreReportSelector
code = code.replace(/renderDBTree\([\s\S]*?toggleDBField/, 'toggleDBField'); // lazy replace
code = code.replace(/toggleDBField\([\s\S]*?clearAllFields\(\) \{/, 'clearAllFields() {'); // lazy replace

fs.writeFileSync('js/Managers.js', code);
console.log('Managers.js updated.');
