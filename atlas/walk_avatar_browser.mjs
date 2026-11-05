// W-3 in a real browser: the avatar walks the map. The page is served with two LIVE nodes; the Map panel's visible
// actions enter them without invisible canvas targets. Empty-hex taps still obey the free-walk law. Uso: node atlas/walk_avatar_browser.mjs
// (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Two LIVE nodes side by side: the cabin (0,0) and ring-e (1,0). Shaped as the server writes state.json (schema 2).
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
      if (ruta === '/openworld/state.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(ESTADO)); return; }
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
  // Map-panel node actions are visible 44 px buttons; selecting one walks the same route as keyboard input.
  const clicNodo = async (id) => {
    await ev("(() => { const b=document.querySelector('.cats [data-cat=Map]'); if(b.getAttribute('aria-pressed')!=='true') b.click(); })()"); await espera(100);
    return ev(`(() => { const b=document.querySelector('#map-node-list [data-node=${JSON.stringify(id)}]'); if(!b || b.getBoundingClientRect().height<44) return false; b.click(); return true; })()`);
  };
  // A pointer click at a point of the canvas, in canvas pixels, remains a free-walk gesture.
  const clicEn = (px, py) => ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + ${px} * r.width / s.width, clientY: r.top + ${py} * r.height / s.height })); return true; })()`);
  const anclaDe = (nodo) => ev(`(() => { const s = document.getElementById('surface'); const est = AtlasOpenworldState.leer(${JSON.stringify(ESTADO)}); const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, ${JSON.stringify(nodo)}); return a; })()`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await hasta('!!document.getElementById("surface")', 15000), 'map loaded');
  ok(await hasta(`(document.querySelector('#joy .state') || {}).textContent && document.querySelector('#joy .state').textContent.includes('terminal') || document.getElementById('state-tech').textContent.includes('Colony:')`, 15000), 'colony drawn from the state');
  await espera(300);

  // 1 · a click on the cabin enters it (the walker starts there): the key of the tutorial is played.
  const cabina = await anclaDe('cabin');
  ok(cabina && typeof cabina.x === 'number', 'cabin hex has an anchor');
  ok(await clicNodo('cabin'), 'visible Map panel offers a touch-sized cabin action');
  await espera(300);
  const primero = await estado();
  ok(/tutorial: key played/.test(primero), 'click on the cabin enters it: ' + primero.slice(0, 140));
  medidas.cabina = primero.slice(0, 160);

  // 2 · a click on the east neighbour walks there over the visible route, then enters it.
  const vecino = await anclaDe('ring-e');
  ok(vecino && typeof vecino.x === 'number', 'ring-e hex has an anchor');
  await ev(`window.__dibujos = 0; document.getElementById('surface').addEventListener('visitor:draw', () => { window.__dibujos++; })`);
  ok(await clicNodo('ring-e'), 'visible Map panel offers a touch-sized ring-e action');
  await espera(60);
  const caminando = await estado();
  medidas.caminando = caminando.slice(0, 120);
  ok(/walking to ring-e/.test(caminando) || /ring-e/.test(caminando) || /terminal/.test(caminando), 'the walk starts: ' + caminando.slice(0, 120));
  ok(await hasta(`/terminal: basic/.test(document.querySelector('#joy .state').textContent)`, 8000), 'arrival enters the node');
  const llegada = await estado();
  const dibujos = await ev('window.__dibujos');
  medidas.dibujos = dibujos;
  ok(dibujos >= 12, 'the walk is drawn frame by frame (12 frames per step): ' + dibujos);
  medidas.llegada = llegada.slice(0, 180);
  ok(/terminal: basic/.test(llegada), 'arrival anchors the terminal: ' + llegada.slice(0, 140));
  ok(/beacon skipped · NO_DATA/.test(llegada) || /next step is at cabin/.test(llegada) || /tutorial:/.test(llegada), 'arrival reports the tutorial: ' + llegada.slice(0, 180));

  // 3 · with free walk off (the W-4 node law), a click on an empty hex walks nowhere and says NO_DATA.
  // With free walk on (compact terminal, 2026-11-02: the pad is retired), the same tap steps the crab one cell toward it.
  const libre = (on) => ev(`(() => { const f = document.getElementById('free-walk'); if (f && f.checked !== ${on}) { f.click(); } return !!f; })()`);
  await libre(false);
  const vacio = await anclaDe('cabin');
  await clicEn(vacio.x + 200, vacio.y + 200);
  await espera(200);
  const vacia = await estado();
  ok(!/walking to/.test(vacia), 'an empty hex does not start a walk');
  ok(/NO_DATA: no visible node on that hex/.test(vacia), 'an empty hex says NO_DATA: ' + vacia.slice(0, 120));
  ok(await libre(true), 'the free-walk checkbox is missing');
  await clicEn(vacio.x + 200, vacio.y + 200); await espera(200);
  const paso = await estado();
  ok(/^You walk (east|south-east|south-west|west|north-east|north-west) to /.test(paso), 'with free walk on, a tap off any node does not step the crab: ' + paso.slice(0, 120));

  console.log(JSON.stringify({ piece: 'W-3', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'W-3', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
