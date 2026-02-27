import fs from 'fs';
import path from 'path';

const controllersDir = 'e:/mtechub/projects/backup/wocha kocha/Controllers';

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

    // Pattern 1: Catching variants with checkQuery/checkCategoryQuery and any quote type (", ', `)
    // We look for SELECT * FROM ..._category WHERE id = $1
    // followed by if (checkResult.rowCount === 0) { ... return res.status(404) ... }
    const pattern = /\s*const check(Category)?Query\s*=\s*[\"`']SELECT \* FROM .*?_category WHERE id = \$1.*?[\"`'];\s*const check(Category)?Result\s*=\s*await pool\.query\(check(Category)?Query, \[.*?\]\);\s*if\s*\(check(Category)?Result\.rowCount\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.status\(404\)[\s\S]*?\}\s*(?:\r?\n)?/g;

    // Pattern 2: catching variations with double quotes specifically
    const pattern2 = /\s*const check(Category)?Query\s*=\s*\"SELECT \* FROM .*?_category WHERE id = \$1\";\s*const check(Category)?Result\s*=\s*await pool\.query\(check(Category)?Query, \[.*\]\);\s*if\s*\(check(Category)?Result\.rowCount\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g;

    content = content.replace(pattern, '\n');
    content = content.replace(pattern2, '\n');

    // Also handle create/update constraints in catch blocks if they exist (though they might be needed)
    // Actually, focusing on the retrieval APIs is the priority.

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully patched ${filePath}`);
    }
});
