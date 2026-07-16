const fs = require('fs');

let js = fs.readFileSync('js/Managers.js', 'utf8');

const targetLogic = `        const s1ds = document.getElementById('stage-1-datasets');
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
            }

            if(s1ds) s1ds.style.display = 'none';
            if(core2Pane) core2Pane.style.display = 'flex';
            
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


const replacementLogic = `        const s1ds = document.getElementById('stage-1-datasets');
        const coreWizard = document.getElementById('core-wizard-container');
        const stage2 = document.getElementById('stage-2');
        const dynamicContent = document.getElementById('core-step-dynamic-content');
        const step1Content = document.getElementById('core-step-1-content');
        
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(coreWizard) coreWizard.style.display = 'flex';
            if(stage2) stage2.style.display = 'none';
            
            const currentStep = state.currentBuilder.coreWizardStep || 1;
            
            // Update sidebar navigation
            document.querySelectorAll('#core-wizard-nav .wizard-step').forEach(li => {
                const step = parseInt(li.dataset.step);
                if (step === currentStep) li.classList.add('active');
                else li.classList.remove('active');
            });
            
            // Show appropriate content
            if (currentStep === 1) {
                if (step1Content) step1Content.style.display = 'flex';
                if (dynamicContent) dynamicContent.style.display = 'none';
            } else {
                if (step1Content) step1Content.style.display = 'none';
                if (dynamicContent) {
                    dynamicContent.style.display = 'block';
                    const targetStage = document.getElementById('stage-' + currentStep);
                    if (targetStage) {
                        // Move the target stage into the dynamic content area
                        dynamicContent.innerHTML = ''; // clear
                        targetStage.style.display = 'block';
                        
                        // We need to keep the target stage in the DOM so React/other code can find it, 
                        // so we appendChild instead of innerHTML.
                        dynamicContent.appendChild(targetStage);
                        
                        // Remove the pipeline styling for wizard mode by hiding the header
                        const header = targetStage.querySelector('.stage-header');
                        if (header) header.style.display = 'none';
                        const content = targetStage.querySelector('.stage-content');
                        if (content) content.style.display = 'block';
                    }
                }
            }
            
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
            if(coreWizard) coreWizard.style.display = 'none';
            if(stage2) stage2.style.display = 'block';
            
            // Move stages back to main content if needed
            const mainContent = document.querySelector('#view-builder .main-content');
            if (mainContent) {
                const s3 = document.getElementById('stage-3');
                const s4 = document.getElementById('stage-4');
                const s5 = document.getElementById('stage-5');
                const s6 = document.getElementById('stage-6');
                
                // Restore headers
                [s3, s4, s5, s6].forEach(s => {
                    if (s) {
                        const h = s.querySelector('.stage-header');
                        if (h) h.style.display = 'flex';
                    }
                });
                
                // Insert them after stage-2
                if (s3 && stage2 && stage2.nextSibling !== s3) stage2.parentNode.insertBefore(s3, stage2.nextSibling);
                if (s4 && s3) s3.parentNode.insertBefore(s4, s3.nextSibling);
                if (s5 && s4) s4.parentNode.insertBefore(s5, s4.nextSibling);
                if (s6 && s5) s5.parentNode.insertBefore(s6, s5.nextSibling);
            }
        }`;

js = js.replace(targetLogic, replacementLogic);

// Add setCoreWizardStep to BuilderManager prototype
const helperFunctions = `
BuilderManager.prototype.setCoreWizardStep = function(step) {
    window.appState.update(state => ({
        ...state,
        currentBuilder: { ...state.currentBuilder, coreWizardStep: step }
    }));
};
`;

js = js.replace(/window\.appBuilderManager = new BuilderManager\(\);/, helperFunctions + '\nwindow.appBuilderManager = new BuilderManager();');


// 3. Update the Template Dataset Selection logic so it loads the core report's fields
// Let's find setDataset and modify it
const setDatasetRegex = /BuilderManager\.prototype\.setDataset = function\(datasetName\) \{[\s\S]*?\};/;
const newSetDataset = `BuilderManager.prototype.setDataset = function(datasetName) {
    window.appHistory.pushState();
    
    // Find the core report
    const state = window.appState.get();
    const coreReport = (state.catalogue || []).find(r => r.name === datasetName && r.type === 'core');
    
    let loadedFields = [];
    if (coreReport && coreReport.fields) {
        // If the core report has fields saved in it, load them directly
        loadedFields = [...coreReport.fields];
        // Populate available fields so filters can use them
        this.availableFields = [...coreReport.fields];
    } else {
        // Fallback for mock datasets
        loadedFields = [];
    }

    window.appState.update(s => ({
        ...s,
        currentBuilder: { 
            ...s.currentBuilder, 
            dataset: datasetName,
            fields: loadedFields
        }
    }));
    window.appToast.show(\`Base report changed to \${datasetName}\`);
    if (typeof toggleStage === 'function') toggleStage(2);
};`;
js = js.replace(setDatasetRegex, newSetDataset);


fs.writeFileSync('js/Managers.js', js);
console.log('Managers.js updated for wizard');
