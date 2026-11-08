// I7 The right letters (Doctor on duty), proved in a real browser on /openworld/ at 420×642 and 360×740. Laws:
// - one «Aa» button in the gamepad middle, 44 px, with its Acho spectrum, starts at Letters 100%;
// - each press goes 115% → 130% → 150% → 100%, says the step in #state, and the reading panel letters grow with it;
// - the map does not change size; no horizontal overflow; the step is remembered for the next visit.
// Sabotage: SABOTAJE=sin-letras (the gamepad does not load type_scale.js) or SABOTAJE=sin-zoom (the CSS ignores the step) ⇒ red.
// Uso: node atlas/type_scale_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
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
      if (ruta === '/assets/openworld.css' && SAB === 'sin-zoom') { cuerpo = Buffer.from(String(cuerpo).replace('zoom:var(--letters,1)', 'zoom:1')); }
      if (ruta === '/game/gamepad.js' && SAB === 'sin-letras') { cuerpo = Buffer.from(String(cuerpo).replace("letters.src = '/game/type_scale.js'; doc.head.appendChild(letters);", '')); }
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
  medidas.bytes = { letters: statSync(join(PUBLIC, 'game/type_scale.js')).size };
  ok(medidas.bytes.letters <= 4000, 'type_scale.js over 4000 B: ' + medidas.bytes.letters);
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + (process.pid % 90);
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


  const LEER = `JSON.stringify((() => { const b = document.getElementById('gp-letters'); if (!b) return null; const r = b.getBoundingClientRect();
    const fs = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : null; };
    return { label: b.getAttribute('aria-label'), w: r.width, h: r.height, inMid: !!b.closest('#gamepad .gp-mid'), acho: b.classList.contains('gp-acho') && !!b.style.getPropertyValue('--gp'),
      step: document.documentElement.dataset.letters, h1: (() => { const e = [...document.querySelectorAll('#voices *')].find((x) => x.children.length === 0 && /\S/.test(x.textContent) && x.getBoundingClientRect().height > 0); return e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : 0; })(), map: Math.round(document.getElementById('stage').getBoundingClientRect().width),
      saved: (() => { try { return localStorage.getItem('preceptoros.letters'); } catch (e) { return 'NO_DATA'; } })(), state: (document.getElementById('state') || {}).textContent || '' }; })())`;
  for (const [W, H, n] of [[420, 642, '420'], [360, 740, '360']]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
    await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
    await ev(`(() => { try { localStorage.removeItem('preceptoros.letters'); } catch (e) {} })()`);
    await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
    await ev(`(() => { const c = document.querySelector('#gamepad .cats [data-cat=Welcome]') || document.querySelector('[data-cat=Welcome]'); c && c.click(); })()`); await espera(400);
    const a = JSON.parse(await ev(LEER) || 'null'); medidas['antes' + n] = a;
    ok(a, n + ': no Aa button in the gamepad');
    if (!a) { continue; }
    ok(a.inMid && a.acho && a.w >= 44 && a.h >= 44 && a.label === 'Letters 100%' && a.step === '1', n + ': Aa is not a 44 px Acho button at Letters 100%: ' + JSON.stringify(a));
    const pasos = [];
    for (let i = 0; i < 4; i++) { await ev(`document.getElementById('gp-letters').click()`); await espera(150); pasos.push(JSON.parse(await ev(LEER))); }
    medidas['pasos' + n] = pasos.map((p) => [p.label, p.h1, p.map]);
    ok(pasos.map((p) => p.label).join(',') === 'Letters 115%,Letters 130%,Letters 150%,Letters 100%', n + ': Aa does not cycle the four steps: ' + pasos.map((p) => p.label));
    ok(pasos[2].h1 > a.h1 * 1.4 && pasos[3].h1 === a.h1, n + ': the reading panel letters do not grow with the step: ' + JSON.stringify([a.h1, pasos.map((p) => p.h1)]));
    ok(pasos.every((p) => p.map === a.map), n + ': the map changed size with the letters');
    ok(pasos[0].state === 'Letters 115%', n + ': the step is not said in #state: ' + pasos[0].state);
    // The step stays for the next visit.
    await ev(`document.getElementById('gp-letters').click()`); await espera(100);
    await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
    const v = JSON.parse(await ev(LEER)); medidas['vuelta' + n] = v;
    ok(v.label === 'Letters 115%' && v.step === '1.15' && v.saved === '1.15', n + ': the step is not remembered: ' + JSON.stringify(v));
    const s = await ev(`JSON.stringify({ scroll: document.documentElement.scrollWidth, w: innerWidth })`); const sc = JSON.parse(s);
    ok(sc.scroll <= sc.w, n + ': horizontal overflow at Letters 115%');
    await foto('letters-' + n + '.png');
  }
  console.log(JSON.stringify({ piece: 'letters', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'letters', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
