import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

// Local-only static SPA preview. No production deployment or app backend.
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let body; let extension = path.extname(file);
    try { body = await readFile(file); }
    catch { if (extension) { res.writeHead(404).end(); return; } body = await readFile(path.join(root, 'index.html')); extension = '.html'; }
    res.writeHead(200, { 'content-type': types[extension] || 'application/octet-stream', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }); res.end(body);
  } catch { res.writeHead(400).end(); }
}).listen(8081, '127.0.0.1', () => console.log('Same Side web preview: http://localhost:8081'));
