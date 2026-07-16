const fs = require('fs');
let code = fs.readFileSync('js/Managers.js', 'utf8');

const dragDropLogic = `
        const arrangeList = document.getElementById('core-arrange-list');
        if(arrangeList) {
            let draggedIndex = null;
            arrangeList.addEventListener('dragstart', (e) => {
                const item = e.target.closest('.arrange-item');
                if(!item) return;
                draggedIndex = parseInt(item.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
                item.style.opacity = '0.4';
            });
            arrangeList.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const item = e.target.closest('.arrange-item');
                if(item) {
                    item.style.borderTop = '2px solid var(--primary)';
                }
            });
            arrangeList.addEventListener('dragleave', (e) => {
                const item = e.target.closest('.arrange-item');
                if(item) {
                    item.style.borderTop = 'none';
                }
            });
            arrangeList.addEventListener('drop', (e) => {
                e.preventDefault();
                const item = e.target.closest('.arrange-item');
                if(item) item.style.borderTop = 'none';
                
                if(!item || draggedIndex === null) return;
                const dropIndex = parseInt(item.dataset.index);
                if(draggedIndex === dropIndex) return;
                
                const state = window.appState.get();
                const fields = [...state.currentBuilder.fields];
                const [moved] = fields.splice(draggedIndex, 1);
                fields.splice(dropIndex, 0, moved);
                
                window.appState.update(s => ({ ...s, currentBuilder: { ...s.currentBuilder, fields } }));
            });
            arrangeList.addEventListener('dragend', (e) => {
                const item = e.target.closest('.arrange-item');
                if(item) item.style.opacity = '1';
                
                // Cleanup borders
                arrangeList.querySelectorAll('.arrange-item').forEach(el => el.style.borderTop = 'none');
            });
        }
`;

code = code.replace('// Dataset Selection', dragDropLogic + '\n\n        // Dataset Selection');

fs.writeFileSync('js/Managers.js', code);
console.log('Drag and Drop added.');
