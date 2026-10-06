import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = {
  '.png': 'image/png',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.html': 'text/html',
};

// Serve only the demo host, compiled bundle, and Lynx runtime. Never expose .env or source files.
http
  .createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname,
      );
      let relative;
      if (pathname === '/') relative = 'web/index.html';
      else if (pathname === '/host.js') relative = 'web/host.js';
      else if (pathname.startsWith('/static/')) relative = 'dist' + pathname;
      else if (
        pathname.startsWith('/dist/') ||
        pathname.startsWith('/node_modules/@lynx-js/web-core/dist/')
      )
        relative = pathname.slice(1);
      else throw new Error('Not found');
      const file = path.resolve(root, relative);
      const allowed = [
        'web',
        'dist',
        'node_modules/@lynx-js/web-core/dist',
      ].some((directory) =>
        file.startsWith(path.join(root, directory) + path.sep),
      );
      if (!allowed) throw new Error('Not found');
      const body = await readFile(file);
      res.setHeader(
        'Content-Type',
        types[path.extname(file)] || 'application/octet-stream',
      );
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(4180, '127.0.0.1', () => {
    console.log('Demo: http://127.0.0.1:4180');
  });
