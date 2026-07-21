const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'db');
const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json'));

let enterpriseDb = {
    Volpay_Payment_Engine: []
};

let tableDataMap = {};
let availableFields = [];

function detectType(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return 'number';
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) return 'date';
        return 'string';
    }
    return 'string';
}

files.forEach(file => {
    const filePath = path.join(dbDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const tableName = content.collection || file.replace('_db.json', '');
    
    const rows = content.data.slice(0, 50); // first 50 rows
    
    // analyze fields
    const fieldTypes = {};
    rows.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!fieldTypes[key]) fieldTypes[key] = new Set();
            const type = detectType(row[key]);
            if (type) fieldTypes[key].add(type);
        });
    });
    
    const fields = Object.keys(fieldTypes).map(key => {
        let type = 'string';
        if (fieldTypes[key].has('number') && !fieldTypes[key].has('string')) type = 'number';
        if (fieldTypes[key].has('date') && !fieldTypes[key].has('string') && !fieldTypes[key].has('number')) type = 'date';
        if (fieldTypes[key].has('boolean') && !fieldTypes[key].has('string') && !fieldTypes[key].has('number')) type = 'boolean';
        
        return { name: key, type: type };
    });
    
    enterpriseDb.Volpay_Payment_Engine.push({
        name: tableName,
        fields: fields.map(f => f.name)
    });
    
    // Create global available fields list
    fields.forEach(f => {
        const id = `Volpay_Payment_Engine.${tableName}.${f.name}`;
        if (!availableFields.find(af => af.id === id)) {
            availableFields.push({
                id: id,
                label: f.name,
                type: f.type,
                dbName: 'Volpay_Payment_Engine',
                tableName: tableName,
                category: tableName
            });
        }
    });

    tableDataMap[tableName] = rows;
});

const outputJs = `
// Auto-generated from db JSON files
window.VOLPAY_DB_SCHEMA = ${JSON.stringify(enterpriseDb, null, 4)};
window.VOLPAY_DB_DATA = ${JSON.stringify(tableDataMap, null, 4)};
window.VOLPAY_AVAILABLE_FIELDS = ${JSON.stringify(availableFields, null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'mockDbData.js'), outputJs);
console.log('Successfully built js/mockDbData.js');
