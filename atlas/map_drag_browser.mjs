// Pieza 3 · LA MANO (odd/tasks/la-mano-la-voz.md §2): one finger drags the map, in a real browser with real touches.
// Law held here:
// - a one-finger drag moves the view (canvas dataset panx/pany) and never walks the crab: its click is swallowed;
// - a tap (under 6 px) still reaches the page, and hands the camera back to the crab (dataset.look cleared);
// - while the visitor looks around, a redraw does not snap the view back (colonia_pagina follow() respects the look);
// - two fingers still pinch-zoom (map_zoom.js); W A S D move the view and the view is spoken; ⌂ brings it home;
// - the pan is bounded; openworld_page.js does not grow; map_drag.js stays under 7 KiB.
// Sabotage: SABOTAJE=sin-destino drops the J7 announcement ⇒ red. SABOTAJE=sin-mirada serves map_drag.js without the look mark ⇒ follow() snaps the view back ⇒ red.
// Uso: node atlas/map_drag_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
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
      if (ruta === '/game/map_drag.js' && SAB === 'sin-mirada') { cuerpo = Buffer.from(String(cuerpo).replace("c.dataset.look = '1'; ", '')); }
      if (ruta === '/game/map_drag.js' && SAB === 'sin-destino') { cuerpo = Buffer.from(String(cuerpo).replace("say('Map view moved · stops at ' + end.panx + ', ' + end.pany + ' px');", '')); }
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
  // Weight law first: the monolith does not grow, the new piece stays small.
  const pageNow = statSync(join(PUBLIC, 'game/openworld_page.js')).size;
  let pageMain = null; try { pageMain = execFileSync('git', ['show', 'origin/main:public/game/openworld_page.js'], { cwd: RAIZ, maxBuffer: 1 << 24 }).length; } catch { pageMain = null; }
  medidas.openworld_page = { ahora: pageNow, main: pageMain };
  ok(pageMain === null || pageNow <= pageMain, 'openworld_page.js grew: ' + pageNow + ' > ' + pageMain);
  const drag = join(PUBLIC, 'game/map_drag.js');
  medidas.map_drag = existsSync(drag) ? statSync(drag).size : null;
  ok(medidas.map_drag !== null && medidas.map_drag < 7168, 'map_drag.js missing or over 7 KiB: ' + medidas.map_drag);

  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9400 + (process.pid % 90);
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
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);

  const vista = async () => JSON.parse(await ev(`JSON.stringify((() => { const d = document.getElementById('surface').dataset, V = window.AtlasOpenworldView && AtlasOpenworldView(), w = V && V.controls && V.controls.walker ? V.controls.walker() : null;
    return { panx: Number(d.panx) || 0, pany: Number(d.pany) || 0, zoom: d.zoom, angle: d.angle || '0', tilt: d.tilt || '1', look: d.look || '', clicks: window.__clicks || 0, walker: w ? JSON.stringify([w.node, w.to, w.q, w.r]) : null, say: (document.getElementById('zoom-state') || {}).textContent || '' }; })())`));
  await ev("window.__clicks = 0; document.addEventListener('click', (e) => { if (e.target && e.target.id === 'surface') { window.__clicks++; } }), true");
  const centro = JSON.parse(await ev("(() => { const c = document.getElementById('surface'); c.scrollIntoView({ block: 'start' }); const r = c.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.6), k: c.width / r.width }); })()"));
  await espera(300);
  // A one-finger path: touchStart, n moves of (dx, dy) each, touchEnd.
  const dedo = async (x, y, dx, dy, n) => {
    await cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= n; i++) { await cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i, y: y + dy * i, id: 1 }] }); await espera(16); }
    await cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  // 1 · drag left 80 CSS px: the view moves with the finger, no walk, no click.
  const a = await vista();
  await dedo(centro.x, centro.y, -10, 0, 8); await espera(30);
  const b0 = await vista(); await espera(700);
  const b = await vista();
  // J7 · the destination is spoken as the finger lifts, and the coast stops exactly there.
  const dest = /stops at (-?\d+), (-?\d+) px/.exec(b0.say);
  medidas.destino = { dicho: b0.say, final: [b.panx, b.pany] };
  ok(!!dest && Number(dest[1]) === b.panx && Number(dest[2]) === b.pany, 'the stop was not announced when the finger lifted (J7): ' + JSON.stringify(medidas.destino));
  medidas.arrastre = { antes: [a.panx, a.pany], despues: [b.panx, b.pany], k: centro.k };
  ok(b.panx - a.panx <= -60 * centro.k, 'a one-finger drag did not move the view with the finger: ' + JSON.stringify(medidas.arrastre));
  ok(b.walker === a.walker, 'the drag walked the crab: ' + a.walker + ' → ' + b.walker);
  ok(b.clicks === a.clicks, 'the drag reached the page as a click');
  ok(b.look === '1', 'the view is not marked as looking around after a drag');
  ok(/moved/i.test(b.say), 'the moved view is not spoken: ' + b.say);
  await foto('la-mano-arrastre.png');

  // 2 · a redraw while looking around keeps the view (follow() respects the look).
  await ev('(window.AtlasOpenworldView && AtlasOpenworldView().redraw(), true)'); await espera(200);
  const c = await vista();
  ok(c.panx === b.panx && c.pany === b.pany, 'a redraw snapped the view back while looking around: ' + JSON.stringify([b.panx, c.panx]));

  // 3 · a tap (2 px) on open floor still reaches the page and hands the camera back. The map now has village buildings
  // that take their own taps (building_sheet.js), so the tap goes to the nearest point where no building answers.
  const suelo = JSON.parse(await ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(), MP = window.AtlasMapPainter;
    const free = (x, y) => !(MP && MP.markAt && MP.markAt((x - r.left) * s.width / r.width, (y - r.top) * s.height / r.height));
    for (let d = 0; d < 200; d += 8) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) { const x = ${centro.x} + dx, y = ${centro.y} + dy; if (free(x, y)) return JSON.stringify({ x, y }); }
    return JSON.stringify({ x: ${centro.x}, y: ${centro.y} }); })()`));
  await dedo(suelo.x, suelo.y, 1, 0, 2); await espera(500);
  const d = await vista();
  ok(d.clicks === c.clicks + 1, 'a tap did not reach the page: ' + (d.clicks - c.clicks) + ' clicks');
  ok(d.look === '', 'a tap did not hand the camera back to the crab');
  // 3b · a tap on a village building opens that building's card (and closes again for the next steps).
  const casa = JSON.parse(await ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(), MP = window.AtlasMapPainter; let best = null;
    for (let y = r.top + 20; y < r.bottom - 20; y += 6) for (let x = r.left + 20; x < r.right - 20; x += 6) { const m = MP && MP.markAt && MP.markAt((x - r.left) * s.width / r.width, (y - r.top) * s.height / r.height); if (m && !m.fog && document.elementFromPoint(x, y) === s) { const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2); if (!best || d < best.d) best = { x, y, id: m.id, d }; } }
    return JSON.stringify(best); })()`)); // one of the node's own buildings (the grey ones are NPCs')
  ok(casa, 'no village building of the node is visible on the map');
  if (casa) {
    await dedo(casa.x, casa.y, 1, 0, 2); await espera(800);
    const abierta = JSON.parse(await ev("JSON.stringify({ open: !document.getElementById('building-sheet').hidden, h: (document.getElementById('bs-h') || {}).textContent || '', say: ((document.getElementById('preceptor-talk') || {}).textContent || '').slice(0, 70), sel: document.getElementById('surface').dataset.sel || '' })"));
    medidas.edificio = [casa.id, abierta.h];
    ok(abierta.open && abierta.h !== 'Node', 'a tap on a building did not open its card: ' + JSON.stringify(abierta));
    await ev("(() => { const s = document.getElementById('building-sheet'); const c = [...s.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Close'); c && c.click(); return 1; })()"); await espera(400);
  }
  // 3c · fog of war: a tap on an NPC's building still in the fog opens no card; the crab's bubble says an NPC holds it.
  const npc = JSON.parse(await ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(), MP = window.AtlasMapPainter, F = window.AtlasMapFog;
    for (let y = r.top + 20; y < r.bottom - 20; y += 6) for (let x = r.left + 20; x < r.right - 20; x += 6) { const m = MP && MP.markAt && MP.markAt((x - r.left) * s.width / r.width, (y - r.top) * s.height / r.height); if (m && m.fog && F && F.hidden(m) && document.elementFromPoint(x, y) === s) return JSON.stringify({ x, y, id: m.id }); }
    return 'null'; })()`));
  if (npc) {
    await espera(400);
    await dedo(npc.x, npc.y, 1, 0, 2); await espera(800);
    const n = JSON.parse(await ev("JSON.stringify({ open: !document.getElementById('building-sheet').hidden, say: (document.getElementById('preceptor-talk') || {}).textContent || '' })"));
    medidas.niebla = [npc.id, n.open, n.say.slice(0, 80)];
    ok(!n.open && /NPC holds this/.test(n.say), 'a tap on an NPC building in the fog opened its card or said nothing: ' + JSON.stringify(n));
  } else { medidas.niebla = 'NO_DATA: no NPC building in the fog on screen'; }

  // 4 · two fingers still pinch the zoom.
  const z0 = (await vista()).zoom;
  await cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: centro.x - 30, y: centro.y, id: 1 }, { x: centro.x + 30, y: centro.y, id: 2 }] });
  for (let i = 1; i <= 6; i++) { await cmd('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: centro.x - 30 - 10 * i, y: centro.y, id: 1 }, { x: centro.x + 30 + 10 * i, y: centro.y, id: 2 }] }); await espera(16); }
  await cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await espera(400);
  const z1 = (await vista()).zoom;
  medidas.pinza = [z0, z1];
  ok(Number(z1) > Number(z0), 'two fingers no longer zoom: ' + z0 + ' → ' + z1);

  // 5 · keyboard: D moves the view east (the picture slides left); the view is spoken.
  await ev("document.activeElement && document.activeElement.blur(), true");
  const k0 = await vista();
  for (const t of ['keyDown', 'keyUp']) { await cmd('Input.dispatchKeyEvent', { type: t, key: 'd', code: 'KeyD', text: t === 'keyDown' ? 'd' : undefined, windowsVirtualKeyCode: 68 }); }
  await espera(300);
  const k1 = await vista();
  ok(k1.panx < k0.panx && k1.look === '1', 'the D key did not move the view east: ' + JSON.stringify([k0.panx, k1.panx, k1.look]));

  // 6 · the pan is bounded: a huge drag stops at the edge.
  await dedo(centro.x, centro.y, 60, 60, 40); await espera(900);
  const e = await vista();
  const lim = JSON.parse(await ev("(() => { const c = document.getElementById('surface'), z = Number(c.dataset.zoom) || 1; return JSON.stringify({ x: Math.round(c.width * z * 0.75), y: Math.round(c.height * z * 0.75) }); })()"));
  medidas.limite = { pan: [e.panx, e.pany], lim };
  ok(Math.abs(e.panx) <= lim.x && Math.abs(e.pany) <= lim.y, 'the pan left its bound: ' + JSON.stringify(medidas.limite));

  // 7 · ⌂ brings the view home and hands the camera back.
  await ev("AtlasMapView.reset(), true"); await espera(300);
  // With free walk on, home is the crab: follow() places the view, so the law is «the camera is handed back».
  const h = await vista();
  medidas.casa = [h.panx, h.pany];
  ok(h.look === '' && (h.panx !== e.panx || h.pany !== e.pany), 'home did not hand the view back to the crab: ' + JSON.stringify(h));

  // The view joystick is separate from the visitor and works with real touch, mouse and keyboard input.
  const stickBox = await ev(`(() => { const s=document.querySelector('#view-joystick .view-stick'); if(!s)return null; const r=s.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}; })()`);
  ok(stickBox && stickBox.w >= 44 && stickBox.h >= 44, 'map view joystick missing or smaller than 44 px');
  if (stickBox) {
    const beforeTouch = await vista();
    await dedo(stickBox.x, stickBox.y, 5, 0, 6); await espera(150);
    const afterTouch = await vista();
    ok(afterTouch.angle !== beforeTouch.angle && afterTouch.walker === beforeTouch.walker, 'touch joystick must turn the map on itself (two fingers, decree 2026-11-08) without walking visitor');
    await ev("document.querySelector('#view-joystick .view-stick').focus(), true");
    const beforeKey = await vista();
    for (const type of ['keyDown', 'keyUp']) await cmd('Input.dispatchKeyEvent', {type, key:'ArrowRight', code:'ArrowRight', windowsVirtualKeyCode:39});
    await espera(150);
    const afterKey = await vista();
    ok(afterKey.angle !== beforeKey.angle && afterKey.walker === beforeKey.walker, 'focused joystick arrows must turn the map without walking visitor');
    for (const type of ['keyDown', 'keyUp']) await cmd('Input.dispatchKeyEvent', {type, key:'ArrowUp', code:'ArrowUp', windowsVirtualKeyCode:38});
    await espera(150);
    ok((await vista()).tilt !== afterKey.tilt, 'focused joystick up arrow must tilt the map into its 2.5D perspective');
    // Decree 2026-11-07, fulfilled 2026-11-08: the right side belongs to the character; it is born, so its stick lives.
    const right = await ev("(() => { const n = document.getElementById('character-joystick-slot'); return {turn:!!document.getElementById('view-joystick-turn'), sticks:document.querySelectorAll('#map .view-joy').length /* gamepad (2026-11-07) */, slot:n ? n.dataset.state + ':' + n.dataset.cause : null, walk:!!document.querySelector('#character-joystick .view-stick')}; })()");
    ok(!right.turn && right.sticks === 2 && right.slot === null && right.walk, 'two sticks: the camera on the left and the character on the right: ' + JSON.stringify(right));
    await ev("AtlasMapView.reset(), true"); await espera(250);
    const beforeView = await vista();
    await ev("AtlasMapView.turn(1), AtlasMapView.zoom(1), true"); await espera(300);
    const afterView = await vista();
    const angle = await ev("Number(document.getElementById('surface').dataset.angle)");
    medidas.viewJoystick = {touchPan:afterTouch.panx-beforeTouch.panx,keyPan:afterKey.panx-beforeKey.panx,zoomBefore:beforeView.zoom,zoomAfter:afterView.zoom,angle,rightStick:right.turn};
    ok(angle !== 0 && Number(afterView.zoom) > Number(beforeView.zoom) && afterView.walker === beforeView.walker, 'turn and zoom must still work without a joystick: ' + JSON.stringify(medidas.viewJoystick));
  }

  console.log(JSON.stringify({ piece: 'la-mano', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'la-mano', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
