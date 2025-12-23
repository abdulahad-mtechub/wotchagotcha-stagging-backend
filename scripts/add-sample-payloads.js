import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'postman_collection.json');
if (!fs.existsSync(file)) {
  console.error('postman_collection.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function sampleForRoute(pathParts) {
  const joined = pathParts.join('/').toLowerCase();
  if (joined.includes('user') || joined.includes('register') || joined.includes('login')) {
    return { email: 'user@example.com', password: 'password123', username: 'demo' };
  }
  if (joined.includes('banner') || joined.includes('top') || joined.includes('news') || joined.includes('qafi') || joined.includes('gebc') || joined.includes('pic') || joined.includes('video')) {
    return { name: 'Sample Title', description: 'Sample description', image: 'https://example.com/image.jpg', user_id: 1 };
  }
  if (joined.includes('item')) {
    return { title: 'Sample item', description: 'Details', price: 100, condition: 'new', region: 'City' };
  }
  if (joined.includes('payment') || joined.includes('cards') || joined.includes('transactions')) {
    return { amount: 10.0, payment_method: 'card', user_id: 1 };
  }
  // default
  return { example: 'value' };
}

function processItems(items) {
  for (const it of items) {
    if (it.item) {
      processItems(it.item);
      continue;
    }
    const req = it.request;
    if (!req) continue;
    const method = req.method && req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // add header if missing
      req.header = req.header || [];
      const hasCt = req.header.some(h => h.key && h.key.toLowerCase() === 'content-type');
      if (!hasCt) req.header.push({ key: 'Content-Type', value: 'application/json' });

      // add body if missing
      if (!req.body) {
        const pathParts = (req.url && req.url.path) || [];
        const sample = sampleForRoute(pathParts);
        req.body = {
          mode: 'raw',
          raw: JSON.stringify(sample, null, 2),
          options: { raw: { language: 'json' } }
        };
      }
    }
  }
}

processItems(data.item || []);
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('postman_collection.json updated with sample payloads');
