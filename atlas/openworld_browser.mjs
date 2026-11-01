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
// W-5: a click on the cabin hex on the map (the page's own state, the page's own geometry), then the status line.
const CLIC_CABINA = "(async () => { const d = await (await fetch('/openworld/estado.json', { cache: 'no-store' })).json(); const est = AtlasOpenworldState.leer(d); const s = document.getElementById('surface'); const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, 'cabin'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + a.x * r.width / s.width, clientY: r.top + a.y * r.height / s.height })); await new Promise((x) => setTimeout(x, 300)); return document.querySelector('#joy [aria-live]').textContent; })()";
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
      sceneComposer: typeof window.AtlasMapScene === 'object' && window.AtlasMapScene.compose([{ id: 'front', x: 0, y: 2, frame: {} }, { id: 'back', x: 0, y: 1, frame: {} }]).map((x) => x.id).join(','),
      botones: [...document.querySelectorAll('#map .press button')].map((b) => b.textContent),
      tinta,
      estado: (document.getElementById('state') || {}).textContent,
      chatAbierto: !!document.querySelector('#chat'),
      entradaOff: !!(document.getElementById('question') || {}).disabled,
      botonChat: [...document.querySelectorAll('button')].some((b) => /^\\s*Chat\\s*$/.test(b.textContent)),
      joystick: (() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(); return { buttons: j.querySelectorAll('button').length, top: r.top, bottom: r.bottom, visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, touch: getComputedStyle(j.querySelector('button')).minHeight }; })(),
      ancho: document.documentElement.scrollWidth, vista: innerWidth,
      texto: document.body.innerText
    }); })()`));
  ok(medida.titulo === 'OpenWorld', 'the page did not load: ' + medida.titulo);
  ok(medida.sceneComposer === 'back,front', 'the single map did not load its depth composer: ' + medida.sceneComposer);
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
  ok(/^NO_DATA · /.test(respuesta || ''), 'the chat answer is not an honest NO_DATA: ' + respuesta);
  ok(JSON.stringify(medida.botones) === JSON.stringify(['Tutorial cabin']), 'the terrain list is not the cabin alone: ' + JSON.stringify(medida.botones));
  ok(medida.tinta > 2000, 'the map is blank: ' + medida.tinta);
  // Estado de 2026-10-30 (MVP moderno): la cabaña es el unico nodo LIVE; Beelink y Doggee son NO_DATA y no se dibujan.
  ok(/^Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #[0-9a-f]{6}$/.test(medida.estado || ''), 'the default state is not the declared one (cabin only, LIVE): ' + medida.estado);
  ok(medida.chatAbierto && !medida.entradaOff, 'the chat panel is missing or its input is off');
  // W-5: the grid is gone; the status panel (with Skip tutorial) must still be on screen at phone width.
  ok(medida.joystick.buttons === 1 && medida.joystick.visible, 'the status panel is missing or below the phone viewport: ' + JSON.stringify(medida.joystick));
  ok(parseFloat(medida.joystick.touch) >= 44, 'joystick controls are below the touch target: ' + medida.joystick.touch);
  // W-5: a click on the cabin hex walks there (already there: it enters); an arrow key with no neighbour says NO_DATA.
  const entered = await ev(CLIC_CABINA);
  ok(/^terminal: basic/.test(entered || ''), 'the ephemeral cabin cannot be entered by clicking it on the map: ' + entered);
  const blocked = await ev("(() => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return document.querySelector('#joy [aria-live]').textContent; })()");
  ok(/^NO_DATA: no colony node/.test(blocked || ''), 'an absent neighbour was not honestly refused: ' + blocked);
  ok(!medida.botonChat, 'there is a Chat button; the chat must always be present, with no button');
  ok(medida.ancho <= medida.vista, 'the page scrolls sideways at phone width: ' + medida.ancho + ' > ' + medida.vista);
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the page');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'openworld-390.png'), Buffer.from(g.result.data, 'base64')); }
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1200);
  const escritorio = JSON.parse(await ev(`(() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(), b = j.querySelector('button'); return JSON.stringify({ buttons: j.querySelectorAll('button').length, top: r.top, bottom: r.bottom, visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, touch: getComputedStyle(b).minHeight, width: document.documentElement.scrollWidth, viewport: innerWidth }); })()`));
  ok(escritorio.buttons === 1 && escritorio.visible, 'the status panel is missing or below the desktop viewport: ' + JSON.stringify(escritorio));
  ok(parseFloat(escritorio.touch) >= 44, 'desktop joystick controls are below the touch target: ' + escritorio.touch);
  ok(escritorio.width <= escritorio.viewport, 'the page scrolls sideways at desktop width: ' + escritorio.width + ' > ' + escritorio.viewport);
  // P6: Enter by keyboard goes into the tutorial cabin; its greeting lands in the radio; the input asks its bot; Escape leaves.
  const cabina = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), st = () => document.getElementById('state').textContent;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(600);
    const radio = () => [...document.querySelectorAll('#radio-chat-lista li')].map((li) => li.textContent).join(' | ');
    const greeting = radio().includes('Welcome to the tutorial cabin'), inside = st(), leave = document.getElementById('leave-building');
    const tall = !!leave && !leave.hidden && leave.getBoundingClientRect().height >= 44;
    const ask = async (t) => { document.getElementById('question').value = t; document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); await w(500); return (document.querySelector('#log li:last-child') || {}).textContent; };
    const help = await ask('help'), poem = await ask('write me a poem');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(100);
    return JSON.stringify({ greeting, inside, tall, help, poem, left: st(), hidden: leave && leave.hidden }); })()`));
  ok(cabina.greeting && /^Inside building b-cabin/.test(cabina.inside) && cabina.tall, 'Enter does not open the cabin chat in the radio: ' + JSON.stringify(cabina));
  ok(/^Tutorial cabin · Ask me/.test(cabina.help || '') && cabina.poem === 'NO_DATA · model_not_installed', 'the cabin bot does not answer honestly: ' + JSON.stringify(cabina));
  ok(cabina.left === 'Left building b-cabin' && cabina.hidden === true, 'Escape does not leave the building: ' + JSON.stringify(cabina));
  const desktopEntry = await ev(CLIC_CABINA);
  ok(/^terminal: basic/.test(desktopEntry || ''), 'the ephemeral cabin cannot be entered on desktop: ' + desktopEntry);
  // H9: the radio chat lives in the chat section and hears what the whole map says aloud (layer 1, PREGUNTAS P-radio).
  const radio = JSON.parse(await ev(`(async () => { const box = document.getElementById('radio-chat'), chat = document.getElementById('chat');
    const st = document.getElementById('state'); st.textContent = 'Nodes online: 7 · radio probe'; await new Promise((r) => setTimeout(r, 300));
    const heard = [...document.querySelectorAll('#radio-chat-lista li')].some((li) => li.textContent.includes('radio probe'));
    const before = box.classList.contains('plegado'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', altKey: true, bubbles: true }));
    const toggled = box.classList.contains('plegado') !== before;
    const tap = [...box.querySelectorAll('button')].filter((b) => b.offsetParent).every((b) => b.getBoundingClientRect().height >= 44);
    return JSON.stringify({ exists: !!box, inChat: !!box && chat.contains(box), heard, toggled, tap, mainKids: document.querySelector('main').children.length }); })()`));
  ok(radio.exists && radio.inChat, 'the radio chat is missing or outside the chat section: ' + JSON.stringify(radio));
  ok(radio.heard, 'the radio does not hear what the map says aloud: ' + JSON.stringify(radio));
  ok(radio.toggled && radio.tap, 'Alt+R or the 44 px targets fail: ' + JSON.stringify(radio));
  ok(radio.mainKids === 2, 'the radio broke the two-row map/chat grid: ' + radio.mainKids);
  // A11Y: zoom without fingers — the + key, the buttons, the spoken level and the reset.
  const zoom = JSON.parse(await ev(`(() => { const s = document.getElementById('surface'), say = () => (document.getElementById('zoom-state') || {}).textContent || '';
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true })); const k = s.dataset.zoom, ks = say();
    document.getElementById('zoom-out').click(); document.getElementById('zoom-out').click(); const o = s.dataset.zoom;
    document.getElementById('zoom-reset').click(); const r = s.dataset.zoom;
    const sizes = Array.from(document.querySelectorAll('#zoom-controls button')).map((b) => b.getBoundingClientRect().height);
    return JSON.stringify({ k, ks, o, r, sizes }); })()`));
  ok(zoom.k === '1.25' && /Map zoom 1\.25×/.test(zoom.ks), 'the + key does not zoom or is not spoken: ' + JSON.stringify(zoom));
  ok(zoom.o === '0.80' && zoom.r === '1.00', 'zoom out / reset do not move the factor: ' + JSON.stringify(zoom));
  ok(zoom.sizes.length === 3 && zoom.sizes.every((h) => h >= 44), 'zoom buttons below the touch target: ' + zoom.sizes);
  // P4: the 2.5D floor of the 7 baked chunks is under the colony, and its text equivalent is spoken in #floor-state.
  const suelo = JSON.parse(await ev(`(async () => { for (let i = 0; i < 50 && !/^Map chunks/.test(document.getElementById('floor-state').textContent); i++) await new Promise((r) => setTimeout(r, 100));
    const W = window.AtlasMapPainter && AtlasMapPainter.world(), c = document.getElementById('surface'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, set = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) set.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4);
    return JSON.stringify({ said: document.getElementById('floor-state').textContent, cells: W ? W.cells.list.length : 0, tones: set.size }); })()`));
  ok(/^Map chunks: 7 of 7 around area 0_0\. Cabin chunk: \d+ water, \d+ sand, \d+ moss, \d+ rock cells/.test(suelo.said) && suelo.cells === 1519 && suelo.tones >= 12, 'the 2.5D floor is not painted: ' + JSON.stringify(suelo));
  if (CAPTURA) { const g2 = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'openworld-floor.png'), Buffer.from(g2.result.data, 'base64')); }
  console.log(JSON.stringify({ medida: { ...medida, texto: undefined }, escritorio, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push('harness: ' + e.message); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
