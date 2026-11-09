// W-4 in a real browser, after the controls retirement (odd/tasks/openworld-controls-retirement.md, 2026-11-05):
// the six-direction pad and the arrow-walk are gone by the Sovereign's decree; walking is a tap on a hex, a node
// place in the panel, and Enter. The view joystick (map_view_joystick.js) owns the arrows when focused. The page
// lists two LIVE nodes (the first node and its east neighbour). Enter on a focused node place walks there over the
// visible route and arrival enters it; a tap on an empty hex with free walk off says NO_DATA and walks nowhere.
// Uso: node atlas/walk_keys_browser.mjs (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
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
  // A key press on the page, as the keyboard sends it: keydown at the body, or at the chat field when given.
  const tecla = (key, enCampo) => ev(`(() => { const t = ${enCampo ? "document.getElementById('question')" : 'document.body'}; if (${enCampo ? 'true' : 'false'}) { t.focus(); } t.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })); return true; })()`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('!!document.getElementById("surface")', 15000), 'map loaded');
  ok(await hasta(`document.getElementById('state-tech').textContent.includes('Colony:')`, 15000), 'colony drawn from the state');
  await espera(300);
  await ev(`(() => { const b = document.querySelector('.cats [data-cat=Welcome]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return true; })()`);

  // 0 · free walk (visitor_walk.js) is on by default; this guard checks the W-4 node law, reachable by turning it off.
  await ev(`(() => { const f = document.getElementById('free-walk'); if (f) { f.checked = false; f.dispatchEvent(new Event('change')); } return true; })()`);

  // 1 · the retirement, measured: no six-direction pad, no data-direction buttons, no arrow-walk; the view joystick stays.
  const botones = await ev(`(() => [...document.querySelectorAll('#joy button')].filter(b=>b.textContent.includes('Skip tutorial')).map(b=>b.textContent.trim()))()`);
  medidas.botones = botones;
  const retiro = JSON.parse(await ev(`JSON.stringify((() => ({ pad: !!document.querySelector('.walk-pad'), dataDirections: document.querySelectorAll('[data-direction]').length, skipHeight: (document.querySelector('#joy button') || {getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height }))())`));
  medidas.retiro = retiro;
  ok(retiro.pad === false, 'the six-direction pad is still on the page');
  ok(retiro.dataDirections === 0, 'direction buttons are still on the page: ' + retiro.dataDirections);
  ok(retiro.skipHeight >= 44, 'the skip tutorial button is under 44 px: ' + retiro.skipHeight);
  const joystick = JSON.parse(await ev(`JSON.stringify((() => { const g = document.querySelector('#gamepad #view-joystick'); const bs = [...document.querySelectorAll('#map .view-joy button')]; return { present: !!g, onStage: !!g && g.parentElement === document.getElementById('gamepad'), mode: !!document.getElementById('view-stick-mode'), buttons: bs.length, minHeight: bs.length ? Math.min(...bs.map(b=>b.getBoundingClientRect().height)) : 0 }; })())`));
  medidas.joystick = joystick;
  // gamepad (2026-11-07): the pan joystick now sits in the gamepad under the map, not over the stage.
  ok(joystick.present && joystick.onStage, 'the view joystick is not in the map gamepad: ' + JSON.stringify(joystick));
  // Decree 2026-11-07, fulfilled 2026-11-08: the camera stick and the character stick, each at least 44 px.
  ok(joystick.buttons === 2 && joystick.minHeight >= 44 && !joystick.mode, 'the map does not carry the camera and the character sticks (decree 2026-11-07): ' + JSON.stringify(joystick));

  // 2 · Enter with no choice says how to choose.
  await tecla('Enter');
  await espera(150);
  const sinEleccion = await estado();
  ok(/No node selected/.test(sinEleccion), 'Enter with no choice says how to choose: ' + sinEleccion.slice(0, 100));

  // 3 · the arrow-walk is retired: a page-level arrow neither walks nor selects; the walker stays.
  const antes = JSON.parse(await ev(`JSON.stringify({ h1: document.querySelector('h1').textContent, estado: (document.querySelector('#joy .state') || {}).textContent || '' })`));
  await tecla('ArrowRight');
  await espera(150);
  const despues = JSON.parse(await ev(`JSON.stringify({ h1: document.querySelector('h1').textContent, estado: (document.querySelector('#joy .state') || {}).textContent || '' })`));
  medidas.retiro.arrowsWalk = !!(despues.h1 !== antes.h1 || despues.estado !== antes.estado);
  ok(medidas.retiro.arrowsWalk === false, 'a page-level arrow still walks or selects: ' + JSON.stringify({ antes, despues }));

  // 4 · the keyboard law survives on the node places: focus the east neighbour's place, Enter walks there and enters it.
  await ev(`(() => { const b = document.querySelector('.cats [data-cat=Welcome]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return true; })()`);
  ok(await hasta(`(() => { const b = document.querySelector('#map-node-list [data-node=ring-e]'); return !!b && b.getBoundingClientRect().height >= 44; })()`, 8000), 'the east neighbour place never appeared in the panel');
  await ev(`(() => { window.__dibujos = 0; document.getElementById('surface').addEventListener('visitor:draw', () => { window.__dibujos++; }); document.querySelector('#map-node-list [data-node=ring-e]').focus(); return true; })()`);
  medidas.focus = await ev(`document.activeElement.outerHTML.slice(0, 300)`);
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  medidas.afterKey = await ev(`({ active: document.activeElement.outerHTML.slice(0, 200), state: document.querySelector('#joy .state').textContent })`);
  ok(await hasta(`window.__dibujos >= 12`, 8000), 'the walk is drawn frame by frame');
  ok(await hasta(`/terminal: basic/.test(document.querySelector('#joy .state').textContent)`, 8000), 'Enter on the focused node place does not walk there and enter it');
  const llegada = await estado();
  medidas.llegada = llegada.slice(0, 160);
  ok((await ev('window.__dibujos')) >= 12, 'the walk is drawn frame by frame');

  // 5 · a tap on an empty hex with free walk off says NO_DATA and walks nowhere.
  await ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * 0.75, clientY: r.top + r.height * 0.25 })); return true; })()`);
  await espera(150);
  const sinVecino = await estado();
  ok(/NO_DATA/.test(sinVecino), 'no visible node is said as NO_DATA: ' + sinVecino.slice(0, 120));

  // 6 · while a form field has focus, the arrow keys are the field's own: nothing is chosen.
  await ev(`(() => { const d = document.getElementById('state'); d.textContent = 'MARK'; return true; })()`);
  await tecla('ArrowLeft', true);
  await espera(150);
  const enCampo = await estado();
  ok(!/selected/.test(enCampo), 'arrow keys in the chat field are not taken by the map: ' + enCampo.slice(0, 100));

  console.log(JSON.stringify({ piece: 'W-4', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'W-4', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
