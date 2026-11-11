// Sound from the first press (missions D10, K11, I7) in a real browser at 360×716. The system voice is replaced by a
// recorder, so what the page asks the voice to say is measured; real audio output is NOT measured here. Laws held:
// - landing: the sound switch is a 44 px button before the single door; one press turns it on, keeps the choice and
//   speaks the welcome at once; a second press turns it off and keeps that;
// - /openworld/: a kept choice is restored on arrival (the root says audio only); nothing is spoken before a gesture;
//   after the first press the place is spoken, and after a walk the new place is spoken: exactly the heading,
//   without the visitor id;
// - with the choice off, the world stays silent; a browser with no voice shows NO_DATA on a disabled switch.
// Sabotage: SABOTAJE=mudo serves sound_first.js without the restore ⇒ red.
// Uso: node atlas/sound_first_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/sound_first.js' && SAB === 'mudo') { cuerpo = Buffer.from(String(cuerpo).replace("if (isOn(s)) { doc.documentElement.dataset.audioOnly = 'on'; }", '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
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
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9800 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });

  const VOZ = `window.__said = []; Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, speak(u) { window.__said.push(u.text); } } });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };`;
  const SIN_VOZ = `Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }); window.SpeechSynthesisUtterance = undefined;`;
  let guion = (await cmd('Page.addScriptToEvaluateOnNewDocument', { source: VOZ })).result.identifier;
  const ir = async (ruta, ms = 2500) => { await cmd('Page.navigate', { url: origen + ruta }); await espera(ms); };
  const lee = async () => JSON.parse(await ev(`JSON.stringify((() => { const b = document.getElementById('sound-first'), h = document.getElementById('map-h'), r = b && b.getBoundingClientRect();
    return { said: window.__said || null, kept: localStorage.getItem('preceptoros.audio-only'), root: document.documentElement.dataset.audioOnly || null, h1: h ? h.textContent : null,
      btn: b ? { pressed: b.getAttribute('aria-pressed'), text: b.textContent, off: b.disabled, box: [Math.round(r.width), Math.round(r.height)],
        first: b.compareDocumentPosition(document.getElementById('start')) === Node.DOCUMENT_POSITION_FOLLOWING, xy: [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] } : null }; })())`));
  const raton = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) { await cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); } };
  const hasta = async (fn, ms = 4000) => { let m = await lee(); for (let t = 0; t < ms && !fn(m); t += 100) { await espera(100); m = await lee(); } return m; };
  const lugar = (h) => String(h || '').replace(/^Visitor-[0-9a-f]{8} · /, '');

  // Landing: off, one press on (welcome spoken, choice kept).
  await ir('/');
  const frio = await lee(); medidas.cold = frio.btn;
  ok(frio.btn && frio.btn.pressed === 'false' && !frio.btn.off && frio.btn.first && frio.btn.box[0] >= 44 && frio.btn.box[1] >= 44 && frio.kept !== 'on', 'landing: no 44 px sound switch, off, before the door: ' + JSON.stringify(frio.btn));
  await ev(`document.getElementById('sound-first').scrollIntoView({ block: 'center' })`); await espera(200);
  const xy = (await lee()).btn.xy; await raton(xy[0], xy[1]);
  const on = await hasta((m) => m.kept === 'on'); medidas.on = { pressed: on.btn.pressed, kept: on.kept, said: on.said };
  ok(on.btn.pressed === 'true' && on.kept === 'on' && on.said.length === 1 && /^Sound on\. Welcome to PreceptorOS\./.test(on.said[0]), 'landing: one press does not turn sound on and speak the welcome: ' + JSON.stringify(medidas.on));
  await foto('sound-first-landing.png');

  // OpenWorld: restored, silent until a gesture, then the place; after a walk, the new place.
  await ir('/openworld/', 3000);
  const llega = await lee(); medidas.arrival = { root: llega.root, said: llega.said };
  ok(llega.root === 'on', 'openworld: the kept choice is not restored on arrival: ' + llega.root);
  ok(llega.said.length === 0, 'openworld: something is spoken before any gesture: ' + JSON.stringify(llega.said));
  const play = JSON.parse(await ev(`JSON.stringify((() => { const r = document.getElementById('gp-play').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })())`));
  await raton(play[0], play[1]);
  const oye = await hasta((m) => m.said.length > 0 && /^Visitor-/.test(m.h1)); medidas.firstPress = { h1: oye.h1, said: oye.said };
  ok(oye.said.length > 0 && oye.said[oye.said.length - 1] === lugar(oye.h1), 'openworld: after the first press the place is not spoken as the heading shows it: ' + JSON.stringify(medidas.firstPress));
  ok(oye.said.every((t) => !/Visitor-/.test(t)), 'the visitor id is spoken');
  let paso = oye;
  for (const [x, y] of [[250, 330], [110, 330], [180, 200]]) { if (lugar(paso.h1) !== lugar(oye.h1)) { break; } await raton(x, y); paso = await hasta((m) => lugar(m.h1) !== lugar(oye.h1), 3000); }
  paso = await hasta((m) => m.said[m.said.length - 1] === lugar(m.h1), 2000); medidas.walk = { h1: paso.h1, last: paso.said[paso.said.length - 1], lines: paso.said.length };
  ok(lugar(paso.h1) !== lugar(oye.h1) && medidas.walk.last === lugar(paso.h1), 'openworld: a walk does not speak the new place: ' + JSON.stringify(medidas.walk));

  // Off again: kept, and the world stays silent.
  await ir('/'); await ev(`document.getElementById('sound-first').scrollIntoView({ block: 'center' })`); await espera(200);
  const xy2 = (await lee()).btn.xy; await raton(xy2[0], xy2[1]);
  const off = await hasta((m) => m.kept === 'off'); medidas.off = { pressed: off.btn.pressed, kept: off.kept, said: off.said };
  ok(off.btn.pressed === 'false' && off.kept === 'off' && off.said.length === 0, 'landing: a second press does not turn sound off: ' + JSON.stringify(medidas.off));
  await ir('/openworld/', 3000); await raton(play[0], play[1]); await espera(1200);
  const mudo = await lee(); medidas.silent = { root: mudo.root, said: mudo.said };
  ok(mudo.root === null && mudo.said.length === 0, 'openworld: with the choice off the world still speaks: ' + JSON.stringify(medidas.silent));

  // No voice in this browser: said, never faked.
  await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: guion });
  guion = (await cmd('Page.addScriptToEvaluateOnNewDocument', { source: SIN_VOZ })).result.identifier;
  await ir('/');
  const sin = await lee(); medidas.noVoice = sin.btn && { text: sin.btn.text, off: sin.btn.off };
  ok(sin.btn && sin.btn.off && sin.btn.text === 'Sound · NO_DATA · this browser has no voice', 'no voice: the switch does not say NO_DATA: ' + JSON.stringify(medidas.noVoice));

  console.log(JSON.stringify({ piece: 'sound-first', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'sound-first', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
