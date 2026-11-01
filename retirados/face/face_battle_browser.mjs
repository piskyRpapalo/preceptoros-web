// P3 [1b] in a real browser: in the preserved Atlantis/Zombie faces, combat fills the map area inside its own panel;
// /face/basic.html is the neutral shared-map terminal and is measured below.
// the fight paints ONLY on its own canvas (never on the world map), and the "×" returns to the map.
// Uso: node atlas/face_battle_browser.mjs [raiz-public]   (Chrome headless por CDP; sin dependencias)
// The optional argument serves another public/ tree, so the same harness measures the "before".
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = process.argv[2] || fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0 (the OS picks a free port): a fixed range collides with services on the
// node (measured 2026-10-26: 8740, 8765, 8766 and 8831 were already listening).
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

// Count every fight mount by the canvas it targets: the world map, or the fight's own stage. [W] O1b (2026-10-27): the fight
// is drawn by the ONE combat face, the wave duel (AtlasWaveDuel), so the spy wraps its escena() as the page defines it.
const ESPIA = `(() => {
  window.__pinta = { mapa: 0, escenario: 0 };
  let W;
  Object.defineProperty(window, 'AtlasWaveDuel', { configurable: true, get: () => W, set: (v) => {
    const e = v.escena; v.escena = function (l) { if (l && l.id === 'b-stage') { __pinta.escenario++; } else { __pinta.mapa++; } return e.apply(this, arguments); };
    W = v; } });
})()`;

async function main() {
  const cdpPort = 9800 + (process.pid % 90);
  srv = await sirve(PUBLIC);
  const port = srv.address().port;
  ch = launchChrome(cdpPort);
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
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: ESPIA });

  for (const mundo of ['atlantis', 'zombie']) {
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/face/${mundo}.html` });
    ok(await hasta('!!(window.PreceptorFaceHooks && PreceptorFaceHooks.battle && PreceptorFaceHooks.army)', 20000), mundo + ': face loaded');
    // A squad of three practice waves stands in for hatched eggs; the battle itself is the real one.
    await ev(`(() => { const H = PreceptorFaceHooks, s = (i) => AtlasCanon.sha('p3-escuadra-' + i);
      H.army.squad = () => [0, 1, 2].map((i) => ({ semilla: s(i), tc: 'tc1' }));
      document.getElementById('tab-battle').click();
      H.battle.start(H.battle.patrols()[0].id); })()`);
    await espera(2500);
    // The map area is the padding box of the stage that holds the sheet (a framed layout has a border).
    const m = JSON.parse(await ev(`JSON.stringify((() => { const s = document.getElementById('sheet-battle'), c = s.offsetParent || s;
      return { pinta: window.__pinta, alto: +(s.offsetHeight / c.clientHeight).toFixed(3), equis: document.querySelectorAll('.stage-sheet .sheet-x').length,
        hojas: document.querySelectorAll('.stage-sheet').length, texto: s.innerText }; })())`));
    medidas[mundo] = { mapa: m.pinta.mapa, escenario: m.pinta.escenario, alto: m.alto, equis: m.equis + '/' + m.hojas };
    ok(m.pinta.mapa === 0, mundo + ': fight painted on the world map ' + m.pinta.mapa + ' times');
    ok(m.pinta.escenario > 0, mundo + ': fight did not paint on its own stage');
    ok(m.alto >= 0.99, mundo + ': battle panel covers ' + m.alto + ' of the map area');
    ok(m.equis === m.hojas && m.hojas >= 3, mundo + ': "×" on ' + m.equis + ' of ' + m.hojas + ' panels');
    ok(!/\bundefined\b|\bNaN\b/.test(m.texto), mundo + ': missing value shown in the battle panel');
    await ev("document.querySelector('#sheet-battle .sheet-x').click()");
    await espera(600);
    const fuera = JSON.parse(await ev(`JSON.stringify({ v: document.body.dataset.view, b: document.body.dataset.battle, on: PreceptorFaceHooks.battle.on(),
      oculta: document.getElementById('sheet-battle').hidden })`));
    ok(fuera.v === 'map' && !fuera.on && fuera.oculta, mundo + ': "×" did not return to the map ' + JSON.stringify(fuera));
  }
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/face/basic.html` });
  ok(await hasta('!!(window.AtlasOpenworldState && window.AtlasColonyControls && document.getElementById("joy"))', 20000), 'basic: shared terminal loaded');
  const terminal = JSON.parse(await ev(`JSON.stringify({ joy: (() => { const r = document.getElementById('joy').getBoundingClientRect(); return r.width >= 96 && r.height >= 96; })(), map: !!document.getElementById('map'), privateWorld: !!window.AtlasFaceWorld })`));
  medidas.basic_terminal = terminal;
  ok(terminal.joy && terminal.map && !terminal.privateWorld, 'basic: terminal is not a private map');
  console.log(JSON.stringify({ piece: 'P3-1b', receipt: 'MEDIDO', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P3-1b', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
