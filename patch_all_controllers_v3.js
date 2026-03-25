import fs from 'fs';
import path from 'path';

const controllersDir = 'e:/mtechub/projects/backup/wocha kocha/Controllers';

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

    // A very loose regex that finds the "SELECT * FROM ..._category" check
    // and removes the entire block including the 404 response.
    // Explanation:
    // \s*.*?SELECT \* FROM .*?_category.*?     -> matches the query definition
    // [\s\S]*?await pool\.query\(.*?\)          -> matches the execution
    // [\s\S]*?if\s*\(.*?(rowCount|category).*?===?\s*0\)  -> matches the rowCount check
    // [\s\S]*?return res[\s\S]*?\.status\(404\)[\s\S]*?\}\s* -> matches the return 404 and closing brace

    const patterns = [
        // Variant 1: classic checkQuery + if block
        /\s*const check(Category)?Query\s*=\s*(?:[`"'])SELECT \* FROM .*?_category WHERE id = \$1.*?([`"']);\s*const check(Category)?Result\s*=\s*await pool\.query\(check(Category)?Query, \[.*?\]\);\s*if\s*\(check(Category)?Result\.rowCount\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g,

        // Variant 2: pooled query inside rowcount destructuring (like in postLetterController)
        /\s*const\s*\{\s*rowCount:\s*category\s*\}\s*=\s*await\s*pool\.query\(\s*[`"']SELECT \* FROM .*?_category WHERE id = \$1 LIMIT 1[`"'],\s*\[.*?\]\s*\);\s*if\s*\(category\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g,

        // Variant 3: generic variant to catch the rest
        /\s*(?:const|let)\s*.*?\s*=\s*await\s*pool\.query\(\s*[`"']SELECT \* FROM .*?_category WHERE id = \$1.*?[`"'],\s*\[.*?\]\s*\);\s*if\s*\(.*?(rowCount|category).*?===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.status\(404\)[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g
    ];

    patterns.forEach(p => {
        content = content.replace(p, '\n');
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully patched ${filePath}`);
    }
});
