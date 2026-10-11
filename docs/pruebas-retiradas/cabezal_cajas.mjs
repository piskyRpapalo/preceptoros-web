// Las CAJAS del cabezal, medidas en un navegador de verdad (Chrome headless por CDP, node sin
// dependencias). Pedido del Soberano, 2026-10-05: el busto se montaba encima de los botones y del
// panel del bosque, y la fila de botones se salia por la izquierda. Aqui se mide, no se supone:
//   - el busto (.presentacion) no se cruza con ningun mando del cabezal ni con lo que va debajo;
//   - ningun boton de la navegacion se sale de la pantalla;
//   - hay UNA sola puerta de juego.
// Con y sin sesion (identidad de tester, nivel 1 sin cuenta), a 412x915 y 1280x900.
// Sin Chrome: imprime NO_DATA y sale con 3; el gate lo dice y no lo da por bueno.
//   node atlas/cabezal_cajas.mjs -> [{caso, ok, detalle}]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';

const RAIZ = new URL('../public/', import.meta.url).pathname;
const CHROME = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  .find((p) => existsSync(p));
if (!CHROME) { console.log(JSON.stringify([{ caso: 'NO_DATA', ok: false, detalle: 'sin Chrome en esta maquina' }])); process.exit(3); }

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
const servidor = createServer((q, r) => {
  let p = join(RAIZ, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(RAIZ)) { r.writeHead(403); r.end(); return; }
  if (existsSync(p) && statSync(p).isDirectory()) { p = join(p, 'index.html'); }
  if (!existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const WEB = `http://127.0.0.1:${servidor.address().port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIDE = `(() => {
  const caja = (n) => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  const cruza = (a, b) => a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1;
  const e = document.querySelector('#cabezal .presentacion .esfera');
  const mal = [];
  if (!e) { return { mal: ['sin busto'], juego: 0 }; }
  const b = caja(e);
  const piezas = [...document.querySelectorAll('#cab-nav .cab-boton, #identity > *, #cabezal .rueda, #cabezal .marca h1, #cab-ident > *')]
    .filter((n) => n.offsetParent !== null);
  piezas.forEach((n) => { if (cruza(b, caja(n))) { mal.push('busto sobre ' + (n.textContent.trim().slice(0, 20) || n.className)); } });
  const cab = caja(document.querySelector('#cabezal'));
  if (b[3] > cab[3] + 1) { mal.push('el busto sale del cabezal por abajo ' + Math.round(b[3] - cab[3]) + ' px'); }
  document.querySelectorAll('#cab-nav .cab-boton').forEach((n) => {
    const c = caja(n);
    if (c[0] < -1 || c[2] > innerWidth + 1) { mal.push('boton fuera de pantalla: ' + n.textContent.trim()); }
  });
  return { mal, juego: document.querySelectorAll('#cab-nav .cab-boton.thegame').length };
})()`;

async function mide(ancho, alto, conSesion) {
  const puerto = 9400 + Math.floor(Math.random() * 400), perfil = mkdtempSync(join(tmpdir(), 'cajas-'));
  const ch = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${perfil}`, `--window-size=${ancho},${alto}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let t; for (let i = 0; i < 60 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${puerto}/json`)).json()).find((x) => x.type === 'page'); } catch { await sleep(200); } }
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
    let id = 0; const pend = {};
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    const evalua = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
    await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.enable'); await send('Page.navigate', { url: WEB + '/en/' }); await sleep(1800);
    if (conSesion) { await evalua('window.Identity && window.Identity.crear().then(() => 1)'); await sleep(900); }
    const r = await evalua(MIDE); ws.close(); return r;
  } finally { ch.kill(); await sleep(150); rmSync(perfil, { recursive: true, force: true }); }
}

const casos = [];
for (const [w, h] of [[412, 915], [1280, 900], [1024, 768]]) {
  for (const s of [false, true]) {
    const r = await mide(w, h, s), nombre = `${w}x${h} ${s ? 'con sesion de tester' : 'sin sesion'}`;
    casos.push({ caso: nombre + ': el busto no pisa nada y los botones caben', ok: !!r && !r.mal.length, detalle: r ? r.mal.join('; ') : 'sin medida' });
    casos.push({ caso: nombre + ': una sola puerta de juego', ok: !!r && r.juego === 1, detalle: r ? String(r.juego) : 'sin medida' });
  }
}
servidor.close();
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
