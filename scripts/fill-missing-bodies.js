import fs from 'fs';
import path from 'path';

const root = process.cwd();
const controllersDir = path.join(root, 'Controllers');
const postmanFile = path.join(root, 'postman_collection.json');

if (!fs.existsSync(postmanFile)) {
  console.error('postman_collection.json not found');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

function extractFieldsFromFileByName(file, name) {
  const content = fs.readFileSync(file, 'utf8');
  const fields = new Set();
  const destrRe = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.body/gi;
  let m;
  while ((m = destrRe.exec(content))) {
    m[1].split(',').map(s=>s.trim()).forEach(f=>{ if (f) fields.add(f.replace(/[:=].*/,'').trim()); });
  }
  const reqBodyRe = /req\.body\.([A-Za-z0-9_]+)/gi;
  while ((m = reqBodyRe.exec(content))) fields.add(m[1]);

  // if name present, try to limit to function block near the name
  const idx = content.indexOf(name);
  if (idx!==-1) {
    const slice = content.slice(Math.max(0, idx-300), Math.min(content.length, idx+1200));
    let mm;
    destrRe.lastIndex = 0;
    while ((mm = destrRe.exec(slice))) {
      mm[1].split(',').map(s=>s.trim()).forEach(f=>{ if (f) fields.add(f.replace(/[:=].*/,'').trim()); });
    }
    const reqBodyRe2 = /req\.body\.([A-Za-z0-9_]+)/gi;
    while ((mm = reqBodyRe2.exec(slice))) fields.add(mm[1]);
  }
  return Array.from(fields);
}

function sampleValueForField(name) {
  const n = name.toLowerCase();
  if (n.includes('email')) return 'user@example.com';
  if (n.includes('password')) return 'Password123!';
  if (n.includes('name') || n.includes('title')) return 'Sample Name';
  if (n.includes('description') || n.includes('body')) return 'Sample description text.';
  if (n.includes('image') || n.includes('thumbnail') || n.includes('video')) return 'https://example.com/media.jpg';
  if (n.includes('price') || n.includes('amount')) return 100;
  if (n.includes('date')) return new Date().toISOString();
  if (n.includes('id') || n.endsWith('_id')) return 1;
  if (n.includes('status')) return 'active';
  if (n.includes('type')) return 'general';
  if (n.includes('link') || n.includes('url')) return 'https://example.com';
  if (n.includes('phone') || n.includes('contact')) return '+1234567890';
  if (n.includes('boolean') || n.startsWith('is_') || n.startsWith('has_')) return true;
  return 'sample';
}

const controllers = walk(controllersDir);
const col = JSON.parse(fs.readFileSync(postmanFile, 'utf8'));
let changed = 0;

for (const folder of col.item) {
  for (const it of folder.item) {
    const method = (it.request && it.request.method) || '';
    if (!['POST','PUT','PATCH'].includes(method)) continue;
    const hasBody = it.request && it.request.body && it.request.body.raw && it.request.body.raw.trim().length>0;
    if (hasBody) continue;

    // determine last path segment or action name
    const raw = it.request && it.request.url && it.request.url.raw;
    const name = it.name || '';
    const lastSeg = raw ? raw.split('/').filter(Boolean).pop() : null;
    const candidates = [];
    if (lastSeg) candidates.push(lastSeg);
    if (name) {
      const parts = name.split('/').pop().split(' ').map(s=>s.trim()).filter(Boolean);
      candidates.push(...parts);
    }

    let fields = [];
    for (const cfile of controllers) {
      const txt = fs.readFileSync(cfile,'utf8');
      for (const cand of candidates) {
        if (txt.includes(cand)) {
          const f = extractFieldsFromFileByName(cfile, cand);
          if (f.length>0) { fields = f; break; }
        }
      }
      if (fields.length>0) break;
    }

    if (fields.length===0) {
      // fallback: common fields
      fields = ['name','description'];
    }

    const body = {};
    for (const f of fields) body[f] = sampleValueForField(f);

    it.request = it.request || {};
    it.request.header = it.request.header || [];
    if (!it.request.header.some(h => h.key && h.key.toLowerCase()==='content-type')) {
      it.request.header.push({ key: 'Content-Type', value: 'application/json' });
    }
    it.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
    changed++;
  }
}

if (changed>0) {
  fs.writeFileSync(postmanFile, JSON.stringify(col, null, 2));
  console.log('Injected', changed, 'bodies into postman_collection.json');
} else console.log('No missing bodies found');
