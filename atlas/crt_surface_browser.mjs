// T_CRT (FIRMO 2026-10-19, Comando #15): ojo de navegador del chasis. Cada boton del menu abre su interactivo en el
// 100% del interior del tubo (entre menu, barra, borde y chat), la rueda vive abajo a la derecha con >= 44 px y recorta,
// y el lienzo del mapa es el MISMO nodo antes y despues (fondo perpetuo). Uso: node atlas/crt_surface_browser.mjs
// Sin Chrome: NO_DATA con causa (rc 0, no es verde ni rojo).
import { sirve } from './sirve_publico.mjs';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = [];
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

const MIDE = `(() => {
  const vis = [document.getElementById('thegame-terminal'), ...document.querySelectorAll('.thegame-hoja')].filter((e) => e && !e.hidden);
  const m = document.getElementById('thegame-menu')?.getBoundingClientRect(), c = document.getElementById('crt-controls')?.getBoundingClientRect();
  const s = vis[0]?.getBoundingClientRect();
  const r = (b) => b && [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)];
  return JSON.stringify({ abiertos: vis.length, slot: vis[0]?.classList.contains('surface-slot') || false, sup: r(s),
    dentro: m && c && [Math.round(m.right), Math.round(m.top), document.documentElement.clientWidth, Math.round(c.top)], ctl: r(c), w: document.documentElement.clientWidth, h: document.documentElement.clientHeight });
})()`;

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, cdpPort = 9600 + (process.pid % 300);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { return { nodata: ch.diagnostic() }; }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { fallos.push('exception: ' + String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 80)); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalua = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable');

  for (const [w, h] of [[360, 716], [1280, 800]]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/play/` });
    await espera(7000);
    await evalua("document.querySelector('.descent-skip')?.click()");
    await espera(6000);
    const marca = await evalua("(() => { const c = document.querySelector('#thegame-mapa canvas'); if (!c) return 'sin lienzo'; c.__crt = 1; return 'ok'; })()");
    if (marca !== 'ok') { fallos.push(`${w}px: map canvas missing before panels`); }
    for (const b of ['history', 'waves', 'buildings', 'nodes', 'start']) {
      await evalua(`document.getElementById('menu-${b}')?.click()`); await espera(1200);
      const m = JSON.parse((await evalua(MIDE)) || '{}');
      medidas.push({ w, b, sup: m.sup, dentro: m.dentro });
      const igual = m.sup && m.dentro && m.sup.every((v, i) => Math.abs(v - m.dentro[i]) <= 1);
      if (m.abiertos !== 1 || !m.slot || !igual) { fallos.push(`${w}px ${b}: surface ${JSON.stringify(m.sup)} != tube ${JSON.stringify(m.dentro)} (open ${m.abiertos}, slot ${m.slot})`); }
      if (!m.ctl || m.ctl[2] !== m.w || Math.abs(m.ctl[3] - m.h) > 1) { fallos.push(`${w}px ${b}: control panel not at the bottom-right corner ${JSON.stringify(m.ctl)}`); }
      await evalua(`document.getElementById('menu-${b}')?.click()`); await espera(600);
      await evalua("document.querySelector('.thegame-hoja:not([hidden]) .thegame-hoja-cierra')?.click()"); await espera(600);
    }
    const perpetuo = await evalua("document.querySelector('#thegame-mapa canvas')?.__crt === 1");
    if (!perpetuo) { fallos.push(`${w}px: map canvas was replaced while panels opened`); }
    const rueda = JSON.parse((await evalua(`(() => { const z = document.getElementById('z-cutoff'); if (!z) return '{}'; const b = z.getBoundingClientRect();
      z.value = '25'; z.dispatchEvent(new Event('input', { bubbles: true })); const d = document.documentElement;
      const r = { w: Math.round(b.width), h: Math.round(b.height), v: AtlasZ.value(), nd: d.classList.contains('z-hide-no-data'), em: d.classList.contains('z-hide-emulated'),
        txt: document.querySelector('.crt-z-out')?.textContent, vt: z.getAttribute('aria-valuetext') };
      z.value = '100'; z.dispatchEvent(new Event('input', { bubbles: true })); r.back = !d.classList.contains('z-hide-no-data') && AtlasZ.value() === 100; return JSON.stringify(r); })()`)) || '{}');
    medidas.push({ w, rueda });
    if (!(rueda.w >= 44 && rueda.h >= 44 && rueda.v === 25 && rueda.nd && rueda.em && rueda.txt === 'Depth 0.25: measured only' && rueda.vt === rueda.txt && rueda.back)) {
      fallos.push(`${w}px: depth wheel ${JSON.stringify(rueda)}`);
    }
  }
  return null;
}

let nodata = null;
try { nodata = (await main())?.nodata || null; } catch (e) { fallos.push('harness: ' + String(e.message)); }
finally { try { ws?.close(); } catch {} try { await ch?.close(); } catch {} try { srv?.close(); } catch {} }
if (nodata) { console.log(JSON.stringify({ ok: null, sello: 'NO_DATA', causa: nodata.slice(0, 200) })); process.exitCode = 0; }
else { console.log(JSON.stringify({ ok: fallos.length === 0, fallos, medidas })); process.exitCode = fallos.length ? 1 : 0; }
