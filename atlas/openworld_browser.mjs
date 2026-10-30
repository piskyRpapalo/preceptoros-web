// NORTE 7 · PR 2 in a real browser: /openworld/ draws the tutorial cabin, joystick and device-local AI chat.
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
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const original = window.fetch.bind(window); window.__localAiCalls = [];
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input.url;
      if (url === 'http://127.0.0.1:8740/api/orquestador') {
        window.__localAiCalls.push({ url, init });
        return Promise.resolve(new Response(JSON.stringify({ esquema:'preceptoros.orquestador/1', intent:'QUERY_STATE', estado:'MEASURED', causa:null, origen:'memory.fts5', respuesta:'Local measured reply', fuentes:1 }), { status:200, headers:{'Content-Type':'application/json'} }));
      }
      return original(input, init);
    };
  })();` });
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
  ok(await ev('window.__localAiCalls.length') === 0, 'the local device was contacted on page load');
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
  // The local AI is called only after an explicit submit; the browser stub measures the bounded loopback request.
  await ev("(() => { const q = document.getElementById('question'); q.value = 'hola'; document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); })()");
  await espera(900);
  const respuesta = await ev("(document.querySelector('#log li:last-child') || {}).textContent || ''");
  const localChat = await ev("JSON.stringify({calls:window.__localAiCalls.length,url:window.__localAiCalls[0]&&window.__localAiCalls[0].url,body:window.__localAiCalls[0]&&window.__localAiCalls[0].init.body,credentials:window.__localAiCalls[0]&&window.__localAiCalls[0].init.credentials})");
  const chatCall = JSON.parse(localChat || '{}');
  ok(respuesta === 'Local measured reply', 'the local AI answer is missing: ' + respuesta);
  ok(chatCall.calls === 1 && chatCall.url === 'http://127.0.0.1:8740/api/orquestador' && JSON.parse(chatCall.body).payload.consulta === 'hola', 'chat did not call this device app exactly once: ' + JSON.stringify(chatCall));
  ok((await ev('window.__localAiCalls[0].init.credentials')) === 'omit', 'local app call includes credentials');
  medida.chat = { local_requests: chatCall.calls, endpoint: '/api/orquestador on this device', answer: respuesta };
  ok(JSON.stringify(medida.botones) === JSON.stringify(['Tutorial cabin']), 'the terrain list is not the one live cabin: ' + JSON.stringify(medida.botones));
  ok(medida.tinta > 2000, 'the map is blank: ' + medida.tinta);
  // The cabin is the only LIVE node; four anonymous device slots remain NO_DATA and are not drawn.
  ok(/^Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #[0-9a-f]{6}$/.test(medida.estado || ''), 'the default state is not the declared one (cabin only, LIVE): ' + medida.estado);
  ok(medida.chatAbierto && !medida.entradaOff, 'the chat panel is missing or its input is off');
  ok(medida.joystick.buttons === 8 && medida.joystick.visible, 'the joystick is missing or below the phone viewport: ' + JSON.stringify(medida.joystick));
  ok(parseFloat(medida.joystick.touch) >= 44, 'joystick controls are below the touch target: ' + medida.joystick.touch);
  const entered = await ev("(() => { const b = [...document.querySelectorAll('#joy button')].find((x) => x.textContent === 'enter node'); b.click(); return document.querySelector('#joy [aria-live]').textContent; })()");
  ok(/^terminal: basic/.test(entered || ''), 'the ephemeral cabin cannot be entered through the joystick: ' + entered);
  const blocked = await ev("(() => { const b = [...document.querySelectorAll('#joy button')].find((x) => x.textContent === 'east'); b.click(); return document.querySelector('#joy [aria-live]').textContent; })()");
  ok(/^NO_DATA: no colony node/.test(blocked || ''), 'an absent neighbour was not honestly refused: ' + blocked);
  ok(!medida.botonChat, 'there is a Chat button; the chat must always be present, with no button');
  ok(medida.ancho <= medida.vista, 'the page scrolls sideways at phone width: ' + medida.ancho + ' > ' + medida.vista);
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the page');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'openworld-390.png'), Buffer.from(g.result.data, 'base64')); }
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1200);
  const escritorio = JSON.parse(await ev(`(() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(), b = j.querySelector('button'); return JSON.stringify({ buttons: j.querySelectorAll('button').length, top: r.top, bottom: r.bottom, visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, touch: getComputedStyle(b).minHeight, width: document.documentElement.scrollWidth, viewport: innerWidth }); })()`));
  ok(escritorio.buttons === 8 && escritorio.visible, 'the joystick is missing or below the desktop viewport: ' + JSON.stringify(escritorio));
  ok(parseFloat(escritorio.touch) >= 44, 'desktop joystick controls are below the touch target: ' + escritorio.touch);
  ok(escritorio.width <= escritorio.viewport, 'the page scrolls sideways at desktop width: ' + escritorio.width + ' > ' + escritorio.viewport);
  await ev("[...document.querySelectorAll('#joy button')].find((b) => b.textContent === 'enter node').click()");
  const desktopEntry = await ev("document.querySelector('#joy [aria-live]').textContent");
  ok(/^terminal: basic/.test(desktopEntry || ''), 'the ephemeral cabin cannot be entered on desktop: ' + desktopEntry);
  console.log(JSON.stringify({ medida: { ...medida, texto: undefined }, escritorio, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push('harness: ' + e.message); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
