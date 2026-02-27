import fs from 'fs';

const filesToFix = [
    'e:/mtechub/projects/backup/wocha kocha/Controllers/xpiVideoController.js',
    'e:/mtechub/projects/backup/wocha kocha/Controllers/picTourController.js'
];

filesToFix.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to look for the checkQuery followed by the if block
    // We match any spacing and any "does not exist" variant
    const pattern = /\s*const checkQuery\s*=\s*\"SELECT \* FROM (video|pic)_category WHERE id = \$1\";\s*const checkResult\s*=\s*await pool\.query\(checkQuery, \[id\]\);\s*if\s*\(checkResult\.rowCount\s*===\s*0\)\s*\{[\s\S]*?return res[\s\S]*?\.json\(\{[\s\S]*?\}\);\s*\}/g;

    const newContent = content.replace(pattern, '');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Successfully patched ${filePath}`);
    } else {
        console.log(`No patches needed for ${filePath} (Pattern not found)`);
    }
});
