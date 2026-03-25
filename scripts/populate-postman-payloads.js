import fs from 'fs';
import path from 'path';

const root = process.cwd();
const routesDir = path.join(root, 'routes');
const controllersDir = path.join(root, 'Controllers');
const postmanFile = path.join(root, 'postman_collection.json');

if (!fs.existsSync(postmanFile)) {
  console.error('postman_collection.json not found; run generator first');
  process.exit(1);
}

function walk(dir) {
  const list = [];
  for (const it of fs.readdirSync(dir)) {
    const p = path.join(dir, it);
    if (fs.statSync(p).isDirectory()) list.push(...walk(p));
    else if (p.endsWith('.js')) list.push(p);
  }
  return list;
}

function parseRouteFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  // find imports from Controllers
  const importMap = {}; // localName -> controllerPath
  const importRe = /import\s+\{?\s*([A-Za-z0-9_,\s]+)\}?\s*from\s+['"](.+Controllers\/.+?)['"]/g;
  let m;
  while ((m = importRe.exec(content))) {
    const funcs = m[1].split(',').map(s=>s.trim()).filter(Boolean);
    const ctlPath = m[2];
    funcs.forEach(f => importMap[f] = ctlPath);
  }

  // find router.<method>('/path', handler...)
  const routeRe = /(router|app)\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*([^\)]+)\)/gi;
  const routes = [];
  while ((m = routeRe.exec(content))) {
    const method = m[2].toUpperCase();
    const routePath = m[3];
    const handlerPart = m[4];
    // take last identifier as handler
    // find last identifier-like token (skip inline functions)
    const idTokens = Array.from(handlerPart.matchAll(/[A-Za-z0-9_\.]+/g)).map(mt=>mt[0]);
    if (idTokens.length===0) continue;
    const last = idTokens[idTokens.length-1];
    if (/^req$/i.test(last)) continue;
    routes.push({ method, routePath, handler: last });
  }
  return { file, importMap, routes };
}

function findControllerFile(localImportPath) {
  // localImportPath like ../Controllers/userController.js or ../Controllers/userController
  let p = path.resolve(path.dirname(path.join(root,'server.js')), localImportPath);
  if (fs.existsSync(p + '.js')) p = p + '.js';
  else if (fs.existsSync(p)) p = p;
  else {
    // try Controllers dir
    const candidate = path.join(controllersDir, path.basename(localImportPath));
    if (fs.existsSync(candidate + '.js')) return candidate + '.js';
    if (fs.existsSync(candidate)) return candidate;
    return null;
  }
  return p;
}

