const fs = require('fs');
let code = fs.readFileSync('js/Managers.js', 'utf8');

const replacement = `
        const s1ds = document.getElementById('stage-1-datasets');
        const s1cdb = document.getElementById('stage-1-core-db');
        const stage2 = document.getElementById('stage-2'); // Hide the entire stage-2 pipeline stage
        
        if(state.currentBuilder.mode === 'core') {
            if(s1ds) s1ds.style.display = 'none';
            if(s1cdb) s1cdb.style.display = 'block';
            if(stage2) stage2.style.display = 'none';
`;

code = code.replace(/const s1ds = document\.getElementById\('stage-1-datasets'\);\s*const s1cdb = document\.getElementById\('stage-1-core-db'\);\s*if\(state\.currentBuilder\.mode === 'core'\) \{/s, replacement);

const replacementElse = `
        } else {
            if(s1ds) s1ds.style.display = 'block';
            if(s1cdb) s1cdb.style.display = 'none';
            if(stage2) stage2.style.display = 'block';
        }
        lucide.createIcons();
`;

code = code.replace(/\} else \{\s*if\(s1ds\) s1ds\.style\.display = 'block';\s*if\(s1cdb\) s1cdb\.style\.display = 'none';\s*\}/s, replacementElse);

fs.writeFileSync('js/Managers.js', code);
console.log('Fixed Stage 2 visibility.');
