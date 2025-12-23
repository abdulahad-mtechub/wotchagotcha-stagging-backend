import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, filelist);
    } else if (/\.js$/.test(file) || /\.sql$/.test(file)) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function extractCreatedTables(initSql) {
  const re = /CREATE TABLE IF NOT EXISTS public\.([A-Za-z0-9_]+)/g;
  const tables = new Set();
  let m;
  while ((m = re.exec(initSql))) {
    tables.add(m[1]);
  }
  return tables;
}

function extractReferencedTables(fileContent) {
  const tables = new Set();
  const patterns = [
    /FROM\s+public\.([A-Za-z0-9_]+)/gi,
    /INSERT INTO\s+public\.([A-Za-z0-9_]+)/gi,
    /UPDATE\s+public\.([A-Za-z0-9_]+)/gi,
    /DELETE FROM\s+public\.([A-Za-z0-9_]+)/gi,
    /REFERENCES\s+([A-Za-z0-9_]+)\(/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(fileContent))) {
      if (m[1]) tables.add(m[1]);
    }
  }
  return tables;
}

function main() {
  const root = path.resolve(process.cwd());
  const initPath = path.join(root, 'model', 'init.sql');
  if (!fs.existsSync(initPath)) {
    console.error('model/init.sql not found');
    process.exit(1);
  }
  const initSql = fs.readFileSync(initPath, 'utf8');
  const created = extractCreatedTables(initSql);

  const files = walk(root);
  const referenced = new Set();
  for (const f of files) {
    if (f.includes('node_modules')) continue;
    const content = fs.readFileSync(f, 'utf8');
    const refs = extractReferencedTables(content);
    refs.forEach((t) => referenced.add(t));
  }

  // remove common SQL words accidentally matched
  const ignore = new Set(['users', 'public']);
  const used = Array.from(referenced).filter((t) => !ignore.has(t));

  const missing = used.filter((t) => !created.has(t));

  console.log('Tables referenced in code (sample):', used.length);
  console.log('Tables defined in model/init.sql:', created.size);
  if (missing.length === 0) {
    console.log('No missing table definitions detected.');
  } else {
    console.log('Missing table definitions (please add to model/init.sql):');
    missing.sort().forEach((t) => console.log('-', t));
  }
}

main();
