// EU-1 piece 1 · the single visit pass in a real browser. One visit from /openworld/ to the end of the short route:
// the cabin key is played, the visit runs (beacon, one step), the visit ends and the open beacon is recorded as skipped
// (NO_DATA), the account is gone after the end, and the walk finishes by entering the cabin again.
// Uso: node atlas/usuario_efimero_pasada_browser.mjs   (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}

const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port;
  ch = launchChrome(0);
  const cdpPort = await ch.debugPort();
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      const que = 'exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop() + ':' + ((f.lineNumber ?? 0) + 1);
      if (!fallos.includes(que)) { fallos.push(que); }
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  // Click the first button whose text matches; the page's own handler runs.
  const pulsa = (texto) => ev(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(texto)}); if (!b) { return false; } b.click(); return true; })()`);
  const pulsaId = (idb) => ev(`(() => { const b = document.getElementById(${JSON.stringify(idb)}); if (!b || b.disabled) { return false; } b.click(); return true; })()`);
  const estado = () => ev(`(document.querySelector('#joy .state') || {}).textContent || ''`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await hasta('!!document.getElementById("surface") && !!document.getElementById("joy")', 15000), 'map and joystick loaded');

  // 1 · the cabin key: the walker stands on the cabin at start; entering it plays the key.
  ok(await hasta("[...document.querySelectorAll('button')].some(x => x.textContent.trim() === 'enter node')", 15000), 'enter node button exists');
  ok(await pulsa('enter node'), 'enter node pressed');
  await espera(300);
  const primero = await estado();
  ok(/tutorial: key played/.test(primero), 'cabin key played on first entry: ' + primero.slice(0, 120));
  medidas.primera_entrada = primero.slice(0, 160);

  // 2 · the visit: start, beacon (100 copper once), one game step.
  ok(await hasta('!!document.getElementById("visitor-start")', 5000), 'visit start button shown');
  ok(await pulsaId('visitor-start'), 'visit started');
  ok(await hasta('!!document.getElementById("visitor-beacon")', 10000), 'visit panel shows beacon');
  ok(await pulsaId('visitor-beacon'), 'beacon claimed');
  await espera(300);
  const panel = await ev(`document.getElementById('visitor-play').textContent`);
  ok(/Copper 100/.test(panel), 'copper 100 after the beacon');
  ok(await pulsaId('visitor-step'), 'one game step taken');
  await espera(200);
  medidas.copper_tras_baliza = /Copper 100/.test(panel);

  // 3 · the visit ends: the open beacon is recorded as skipped (beelink is NO_DATA); the walk keeps the key.
  ok(await pulsaId('visitor-end'), 'visit ended');
  await espera(300);
  const fin = await estado();
  ok(/visit ended/.test(fin) && /played: key/.test(fin) && /skipped: beacon/.test(fin), 'visit end report: key played, beacon skipped: ' + fin.slice(0, 160));
  medidas.fin_visita = fin.slice(0, 200);
  ok(await hasta('!!document.getElementById("visitor-start") && !document.getElementById("visitor-beacon")', 5000), 'account is gone after the visit ends');

  // 4 · the walk finishes: entering the cabin again plays the node step (the dead beacon is already resolved).
  ok(await pulsa('enter node'), 'enter node button still exists after the visit');
  await espera(300);
  const segunda = await estado();
  ok(/tutorial: node played/.test(segunda), 'node step played on the second entry: ' + segunda.slice(0, 120));
  medidas.segunda_entrada = segunda.slice(0, 160);

  // 5 · the walk is over: a further entry says so, and nothing else is recorded.
  ok(await pulsa('enter node'), 'enter node button for the last check');
  await espera(300);
  const ultima = await estado();
  ok(/tutorial: complete/.test(ultima), 'walk reports complete at the end: ' + ultima.slice(0, 120));
  medidas.ultima = ultima.slice(0, 160);

  console.log(JSON.stringify({ piece: 'EU-1.5', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'EU-1.5', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
