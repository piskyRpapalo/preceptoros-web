// Art is a claim (missions A9, C8, H6) in a real browser, on /creation.html at 360×716. Laws held here:
// - the page loads and takes a keyboard drawing with zero exceptions (a stroke used to throw on a frozen object);
// - «Read the example: low tide» shows one drawing three ways under the SAME ids: every drawn group carries the id of
//   one listed row and its <title> is that row's sentence; Listen names the rows that sound; Inspect is valid JSON
//   whose ids are the same list and whose frame hashes to the same id;
// - the visitor's own ribbon reads as one thing and says honestly that it is silent;
// - every control of the panel is at least 44 px and the page does not scroll sideways.
// Sabotage: SABOTAJE=otro-id serves acho_claim.js drawing its groups under another id ⇒ red.
// Uso: node atlas/acho_claim_browser.mjs [carpeta-captura]
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
      if (ruta === '/game/acho_claim.js' && SAB === 'otro-id') { cuerpo = Buffer.from(String(cuerpo).replace("e.setAttribute('data-claim', result.rows[i].id)", "e.setAttribute('data-claim', 'acho:00000000#' + i)")); }
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
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9600 + (process.pid % 90);
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

  const LEE = `JSON.stringify((() => {
    const t = (e) => (e ? e.textContent : '');
    const pre = document.getElementById('claim-machine');
    return { status: t(document.getElementById('claim-status')), rows: [...document.querySelectorAll('#claim-rows li')].map((l) => [l.getAttribute('data-claim'), t(l)]),
      groups: [...document.querySelectorAll('#claim-art svg > g[data-claim]')].map((g) => [g.getAttribute('data-claim'), t(g.querySelector('title')), g.querySelectorAll('path,circle,text').length]),
      machine: pre.hidden ? null : t(pre), sign: t(document.getElementById('creation-status')),
      small: [...document.querySelectorAll('#claim-panel button')].filter((b) => b.getBoundingClientRect().width < 44 || b.getBoundingClientRect().height < 44).map(t),
      scroll: document.documentElement.scrollWidth, ancho: innerWidth };
  })())`;
  const lee = async () => JSON.parse(await ev(LEE));
  const hasta = async (fn, ms = 4000) => { let m = await lee(); for (let t = 0; t < ms && !fn(m); t += 100) { await espera(100); m = await lee(); } return m; };
  const pulsa = (i) => ev(`document.getElementById(${JSON.stringify(i)}).click()`);

  await cmd('Page.navigate', { url: origen + '/creation.html' }); await espera(1500);
  const frio = await lee(); medidas.cold = { small: frio.small, scroll: [frio.scroll, frio.ancho] };
  ok(frio.small.length === 0, 'panel controls under 44 px: ' + JSON.stringify(frio.small));
  ok(frio.scroll <= frio.ancho, 'the page scrolls sideways at 360 px: ' + frio.scroll);
  await pulsa('claim-look');
  ok(/^NO_DATA · no drawing yet/.test((await lee()).status), 'with nothing drawn, Look does not say NO_DATA');

  // The example, three ways, one set of ids.
  await pulsa('claim-example');
  const mira = await hasta((m) => m.groups.length > 0); await foto('acho-claim-look.png');
  const cid = (/acho:[0-9a-f]{8}/.exec(mira.status) || [null])[0];
  medidas.look = { status: mira.status, rows: mira.rows.length, groups: mira.groups.length };
  ok(cid && mira.rows.length === 9 && mira.groups.length === 9, 'the example does not read as nine things: ' + JSON.stringify(medidas.look));
  ok(mira.groups.every((g, i) => g[0] === mira.rows[i][0] && g[1] === mira.rows[i][1] && g[0].startsWith(cid + '#') && g[2] > 0), 'a drawn group and its listed row do not share id and sentence');
  ok(mira.scroll <= mira.ancho, 'the drawing makes the page scroll sideways: ' + mira.scroll);
  await pulsa('claim-listen');
  const oye = await lee(); medidas.listen = oye.status;
  ok(oye.status === 'low tide · ' + cid + ' · listen · 2 of 9 sound: 0.0 at 110 Hz, 1.4 at 139 Hz', 'Listen does not name the two rows that sound: ' + oye.status);
  ok(oye.rows.filter((r) => / sounds at /.test(r[1])).map((r) => r[0]).join() === [cid + '#0.0', cid + '#1.4'].join(), 'the rows that say they sound are not the ones Listen names');
  await pulsa('claim-inspect');
  const maq = await lee(); let doc = null; try { doc = JSON.parse(maq.machine); } catch { doc = null; }
  medidas.inspect = doc ? { id: doc.id, bytes: doc.bytes, rows: doc.rows.length } : null;
  ok(doc && doc.id === cid && doc.bytes < 1024 && doc.rows.join() === maq.rows.map((r) => r[0]).join(), 'Inspect is not JSON with the same ids: ' + JSON.stringify(medidas.inspect));
  const otra = doc ? await ev(`'acho:' + ('0000000' + AtlasAcho.hash32(AtlasAchoEditor.serialize(${JSON.stringify(doc.frame)})).toString(16)).slice(-8)`) : null;
  ok(otra === cid, 'the inspected frame does not hash to the id on screen: ' + otra);

  // The visitor's own drawing: four keyboard points on the canvas, then read.
  await ev(`(() => { const s = document.querySelector('#paint [tabindex="0"]'); s.focus(); ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowUp'].forEach((k) => s.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))); })()`);
  await pulsa('claim-mine');
  const mio = await hasta((m) => /^your drawing · acho:/.test(m.status)); medidas.mine = { status: mio.status, rows: mio.rows.length, sign: mio.sign };
  ok(/^your drawing · acho:[0-9a-f]{8} · look · 1 thing · \d+ of 1024 bytes$/.test(mio.status) && mio.rows.length === 1 && mio.groups.length === 1 && mio.groups[0][0] === mio.rows[0][0], 'the visitor\'s ribbon does not read as one thing: ' + JSON.stringify(medidas.mine));
  ok(mio.sign === 'Drawing changed. Sign the creation again.', 'a stroke does not reach the signing state: ' + mio.sign);
  await pulsa('claim-listen');
  const callado = await lee(); medidas.mineListen = callado.status;
  ok(/ · listen · NO_DATA · silent: this ribbon carries no harmonics$/.test(callado.status), 'a ribbon does not say honestly that it is silent: ' + callado.status);

  console.log(JSON.stringify({ piece: 'acho-claim', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'acho-claim', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
