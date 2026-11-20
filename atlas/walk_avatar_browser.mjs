// W-3 in a real browser: node route walking and empty hex NO_DATA. W-4 retired
// the Free walk checkbox; modern visitor Play/crab has a separate Journey gate. Uso: node atlas/walk_avatar_browser.mjs
// (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Two LIVE nodes side by side: the first node (0,0) and ring-e (1,0). Shaped as the server writes state.json (schema 2).
const ESTADO = {
  esquema: 'preceptoros.openworld-estado/2', nodes: [],
  colonia: {
    nodes: [
      { id: 'home', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-10-31', look: 'basic' },
      { id: 'ring-e', q: 1, r: 0, alive: true, seal: 'LIVE', since: '2026-10-31', look: 'basic' }
    ],
    buildings: [{ id: 'b-home', node: 'home' }, { id: 'b-ring-e', node: 'ring-e' }],
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
    await ev("(() => { const b=document.querySelector('.cats [data-cat=Welcome]'); if(b.getAttribute('aria-pressed')!=='true') b.click(); })()"); await espera(100);
    return ev(`(() => { const b=document.querySelector('#map-node-list [data-node=${JSON.stringify(id)}]'); if(!b || b.getBoundingClientRect().height<44) return false; b.click(); return true; })()`);
  };
  // A pointer click at a point of the canvas, in canvas pixels, remains a free-walk gesture.
  const clicEn = (px, py) => ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + ${px} * r.width / s.width, clientY: r.top + ${py} * r.height / s.height })); return true; })()`);
  const anclaDe = (nodo) => ev(`(() => { const s = document.getElementById('surface'); const est = AtlasOpenworldState.leer(${JSON.stringify(ESTADO)}); const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, ${JSON.stringify(nodo)}); return a; })()`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('!!document.getElementById("surface")', 15000), 'map loaded');
  ok(await hasta(`(document.querySelector('#joy .state') || {}).textContent && document.querySelector('#joy .state').textContent.includes('terminal') || document.getElementById('state-tech').textContent.includes('Colony:')`, 15000), 'colony drawn from the state');
  await espera(300);

  // 1 · a click on the first node enters it (the walker starts there): the key of the tutorial is played.
  const casa = await anclaDe('home');
  ok(casa && typeof casa.x === 'number', 'home hex has an anchor');
  ok(await clicNodo('home'), 'visible Welcome leaf offers a touch-sized home action');
  await espera(300);
  const primero = await estado();
  ok(/tutorial: key played/.test(primero), 'click on the first node enters it: ' + primero.slice(0, 140));
  medidas.casa = primero.slice(0, 160);

  // 2 · a click on the east neighbour walks there over the visible route, then enters it.
  const vecino = await anclaDe('ring-e');
  ok(vecino && typeof vecino.x === 'number', 'ring-e hex has an anchor');
  await ev(`window.__dibujos = 0; document.getElementById('surface').addEventListener('visitor:draw', () => { window.__dibujos++; })`);
  ok(await clicNodo('ring-e'), 'visible Welcome leaf offers a touch-sized ring-e action');
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
  ok(/beacon skipped · NO_DATA/.test(llegada) || /next step is at home/.test(llegada) || /tutorial:/.test(llegada), 'arrival reports the tutorial: ' + llegada.slice(0, 180));

  // 3 · retired W-4 Free walk is deliberately NOT a visible switch. An empty-hex
  // tap remains fail-closed; Play starts the current visitor path (separately
  // verified by journey_single_mount_browser). Never click hidden controls.
  const legacy = await ev(`(() => { const f=document.getElementById('free-walk');
    return { exists:!!f, visible:!!(f&&f.getBoundingClientRect().height>0), checked:!!(f&&f.checked) }; })()`);
  ok(legacy.exists && !legacy.visible,
    'retired Free walk checkbox must stay hidden: ' + JSON.stringify(legacy));
  medidas.legacy = legacy;
  // Test-only negative control: the visitor still walks through the gamepad, but
  // an empty hex must say NO_DATA whenever free walk is explicitly disabled.
  const switchedOff = await ev("(() => {const f=document.getElementById('free-walk');if(f.checked)f.click();return !f.checked})()");
  ok(switchedOff, 'test fixture could not disable free walk');
  const vacio = await anclaDe('home');
  // an empty hex near home: no building, guardian or node under it (the town ring of town_plan.js now stands around home)
  const off = await ev(`(() => { const MP = window.AtlasMapPainter, F = window.AtlasMapFog, B = window.AtlasNodeBeacon, s = document.getElementById('surface');
    const free = (x, y) => x > 20 && y > 20 && x < s.width - 20 && y < s.height - 20 && !(MP && MP.markAt && MP.markAt(x, y)) && !(F && F.askAt && F.askAt(x, y)) && !(F && F.guideAt && F.guideAt(x, y)) && !(B && B.hitAt && B.hitAt(x, y));
    for (let R = 160; R < Math.max(s.width, s.height); R += 40) for (let a = 0; a < 24; a++) { const dx = Math.round(R * Math.cos(a * Math.PI / 12 + 0.785)), dy = Math.round(R * Math.sin(a * Math.PI / 12 + 0.785)); if (free(${vacio.x} + dx, ${vacio.y} + dy)) return [dx, dy]; }
    return [200, 200]; })()`);
  // A tap on the map with a panel open only closes the panel (Sovereign, 2026-11-08; panel_x.js outside()): when a panel
  // is open (arrival opens the node's; the free-walk switch lives in one), the first tap closes it and walks nowhere.
  const panel = () => ev(`!!(document.querySelector('#map .cats button[aria-pressed="true"]') || document.querySelector('#entry-tools[aria-expanded="true"]') || [...document.querySelectorAll('#building-sheet,#settings-sheet')].some((x) => !x.hidden))`);
  const cierra = async () => {
    if (!(await panel())) { return; }
    await clicEn(vacio.x + off[0], vacio.y + off[1]); await espera(200);
    ok(!(await panel()) && !/walking to|^You walk/.test(await estado()), 'a tap on the map with a panel open closes the panel and walks nowhere');
  };
  // Communication is a nonmodal overlay. Exercise outside-to-dismiss on the modal Help panel.
  await ev("AtlasTerminalPanel.mounted.show('Welcome')");
  await cierra();
  await clicEn(vacio.x + off[0], vacio.y + off[1]);
  await espera(200);
  const vacia = await estado();
  ok(!/walking to/.test(vacia), 'an empty hex does not start a walk');
  ok(/NO_DATA: no visible node on that hex/.test(vacia), 'an empty hex says NO_DATA: ' + vacia.slice(0, 120));
  // The current accessible crab path is Play now; the retired checkbox is
  // not the visitor's movement control. Its end-to-end route has its own gate.
  if (legacy.checked) await ev("document.getElementById('free-walk').click()"); // restore the input state for the page
  const startReady = await ev("!!document.getElementById('visitor-start')");
  ok(startReady, 'current visitor Play control is unavailable');
  medidas.visitorStartReady = startReady;

  console.log(JSON.stringify({ piece: 'W-3', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'W-3', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
