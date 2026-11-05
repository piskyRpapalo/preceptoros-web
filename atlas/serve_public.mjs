// Static server for the Chrome harnesses (X7, 2026-10-26). It listens on port 0, so the system hands
// out a free port. A fixed range collided with live services on this node (measured: pwa 8740,
// nexo 8765, sala 8831 inside 8700-8889), and `python3 -m http.server` on a taken port failed in
// silence, so the harness ended up talking to another service. Uso: const s = await sirve(raiz);
// const port = s.address().port; ... s.close();
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';

const TIPOS = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.md': 'text/plain', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json', '.gz': 'application/gzip', '.sha256': 'text/plain' };

export function sirve(raiz, puerto = 0) {
  const base = resolve(raiz);
  const s = createServer((req, res) => {
    try {
      let f = resolve(base, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
      if (f !== base && !f.startsWith(base + '/')) { res.writeHead(403); res.end(); return; }
      if (statSync(f).isDirectory()) { f = join(f, 'index.html'); }
      const cuerpo = readFileSync(f);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r, j) => { s.once('error', j); s.listen(puerto, '127.0.0.1', () => r(s)); });
}
