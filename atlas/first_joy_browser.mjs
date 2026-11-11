// First joy (missions D1, D12, I3; Private Mesa candidate «five-minute first joy»): a cold visitor on a phone plays
// the whole first visit in a real browser, with nothing but the page. Laws held here, at 360×716:
// - cold: nothing of the visit is stored; one press on «Play now» (44 px) makes the visitor an ephemeral crab, no login;
// - a tap on a near hex walks the crab: the heading says the new place;
// - a building is a door: Node → Honest lottery → Roll lands the visitor in the panel that holds the summons, in two
//   presses, with keyboard focus on a pressable 44 px control there; the same state is on screen (the House panel) and
//   in the machine-readable tree (the Profile button is pressed, the sheet is closed). A file name is not an outcome;
// - before Play, the same door says NO_DATA with its cause and opens nothing;
// - «End this visit» leaves: no visitor name, Play is back, nothing stored.
// Sabotage: SABOTAJE=sin-puerta serves building_doors.js without its doors ⇒ red.
// Uso: node atlas/first_joy_browser.mjs [carpeta-captura]
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
      if (ruta === '/game/building_doors.js' && SAB === 'sin-puerta') { cuerpo = Buffer.from(String(cuerpo).replace(/var DOORS = \{[^}]*\}/, 'var DOORS = {}')); }
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
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9500 + (process.pid % 90);
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

  // One reading of the page: what the eye sees and what the accessibility tree says, from the same DOM.
  const LEE = `JSON.stringify((() => {
    const box = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const see = (e) => !!e && !e.hidden && e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden';
    const play = document.getElementById('gp-play'), sheet = document.getElementById('building-sheet');
    const prof = document.querySelector('.cats [data-cat=Profile]'), house = document.querySelector('#voices [data-speaker=House]');
    const a = document.activeElement;
    return { h1: document.getElementById('map-h').textContent, play: see(play) ? box(play) : null,
      stored: Object.keys(localStorage).length, login: document.querySelectorAll('input[type=password],input[type=email]').length,
      sheet: !!sheet && !sheet.hidden, line: sheet ? sheet.querySelector('.bs-line').textContent : '',
      profile: prof ? prof.getAttribute('aria-pressed') : null, house: see(house), summons: see(document.getElementById('visitor-summon-tc1')),
      focus: a ? { id: a.id, tag: a.tagName, inPanel: !!a.closest('#voices'), box: box(a), off: !!a.disabled } : null };
  })())`;
  const lee = async () => JSON.parse(await ev(LEE));
  const hasta = async (fn, ms = 4000) => { let m = await lee(); for (let t = 0; t < ms && !fn(m); t += 100) { await espera(100); m = await lee(); } return m; };
  const pulsa = (sel, texto) => ev(`(() => { const all = [...document.querySelectorAll(${JSON.stringify(sel)})];
    const b = ${JSON.stringify(texto || null)} ? all.find((x) => x.firstChild && x.firstChild.textContent.startsWith(${JSON.stringify(texto || '')})) : all[0];
    if (!b) return false; b.focus(); b.click(); return true; })()`);
  const puerta = async () => { // Node → Honest lottery → Roll, by the buttons a keyboard reaches
    ok(await pulsa('#gp-town'), 'no Node button');
    await hasta((m) => m.sheet);
    for (let i = 0; i < 30 && !(await pulsa('#building-sheet .bs-card', 'Honest lottery')); i++) { await espera(100); }
    for (let i = 0; i < 30 && !(await pulsa('#building-sheet .bs-card', 'Roll')); i++) { await espera(100); }
  };

  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
  const frio = await lee(); medidas.cold = { h1: frio.h1, play: frio.play, stored: frio.stored };
  ok(frio.stored === 0 && frio.login === 0 && !/Visitor-/.test(frio.h1), 'cold: something of a visit exists before Play: ' + JSON.stringify(medidas.cold));
  ok(frio.play && frio.play[0] >= 44 && frio.play[1] >= 44, 'cold: Play now is not a visible 44 px button: ' + JSON.stringify(frio.play));

  // Before Play, the door is honest: it names its cause and opens nothing.
  await puerta();
  const antes = await hasta((m) => /NO_DATA · /.test(m.line), 2500); medidas.beforePlay = antes.line;
  ok(/NO_DATA · /.test(antes.line) && antes.profile !== 'true' && antes.sheet, 'before Play, Roll does not say NO_DATA with its cause: ' + JSON.stringify([antes.line, antes.profile, antes.sheet]));
  await pulsa('#building-sheet .bs-bar > .bs-tool:last-child');

  // 1 · one press: an ephemeral crab, no login, nothing stored.
  await pulsa('#gp-play');
  const crab = await hasta((m) => /^Visitor-[0-9a-f]{8} · /.test(m.h1)); medidas.play = { presses: 1, h1: crab.h1, stored: crab.stored };
  ok(/^Visitor-[0-9a-f]{8} · /.test(crab.h1) && crab.login === 0 && crab.stored === 0, 'Play now does not make an ephemeral crab in one press: ' + JSON.stringify(medidas.play));

  // 2 · a tap on a near hex walks: the heading says the new place.
  const lugar = (h) => h.replace(/^Visitor-[0-9a-f]{8} · /, '');
  let paso = crab;
  for (const [x, y] of [[250, 330], [110, 330], [180, 200]]) {
    if (lugar(paso.h1) !== lugar(crab.h1)) { break; }
    for (const type of ['mousePressed', 'mouseReleased']) { await cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
    paso = await hasta((m) => lugar(m.h1) !== lugar(crab.h1), 3000);
  }
  medidas.walk = { from: lugar(crab.h1), to: lugar(paso.h1) };
  ok(medidas.walk.from !== medidas.walk.to, 'a tap on a near hex does not walk the crab: ' + JSON.stringify(medidas.walk));

  // 3 · the building is a door: two presses inside Node land in the panel that holds the summons.
  await puerta();
  const dentro = await hasta((m) => m.profile === 'true' && !m.sheet, 3000);
  medidas.door = { presses: 2, sheet: dentro.sheet, profile: dentro.profile, house: dentro.house, summons: dentro.summons, focus: dentro.focus };
  ok(dentro.profile === 'true' && dentro.house && dentro.summons, 'Roll does not open the panel that holds the summons: ' + JSON.stringify(medidas.door));
  ok(!dentro.sheet, 'the sheet stays over the opened panel');
  const f = dentro.focus;
  ok(f && f.inPanel && f.tag === 'BUTTON' && !f.off && f.box[0] >= 44 && f.box[1] >= 44, 'focus does not land on a pressable 44 px control in the panel: ' + JSON.stringify(f));
  await foto('first-joy-door.png');

  // 4 · leaving is one press and leaves nothing.
  await pulsa('#visitor-end');
  const fuera = await hasta((m) => !/Visitor-/.test(m.h1) && !!m.play); medidas.exit = { h1: fuera.h1, play: !!fuera.play, stored: fuera.stored };
  ok(!/Visitor-/.test(fuera.h1) && fuera.play && fuera.stored === 0, 'End this visit does not leave cleanly: ' + JSON.stringify(medidas.exit));

  console.log(JSON.stringify({ piece: 'first-joy', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'first-joy', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
