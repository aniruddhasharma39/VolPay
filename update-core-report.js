const fs = require('fs');
let code = fs.readFileSync('js/CoreReportSelector.js', 'utf8');

const dragDropCode = `
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
`;

code = code.replace("this.emptyMsg = document.getElementById('core-db-empty-msg');", "this.emptyMsg = document.getElementById('core-db-empty-msg');\n" + dragDropCode);
fs.writeFileSync('js/CoreReportSelector.js', code);
console.log('Drag drop logic added to CoreReportSelector');
