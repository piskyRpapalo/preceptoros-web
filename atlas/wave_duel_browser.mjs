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
  let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
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
  // [W] O1b · the real entry points. A spy counts every wave-duel mount by its target canvas (installed before page load).
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { window.__montajes = []; let W;
    Object.defineProperty(window, 'AtlasWaveDuel', { configurable: true, get: () => W, set: (v) => { const e = v.escena;
      v.escena = function (l) { __montajes.push(l && (l.id || l.className)); return e.apply(this, arguments); }; W = v; } }); })()` });
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  const tinta = (sel) => `(() => { const c = document.querySelector(${JSON.stringify(sel)}); if (!c || !c.width) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) { if (d[i] > 0) n++; } return n; })()`;
  // 1 · /play/ arena: a PvE fight through ui-arena's real juega (the duel plays through the same juega).
  await cmd('Page.navigate', { url: origen + '/play/' });
  await hasta("!!document.querySelector('.descent-skip')", 15000); await ev("(b => b && b.click())(document.querySelector('.descent-skip'))");
  ok(await hasta('!!(window.AtlasArenaUI && window.AtlasArena && window.AtlasWaveDuel)', 40000), '/play/: the arena or the wave duel did not load');
  await ev(`(() => { const K = AtlasCanon, A = AtlasArena, l = A.lugares().find((x) => x.id === 'arrecife'), asa = [1, 2, 3].map((n) => ({ tc: 'tc1', semilla: K.sha('w-captura-ref-' + n) })),
    s = K.sha('w-captura-ref-semilla'); AtlasArenaUI.juega(l.defensa.tropas, asa, A.combate(l.defensa.tropas, asa, s), { titulo: 'ref', yo: 1, semilla: s, pve: true }); return true; })()`);
  await espera(3000);
  medida.play = JSON.parse(await ev(`JSON.stringify({ montajes: __montajes.slice(), replay: typeof window.AtlasReplay, tinta: ${tinta('canvas.atlas-arena-lienzo')} })`));
  ok(medida.play.montajes.includes('atlas-arena-lienzo') && medida.play.replay === 'undefined' && medida.play.tinta > 500, '/play/ arena is not on the wave duel: ' + JSON.stringify(medida.play));
  if (CAPTURA) { const s = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'o1b-play.png'), Buffer.from(s.result.data, 'base64')); }
  // 2 · the tutorial practice: its own scripts, mounted, rounds advanced until the model ends it (measured: this seed ends at round 2).
  await ev('TheGame.tutorial()'); await hasta('!!(window.AtlasPracticeArena && window.AtlasWaveDuel)', 30000);
  await ev(`(() => { const h = document.createElement('div'); h.id = 'w-practica'; document.body.appendChild(h); window.__pr = AtlasPracticeArena.mount(document, h, { seed: AtlasCanon.sha('w-practica') });
    for (let i = 0; i < 3; i++) { [...h.querySelectorAll('button')].find((b) => b.textContent === 'Next round').click(); } return true; })()`);
  await espera(2500);
  medida.practica = JSON.parse(await ev(`JSON.stringify({ montajes: __montajes.slice(), tick: __pr.state().tick, tinta: ${tinta('#w-practica canvas.en301-duel')} })`));
  ok(medida.practica.montajes.includes('en301-duel') && medida.practica.tick >= 1 && medida.practica.tinta > 200, 'the practice is not on the wave duel: ' + JSON.stringify(medida.practica));
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
} catch (e) { fallos.push(String(e && e.message || e)); }
finally { try { ws && ws.close(); } catch {} ch.close && ch.close(); srv.close(); }
console.log(JSON.stringify({ piece: 'W-O1a', receipt: 'MEDIDO', fixture: 'atlas/wave_duel_fixture.html (test-only)', canvas: [medida.w, medida.h], gana: medida.gana, rondas: medida.rondas,
  dibujo: medida.n && { stroke: medida.n.stroke, fillRect: medida.n.fillRect, arc: medida.n.arc, moveTo: medida.n.moveTo, texto: medida.n.texto }, aria: medida.aria, play: medida.play, practica: medida.practica, externas: externas.length, fallos }));
process.exitCode = fallos.length ? 1 : 0;
