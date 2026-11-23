// Chat Live closes on a phone and gives the map back (S110, 2026-11-23, Mesa #51). On a 360 px screen a focused
// field scrolled the HUD and its close (✕) went out of view: the panel stayed over the map and ate every tap.
// Real mouse events only: open Chat Live, focus the public box, scroll the HUD to its end (what the keyboard does),
// the ✕ must still be on screen and on top; one click closes the HUD; a tap on the map then reaches the walker.
// Uso: node atlas/chatlive_close_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const MUNDO = { esquema: 'preceptoros.openworld-estado/2', cobertura: { estado: 'MEDIDO' },
  colonia: { nodes: [{ id: 'fixture-node-one', alive: true, seal: 'LIVE', since: '2026-11-23', q: 0, r: 0 }], buildings: [], units: [] } };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      if (ruta === '/api/world-state') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(MUNDO)); return; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(readFileSync(f));
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [];
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
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  const clicXY = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) { await cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); } };
  // The centre of an element as laid out now; the test never scrolls it into view (the person cannot either).
  const centro = async (sel) => JSON.parse(await ev(`JSON.stringify((() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) { return null; } const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })())`));

  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  await ev('(async () => { if (window.AtlasVisitorPlay && AtlasVisitorPlay.enter) { await AtlasVisitorPlay.enter(true); } return 1; })()'); await espera(1500);

  const boton = await centro('#map-communication button');
  ok(!!boton, 'no Chat Live button on the map');
  if (!boton) { return; }
  await clicXY(boton.x, boton.y); await espera(600);
  ok(await ev("!document.getElementById('voices').hidden"), 'Chat Live did not open');
  const caja = await centro('#open-chat-text');
  if (caja) { await clicXY(caja.x, caja.y); }
  // What the S110's on-screen keyboard does: the viewport shrinks to 368 px (62dvh with it) and the focused field is
  // scrolled into view inside the HUD, so its head scrolls up. The test keeps that smaller viewport, as the phone does.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 368, deviceScaleFactor: 1, mobile: true }); await espera(400);
  await ev("(() => { const v = document.getElementById('voices'); v.scrollTop = v.scrollHeight; return v.scrollTop; })()"); await espera(300);
  await foto('chatlive-scrolled.png');
  const x = JSON.parse(await ev(`JSON.stringify((() => {
    const v = document.getElementById('voices'), b = document.getElementById('voices-x'); if (!b) { return null; }
    const r = b.getBoundingClientRect(), p = v.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, top = document.elementFromPoint(cx, cy);
    return { x: cx, y: cy, w: r.width, h: r.height, inside: r.top >= p.top - 1 && r.bottom <= p.bottom + 1, onTop: !!top && (top === b || b.contains(top)), scrolled: v.scrollTop };
  })())`));
  ok(!!x, 'Chat Live has no close (✕)');
  if (!x) { return; }
  ok(x.scrolled > 0, 'the HUD did not scroll in this layout, the case is not exercised: ' + JSON.stringify(x));
  ok(x.inside && x.onTop, 'the close (✕) scrolls out of view with the HUD: ' + JSON.stringify(x));
  ok(x.w >= 44 && x.h >= 44, 'the close (✕) is below 44 px: ' + JSON.stringify(x));
  await clicXY(x.x, x.y); await espera(500);
  const cerrado = JSON.parse(await ev(`JSON.stringify({ hidden: document.getElementById('voices').hidden, expanded: document.querySelector('#map-communication button').getAttribute('aria-expanded') })`));
  ok(cerrado.hidden === true && cerrado.expanded === 'false', 'one click on the ✕ did not close Chat Live: ' + JSON.stringify(cerrado));
  // The field lost focus, so the keyboard is gone and the phone's full viewport comes back.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true }); await espera(600);
  // The map is the map again: a tap 60 px west of the crab reaches the walker (a step, or its NO_DATA cause), not a panel.
  const yo = JSON.parse(await ev(`JSON.stringify((() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(); if (!s.dataset.youx) { return null; } return { x: r.left + Number(s.dataset.youx) * r.width / s.width - 60, y: r.top + Number(s.dataset.youy) * r.height / s.height }; })())`));
  ok(!!yo, 'NO_DATA: the crab is not on the map');
  if (yo) {
    const encima = await ev(`(() => { const e = document.elementFromPoint(${yo.x}, ${yo.y}); return e ? e.tagName + '#' + e.id + '.' + String(e.className).split(' ')[0] : 'none'; })()`);
    ok(encima === 'CANVAS#surface.surface', 'something still covers the map after closing Chat Live: ' + encima);
    await clicXY(yo.x, yo.y); await espera(500);
    const dijo = await ev("(document.querySelector('#joy p') || {}).textContent || ''");
    ok(/You walk|NO_DATA: .* the way/.test(dijo), 'a tap on the map after closing Chat Live did not reach the walker: ' + dijo);
  }
  await foto('chatlive-closed.png');
}

main().catch((e) => fallos.push('error: ' + e.message)).finally(() => {
  try { ws && ws.close(); } catch {}
  try { ch && ch.close(); } catch {}
  try { srv && srv.close(); } catch {}
  if (fallos.length) { console.error('FAIL chatlive_close_browser\n- ' + fallos.join('\n- ')); process.exit(1); }
  console.log('OK chatlive_close_browser · the ✕ stays on top of a scrolled Chat Live, one click closes it, the map walks again');
  process.exit(0);
});
