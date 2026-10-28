// NORTE 7 · PR 2 in a real browser: /openworld/ draws the tutorial cabin with zero nodes, the chat panel is
// there with its input off, no exception, no external request, no sideways scroll at phone width.
// Uso: node atlas/openworld_browser.mjs [carpeta-captura]
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
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [];
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
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  // Phone width first: the map is the top half, the chat the bottom half, nothing scrolls sideways.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  const medida = JSON.parse(await ev(`(() => {
    const c = document.getElementById('surface'); let tinta = 0;
    try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { tinta++; } } } catch (e) { tinta = -1; }
    return JSON.stringify({
      titulo: (document.querySelector('h1') || {}).textContent,
      botones: [...document.querySelectorAll('#map .press button')].map((b) => b.textContent),
      tinta,
      estado: (document.getElementById('state') || {}).textContent,
      chatAbierto: !!document.querySelector('#chat'),
      entradaOff: !!(document.getElementById('question') || {}).disabled,
      botonChat: [...document.querySelectorAll('button')].some((b) => /^\\s*Chat\\s*$/.test(b.textContent)),
      ancho: document.documentElement.scrollWidth, vista: innerWidth,
      texto: document.body.innerText
    }); })()`));
  ok(medida.titulo === 'OpenWorld', 'the page did not load: ' + medida.titulo);
  // NORTE 8 · mandato 3 (rebanada 2): el sonido nativo. La cabaña no declara ondas con armónicos, así que su
  // sonido dice NO_DATA con su causa en la región en vivo. Un clic no crea audio sin una voz que sonar.
  // a demanda: el módulo de sonido no existe en la página hasta el primer clic.
  ok((await ev("typeof window.AtlasSonifyBubble")) === 'undefined', 'the sound module loaded on page load: it must load on the first click');
  const esBoton = await ev("document.getElementById('listen') && document.getElementById('listen').tagName === 'BUTTON'");
  ok(esBoton === true, 'the listen control is not a button (keyboard operability)');
  await ev("document.getElementById('listen').click()"); await espera(200);
  const escucha = await ev("document.getElementById('listen-state').textContent");
  ok(/^Playing 1 voices\.$/.test(escucha || ''), 'the cabin sound did not play its one voice: ' + escucha);
  // El chat: una pregunta se muestra como viva y la respuesta es NO_DATA con su causa (no hay modelo instalado).
  await ev("(() => { const q = document.getElementById('question'); q.value = 'hola'; document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); })()");
  await espera(900);
  const respuesta = await ev("(document.querySelector('#log li:last-child') || {}).textContent || ''");
  ok(/^NO_DATA · /.test(respuesta || ''), 'the chat answer is not an honest NO_DATA: ' + respuesta); merged/atlas/openworld_browser.mjs
  ok(JSON.stringify(medida.botones) === JSON.stringify(['Tutorial cabin']), 'the terrain list is not the cabin alone: ' + JSON.stringify(medida.botones));
  ok(medida.tinta > 2000, 'the map is blank: ' + medida.tinta);
  ok(medida.estado === 'Nodes online: 0. The tutorial cabin is the basic world.', 'the default state is not zero nodes: ' + medida.estado);
  ok(medida.chatAbierto && !medida.entradaOff, 'the chat panel is missing or its input is off');
  ok(!medida.botonChat, 'there is a Chat button; the chat must always be present, with no button');
  ok(medida.ancho <= medida.vista, 'the page scrolls sideways at phone width: ' + medida.ancho + ' > ' + medida.vista);
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the page');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'openworld-390.png'), Buffer.from(g.result.data, 'base64')); }
  console.log(JSON.stringify({ medida: { ...medida, texto: undefined }, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push('harness: ' + e.message); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
