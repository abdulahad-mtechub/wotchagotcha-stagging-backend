import fs from 'fs';
import path from 'path';

const controllersDir = 'e:/mtechub/projects/backup/wocha kocha/Controllers';

// Map of table names to catch in regex
const tableNames = [
    'video_category',
    'pic_category',
    'item_category',
    'news_category',
    'sport_category',
    'tv_progmax_category',
    'QAFI_category',
    'GEBC_category',
    'hobbies_category',
    'kidvid_category',
    'fanstar_category',
    'cinematic_category',
    'disc_category'
];

// List of all controller files to process
const getAllFiles = (dir, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    return fileList;
};

const allFiles = getAllFiles(controllersDir);

allFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern 1: checkQuery with specific table name and if (checkResult.rowCount === 0)
    // We iterate over the table names to be more precise
    tableNames.forEach(tableName => {
        const pattern = new RegExp(`\\s*const check(Category)?Query\\s*=\\s*\\"SELECT \\* FROM ${tableName} WHERE id = \\$1\\";\\s*const check(Category)?Result\\s*=\\s*await pool\\.query\\(check(Category)?Query, \\[.*?\\]\\);\\s*if\\s*\\(check(Category)?Result\\.rowCount\\s*===\s*0\\)\\s*\\{[\\s\\S]*?return res[\\s\\S]*?\\.json\\(\\{[\\s\\S]*?\\}\\);\\s*\\}`, 'g');
        content = content.replace(pattern, '');
    });

    // Pattern 2: Catching variants where count is checked differently or table name is slightly off
    // but follows the same pattern of returning 404 if category doesn't exist.
    const genericPattern = /\s*const checkQuery\s*=\s*\"SELECT \* FROM .*?_category WHERE id = \$1\";\s*const checkResult\s*=\s*await pool\.query\(checkQuery, \[id\]\);\s*if\s*\(checkResult\.rowCount\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g;
    content = content.replace(genericPattern, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully patched ${filePath}`);
    }
});
