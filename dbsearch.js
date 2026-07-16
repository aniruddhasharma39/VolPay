const fs = require('fs');
let code = fs.readFileSync('js/Managers.js', 'utf8');

const searchLogic = `
        const setupDBSearch = (inputId, treeId) => {
            const input = document.getElementById(inputId);
            if(input) {
                input.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    const tree = document.getElementById(treeId);
                    if(!tree) return;
                    
                    tree.querySelectorAll('.db-category').forEach(cat => {
                        let catHasMatch = false;
                        cat.querySelectorAll('.db-table').forEach(table => {
                            let tableHasMatch = false;
                            table.querySelectorAll('.db-field-item').forEach(field => {
                                const text = field.innerText.toLowerCase();
                                if(text.includes(term)) {
                                    field.style.display = 'flex';
                                    tableHasMatch = true;
                                    catHasMatch = true;
                                } else {
                                    field.style.display = 'none';
                                }
                            });
                            if(tableHasMatch || table.querySelector('.db-table-header').innerText.toLowerCase().includes(term)) {
                                table.style.display = 'block';
                                catHasMatch = true;
                                if(term) table.querySelector('.db-fields').style.display = 'block'; // expand on match
                            } else {
                                table.style.display = 'none';
                            }
                        });
                        
                        if(catHasMatch || cat.querySelector('.db-category-header').innerText.toLowerCase().includes(term)) {
                            cat.style.display = 'block';
                            if(term) cat.querySelector('.db-category-content').style.display = 'block'; // expand on match
                        } else {
                            cat.style.display = 'none';
                        }
                    });
                });
            }
        };
        
        setupDBSearch('search-core-banking', 'tree-core-banking');
        setupDBSearch('search-payment-engine', 'tree-payment-engine');
`;

code = code.replace('// Dataset Selection', searchLogic + '\n\n        // Dataset Selection');

fs.writeFileSync('js/Managers.js', code);
console.log('Search added.');
