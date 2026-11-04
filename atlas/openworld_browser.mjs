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
// P5a: with HITL_ON the state file is the test fixture (the tutorial cabin waits for a signature).
const HITL = readFileSync(new URL('./fixtures/hitl_estado.json', import.meta.url));
let HITL_ON = false;
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = HITL_ON && ruta === '/openworld/estado.json' ? HITL : readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
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
  await cmd('Network.setBlockedURLs', { urls: ['https://api.preceptoros.org/*'] }); // the live door is never called from CI
  // Phone width first: the map is the top half, the chat the bottom half, nothing scrolls sideways.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  const medida = JSON.parse(await ev(`(() => {
    const c = document.getElementById('surface'); let tinta = 0;
    try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { tinta++; } } } catch (e) { tinta = -1; }
    return JSON.stringify({
      titulo: (document.querySelector('h1') || {}).textContent,
      sceneComposer: typeof window.AtlasMapScene === 'object' && window.AtlasMapScene.compose([{ id: 'front', x: 0, y: 2, frame: {} }, { id: 'back', x: 0, y: 1, frame: {} }]).map((x) => x.id).join(','),
      botones: [...document.querySelectorAll('#terrain-actions button')].map((b) => b.textContent),
      tinta,
      estado: (document.getElementById('state') || {}).textContent,
      tecnico: (document.getElementById('state-tech') || {}).textContent,
      chatAbierto: !!document.querySelector('#chat'),
      entradaOff: !!(document.getElementById('question') || {}).disabled,
      botonChat: [...document.querySelectorAll('button:not([role=tab])')].some((b) => /^\\s*Chat\\s*$/.test(b.textContent)),
      joystick: (() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(); return { buttons: j.querySelectorAll('button').length, top: r.top, bottom: r.bottom, visible: r.width > 0 && r.height > 0 && r.top >= 0, touch: getComputedStyle(j.querySelector('button')).minHeight }; })(),
      ancho: document.documentElement.scrollWidth, vista: innerWidth, alto: innerHeight,
      texto: document.body.innerText
    }); })()`));
  ok(medida.titulo === 'preceptoros.org', 'the page did not load: ' + medida.titulo);
  const layout = JSON.parse(await ev(`JSON.stringify((() => { const welcome = document.getElementById('welcome-lore').getBoundingClientRect(); const actions = document.getElementById('joy').getBoundingClientRect(), log = document.getElementById('log').getBoundingClientRect(), form = document.getElementById('entry').getBoundingClientRect(); const bar = document.querySelector('.topbar'); return { welcome: welcome.top, actions: actions.top, log: log.top, form: form.top, headerCount: bar.children.length, header: bar.textContent.trim() }; })())`));
  ok(layout.headerCount === 1 && layout.header === 'preceptoros.org' && layout.welcome < layout.actions && layout.actions < layout.log && layout.log < layout.form, 'welcome, joystick, log, and form are out of order: ' + JSON.stringify(layout));
  ok(layout.actions < medida.alto, 'the joystick is below the initial phone viewport: ' + JSON.stringify(layout));

  // MV-1 panel mask: a fixed live map window stays visible while one terminal scrolls below it on phones;
  // desktop keeps the map left and the terminal right. Widths are the commissioned matrix.
  const mask = [];
  for (const [width, height, mobile] of [[360, 716, true], [412, 844, true], [900, 900, false], [1200, 900, false]]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }); await espera(120);
    mask.push(JSON.parse(await ev(`(() => { window.scrollTo(0,0); window.scrollTo(0,100); const rootScroll = scrollY; window.scrollTo(0,0); const m = document.getElementById('map').getBoundingClientRect(), c = document.getElementById('chat').getBoundingClientRect(), s = document.getElementById('surface').getBoundingClientRect();
      const joy = document.getElementById('joy').getBoundingClientRect();
      return JSON.stringify({ width: innerWidth, height: innerHeight, map: [m.left,m.top,m.right,m.bottom], chat: [c.left,c.top,c.right,c.bottom], joy: [joy.top,joy.bottom], surface: [s.width,s.height], rootScroll, bodyOverflow: getComputedStyle(document.body).overflowY, overflow: getComputedStyle(document.getElementById('chat')).overflowY }); })()`)));
  }
  ok(mask.length === 4 && mask.slice(0, 2).every((m) => m.map[1] === 0 && Math.abs(m.map[3] - m.height * 0.52) < 2 && m.chat[1] >= m.map[3] - 1 && Math.abs(m.chat[3] - m.height) < 1 && m.overflow === 'auto' && m.bodyOverflow === 'hidden' && m.rootScroll === 0 && m.surface[1] > m.height * 0.4 && m.surface[1] < m.height * 0.5 && m.joy[0] < m.height), 'phone panel mask is misplaced: ' + JSON.stringify(mask.slice(0, 2)));
  ok(mask.slice(2).every((m) => m.map[1] === 0 && m.chat[1] === 0 && m.map[2] <= m.chat[0] + 1 && Math.abs(m.map[3] - m.height) < 1 && Math.abs(m.chat[3] - m.height) < 1 && m.bodyOverflow === 'hidden' && m.rootScroll === 0 && m.surface[1] > 0), 'desktop panel mask is not one full-height map-left / terminal-right view: ' + JSON.stringify(mask.slice(2)));
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await espera(120);

  ok(medida.sceneComposer === 'back,front', 'the single map did not load its depth composer: ' + medida.sceneComposer);
  // NORTE 8 · mandato 3 (rebanada 2): el sonido nativo. La cabaña no declara ondas con armónicos, así que su
  // sonido dice NO_DATA con su causa en la región en vivo. Un clic no crea audio sin una voz que sonar.
  // a demanda: el módulo de sonido no existe en la página hasta el primer clic.
  ok((await ev("typeof window.AtlasSonifyAcho")) === 'undefined', 'the sound module loaded on page load: it must load on the first click');
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
  // Latido visible (2026-11-03): this static server has no /api/world-state, so the head says the heartbeat is pending or NO_DATA, never «0».
  ok(/^Colony: 1 nodes · 1 buildings · 1 bots with faces$/.test(medida.tecnico || '') && /^Nodes online: (NO_DATA\.|checking…) Your cabin is awake · 3 more still asleep\./.test(medida.estado || ''), 'the default state is not the declared one (cabin only, LIVE): ' + medida.estado + ' | ' + medida.tecnico);
  ok(medida.chatAbierto && !medida.entradaOff, 'the chat panel is missing or its input is off');
  // TF-2: four category buttons (44 px), one category visible; Explore shows the Map voice; the brain and the form stay.
  const cats = JSON.parse(await ev(`(() => { const vis = () => [...document.querySelectorAll('#voices [data-speaker]')].filter((li) => li.getBoundingClientRect().height > 0).map((li) => li.dataset.speaker);
    const bs = [...document.querySelectorAll('.cats button')], antes = vis(); bs.find((b) => b.dataset.cat === 'Explore').click(); const explore = vis(); bs[0].click();
    return JSON.stringify({ cats: bs.map((b) => b.dataset.cat), alto: Math.min(...bs.map((b) => b.getBoundingClientRect().height)), antes, explore, form: document.getElementById('entry').getBoundingClientRect().height > 0 }); })()`));
  ok(cats.cats.join() === 'Start,Explore,Play,About' && cats.alto >= 44 && cats.antes.join() === 'Welcome,Tutorial,Guide'.split(',').filter((v) => cats.antes.includes(v)).join() && !cats.antes.includes('Map') && cats.explore.includes('Map') && !cats.explore.includes('Guide') && cats.form,
    'the category panel is not one visible category with 44 px buttons: ' + JSON.stringify(cats));
  // Character control: six native buttons stay in the terminal, outside the map canvas, with 44 px targets and named directions.
  const stick = JSON.parse(await ev(`(() => { const pad = document.querySelector('#joy .walk-pad'), bs = [...document.querySelectorAll('#joy .walk-pad button')];
    return JSON.stringify({ label: pad && pad.getAttribute('aria-label'), directions: bs.map((b) => b.dataset.direction), names: bs.map((b) => b.getAttribute('aria-label')), sizes: bs.map((b) => [b.getBoundingClientRect().width,b.getBoundingClientRect().height]), inTerminal: !!pad && document.getElementById('chat').contains(pad), outsideMap: !!pad && !document.getElementById('map').contains(pad) }); })()`));
  ok(stick.label === 'Map joystick' && stick.directions.join('|') === 'north-west|north-east|west|east|south-west|south-east' && stick.names.every(Boolean) && stick.sizes.every((r) => r[0] >= 44 && r[1] >= 44) && stick.inTerminal && stick.outsideMap, 'the six-direction joystick is missing, unnamed, too small, or covering the map: ' + JSON.stringify(stick));
  // W-5: the six-direction controls replace the retired map overlay and remain in the scrollable terminal.
  ok(medida.joystick.buttons === 7 && medida.joystick.top >= 0 && medida.joystick.visible, 'the terminal movement controls are missing from the scrollable phone panel: ' + JSON.stringify(medida.joystick));
  ok(parseFloat(medida.joystick.touch) >= 44, 'tutorial voice controls are below the touch target: ' + medida.joystick.touch);
  // W-5: a click on the cabin hex walks there (already there: it enters); an arrow key with no neighbour says NO_DATA.
  const entered = await ev(CLIC_CABINA);
  ok(/^terminal: basic/.test(entered || ''), 'the ephemeral cabin cannot be entered by clicking it on the map: ' + entered);
  // Free walk on by default; the W-4 node law stays reachable by turning it off (the #free-walk checkbox).
  const blocked = await ev("(() => { const f = document.getElementById('free-walk'); f.checked = false; f.dispatchEvent(new Event('change')); document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); const said = document.querySelector('#joy [aria-live]').textContent; f.checked = true; f.dispatchEvent(new Event('change')); return said; })()");
  ok(/^NO_DATA: no colony node/.test(blocked || ''), 'an absent neighbour was not honestly refused: ' + blocked);
  ok(!medida.botonChat, 'there is a Chat button; the chat must always be present, with no button');
  ok(medida.ancho <= medida.vista, 'the page scrolls sideways at phone width: ' + medida.ancho + ' > ' + medida.vista);
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the page');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'openworld-390.png'), Buffer.from(g.result.data, 'base64')); }
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1200);
  const escritorio = JSON.parse(await ev(`(() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(), b = j.querySelector('button'); return JSON.stringify({ buttons: j.querySelectorAll('button').length, top: r.top, bottom: r.bottom, visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, touch: getComputedStyle(b).minHeight, width: document.documentElement.scrollWidth, viewport: innerWidth }); })()`));
  ok(escritorio.buttons === 7 && escritorio.top >= 0, 'the terminal movement controls are missing on desktop: ' + JSON.stringify(escritorio));
  ok(parseFloat(escritorio.touch) >= 44, 'desktop tutorial voice controls are below the touch target: ' + escritorio.touch);
  ok(escritorio.width <= escritorio.viewport, 'the page scrolls sideways at desktop width: ' + escritorio.width + ' > ' + escritorio.viewport);
  // P6: Enter by keyboard goes into the tutorial cabin; its greeting lands in the radio; the input asks its bot; Escape leaves.
  const cabina = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), st = () => document.getElementById('state').textContent;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); for (let i = 0; i < 30 && !/Inside building/.test(st()); i++) await w(100); // the entry passes through the hexagonal tunnel (#561): wait for it, up to 3 s
    const radio = () => [...document.querySelectorAll('#radio-chat-lista li')].map((li) => li.textContent).join(' | ');
    const greeting = document.getElementById('log').textContent.includes('Welcome to the tutorial cabin'), radioClean = !radio().includes('Welcome to the tutorial cabin'), inside = st(), leave = document.getElementById('leave-building');
    const tall = !!leave && !leave.hidden && leave.getBoundingClientRect().height >= 44;
    const ask = async (t) => { document.getElementById('question').value = t; document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); await w(500); return (document.querySelector('#log li:last-child') || {}).textContent; };
    const help = await ask('help'), poem = await ask('write me a poem');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(100);
    return JSON.stringify({ greeting, radioClean, inside, tall, help, poem, left: st(), hidden: leave && leave.hidden }); })()`));
  ok(cabina.greeting && cabina.radioClean && /^Inside building b-cabin/.test(cabina.inside) && cabina.tall, 'Enter does not open the cabin chat in the radio: ' + JSON.stringify(cabina));
  ok(/^Tutorial cabin · Ask me/.test(cabina.help || '') && /^Hexelion · NO_DATA · .*\(red\)$/.test(cabina.poem || ''), 'the cabin bot does not answer honestly: ' + JSON.stringify(cabina));
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
  ok(zoom.k === '1.25' && /zoom 1\.25×/.test(zoom.ks), 'the + key does not zoom or is not spoken: ' + JSON.stringify(zoom));
  ok(zoom.o === '0.80' && zoom.r === '1.00', 'zoom out / reset do not move the factor: ' + JSON.stringify(zoom));
  // G1 (2026-11-03, web#608): the Explore button joins the map tools, so seven 44 px buttons.
  ok(zoom.sizes.length === 7 && zoom.sizes.every((h) => h >= 44), 'zoom buttons below the touch target: ' + zoom.sizes);
  // Orbit: E turns the view 60° (spoken in the plate's line), a tap on the cabin at 120° still enters it, Reset view returns to 0°.
  const orbita = JSON.parse(await ev(`(async () => { const s = document.getElementById('surface'), say = () => (document.getElementById('zoom-state') || {}).textContent || '', w = (ms) => new Promise((r) => setTimeout(r, ms));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })); await w(400); const a1 = s.dataset.angle, l1 = say();
    document.getElementById('rotate-right').click(); await w(400); const a2 = s.dataset.angle;
    const d = await (await fetch('/openworld/estado.json', { cache: 'no-store' })).json(), est = AtlasOpenworldState.leer(d);
    const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, 'cabin'), r = s.getBoundingClientRect();
    s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + a.x * r.width / s.width, clientY: r.top + a.y * r.height / s.height })); await w(300);
    const joy = document.querySelector('#joy [aria-live]').textContent;
    document.getElementById('view-reset').click(); await w(100);
    return JSON.stringify({ a1, l1, a2, joy, r: s.dataset.angle, z: s.dataset.zoom, rl: say(), labels: ['rotate-left', 'rotate-right', 'view-reset'].map((id) => { const b = document.getElementById(id); return b ? (b.getAttribute('aria-label') || b.textContent) : undefined; }) }); })()`));
  ok(orbita.a1 === '60' && /^Map view 60° · zoom 1\.00×$/.test(orbita.l1), 'E does not turn the map 60° or the line does not say it: ' + JSON.stringify(orbita));
  ok(orbita.a2 === '120' && /^terminal: basic/.test(orbita.joy || ''), 'a tap on the cabin at 120° does not enter it: ' + JSON.stringify(orbita));
  ok(orbita.r === '0' && orbita.z === '1.00' && /^Map view 0°/.test(orbita.rl), 'Reset view does not return to 0°: ' + JSON.stringify(orbita));
  ok(orbita.labels.join('|') === 'Rotate left|Rotate right|Reset view', 'the orbit buttons are missing: ' + orbita.labels);
  // P5a: the HITL «?» is a real button over the cabin: 44 px, reached by Tab, Enter opens it and #state says it.
  HITL_ON = true;
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  const tecla = async (key, code, vk, text) => {
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text });
    await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  };
  let alcanzado = false;
  for (let i = 0; i < 40 && !alcanzado; i++) {
    await tecla('Tab', 'Tab', 9);
    alcanzado = await ev("!!(document.activeElement && document.activeElement.classList.contains('hitl-mark'))");
  }
  const marca = JSON.parse(await ev(`(() => { const b = document.querySelector('.hitl-mark'); if (!b) { return '{}'; } const r = b.getBoundingClientRect(); return JSON.stringify({ tag: b.tagName, label: b.getAttribute('aria-label'), w: r.width, h: r.height, walkers: (document.getElementById('walkers-state') || {}).textContent || '' }); })()`));
  if (alcanzado) { await tecla('Enter', 'Enter', 13, '\r'); await espera(300); }
  const tras = JSON.parse(await ev("JSON.stringify({ state: document.getElementById('state').textContent, joy: document.querySelector('#joy [aria-live]').textContent })"));
  ok(marca.tag === 'BUTTON' && marca.label === 'Needs you: P5a tutorial signature', 'the HITL mark is not a labelled button: ' + JSON.stringify(marca));
  ok(marca.w >= 44 && marca.h >= 44, 'the HITL button is below 44 px: ' + JSON.stringify(marca));
  ok(alcanzado, 'Tab never reaches the HITL button');
  ok(/terminal: basic/.test(tras.joy), 'Enter on the HITL button does not open the cabin: ' + tras.joy);
  ok(/Needs you: P5a tutorial signature · opening cabin/.test(tras.state), 'the HITL opening is not announced in #state: ' + tras.state);
  ok(/walker of cabin: needs you · at cabin/.test(marca.walkers), 'the walker log does not say needs-you: ' + marca.walkers);
  HITL_ON = false;
  console.log(JSON.stringify({ hitl: { marca, alcanzado, tras }, medida: { ...medida, texto: undefined }, escritorio, externas: externas.length, fallos }));
  // P4: the 2.5D floor of the 7 baked chunks is under the colony, and its text equivalent is spoken in #floor-state.
  const suelo = JSON.parse(await ev(`(async () => { for (let i = 0; i < 50 && !/^Map loaded/.test(document.getElementById('floor-state').textContent); i++) await new Promise((r) => setTimeout(r, 100));
    const W = window.AtlasMapPainter && AtlasMapPainter.world(), c = document.getElementById('surface'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, set = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) set.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4);
    return JSON.stringify({ said: document.getElementById('floor-state').textContent, tech: document.getElementById('floor-tech').textContent, cells: W ? W.cells.list.length : 0, tones: set.size }); })()`));
  ok(suelo.said === 'Map loaded.' && /^Map chunks: 7 of 7 around area 0_0\. Cabin chunk: \d+ water, \d+ sand, \d+ moss, \d+ rock cells/.test(suelo.tech) && suelo.cells === 1519 && suelo.tones >= 12, 'the 2.5D floor is not painted: ' + JSON.stringify(suelo));
  // 3.5D: the floor baked into bitmaps per chunk. 120 floor draws timed live vs baked (performance.now lives HERE, in
  // the harness, never in the painter), and Long Animation Frames counted over 120 full redraws per mode.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  await ev("(async () => { for (let i = 0; i < 50 && !/^Map loaded/.test(document.getElementById('floor-state').textContent); i++) await new Promise((r) => setTimeout(r, 100)); })()");
  // Phone-class CPU (4× slower), as the Doogee is: the numbers below are emulated, not measured on the S110.
  await cmd('Emulation.setCPUThrottlingRate', { rate: 4 });
  const banco = JSON.parse(await ev(`(async () => {
    const P = AtlasMapPainter, CPg = AtlasColoniaPagina, v = AtlasOpenworldView(), c = document.getElementById('surface'), g = c.getContext('2d');
    if (!v.colony) { return JSON.stringify({ error: 'no colony' }); }
    const G0 = CPg.geometry(CPg.scene(v.colony, 0, false, v.looks, v.seals), c), Z = Number(c.dataset.zoom) || 1;
    let G = G0;
    const floorMs = (mode) => { P.setLive(mode === 'live'); P.setBake(mode === 'baked'); P.resetCache(); const ms = []; for (let i = 0; i < 120; i++) { const a = performance.now(); P.draw(g, G, i, false); ms.push(performance.now() - a); } ms.sort((x, y) => x - y); return { mean: +(ms.reduce((x, y) => x + y, 0) / ms.length).toFixed(3), median: +ms[60].toFixed(3), p95: +ms[113].toFixed(3), bakes: P.cacheStats().bakes, mode: P.cacheStats().mode }; };
    const loaf = (mode) => new Promise((done) => { P.setLive(mode === 'live'); P.setBake(mode === 'baked'); P.resetCache(); let n = 0, o = null;
      try { o = new PerformanceObserver((l) => { n += l.getEntries().length; }); o.observe({ type: 'long-animation-frame' }); } catch (e) { n = -1; }
      let i = 0; const step = () => { v.redraw(); if (++i < 120) { requestAnimationFrame(step); } else { setTimeout(() => { o && o.disconnect(); done(n); }, 200); } }; requestAnimationFrame(step); });
    const zooms = {}; for (const z of [0.6, 1, 3]) { G = { cx: G0.cx, cy: G0.cy, k: G0.k / Z * z }; zooms[z] = { live: floorMs('live'), baked: floorMs('baked'), auto: floorMs('auto') }; }
    G = G0;
    const live = floorMs('live'), baked = floorMs('baked'), auto = floorMs('auto'), loafLive = await loaf('live'), loafBaked = await loaf('baked'), loafAuto = await loaf('auto');
    P.setLive(false); P.setBake(false); P.resetCache(); v.redraw();
    const d = g.getImageData(0, 0, c.width, c.height).data, tones = new Set(); for (let i = 0; i < d.length; i += 4 * 97) tones.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4);
    return JSON.stringify({ zooms, live, baked, auto, loafAuto, loafLive, loafBaked, stats: P.cacheStats(), tones: tones.size, offscreen: typeof OffscreenCanvas === 'function' }); })()`));
  await cmd('Emulation.setCPUThrottlingRate', { rate: 1 });
  // Orbit × 3.5D: the baked floor at 120° matches the live floor at 120° (the cache key carries the angle). First a bake at
  // 0°, then 120°: a key without the angle would blit the 0° bitmaps turned nowhere. Pixels differing by > 48 in a channel.
  const giro = JSON.parse(await ev(`(() => {
    const P = AtlasMapPainter, CPg = AtlasColoniaPagina, v = AtlasOpenworldView(), s = document.getElementById('surface');
    const pinta = (ang, mode) => { const c = document.createElement('canvas'); c.width = s.width; c.height = s.height; c.dataset.angle = String(ang);
      const g = c.getContext('2d'), G = CPg.geometry(CPg.scene(v.colony, 0, true, v.looks, v.seals), c); P.setLive(mode === 'live'); P.setBake(mode === 'baked');
      g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); P.draw(g, G, 0, true); return g.getImageData(0, 0, c.width, c.height).data; };
    P.resetCache(); pinta(0, 'baked'); const baked = pinta(120, 'baked'), scope = P.cacheStats().scope, live = pinta(120, 'live'), cero = pinta(0, 'live');
    P.setLive(false); P.setBake(false); P.resetCache(); v.redraw();
    const diff = (a, b) => { let n = 0, lit = 0; for (let i = 0; i < a.length; i += 4) { const on = a[i] + a[i + 1] + a[i + 2] > 0 || b[i] + b[i + 1] + b[i + 2] > 0; if (!on) continue; lit++;
      if (Math.abs(a[i] - b[i]) > 48 || Math.abs(a[i + 1] - b[i + 1]) > 48 || Math.abs(a[i + 2] - b[i + 2]) > 48) n++; } return +(n / (lit || 1)).toFixed(4); };
    return JSON.stringify({ scope, baked_vs_live: diff(baked, live), live120_vs_live0: diff(live, cero) }); })()`));
  console.log('ORBITA35D ' + JSON.stringify(giro));
  ok(giro.baked_vs_live < 0.05 && giro.live120_vs_live0 > 0.2, 'the baked floor at 120° does not match the live floor at 120°: ' + JSON.stringify(giro));
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  console.log('MOTOR35D ' + JSON.stringify(banco));
  // Zoomed out (many prisms) the bitmaps must win; the policy (auto) must never be slower than live by more than noise.
  ok(banco.zooms && banco.zooms['0.6'].baked.median < banco.zooms['0.6'].live.median, 'the baked floor is not faster zoomed out: ' + JSON.stringify(banco.zooms));
  ok(Object.values(banco.zooms || {}).every((z) => z.auto.median <= z.live.median * 1.25 + 0.3), 'the bake policy loses to live: ' + JSON.stringify(banco.zooms));
  ok(banco.tones >= 12, 'the floor is not painted after the bench: ' + JSON.stringify(banco));
  ok(typeof banco.loafAuto === 'number' && banco.loafAuto >= 0 && typeof banco.loafLive === 'number', 'LoAF not reported: ' + JSON.stringify(banco));
  const tapBaked = await ev(CLIC_CABINA);
  ok(/^terminal: basic|^Inside|cabin/.test(tapBaked || ''), 'a tap on the cabin does not enter with the baked floor: ' + tapBaked);
  if (CAPTURA) { const g2 = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'openworld-floor.png'), Buffer.from(g2.result.data, 'base64')); }
  // Compact terminal (the Sovereign p0, buzon#30, 2026-11-02): ONE map, ONE panel. No tab sheet, no stick pad, no loose
  // text under the map; every voice of the panel has a header naming its speaker (< 1,024 UTF-8 bytes) and its line starts
  // with it; every log line carries its speaker; the visit's actions are 44 px buttons inside the panel; desktop: map left.
  const panel = JSON.parse(await ev(`(() => { const map = document.getElementById('map'), chat = document.getElementById('chat');
    const vivas = [...map.querySelectorAll('[aria-live],[role=status],p.state,[role=tablist],.sheet,[role=application]')].map((e) => e.id || e.className || e.tagName);
    const voces = [...document.querySelectorAll('#voices > li')].map((li) => { const h = li.querySelector(':scope > .who'), t = h ? h.textContent : '';
      return { who: t, bytes: new TextEncoder().encode(t).length, starts: !!t && li.textContent.trim().startsWith(t), label: li.getAttribute('aria-label') }; });
    const log = [...document.querySelectorAll('#log li')].map((li) => li.dataset.speaker || '');
    const dentro = ['state', 'floor-state', 'listen-state', 'next-step', 'zoom-state', 'walkers-state', 'joy', 'visitor-play', 'army-visit', 'frases'].filter((id) => { const e = document.getElementById(id); return !e || !chat.contains(e); });
    const acts = ['play-now', 'visitor-start', 'listen', 'world-refresh'].map((id) => { const e = document.getElementById(id), li = e && e.closest('[data-cat]'); if (li) { document.querySelector('.cats [data-cat=' + li.dataset.cat + ']').click(); } return e && chat.contains(e) ? e.getBoundingClientRect().height : 0; }); document.querySelector('.cats [data-cat=Start]').click(); // TF-2: each action measured in its own category
    const m = document.getElementById('surface').getBoundingClientRect(), c = chat.getBoundingClientRect();
    return JSON.stringify({ vivas, voces, log, dentro, acts, izquierda: m.right <= c.left + 1, logVivo: document.getElementById('log').getAttribute('aria-live') }); })()`));
  ok(panel.vivas.length === 0 && panel.dentro.length === 0 && panel.voces.length >= 8 && panel.voces.every((v) => v.who && v.bytes < 1024 && v.starts && v.label)
    && panel.log.length >= 1 && panel.log.every(Boolean) && panel.logVivo === 'polite' && panel.acts.every((h) => h >= 44) && panel.izquierda,
    'the compact terminal is fragmented or a voice has no speaker: ' + JSON.stringify(panel));
  if (CAPTURA) { const g3 = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'openworld-desktop.png'), Buffer.from(g3.result.data, 'base64')); }
  // Free walk: from the HITL cabin (-1,0) ArrowRight seven times walks the crab east over the floor to 6,0; the seventh is water and is refused.
  // With a visit started, each accepted step is one game step (the eggs hatch by walking).
  const libre = JSON.parse(await ev(`(async () => { const say = () => document.querySelector('#joy [aria-live]').textContent, key = (k) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    const visitStep = () => { const p = document.querySelector('#visitor-play div:nth-of-type(2) p'), m = p && p.textContent.match(/Step (\\d+)/); return m ? Number(m[1]) : -1; };
    document.getElementById('visitor-start').click(); for (let i = 0; i < 40 && !document.getElementById('visitor-step'); i++) await new Promise((r) => setTimeout(r, 100));
    const stickBefore = visitStep(); document.querySelector('#joy .walk-pad [data-direction="east"]').click(); const stickAfter = visitStep(), stickSaid = say();
    const said = []; for (let i = 0; i < 6; i++) { key('ArrowRight'); said.push(say()); }
    key('ArrowRight'); const water = say(); const blockedBefore = visitStep(); document.querySelector('#joy .walk-pad [data-direction="east"]').click(); const stickBlocked = say(), blockedAfter = visitStep();
    // Tap-to-step (the pad retired): a tap west of the crab, off any node, steps it one cell west.
    const s = document.getElementById('surface'), r = s.getBoundingClientRect(), x = Number(s.dataset.youx) - 80, y = Number(s.dataset.youy);
    s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + x * r.width / s.width, clientY: r.top + y * r.height / s.height }));
    const tap = say();
    // Orbit: at 120° a tap toward the cell drawn west of the crab still steps it west (the tap is turned back to the ground).
    document.getElementById('rotate-right').click(); await new Promise((r) => setTimeout(r, 400)); document.getElementById('rotate-right').click(); await new Promise((r) => setTimeout(r, 400));
    const G = AtlasColoniaPagina.geometry({ tiles: [{ x: 1 }] }, s), wv = G.turn(-48, -12), wl = Math.hypot(wv.x, wv.y) || 1;
    const x2 = Number(s.dataset.youx) + 80 * wv.x / wl, y2 = Number(s.dataset.youy) + 80 * wv.y / wl;
    s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + x2 * r.width / s.width, clientY: r.top + y2 * r.height / s.height }));
    const tap120 = say(), angle120 = s.dataset.angle; document.getElementById('view-reset').click();
    const visitText = document.getElementById('visitor-play').textContent; document.getElementById('visitor-end').click();
    const crab = [...document.querySelectorAll('#frases li')].map((li) => li.textContent).filter((t) => /^you · /.test(t))[0] || '';
    const visit = visitText.match(/Step (\\d+)/);
    return JSON.stringify({ said, water, tap, tap120, angle120, crab, step: visit ? +visit[1] : -1, stickBefore, stickAfter, stickSaid, stickBlocked, blockedBefore, blockedAfter }); })()`));
  ok(libre.stickBefore === 0 && libre.stickAfter === 1 && /You walk east to 0,0/.test(libre.stickSaid), 'the joystick does not advance the active ephemeral visit by one accepted map step: ' + JSON.stringify(libre));
  ok(/^NO_DATA: water blocks/.test(libre.stickBlocked || '') && libre.blockedAfter === libre.blockedBefore, 'a blocked joystick move changed visit progress or hid its cause: ' + JSON.stringify(libre));
  ok(libre.said[5] === 'You walk east to 6,0 · moss · step 7', 'the crab does not walk the floor cell by cell: ' + JSON.stringify(libre.said));
  ok(libre.water === 'NO_DATA: water blocks the way east', 'a step into water is not refused: ' + libre.water);
  ok(/on cell 4,0/.test(libre.crab), 'the crab is not drawn on its floor cell after the tap: ' + libre.crab);
  ok(libre.angle120 === '120' && /^You walk west to 4,0/.test(libre.tap120 || ''), 'a tap at 120° does not step the crab toward the drawn cell: ' + JSON.stringify(libre));
  ok(/^You walk west to 5,0/.test(libre.tap || ''), 'a tap on the map does not step the crab without the pad: ' + libre.tap);
  ok(libre.step === 9, 'walking does not advance the visit: ' + libre.step);
  if (CAPTURA) { await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await espera(400); const g4 = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'openworld-free-walk.png'), Buffer.from(g4.result.data, 'base64')); await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); }
  // Plug&play (2026-11-01): at 390 px the page reads map → tabs → ONE next step → chat; the rare controls are folded.
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  const plug = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), y = (id) => document.getElementById(id).getBoundingClientRect().top;
    const t0 = document.getElementById('next-text').textContent, p = document.getElementById('play-now'), tall = p.getBoundingClientRect().height;
    const s = document.getElementById('surface').getBoundingClientRect(), share = s.height / innerHeight;
    const geo = [y('surface'), y('chat'), y('next-step'), Math.round(s.width), innerWidth], order = geo[0] < geo[1] && geo[1] <= geo[2] && share >= 0.4 && share <= 0.5 && s.width >= innerWidth - 1 && !document.querySelector('#map [role=tablist], .sheet');
    const look = document.querySelector('select[aria-label="Terminal look"]'), folded = !!look && !!look.closest('#more') && !document.querySelector('#joy select');
    const first = (document.getElementById('log') || {}).textContent || '';
    p.click(); for (let i = 0; i < 50 && !document.getElementById('visitor-beacon'); i++) await w(100);
    const t1 = document.getElementById('next-text').textContent, gone = p.hidden;
    document.getElementById('visitor-beacon').click(); for (let i = 0; i < 50 && !/Summon/.test(document.getElementById('next-text').textContent); i++) await w(100);
    const pad = !!document.querySelector('#joy [role=application], [aria-label*="drag inside the circle"]'), tap = await ${CLIC_CABINA};
    return JSON.stringify({ t0, tall, order, geo, share, folded, first, pad, tap, t1, gone, t2: document.getElementById('next-text').textContent, live: document.getElementById('next-step').getAttribute('aria-live') }); })()`));
  ok(plug.t0 === 'Press Play now.' && plug.tall >= 44 && plug.live === 'polite', 'the next step does not say Play now on a 44 px button: ' + JSON.stringify(plug));
  ok(plug.order, 'the phone order is not one map (40-50 %, edge to edge) then one panel: ' + JSON.stringify(plug));
  ok(!plug.pad && /^terminal: basic/.test(plug.tap || ''), 'a phone user cannot walk without the stick pad (tap a node on the map): ' + JSON.stringify(plug));
  ok(plug.folded, 'the terminal look is not folded under More: ' + JSON.stringify(plug));
  ok(/Start here: press Play now/.test(plug.first), 'the conversation does not tell a newcomer what to do: ' + plug.first);
  ok(plug.gone && plug.t1 === 'Ask the guide in the chat.' && plug.t2 === 'Summon a wave: press Summon at the Reef below.', 'the next step does not follow the visit state: ' + JSON.stringify(plug));
  if (CAPTURA) { await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500); const g4 = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'openworld-first-screen.png'), Buffer.from(g4.result.data, 'base64')); }
  console.log(JSON.stringify({ medida: { ...medida, texto: undefined }, telefono: mask.slice(0, 2).map((m) => ({ ancho: m.width, alto: m.height, joystickY: m.joy[0] })), escritorio, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push('harness: ' + e.message); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
