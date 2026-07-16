const fs = require('fs');

let js = fs.readFileSync('js/Managers.js', 'utf8');

const targetUIUpdate = `        const s1ds = document.getElementById('stage-1-datasets');
        const s1cdb = document.getElementById('stage-1-core-db');
        const stage2 = document.getElementById('stage-2'); // Hide the entire stage-2 pipeline stage
        
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(s1cdb) s1cdb.style.display = 'block';
            if(stage2) stage2.style.display = 'none';

            if(s1ds) s1ds.style.display = 'none';
            if(s1cdb) s1cdb.style.display = 'block';`;

const replacementUIUpdate = `        const s1ds = document.getElementById('stage-1-datasets');
        const core2Pane = document.getElementById('core-2pane-container');
        const stage2 = document.getElementById('stage-2');
        const coreOpsContainer = document.getElementById('core-operations-container');
        
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(core2Pane) core2Pane.style.display = 'flex';
            if(stage2) stage2.style.display = 'none';
            
            // Move other stages into core operations container
            if (coreOpsContainer) {
                const s3 = document.getElementById('stage-3');
                const s4 = document.getElementById('stage-4');
                const s5 = document.getElementById('stage-5');
                const s6 = document.getElementById('stage-6');
                if (s3) coreOpsContainer.appendChild(s3);
                if (s4) coreOpsContainer.appendChild(s4);
                if (s5) coreOpsContainer.appendChild(s5);
                if (s6) coreOpsContainer.appendChild(s6);
            }`;

js = js.replace(targetUIUpdate, replacementUIUpdate);

const targetUIUpdateElse = `        } else {
            if(s1ds) s1ds.style.display = 'block';
            if(s1cdb) s1cdb.style.display = 'none';
            if(stage2) stage2.style.display = 'block';
        }`;

const replacementUIUpdateElse = `        } else {
            if(s1ds) s1ds.style.display = 'block';
            if(core2Pane) core2Pane.style.display = 'none';
            if(stage2) stage2.style.display = 'block';
            
            // Move stages back to main content if needed
            const mainContent = document.querySelector('#view-builder .main-content');
            if (mainContent) {
                const s3 = document.getElementById('stage-3');
                const s4 = document.getElementById('stage-4');
                const s5 = document.getElementById('stage-5');
                const s6 = document.getElementById('stage-6');
                // Insert them after stage-2
                if (s3 && stage2 && stage2.nextSibling !== s3) stage2.parentNode.insertBefore(s3, stage2.nextSibling);
                if (s4 && s3) s3.parentNode.insertBefore(s4, s3.nextSibling);
                if (s5 && s4) s4.parentNode.insertBefore(s5, s4.nextSibling);
                if (s6 && s5) s5.parentNode.insertBefore(s6, s5.nextSibling);
            }
        }`;

js = js.replace(targetUIUpdateElse, replacementUIUpdateElse);

fs.writeFileSync('js/Managers.js', js);
console.log('Managers.js updated.');
