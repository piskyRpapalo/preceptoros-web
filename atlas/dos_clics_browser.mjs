// Two clicks, in a real browser and with real mouse clicks: from the landing `/` the OpenWorld door (1), then «Play now»
// on the welcome card of /openworld/ (2) → a visit is active (signed on this device), copper ≥ 100 from the beacon and the
// reef summon button is enabled. Also: the card is a labelled dialog, its main button gets focus, 44 px, Escape closes.
// Uso: node atlas/dos_clics_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(readFileSync(f));
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, clics = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9500 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  // A real click: the mouse at the centre of the element as laid out on screen (whatever covers it gets the click).
  const clic = async (sel) => {
    const c = JSON.parse(await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) { return 'null'; } e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`));
    if (!c) { fallos.push('nothing to click: ' + sel); return; }
    for (const type of ['mousePressed', 'mouseReleased']) { await cmd('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', clickCount: 1 }); }
    clics++;
  };
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/' }); await espera(1200);
  const puerta = await ev("(() => { const a = [...document.querySelectorAll('a.door')].find((x) => /OpenWorld/.test(x.textContent)); return a ? a.textContent : null; })()");
  ok(/Play now: the map, your crab and the chat\./.test(puerta || ''), 'the OpenWorld door does not say «Play now»: ' + puerta);
  await clic('a.door[href="/openworld/"]'); await espera(2000);
  const llegada = JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('sheet-welcome'), b = document.getElementById('welcome-play'), r = b ? b.getBoundingClientRect() : {};
    return { path: location.pathname, shown: !!c && !c.hidden, role: c && c.getAttribute('role'), modal: c && c.getAttribute('aria-modal'), title: (document.getElementById('welcome-h') || {}).textContent,
      focus: document.activeElement && document.activeElement.id, h: r.height, w: r.width, top: r.top, bottom: r.bottom, look: !!document.getElementById('welcome-look'), ancho: document.documentElement.scrollWidth }; })())`));
  ok(llegada.path === '/openworld/', 'click 1 did not reach /openworld/: ' + llegada.path);
  ok(llegada.shown && llegada.role === 'dialog' && llegada.modal === 'false', 'the welcome card does not cover the map as a dialog: ' + JSON.stringify(llegada));
  ok(llegada.title === 'Welcome to the sunken forest', 'the welcome title is wrong: ' + llegada.title);
  ok(llegada.focus === 'welcome-play', 'focus is not on «Play now»: ' + llegada.focus);
  ok(llegada.h >= 44 && llegada.w >= 44 && llegada.top >= 0 && llegada.bottom <= 844, 'the «Play now» button is below 44 px or off screen: ' + JSON.stringify(llegada));
  ok(llegada.look && llegada.ancho <= 390, 'no «Look around first» or sideways scroll: ' + JSON.stringify(llegada));
  await foto('dos-clics-welcome.png');
  await clic('#welcome-play'); await espera(1500);
  const jugando = JSON.parse(await ev(`JSON.stringify((() => { const s = document.getElementById('visitor-summon-tc1'), t = (document.getElementById('visitor-play') || {}).textContent || '';
    const m = /Copper (\\d+)/.exec(t); return { card: document.getElementById('sheet-welcome').hidden, copper: m ? +m[1] : -1, summon: !!s && !s.disabled, end: !!document.getElementById('visitor-end'),
      tab: document.getElementById('tab-summons').getAttribute('aria-selected'), state: document.getElementById('state').textContent, result: document.getElementById('welcome-result').textContent }; })())`));
  ok(clics === 2, 'reaching the game took ' + clics + ' clicks, not 2');
  ok(jugando.end, 'after two clicks no visit is active');
  ok(jugando.copper >= 100, 'after two clicks the copper is below 100: ' + jugando.copper);
  ok(jugando.summon, 'after two clicks the reef summon button is not enabled');
  ok(jugando.card === true && jugando.tab === 'true', 'the welcome card did not give way to the Summons tab: ' + JSON.stringify(jugando));
  ok(/Visit started · signed on this device · 100 copper from the beacon · you can summon twice/.test(jugando.state), '#state does not announce the visit: ' + jugando.state);
  ok(/Play the tutorial by walking to the beacon, or press Skip tutorial/.test(jugando.result), 'the tutorial choice is not said: ' + jugando.result);
  await foto('dos-clics-playing.png');
  // «Look around first» and Escape: a fresh page, the card closes and the map is there.
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  ok((await ev("document.getElementById('sheet-welcome').hidden")) === true, 'Escape does not close the welcome card');
  ok(externas.length === 0, 'external requests: ' + externas.join(' '));
  console.log(JSON.stringify({ clics, llegada, jugando, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
