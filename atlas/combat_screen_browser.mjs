// P2 in a real browser: combat is its own screen and the map cannot draw what combat made undefined.
// Uso: node atlas/combat_screen_browser.mjs  (Chrome headless por CDP y python3 sirviendo public/; sin dependencias)
// Plays two practice fights on /play/: one left by the screen's own button, one by the browser's Back.
// Measures the route, the hidden map, the record settled once per fight, and every text and line
// the MAP canvas draws (a hostile player with no name is added first: it must not reach the canvas).
import { spawn } from 'node:child_process';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

const ESPIA = `(() => {
  const P = CanvasRenderingContext2D.prototype, mapa = (g) => g.canvas && g.canvas.classList.contains('atlas-arena-mapa');
  window.__mapa = { textos: 0, malos: [], lineas: 0, rotas: 0 };
  const ft = P.fillText; P.fillText = function (t, x, y) {
    if (mapa(this)) { __mapa.textos++; if (typeof t !== 'string' || /\\b(undefined|NaN)\\b/.test(t) || !isFinite(x) || !isFinite(y)) __mapa.malos.push(String(t)); }
    return ft.apply(this, arguments); };
  ['lineTo', 'moveTo'].forEach((m) => { const o = P[m]; P[m] = function (x, y) {
    if (mapa(this)) { __mapa.lineas++; if (!isFinite(x) || !isFinite(y)) __mapa.rotas++; } return o.apply(this, arguments); }; });
})()`;

async function main() {
  const port = 8800 + (process.pid % 90), cdpPort = 9900 + (process.pid % 90);
  srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: PUBLIC, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await espera(250); try { await fetch(`http://127.0.0.1:${port}/`); break; } catch {} }
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
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: ESPIA });

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/play/` });
  await hasta("!!document.querySelector('.descent-skip')", 15000);
  await ev("(b => b && b.click())(document.querySelector('.descent-skip'))");
  ok(await hasta("!!(window.AtlasCombatScreen && window.AtlasArenaUI && document.getElementById('arena-lucha'))", 40000), 'arena and combat screen loaded');

  // Two hostile players. One has a signer but no pseudonym: it is drawn, named by its fingerprint.
  // One has no signer at all: it must be refused at the door, and the map must not throw.
  await ev(`(() => { const s = AtlasCanon.sha('p2-hostil'), t = [{ tc: 'tc1', semilla: s }];
    AtlasArenaUI.ponJugadores([{ huella: s, sobre: { de: s, cuerpo: { tropas: t } } }, { huella: s + 'x', sobre: { cuerpo: { tropas: t } } }]); })()`);
  await espera(1500);
  const nombres = await ev("[...document.querySelectorAll('.atlas-arena-lugar')].map(b => b.textContent).join(' | ')");
  ok(/Player [0-9a-f]{8}/.test(nombres) && !/undefined|NaN/.test(nombres), 'places list names the player by fingerprint: ' + nombres.slice(-80));
  const estado = `JSON.stringify({ h: location.hash, c: document.documentElement.classList.contains('con-combate'),
    mapa: getComputedStyle(document.getElementById('thegame-mapa')).display, hoja: !document.getElementById('thegame-batalla').hidden,
    r: AtlasArenaUI.record() })`;

  for (const salida of ['button', 'back']) {
    const antes = JSON.parse(await ev(estado)).r;
    await ev("document.getElementById('arena-lucha').click()");
    await espera(800);
    const dentro = JSON.parse(await ev(estado));
    ok(dentro.h === '#thegame/battle', salida + ': own route, got ' + dentro.h);
    ok(dentro.c && dentro.mapa === 'none' && dentro.hoja, salida + ': battle screen shown and map not shown');
    if (salida === 'button') { await ev("document.getElementById('thegame-batalla-cierra').click()"); } else { await ev('history.back()'); }
    await espera(1200);
    const fuera = JSON.parse(await ev(estado));
    ok(fuera.h !== '#thegame/battle' && !fuera.c && fuera.mapa !== 'none' && !fuera.hoja, salida + ': back on the map, got ' + JSON.stringify(fuera));
    ok(fuera.r.g + fuera.r.p === antes.g + antes.p + 1, salida + ': the fight settled exactly once ' + JSON.stringify([antes, fuera.r]));
  }
  await espera(2500);
  const m = JSON.parse(await ev('JSON.stringify(window.__mapa)'));
  ok(m.textos > 0 && m.lineas > 0, 'the map painted after combat');
  ok(m.malos.length === 0, 'map text drawn from missing values: ' + m.malos.slice(0, 3).join(' | '));
  ok(m.rotas === 0, 'non-finite map line points: ' + m.rotas);
  console.log(JSON.stringify({ piece: 'P2', receipt: 'MEDIDO', map: m, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P2', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.kill(); process.exitCode = fallos.length ? 1 : 0; });