function extractFieldsFromController(controllerFile, handlerName) {
  if (!controllerFile || !fs.existsSync(controllerFile)) return [];
  const content = fs.readFileSync(controllerFile, 'utf8');
  const fields = new Set();
  // find destructuring like const { a, b } = req.body
  const destrRe = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.body/gi;
  let m;
  while ((m = destrRe.exec(content))) {
    m[1].split(',').map(s=>s.trim()).forEach(f=>{ if (f) fields.add(f.replace(/[:=].*/,'').trim()); });
  }
  // find req.body.xyz occurrences
  const reqBodyRe = /req\.body\.([A-Za-z0-9_]+)/gi;
  while ((m = reqBodyRe.exec(content))) fields.add(m[1]);

  // Narrow to function body of handlerName if possible
  if (handlerName && fields.size>0) {
    // attempt to find function start
    const funcRe = new RegExp(handlerName + "\\s*=\\s*async?\\s*\\(req,\\s*res", 'i');
    const funcIndex = content.search(funcRe);
    if (funcIndex !== -1) {
      const body = content.slice(funcIndex, funcIndex+4000); // small window
      const localFields = new Set();
      let mm;
      while ((mm = destrRe.exec(body))) {
        mm[1].split(',').map(s=>s.trim()).forEach(f=>{ if (f) localFields.add(f.replace(/[:=].*/,'').trim()); });
      }
      const reqBodyRe2 = /req\.body\.([A-Za-z0-9_]+)/gi;
      while ((mm = reqBodyRe2.exec(body))) localFields.add(mm[1]);
      if (localFields.size>0) return Array.from(localFields);
    }
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

function updatePostmanCollection(mappings) {
  const col = JSON.parse(fs.readFileSync(postmanFile, 'utf8'));
  const base = '{{BASE_URL}}';
  function setBodyForItem(item, bodyObj) {
    item.request = item.request || {};
    item.request.header = item.request.header || [];
    if (!item.request.header.some(h=>h.key && h.key.toLowerCase()==='content-type')) {
      item.request.header.push({ key: 'Content-Type', value: 'application/json' });
    }
    item.request.body = { mode: 'raw', raw: JSON.stringify(bodyObj, null, 2), options: { raw: { language: 'json' } } };
  }

  for (const folder of col.item) {
    for (const it of folder.item) {
      const method = it.request.method;
      const raw = it.request.url && it.request.url.raw;
      if (!raw) continue;
      // raw like {{BASE_URL}}/mount/path
      const pathPart = raw.replace(base, '');
      const key = method + ' ' + pathPart;
      if (mappings[key]) {
        setBodyForItem(it, mappings[key]);
      }
    }
  }
  fs.writeFileSync(postmanFile, JSON.stringify(col, null, 2));
  console.log('postman_collection.json updated with inferred payloads');
}

// Main
const routeFiles = walk(routesDir);
const mappings = {}; // key: 'METHOD /mount/path' -> sample body

for (const rf of routeFiles) {
  const { importMap, routes } = parseRouteFile(rf);
  for (const r of routes) {
    const handler = r.handler.replace(/^[A-Za-z0-9_\.]+\./,'');
    const controllerImportPath = importMap[handler];
    let controllerFile = null;
    if (controllerImportPath) controllerFile = findControllerFile(controllerImportPath);
    else {
      // try matching handler name in Controllers folder
      const candidates = walk(controllersDir);
      for (const c of candidates) {
        const content = fs.readFileSync(c, 'utf8');
        const escHandler = handler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('function\\s+'+escHandler+'\\s*\\(|const\\s+'+escHandler+'\\s*=\\s*async','i').test(content) || content.includes('export '+handler)) {
          controllerFile = c; break;
        }
      }
    }
    const fields = extractFieldsFromController(controllerFile, handler);
    if (fields.length===0) continue;
    const body = {};
    for (const f of fields) body[f] = sampleValueForField(f);
    // mount path detection: derive mount from server.js mapping by reading generated postman file structure
    // We'll map by looking for matching route path among existing collection entries
    // Build candidate keys and store; actual matching will be done in updatePostmanCollection
    mappings[r.method + ' ' + r.routePath] = body; // temporary
  }
}

// Now convert mappings to keys matching collection raw paths.
// Build final mapping: try to find folder mount that, when prefixed, matches collection paths.
const col = JSON.parse(fs.readFileSync(postmanFile, 'utf8'));
const finalMappings = {};
for (const folder of col.item) {
  const mount = folder.name; // e.g., /app
  for (const it of folder.item) {
    const method = it.request.method;
    const raw = it.request.url && it.request.url.raw;
    if (!raw) continue;
    const pathPart = raw.replace('{{BASE_URL}}','');
    // try to find mapping with just the route suffix
    const suffix = pathPart.replace(mount, '') || '/';
    // search mappings for key that endsWith route path
    let found = null;
    for (const k of Object.keys(mappings)) {
      const route = k.split(' ')[1];
      if (route === pathPart || route === suffix || pathPart.endsWith(route) || suffix === route) { found = k; break; }
    }
    if (found) {
      finalMappings[method + ' ' + pathPart] = mappings[found];
    }
  }
}

updatePostmanCollection(finalMappings);
