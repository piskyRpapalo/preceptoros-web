// [W] O1a (2026-10-27) · the wave duel scene in a real browser, on a test-only fixture (atlas/wave_duel_fixture.html,
// never served by the site). It plays the v1.1 reference fight (arrecife vs 3 seeded tc1 troops) and measures the hybrid
// layout: the canvas, five sea lines, one life bar per troop, the sine trail, the 12-radial pulse ring, the round label,
// the screen-reader text, the end letter, 0 exceptions and 0 external requests. Uso: node atlas/wave_duel_browser.mjs [dir]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url)), FIXTURE = readFileSync(new URL('./wave_duel_fixture.html', import.meta.url));
const CAPTURA = process.argv[2] || null, espera = (ms) => new Promise((r) => setTimeout(r, ms));
const TIPOS = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' };
const srv = createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if (ruta === '/wave_duel_fixture.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(FIXTURE); return; }
  try { const f = resolve(PUBLIC, '.' + ruta); if (!f.startsWith(resolve(PUBLIC))) { throw new Error('out'); }
    const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': TIPOS[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const origen = 'http://127.0.0.1:' + srv.address().port, cdp = 9600 + (process.pid % 300), ch = launchChrome(cdp);
const fallos = [], externas = [], pend = new Map(); let id = 0, ws = null, medida = {};
const ok = (c, q) => { if (!c) { fallos.push(q); } };
try {
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch('http://127.0.0.1:' + cdp + '/json')).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && !u.startsWith(origen)) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') { fallos.push('exception: ' + String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0].slice(0, 100)); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable'); await cmd('Network.setBlockedURLs', { urls: ['https://*'] });
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1040, height: 520, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: origen + '/wave_duel_fixture.html' }); await espera(1500);
  // Count what each frame draws: wrap the 2D context (test-only instrumentation, the scene is not touched).
  await ev(`(() => { const P = CanvasRenderingContext2D.prototype, n = window.__n = { stroke: 0, fillRect: 0, arc: 0, moveTo: 0, lineTo: 0, texto: [] };
    ['stroke', 'fillRect', 'arc', 'moveTo', 'lineTo'].forEach((k) => { const o = P[k]; P[k] = function () { n[k]++; return o.apply(this, arguments); }; });
    const ft = P.fillText; P.fillText = function (t) { if (n.texto.length < 400) n.texto.push(String(t)); return ft.apply(this, arguments); };
    window.__s = juega(); return true; })()`);
  const fotos = [['0500', 500], ['1500', 1000], ['3000', 1500], ['6000', 3000]];
  for (const [nom, ms] of fotos) {
    await espera(ms);
    if (CAPTURA) { const s = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'o1a-' + nom + 'ms.png'), Buffer.from(s.result.data, 'base64')); }
  }
  medida = JSON.parse(await ev(`(() => { const c = document.getElementById('lienzo');
    return JSON.stringify({ w: c.width, h: c.height, n: Object.assign({}, window.__n, { texto: [...new Set(window.__n.texto)].slice(0, 8) }),
      aria: c.getAttribute('aria-label'), role: c.getAttribute('role'), rondas: window.__c.rondas, gana: window.__c.gana }); })()`));
  await ev('__s.salta()'); await espera(1500);
  medida.fin = await ev('!!window.__fin');
  await ev('__s.para()');
  ok(medida.w === 983 && medida.h === 440, 'canvas is not 983x440: ' + medida.w + 'x' + medida.h);
  ok(medida.n.stroke >= 5 * 100, 'too few strokes for five sea lines per frame: ' + medida.n.stroke);
  ok(medida.n.fillRect >= 10 * 100, 'too few life-bar rects: ' + medida.n.fillRect);
  ok(medida.n.arc > 0 && medida.n.moveTo >= 12, 'no pulse ring with radials');
  ok(medida.n.texto.some((t) => /^Round \d+$/.test(t)) && medida.n.texto.some((t) => /^-\d+$/.test(t)), 'no round label or floating damage: ' + medida.n.texto);
  ok(medida.role === 'img' && /harmonics/.test(medida.aria || ''), 'screen-reader text missing: ' + medida.aria);
  ok(medida.fin === true, 'Skip did not end the fight (alFin)');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
} catch (e) { fallos.push(String(e && e.message || e)); }
finally { try { ws && ws.close(); } catch {} ch.close && ch.close(); srv.close(); }
console.log(JSON.stringify({ piece: 'W-O1a', receipt: 'MEDIDO', fixture: 'atlas/wave_duel_fixture.html (test-only)', canvas: [medida.w, medida.h], gana: medida.gana, rondas: medida.rondas,
  dibujo: medida.n && { stroke: medida.n.stroke, fillRect: medida.n.fillRect, arc: medida.n.arc, moveTo: medida.n.moveTo, texto: medida.n.texto }, aria: medida.aria, externas: externas.length, fallos }));
process.exitCode = fallos.length ? 1 : 0;
