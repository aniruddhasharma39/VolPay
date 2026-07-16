const fs = require('fs');
let js = fs.readFileSync('js/Managers.js', 'utf8');

const targetBadLogic = `            // Show appropriate content
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
            }`;

const fixedLogic = `            // Show appropriate content
            if (currentStep === 1) {
                if (step1Content) step1Content.style.display = 'flex';
                if (dynamicContent) dynamicContent.style.display = 'none';
            } else {
                if (step1Content) step1Content.style.display = 'none';
                if (dynamicContent) {
                    dynamicContent.style.display = 'block';
                }
            }

            // Move all stages into dynamic content and toggle visibility
            if (dynamicContent) {
                const stages = [document.getElementById('stage-3'), document.getElementById('stage-4'), document.getElementById('stage-5'), document.getElementById('stage-6')];
                stages.forEach(s => {
                    if (s && s.parentNode !== dynamicContent) {
                        dynamicContent.appendChild(s);
                    }
                });
                
                stages.forEach(s => {
                    if (s) {
                        if (currentStep !== 1 && s.id === 'stage-' + currentStep) {
                            s.style.display = 'block';
                            const header = s.querySelector('.stage-header');
                            if (header) header.style.display = 'none';
                            const content = s.querySelector('.stage-content');
                            if (content) content.style.display = 'block';
                        } else {
                            s.style.display = 'none';
                        }
                    }
                });
            }`;

js = js.replace(targetBadLogic, fixedLogic);

fs.writeFileSync('js/Managers.js', js);
console.log('Fixed dynamic stage destruction bug.');
