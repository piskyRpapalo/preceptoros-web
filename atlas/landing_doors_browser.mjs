// P3 [1d] in a real browser: the landing's three doors are drawn in the house bubble language, with
// the same three links, the same footer, the titles still readable by screen readers, no exception
// and no external request. Uso: node atlas/landing_doors_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
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
const fallos = [], externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, medida = null;
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
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd('Page.navigate', { url: origen + '/' });
  for (let t = 0; t < 15000 && !(await ev("document.documentElement.classList.contains('con-burbujas')")); t += 250) { await espera(250); }
  medida = JSON.parse(await ev(`JSON.stringify((() => {
    const puertas = [...document.querySelectorAll('#doors .door')];
    const tinta = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { n++; } } return n; };
    return { burbujas: document.documentElement.classList.contains('con-burbujas'), puertas: puertas.length,
      enlaces: puertas.map((a) => a.getAttribute('href')), titulos: puertas.map((a) => (a.querySelector('b') || {}).textContent),
      dibujos: puertas.map((a) => { const c = a.querySelector('canvas.door-art'); return c ? tinta(c) : 0; }),
      pie: (document.querySelector('.note') || {}).textContent, texto: document.body.innerText,
      // [2]: the web and the app, two bubbles facing each other; the tail is the ink nearest the bottom corners.
      lados: [...document.querySelectorAll('#web-app .side')].map((p) => { const c = p.querySelector('canvas.door-art'); if (!c) { return null; }
        const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, w = c.width, h = c.height, y = Math.floor(h * 0.95);
        let izq = 0, der = 0; for (let x = 0; x < w; x++) { if (d[(y * w + x) * 4 + 3] > 0) { if (x < w / 2) { izq++; } else { der++; } } }
        return { lado: p.dataset.lado, tinta: tinta(c), cola: izq > der ? 'left' : der > izq ? 'right' : 'none', titulo: (p.querySelector('b') || {}).textContent }; }),
      plegado: !(document.querySelector('#web-app details.tech') || {}).open };
  })())`));
  ok(medida.burbujas && medida.puertas === 3, 'the three doors were not all drawn in bubble language');
  ok(JSON.stringify(medida.enlaces) === JSON.stringify(['/play/', '/face/', '/creation.html']), 'links changed: ' + medida.enlaces);
  ok(JSON.stringify(medida.titulos) === JSON.stringify(['Play theGame', 'Worlds', 'Creation studio']), 'titles changed or gone: ' + medida.titulos);
  ok(medida.dibujos.every((n) => n > 2000), 'a bubble is blank: ' + medida.dibujos);
  ok(medida.pie === 'One language until the MVP: English. The old translated addresses lead here.', 'footer changed');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the landing');
  ok(medida.lados.length === 2 && medida.lados.every((l) => l && l.tinta > 2000), '[2] the web/app bubbles are not both drawn: ' + JSON.stringify(medida.lados));
  ok(JSON.stringify(medida.lados.map((l) => l && [l.lado, l.titulo, l.cola])) === JSON.stringify([['web', 'The web', 'left'], ['app', 'The app', 'right']]), '[2] the bubbles do not face each other: ' + JSON.stringify(medida.lados));
  ok(medida.plegado, '[2] technical details are not folded');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  // North D1: the install guide, at phone width: nothing external, no sideways scroll, no missing value, the landing links it.
  ok(await ev("!!document.querySelector('#web-app ~ .get-app a[href=\"/get-the-app/\"], .get-app a[href=\"/get-the-app/\"]')"), 'the landing does not link /get-the-app/');
  await cmd('Page.navigate', { url: origen + '/get-the-app/' }); await espera(1500);
  medida.guia = JSON.parse(await ev("JSON.stringify({ h1: (document.querySelector('h1') || {}).textContent, ancho: document.documentElement.scrollWidth, vista: innerWidth, bajas: document.querySelectorAll('a[href*=\"/releases/download/\"]').length, huellas: document.querySelectorAll('code.sha[data-asset]').length, filas: document.querySelectorAll('.pruebas tbody tr').length, texto: document.body.innerText })"));
  ok(medida.guia.h1 === 'Get the app', '/get-the-app/ did not load');
  ok(medida.guia.ancho <= medida.guia.vista, '/get-the-app/ scrolls sideways: ' + medida.guia.ancho + ' > ' + medida.guia.vista);
  ok(medida.guia.bajas >= 3 && medida.guia.huellas >= 2 && medida.guia.filas >= 4, '/get-the-app/ lost downloads, fingerprints or the test table');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.guia.texto), 'missing value shown on /get-the-app/');
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'get-the-app.png'), Buffer.from(g.result.data, 'base64')); }
  ok(externas.length === 0, 'external requests after /get-the-app/: ' + externas.slice(0, 3));
  // North N2: /aduana/ is observant. The checker mounts, the registry reads NO_DATA from the contract, sending is
  // asleep (the send button disabled, envia() sends nothing), nothing external, no sideways scroll.
  await cmd('Page.navigate', { url: origen + '/aduana/' }); await espera(2000);
  medida.aduana = JSON.parse(await ev(`(async () => { const b = [...document.querySelectorAll('#comprueba button')];
    const r = window.AtlasAduana ? await AtlasAduana.envia({ pares: [{}] }) : null;
    return JSON.stringify({ h1: (document.querySelector('h1') || {}).textContent, botones: b.length, envioOff: b.length ? b[b.length - 1].disabled : null,
      registro: (document.getElementById('estado-registro') || {}).textContent, envia: r && { sent: r.sent, code: r.code },
      ancho: document.documentElement.scrollWidth, vista: innerWidth, texto: document.body.innerText }); })()`));
  ok(medida.aduana.h1 === 'Create a node', '/aduana/ did not load');
  ok(medida.aduana.botones >= 3 && medida.aduana.envioOff === true, '/aduana/ checker not mounted, or its send is awake');
  ok(medida.aduana.registro === 'NO_DATA' && medida.aduana.envia && medida.aduana.envia.sent === false && medida.aduana.envia.code === 'registry_not_deployed', '/aduana/ is not asleep: ' + JSON.stringify(medida.aduana.envia));
  ok(medida.aduana.ancho <= medida.aduana.vista, '/aduana/ scrolls sideways');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.aduana.texto), 'missing value shown on /aduana/');
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'aduana.png'), Buffer.from(g.result.data, 'base64')); }
  ok(externas.length === 0, 'external requests after /aduana/: ' + externas.slice(0, 3));
  if (CAPTURA) {
    const s = await cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(CAPTURA, 'landing-doors.png'), Buffer.from(s.result.data, 'base64'));
  }
  console.log(JSON.stringify({ piece: 'P3-1d', receipt: 'MEDIDO', dibujos: medida.dibujos, lados: medida.lados, aduana: medida.aduana && { botones: medida.aduana.botones, envioOff: medida.aduana.envioOff, registro: medida.aduana.registro, envia: medida.aduana.envia, ancho: medida.aduana.ancho }, guia: medida.guia && { ancho: medida.guia.ancho, vista: medida.guia.vista, bajas: medida.guia.bajas, huellas: medida.guia.huellas, filas: medida.guia.filas }, enlaces: medida.enlaces, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P3-1d', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
