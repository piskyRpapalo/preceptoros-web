// SW · primera carga tras un deploy (odd/tasks/sw-primera-carga.md, 2026-11-03). Measured on the Doogee after
// web#601: a RETURNING visitor's first load ran the previous world_feed.js from Cache Storage (0B/cache-storage),
// because the old service worker serves statics cache-first; only a second load showed the new piece.
// Held shut here, in a real browser, with the server switching versions under the page:
// A · first visit ever: the page loads from the network and is NOT reloaded when the worker takes control.
// B · a new VERSION is deployed: the returning visit starts on old code and, WITHOUT a second navigation by the
//     visitor, ends running the new code (one automatic reload, never two).
// C · a new VERSION arrives after the visitor already touched the page: no reload (nothing they did is lost).
// Sabotage: SABOTAJE=sin-guarda serves pwa.js without the interaction guard ⇒ C must turn red.
// Uso: node atlas/sw_first_load_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const SAB = process.env.SABOTAJE || '';
let fase = 'A', retrasoSw = 0;
function sirve(raiz) {
  const s = createServer(async (req, res) => {
    const ruta0 = new URL(req.url, 'http://local').pathname;
    if (ruta0 === '/api/world-state') { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end('{"estado":"NO_DATA","causa":"fixture"}'); return; }
    try {
      let ruta = decodeURIComponent(ruta0); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/sw.js') {
        if (retrasoSw) { await espera(retrasoSw); }
        cuerpo = Buffer.from(String(cuerpo).replace(/const VERSION = '[^']*'/, "const VERSION = 'prueba-" + fase + "'"));
      }
      // The marker says which deploy's code the page is running: it rides inside a static the old worker caches.
      if (ruta === '/game/world_feed.js') { cuerpo = Buffer.concat([cuerpo, Buffer.from('\n;self.__marca = ' + JSON.stringify(fase) + ';\n')]); }
      if (ruta === '/assets/pwa.js' && SAB === 'sin-guarda') { cuerpo = Buffer.from(String(cuerpo).replace('if (tocada) { return; }', '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], excepciones = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, navegaciones = 0, marco = null;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const pagina = lista.find((t) => t.type === 'page');
  marco = pagina.id;
  ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) { navegaciones++; }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; excepciones.push(String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable');
  // Polls an expression until it is true (or ms pass); the page may reload under it, so errors just retry.
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e).catch(() => false) === true) { return true; } await espera(250); } return false; };
  const controlada = "!!(navigator.serviceWorker && navigator.serviceWorker.controller)";
  const nueva = (v) => `(async () => (await caches.keys()).some((k) => k === 'shell-prueba-${v}'))()`;

  // A · first visit ever: network code, the worker takes control, no reload.
  fase = 'A'; navegaciones = 0;
  await cmd('Page.navigate', { url: origen + '/openworld/' });
  ok(await hasta(controlada + ' && self.__marca === "A"', 15000), 'A: the first visit never ran under the worker with code A');
  await espera(1500);
  ok(navegaciones === 1, 'A: a first-ever visit was reloaded (' + navegaciones + ' navigations)');
  // A returning visit under worker A: now its statics live in cache A (the Doogee's visitor had come before).
  await cmd('Page.navigate', { url: origen + '/openworld/' });
  ok(await hasta('self.__marca === "A"', 10000) && await ev("(async () => !!(await caches.match('/game/world_feed.js')))()"), 'A: the return visit did not cache world_feed.js');

  // B · deploy B: the returning visit starts on A (cache) and ends on B by itself, with exactly one reload. The new
  // worker arrives late (as on the Doogee, where the page finished on old code before the update installed).
  fase = 'B'; navegaciones = 0; retrasoSw = 2500;
  await cmd('Page.navigate', { url: origen + '/openworld/' });
  const llegoB = await hasta('self.__marca === "B"', 20000);
  await espera(1500);
  ok(llegoB, 'B: after deploy B the returning visit still runs the old code (marca ' + await ev('self.__marca') + ')');
  ok(navegaciones === 2, 'B: expected the visitor navigation plus ONE automatic reload, got ' + navegaciones);
  retrasoSw = 0;

  // C · deploy C lands after the visitor touched the page: no reload, the new worker still takes over for next time.
  fase = 'C'; navegaciones = 0; retrasoSw = 2500;
  await cmd('Page.navigate', { url: origen + '/openworld/' });
  await hasta('document.readyState === "complete"', 5000);
  // The 30 s guard from B's reload must not be what holds C: only the touch may.
  await ev("sessionStorage.removeItem('sw-recarga'), true");
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', code: 'ShiftLeft' });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift', code: 'ShiftLeft' });
  const tomoC = await hasta(nueva('C'), 20000);
  await espera(2000);
  ok(tomoC, 'C: the new worker never installed its version');
  const marcaC = await ev('self.__marca');
  ok(navegaciones === 1 && marcaC === 'B', 'C: a visitor who already touched the page was reloaded (' + navegaciones + ' navigations, marca ' + marcaC + ')');
  retrasoSw = 0;

  ok(excepciones.length === 0, 'exceptions: ' + excepciones.join(' | '));
  console.log(JSON.stringify({ piece: 'sw-primera-carga', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'sw-primera-carga', sabotaje: SAB || null, receipt: 'ROJO', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
