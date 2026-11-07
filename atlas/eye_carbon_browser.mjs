// Ojo de carbono (inventario PR #547, 2026-11-01): the defects the inventory measured, held shut in a real browser.
// 1 /creation.html loads with zero exceptions. 2 «Check live nodes» makes zero 404s and says a sentence: the static
// server answers /api/world-state through the real worker (worker/world_state.js) with no publisher binding, i.e. the
// honest 503 NO_DATA the deployed site gives when its publisher is missing. 3 every visible a/button/select/input/tab
// on / and /openworld/ is >= 44x44 at 390 px (exempt: .skip links, off-screen until focused; .sr, visually hidden).
// 4 the Army voice of the panel shows troops or NO_DATA and the /game/army.html link; the radio tabs switch panels.
// Uso: node atlas/eye_carbon_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { worldState } from '../worker/world_state.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer(async (req, res) => {
    const ruta0 = new URL(req.url, 'http://local').pathname;
    if (ruta0 === '/api/world-state') {
      const r = await worldState(new Request('http://local' + req.url, { method: req.method }), {});
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' }); res.end(await r.text()); return;
    }
    try {
      let ruta = decodeURIComponent(ruta0); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [], excepciones = [], no404 = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
const PEQUENOS = `JSON.stringify([...document.querySelectorAll('a[href],button,select,input,[role="tab"]')].filter((e) => {
  if (e.matches('.skip,.sr') || e.closest('.sr,[hidden]')) { return false; }
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && (r.width < 43.5 || r.height < 43.5);
}).map((e) => { const r = e.getBoundingClientRect(); return (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' «' + (e.textContent || e.value || '').trim().slice(0, 30) + '» ' + Math.round(r.width) + 'x' + Math.round(r.height); }))`;

async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9500 + (process.pid % 90);
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
    if (d.method === 'Network.responseReceived' && d.params.response.status === 404) { no404.push(d.params.response.url.replace(origen, '')); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; excepciones.push(String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  // 1 · /creation.html: zero exceptions on load.
  await cmd('Page.navigate', { url: origen + '/creation.html' }); await espera(1500);
  ok(excepciones.length === 0, '/creation.html threw on load: ' + excepciones.join(' | '));
  excepciones.length = 0;

  // 3 · touch targets on the landing.
  await cmd('Page.navigate', { url: origen + '/' }); await espera(1200);
  const enLanding = JSON.parse(await ev(PEQUENOS));
  ok(enLanding.length === 0, '/ has targets under 44x44: ' + enLanding.join(' | '));

  // /openworld/: touch targets, then the one-map-one-panel order, then «Check live nodes».
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  const enMapa = JSON.parse(await ev(PEQUENOS));
  ok(enMapa.length === 0, '/openworld/ has targets under 44x44: ' + enMapa.join(' | '));
  // One full-map showcase; content leaves and communication stay closed until requested.
  const orden = JSON.parse(await ev(`JSON.stringify((() => { const t = (s) => document.querySelector(s).getBoundingClientRect(), m=t('#map'), s=t('#surface'), c=t('#chat'), p=document.querySelector('#gamepad #view-joystick') /* gamepad (2026-11-07) */, pr=p?.getBoundingClientRect(), b=t('#map .cats'); return { mapa:m.top, mapaFin:m.bottom, lienzoFin:s.bottom, chat:c.top, pad:!!p, padTop:pr?.top||0,padBottom:pr?.bottom||0,padRight:pr?.right||0,mapRight:m.right,barraTop:b.top,barraBottom:b.bottom,barCount:document.querySelectorAll('#map .cats button').length,padGone:!document.querySelector('.walk-pad'),directions:document.querySelectorAll('[data-direction]').length,profileHidden:document.querySelector('.cats [data-cat=Profile]').hidden,hojas:document.querySelectorAll('.sheet,#map [role=tablist]').length,ancho:document.documentElement.scrollWidth }; })())`));
  ok(orden.mapa === 0 && orden.mapaFin >= 844 && orden.chat === 0 && orden.pad && orden.padTop >= orden.mapa && orden.padBottom <= orden.mapaFin && orden.padRight <= orden.mapRight && orden.barraTop >= orden.lienzoFin && orden.barraBottom <= orden.mapaFin && orden.barCount === 3 && orden.padGone && orden.directions === 0 && orden.profileHidden && orden.hojas <= 1 && orden.ancho <= 390, 'the phone page is not a single full-map showcase with retired walk controls: ' + JSON.stringify(orden));

  // 4 · Army (TF-2: in the Play category, opened first): its voice in the panel shows, honest content, the link to the full army page.
  const army = JSON.parse(await ev(`(async () => { const p=document.querySelector('.cats [data-cat=Profile]'); document.querySelector('#visitor-start').click();
    for(let i=0;i<30 && !document.querySelector('#visitor-end');i++) await new Promise(r=>setTimeout(r,100)); p.click();
    const s = document.getElementById('army-visit').closest('li'), r = s.getBoundingClientRect(); return JSON.stringify({ visible: r.height > 0, texto: s.innerText, enlace: !!s.querySelector('a[href="/game/army.html"]'), quien: s.dataset.speaker }); })()`));
  ok(army.visible && army.quien === 'Army', 'the Army voice is not in the panel: ' + JSON.stringify(army));
  ok(/^Army\s+NO_DATA: no troops adopted in this visit yet|^Army\s+Troops of this visit/.test(army.texto) && army.enlace, 'the Army voice does not say its troops or NO_DATA with the army link: ' + army.texto);
  // the radio tabs: Echoes hides the Radio list, Radio shows it again.
  const radio = JSON.parse(await ev(`(async () => { const p = () => new Promise((r) => setTimeout(r, 120)); document.querySelector('.cats [data-cat=Communication]').click(); const c = document.getElementById('radio-chat'); if (!c) { return JSON.stringify({ falta: true }); }
    if (c.querySelector('.radio-chat-alterna').getAttribute('aria-expanded') !== 'true') c.querySelector('.radio-chat-alterna').click(); await p(); const tabs = [...c.querySelectorAll('[role=tab]')], l = document.getElementById('radio-chat-lista');
    const de = (n) => tabs.find((b) => b.textContent.trim() === n); de('Echoes').click(); await p(); const a = l.hidden; de('Radio').click(); await p();
    const radioVisible = !l.hidden, radioSelected = de('Radio').getAttribute('aria-selected');
    de('Chat').click(); await p(); const log = document.getElementById('log'), entry = document.getElementById('entry');
    return JSON.stringify({ canales: tabs.map((b) => b.textContent.trim()), echoesOcultaRadio: a, radioMuestra: radioVisible, elegida: radioSelected, chatVisible: !log.hidden && !entry.hidden }); })()`));
  ok(!radio.falta && radio.canales.join('/') === 'Radio/Echoes/Chat' && radio.echoesOcultaRadio && radio.radioMuestra && radio.elegida === 'true' && radio.chatVisible, 'Radio, Echoes, and Chat are not available in the Communication player: ' + JSON.stringify(radio));

  // 2 · «Check live nodes»: zero 404s after the click, and a sentence in #state.
  await ev("document.querySelector('.cats [data-cat=Welcome]').click()");
  no404.length = 0;
  const frase = await ev(`(async () => { const b = document.getElementById('world-refresh'); const antes = document.getElementById('state').textContent; b.click(); for (let i = 0; i < 40 && document.getElementById('state').textContent === antes; i++) { await new Promise((r) => setTimeout(r, 100)); } return document.getElementById('state').textContent; })()`);
  ok(no404.length === 0, '«Check live nodes» requested a missing endpoint: ' + no404.join(' '));
  ok(/Live nodes (NO_DATA: \S|online)/.test(frase || '') && /world_publisher_unavailable$/.test(frase || ''), '«Check live nodes» did not announce a sentence with its cause: ' + frase);
  ok(excepciones.length === 0, '/ or /openworld/ threw: ' + excepciones.join(' | '));
  ok(externas.length === 0, 'external requests: ' + externas.join(' '));
  console.log(JSON.stringify({ piece: 'ojo-carbono', receipt: fallos.length ? 'ROJO' : 'VERDE', landing_small: enLanding.length, openworld_small: enMapa.length, refresh: frase && frase.split(' · ').pop(), fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'ojo-carbono', receipt: 'ROJO', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
