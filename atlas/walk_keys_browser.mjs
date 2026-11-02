// W-4 in a real browser: the keyboard walks the map. Arrow keys choose a visible neighbour, Enter walks there, and the
// grid of six buttons is gone. The page is served with a state that lists two LIVE nodes (the cabin
// and its east neighbour). A click on the cabin enters it; a click on the neighbour walks there over the visible route
// and arrival enters it; a click on an empty hex says NO_DATA and walks nowhere. Uso: node atlas/walk_avatar_browser.mjs
// (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Two LIVE nodes side by side: the cabin (0,0) and ring-e (1,0). Shaped as the server writes estado.json (schema 2).
const ESTADO = {
  esquema: 'preceptoros.openworld-estado/2', nodes: [],
  colonia: {
    nodes: [
      { id: 'cabin', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-10-31', look: 'basic' },
      { id: 'ring-e', q: 1, r: 0, alive: true, seal: 'LIVE', since: '2026-10-31', look: 'basic' }
    ],
    buildings: [{ id: 'b-cabin', node: 'cabin' }, { id: 'b-ring-e', node: 'ring-e' }],
    units: []
  }
};

// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      if (ruta === '/openworld/estado.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(ESTADO)); return; }
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
  const estado = () => ev(`(document.querySelector('#joy .state') || {}).textContent || ''`);
  // A key press on the page, as the keyboard sends it: keydown at the body, or at the chat field when given.
  const tecla = (key, enCampo) => ev(`(() => { const t = ${enCampo ? "document.getElementById('question')" : 'document.body'}; if (${enCampo ? 'true' : 'false'}) { t.focus(); } t.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })); return true; })()`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await hasta('!!document.getElementById("surface")', 15000), 'map loaded');
  ok(await hasta(`document.getElementById('state').textContent.includes('Colony:')`, 15000), 'colony drawn from the state');
  await espera(300);

  // 0 · free walk (visitor_walk.js) is on by default; this guard checks the W-4 node law, reachable by turning it off.
  await ev(`(() => { const f = document.getElementById('free-walk'); if (f) { f.checked = false; f.dispatchEvent(new Event('change')); } return true; })()`);

  // 1 · the grid of six buttons and the enter button are gone from the page.
  const botones = await ev(`[...document.querySelectorAll('#joy button')].map(b => b.textContent.trim())`);
  medidas.botones = botones;
  ok(!botones.some((t) => ['east', 'west', 'north-east', 'north-west', 'south-east', 'south-west', 'enter node'].includes(t)), 'the grid and enter node are gone: ' + JSON.stringify(botones));
  ok(botones.includes('Skip tutorial'), 'the skip tutorial button stays');

  // 2 · Enter with no choice says how to choose.
  await tecla('Enter');
  await espera(150);
  const sinEleccion = await estado();
  ok(/No node selected/.test(sinEleccion), 'Enter with no choice says how to choose: ' + sinEleccion.slice(0, 100));

  // 3 · ArrowRight chooses ring-e; the status says so; Enter walks there and enters it.
  await tecla('ArrowRight');
  await espera(150);
  const elegido = await estado();
  ok(/selected ring-e/.test(elegido), 'ArrowRight chooses the east neighbour: ' + elegido.slice(0, 100));
  await ev(`window.__dibujos = 0; document.getElementById('surface').addEventListener('visitor:draw', () => { window.__dibujos++; })`);
  await tecla('Enter');
  ok(await hasta(`/terminal: basic/.test(document.querySelector('#joy .state').textContent)`, 8000), 'Enter walks to the chosen node and enters it');
  const llegada = await estado();
  medidas.llegada = llegada.slice(0, 160);
  ok((await ev('window.__dibujos')) >= 12, 'the walk is drawn frame by frame');

  // 4 · ArrowRight from ring-e has no visible node to the east: the page says so and walks nowhere.
  await tecla('ArrowRight');
  await espera(150);
  const sinVecino = await estado();
  ok(/NO_DATA/.test(sinVecino), 'no visible neighbour is said as NO_DATA: ' + sinVecino.slice(0, 120));

  // 5 · while a form field has focus, the arrow keys are the field's own: nothing is chosen.
  await ev(`(() => { const d = document.getElementById('state'); d.textContent = 'MARK'; return true; })()`);
  await tecla('ArrowLeft', true);
  await espera(150);
  const enCampo = await estado();
  ok(!/selected/.test(enCampo), 'arrow keys in the chat field are not taken by the map: ' + enCampo.slice(0, 100));

  console.log(JSON.stringify({ piece: 'W-4', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'W-4', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
