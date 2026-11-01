// La Arena del Laboratorio en un navegador real (2026-11-01): /openworld/ dibuja un edificio por modelo de cerebros.json,
// cada uno con su botón de 44 px; Enter desde el teclado abre su ficha en la radio; «Run on this device» sin cerebro es
// NO_DATA y, con el cerebro del nodo web cargado, mide tok/s en ESTE aparato junto a la cifra del rack. Cero externas.
// Uso: node atlas/arena_lab_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [], modelos = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } if (/\/models\/web-node\//.test(u)) { modelos.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });

  const cmd = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (e) => { const x = (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result; if (x?.exceptionDetails) { fallos.push('eval: ' + String(x.exceptionDetails.exception?.description || x.exceptionDetails.text).split('\n')[0]); } return x?.result?.value ?? null; };
  await cmd('Network.enable'); await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(3000);
  const r = JSON.parse(await ev(`(async () => {
    window.AtlasBenchLab.drawn = 0; document.getElementById('surface').dispatchEvent(new CustomEvent('visitor:draw')); const lab = window.AtlasBenchLab.drawn;
    document.getElementById('lab-doors').open = true;
    const bs = [...document.querySelectorAll('.lab-building')], s = document.getElementById('surface').getBoundingClientRect();
    const big = bs.filter((b) => { const q = b.getBoundingClientRect(); return q.width >= 44 && q.height >= 44; }).length, wide = document.documentElement.scrollWidth <= innerWidth;
    return JSON.stringify({ n: bs.length, lab, big, wide, state: (document.getElementById('lab-state') || {}).textContent || '', labels: bs.map((b) => b.getAttribute('aria-label').slice(0, 60)) }); })()`));
  ok(r.n === 7, 'expected 7 lab buildings: ' + r.n);
  ok(r.lab === 7, 'the lab frames are not painted on the map: ' + r.lab);
  ok(r.big === 7, 'lab doors below 44 px: ' + r.big);
  ok(r.wide, 'the lab doors make the page scroll sideways');
  ok(/7 model buildings/.test(r.state), 'lab state line: ' + r.state);
  await ev(`(() => { const b = document.querySelector('.lab-building[data-model="mini"]'); b.focus(); return document.activeElement === b; })()`);
  for (const type of ['keyDown', 'keyUp']) { await cmd('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: type === 'keyDown' ? '\r' : undefined }); }
  await espera(1200);
  const k = JSON.parse(await ev(`(async () => {
    const log = [...document.querySelectorAll('#log li')].map((li) => li.textContent), radio = (document.getElementById('radio-chat') || document.body).textContent;
    const run = document.getElementById('lab-run'); const tall = run ? run.getBoundingClientRect().height : 0; if (run) run.click();
    await new Promise((r) => setTimeout(r, 200));
    return JSON.stringify({ log: log.filter((l) => /Lab · qwen3:1.7b/.test(l)).length, radio: /Lab · qwen3:1.7b/.test(radio), measured: log.some((l) => /55\\.2 tok\\/s generation/.test(l) && /cerebros\\.json/.test(l)),
      tall, bars: (document.getElementById('lab-bars') || {}).textContent || '' }); })()`));
  ok(k.log === 3 && k.radio, 'keyboard Enter did not open the model card in the radio: ' + JSON.stringify(k));
  ok(k.measured, 'the card does not say the measured number and its source');
  ok(k.tall >= 44, 'Run on this device below 44 px: ' + k.tall);
  ok(/Rack .*55\.2 tok\/s/.test(k.bars) && /This device NO_DATA · model_not_installed/.test(k.bars), 'bars without the brain: ' + k.bars);
  // With the web node brain loaded (same origin, consent by click), the run measures THIS device.
  const d = JSON.parse(await ev(`(async () => { const note = document.getElementById('chat-note'); document.getElementById('brain-load').click();
    for (let i = 0; i < 900 && !/ready on this device/.test(note.textContent); i++) await new Promise((r) => setTimeout(r, 100));
    document.getElementById('lab-run').click(); const out = document.getElementById('lab-bars');
    for (let i = 0; i < 900 && !/web node brain, not written|This device NO_DATA · (?!running)/.test(out.textContent); i++) await new Promise((r) => setTimeout(r, 100));
    return JSON.stringify({ bars: out.textContent }); })()`));
  ok(/This device .* tok\/s · web node brain/.test(d.bars), 'no device run: ' + d.bars);
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  console.log(JSON.stringify({ piece: 'lab-arena', edificios: r.n, teclado: k, dispositivo: d.bars, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e.message || e)); console.log(JSON.stringify({ fallos })); }).finally(() => { try { ws && ws.close(); } catch {} try { ch && ch.close && ch.close(); } catch {} try { srv && srv.close(); } catch {} process.exit(fallos.length ? 1 : 0); });
