import fs from 'fs';
import path from 'path';

const root = process.cwd();
const serverPath = path.join(root, 'server.js');
const routesDir = path.join(root, 'routes');

function readServerMounts() {
  const content = fs.readFileSync(serverPath, 'utf8');
  const importRe = /import\s+([A-Za-z0-9_]+)\s+from\s+['"](.\/routes[^'\"]+)['"]/g;
  const mounts = {};
  let m;
  const varToFile = {};
  while ((m = importRe.exec(content))) {
    varToFile[m[1]] = m[2];
  }
  const useRe = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
  while ((m = useRe.exec(content))) {
    const mount = m[1];
    const varName = m[2];
    mounts[varName] = mount;
  }
  // also include nested mounts (like /cinematics/category)
  return { mounts, varToFile };
}

function scanRouteFiles() {
  const files = [];
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const it of items) {
      const p = path.join(dir, it);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  }
  walk(routesDir);
  return files;
}

function extractRoutesFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  // find the router variable name (e.g., const userRoute = Router();)
  const routerNameMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*Router\(/);
  const routerName = routerNameMatch ? routerNameMatch[1] : null;
  const re = /([A-Za-z0-9_]+)\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]/gi;
  const routes = [];
  let m;
  while ((m = re.exec(content))) {
    const obj = m[1];
    const method = m[2].toUpperCase();
    let routePath = m[3];
    // normalize routePath
    if (!routePath.startsWith('/')) routePath = '/' + routePath;
    routes.push({ obj, method, routePath });
  }
  return { file, routerName, routes };
}

function buildCollection() {
  const { mounts, varToFile } = readServerMounts();
  const routeFiles = scanRouteFiles();
  const itemsByMount = {};

  for (const f of routeFiles) {
    const { routerName, routes } = extractRoutesFromFile(f);
    if (routes.length === 0) continue;
    // determine which var corresponds to this file
    const rel = './' + path.relative(root, f).replace(/\\/g, '/');
    const varEntries = Object.entries(varToFile).filter(([, v]) => {
      return v === rel || v === rel.replace(/\.js$/, '') || v === rel.replace(/\.routes\.js$/, '');
    });
    // find mount path
    let mount = null;
    if (varEntries.length > 0) {
      const varName = varEntries[0][0];
      mount = mounts[varName] || null;
    }
    // fallback: try to match by file basename (some imports use different names)
    if (!mount) {
      for (const [v, p] of Object.entries(varToFile)) {
        if (p.includes(path.basename(f).replace('.js',''))) {
          mount = mounts[v];
          break;
        }
      }
    }
    const key = mount || '/';
    if (!itemsByMount[key]) itemsByMount[key] = [];
    routes.forEach((r) => itemsByMount[key].push({ ...r, file: f }));
  }

  // Build Postman collection object
  const collection = {
    info: {
      name: 'wocha kocha - API collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: []
  };

  const baseUrlVar = '{{BASE_URL}}';

  for (const [mount, routes] of Object.entries(itemsByMount)) {
    const folder = { name: mount, item: [] };
    // deduplicate routes by method+path
    const seen = new Set();
    routes.forEach((r) => {
      const fullPath = path.posix.join(mount, r.routePath).replace(/\\/g, '/').replace(/\/\//g, '/');
      const key = r.method + ' ' + fullPath;
      if (seen.has(key)) return;
      seen.add(key);
      folder.item.push({
        name: key,
        request: {
          method: r.method,
          header: [],
          url: {
            raw: baseUrlVar + fullPath,
            host: [baseUrlVar],
            path: fullPath.split('/').filter(Boolean).map(p => p.startsWith(':') ? p : p)
          }
        }
      });
    });
    collection.item.push(folder);
  }

  fs.writeFileSync(path.join(root, 'postman_collection.json'), JSON.stringify(collection, null, 2));
  console.log('postman_collection.json generated');
}

buildCollection();
