// LA VOZ DEL RACK (ODD decree 2026-10-28), proved in a real browser on /openworld/ at the edge phone's size (360×716 CSS).
// Laws:
// - the map is the first visible element and the chat window the second (both inside the first screen, map above);
// - zero external requests on load: nothing leaves the origin until the visitor asks;
// - before entry the panel names its guide («Guide»); inside a building it names that building; leaving restores «Guide»;
// - the Rack ideas button is a 44 px target; one click → ONE request, to the study index, and the ideas arrive one by one;
// - a failing rack (HTTP 404) is said as NO_DATA with its cause; nothing is invented;
// - the Jewels button brings the system's jewels (odd/JOYAS.md on main) one by one, the same way;
// - a question with no script goes to the live door (Hexelion, /api/v1/chat) with the building in its context; a closed
//   door is said in plain words with its cause. Hexelion is answered by a page-side stub: CI never calls production.
// The study index is served by the harness through CDP Fetch (fixture atlas/fixtures/ai-index-sample.json): the proof never
// depends on the network.
// Sabotage: SABOTAJE=en-carga asks on page load; SABOTAJE=sin-titulo prevents the building speaker name.
// Uso: node atlas/rack_ideas_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const W = 360, H = 716, STUDY = 'https://raw.githubusercontent.com/';
const MUESTRA = readFileSync(join(RAIZ, 'atlas/fixtures/ai-index-sample.json'));
const JOYAS = readFileSync(join(RAIZ, 'odd/JOYAS.md'));
const ONE = readFileSync(new URL('./fixtures/one_live_node.json', import.meta.url));   // one live node: the first node alive is the tutorial's place (the tutorial cabin is retired)
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = ruta === '/openworld/state.json' ? ONE : readFileSync(f);
      if (ruta === '/openworld/index.html' && SAB === 'en-carga') { cuerpo = Buffer.from(String(cuerpo).replace('</body>', "<script>fetch('" + STUDY + "piskyRpapalo/study/main/ai-index.json').catch(function(){})</script></body>")); }
      if (ruta === '/game/building_chat.js' && SAB === 'sin-titulo') { cuerpo = Buffer.from(String(cuerpo).replace('h.textContent = titleOf(b);', '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, modo = 200;
const pend = new Map(), pedidas = [];

async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + ((process.pid + 37) % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (!u.startsWith(origen) && !u.startsWith('data:') && !u.startsWith('blob:')) { pedidas.push(u); } }
    if (d.method === 'Fetch.requestPaused') {
      const p = d.params, cab = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'text/plain; charset=utf-8' }];
      const cuerpo = /JOYAS\.md$/.test(p.request.url) ? JOYAS : MUESTRA;
      if (modo === 200) { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: cab, body: cuerpo.toString('base64') }); }
      else { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 404, responseHeaders: cab, body: Buffer.from('404: Not Found').toString('base64') }); }
    }
  });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Fetch.enable', { patterns: [{ urlPattern: STUDY + '*', requestStage: 'Request' }] });
  await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);

  // 1 · load: no request leaves the origin; communication opens only when requested.
  medidas.externas_en_carga = pedidas.length;
  ok(pedidas.length === 0, 'external requests on load: ' + pedidas.slice(0, 3));
  const orden = JSON.parse(await ev(`JSON.stringify((() => { const m = document.getElementById('map').getBoundingClientRect(), c = document.getElementById('chat').getBoundingClientRect();
    const vis = [...document.querySelectorAll('main > section')].filter((s) => { const r = s.getBoundingClientRect(); return r.height > 0 && getComputedStyle(s).display !== 'none'; }).map((s) => s.id);
    return { mapa: Math.round(m.top), chat: Math.round(c.top), alto: innerHeight, vis: vis.slice(0, 2), titulo: document.getElementById('chat-h').textContent }; })())`));
  medidas.orden = orden;
  ok(orden.vis[0] === 'map' && orden.vis.length === 1 && orden.mapa === 0, 'the showcase is not the only visible surface before interaction: ' + JSON.stringify(orden));
  ok(orden.titulo === 'Guide', 'the initial panel does not identify its guide speaker: ' + orden.titulo);

  // 2 · enter the first node: the title names it; the Rack ideas button is a 44 px target.
  const dentro = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), st = () => document.getElementById('state').textContent;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); for (let i = 0; i < 30 && !/Inside building/.test(st()); i++) await w(100);
    const b = document.getElementById('rack-ideas'), r = b && b.getBoundingClientRect();
    return JSON.stringify({ titulo: document.getElementById('chat-h').textContent, boton: b ? { w: Math.round(r.width), h: Math.round(r.height), hidden: b.hidden } : null }); })()`));
  medidas.dentro = dentro;
  ok(dentro.titulo === 'Hexagonal building · b-home', 'the panel title does not name its current speaker: ' + dentro.titulo);
  ok(dentro.boton && !dentro.boton.hidden && dentro.boton.h >= 44 && dentro.boton.w >= 44, 'no 44 px Rack ideas button inside: ' + JSON.stringify(dentro.boton));
  ok(pedidas.length === 0, 'entering a building asked the network: ' + pedidas.slice(0, 3));

  // 3 · one click: one request to the study index; the ideas arrive one by one (never all at once).
  const ideas = () => ev(`[...document.querySelectorAll('#log li')].filter((li) => li.dataset.voice === 'rack' && /^Rack · study · Idea /.test(li.textContent)).length`);
  await ev("document.getElementById('rack-ideas').click(), true"); await espera(450);
  const pronto = await ideas(); await espera(2000);
  const luego = await ideas();
  const lineas = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('#log li')].map((li) => li.textContent).filter((t) => /^Rack · study · /.test(t)))`));
  medidas.ideas = { pronto, luego, peticiones: pedidas.length, primera: lineas[1] || null };
  ok(pedidas.length === 1 && /\/study\/main\/ai-index\.json$/.test(pedidas[0] || ''), 'one click did not make exactly one request to the study index: ' + pedidas);
  ok(pronto >= 1 && pronto < 3 && luego === 3, 'the ideas did not arrive one by one: ' + JSON.stringify(medidas.ideas));
  ok(/^Rack · study · 3 ideas, live from study .*asked from Hexagonal building\.$/.test(lineas[0] || ''), 'no header naming the count and the building: ' + lineas[0]);
  ok(lineas.every((t) => Buffer.byteLength(t) < 1024), 'a rack line is over 1 KiB');
  await foto('rack-ideas.png');

  // 4 · the rack fails (404): the chat says NO_DATA with its cause.
  modo = 404;
  const falla = await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); document.getElementById('question').value = 'ideas';
    document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); await w(800); return (document.querySelector('#log li:last-child') || {}).textContent; })()`);
  medidas.falla = falla;
  ok(/^Rack · study · NO_DATA · http_404: /.test(falla || ''), 'a failing rack is not said as NO_DATA with its cause: ' + falla);

  // 4b · the jewels: one click, one request to JOYAS.md on main, said one by one.
  modo = 200; const antes = pedidas.length;
  const joyas = () => ev(`[...document.querySelectorAll('#log li')].filter((li) => li.dataset.voice === 'jewels' && /^Rack · jewels · Jewel /.test(li.textContent)).length`);
  await ev("document.getElementById('rack-jewels').click(), true"); await espera(450);
  const jPronto = await joyas(); await espera(4000);
  const jLuego = await joyas(), total = (String(JOYAS).match(/^### J\d+ · /gm) || []).length;
  medidas.joyas = { pronto: jPronto, luego: jLuego, total, peticion: pedidas.slice(antes) };
  ok(pedidas.length === antes + 1 && /\/preceptoros-web\/main\/odd\/JOYAS\.md$/.test(pedidas[antes] || ''), 'the Jewels click did not make one request to JOYAS.md: ' + pedidas.slice(antes));
  ok(jPronto >= 1 && jPronto < total && jLuego === total, 'the jewels did not arrive one by one: ' + JSON.stringify(medidas.joyas));

  // 4c · a question with no script goes to Hexelion with the building in its context (page-side stub of the edge).
  // The stub now carries the D7 decision receipt (PROPOSED · FIRMA:NO): the aula shows the answer AND its receipt
  // beside it; the receipt is only trusted when the sha chain holds. Forged here in CI (node) with the same canonical
  // bytes as the page's, because the aula script only loads when the visitor asks. CI never calls production.
  const canon = (v) => { if (v === null || typeof v === 'boolean' || typeof v === 'string') { return JSON.stringify(v).replace(/[\u007f-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')); } if (Array.isArray(v)) { return '[' + v.map(canon).join(',') + ']'; } if (!v || typeof v !== 'object') { throw new Error('unsupported receipt value'); } return '{' + Object.keys(v).sort().map((k) => canon(k) + ':' + canon(v[k])).join(',') + '}'; },
    sha256 = async (t) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join(''); },
    veredicto = { state: 'PROPOSED', FUENTE: 'The study index of the rack.', ACCIÓN: 'Advise the visitor; never sign.', EVIDENCIA: 'Measured by la-voz-del-rack in CI.', COSTE: 'One local turn; no external call.', FIRMA: 'NO' },
    payload_sha256 = await sha256(canon(veredicto)), recibido = '2026-11-04T01:00:00.000Z',
    recibo_sha256 = await sha256(canon({ recibido: recibido, payload_sha256: payload_sha256 })),
    RECIBO = JSON.stringify({ veredicto: veredicto, trailer: { recibido: recibido, payload_sha256: payload_sha256, recibo_sha256: recibo_sha256 } });
  const hex = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), real = window.fetch, vistos = [];
    let respuesta = { status: 200, body: { v: 'preceptoros.chat/1', estado: 'OK', burbuja: { texto: 'The first node is where every visit starts.', recortada: false }, sello: { tic: 1, mac: 'x' }, recibo: ${RECIBO} } };
    window.fetch = (u, o) => { if (String(u).startsWith('https://api.preceptoros.org/')) { vistos.push(JSON.parse(o.body)); return Promise.resolve(new Response(JSON.stringify(respuesta.body), { status: respuesta.status })); } return real(u, o); };
    const last = () => [...document.querySelectorAll('#log li')].filter((li) => !/receipt/.test(li.className || '')).pop(),
      ask = async (t) => { document.getElementById('question').value = t; document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); await w(900); return (last() || {}).textContent; };
    const bien = await ask('tell me a story of the sea');
    const reciboLi = (document.querySelector('#log li.turn.receipt') || {}).textContent || '';
    respuesta = { status: 503, body: { v: 'preceptoros.chat/1', estado: 'NO_DATA', causa: 'aula_rechaza' } };
    const cerrada = await ask('are you there');
    window.fetch = real;
    return JSON.stringify({ bien, reciboLi, cerrada, pagina: vistos[0] && vistos[0].contexto.pagina, tics: vistos.map((v) => v.tic) }); })()`));
  medidas.hexelion = hex;
  ok(hex.bien === 'Hexelion · The first node is where every visit starts.', 'Hexelion\'s live answer is not shown: ' + hex.bien);
  ok(/Hexelion · Decision proposed\. Hexelion advises; it never signs\./.test(hex.reciboLi || '') && /Payload SHA-256: [0-9a-f]{64}/.test(hex.reciboLi || ''), 'the decision receipt is not shown beside the answer: ' + hex.reciboLi);
  ok(hex.pagina === '/openworld/#b-home', 'the door does not know the building: ' + hex.pagina);
  ok(/^Hexelion · NO_DATA · Hexelion is not taking visitors right now\. \(aula_rechaza\)$/.test(hex.cerrada || ''), 'a closed door is not said with its cause: ' + hex.cerrada);
  ok(JSON.stringify(hex.tics) === '[1,2]', 'the turns do not chain: ' + JSON.stringify(hex.tics));

  // 4d · «voices»: the building lists who can speak here, one by one, from the pinned table (the contributors included);
  // and every line of the conversation names who speaks.
  const voces = JSON.parse(await ev(`(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); document.getElementById('question').value = 'voices';
    document.getElementById('entry').dispatchEvent(new Event('submit', { cancelable: true })); await w(4500);
    const all = [...document.querySelectorAll('#log li')], v = all.map((li) => li.textContent).filter((t) => /^Hexagonal building · Voice \\d+\\/9 · /.test(t));
    return JSON.stringify({ n: v.length, claude: v.some((t) => /Contributor · Claude — contributor model, GitHub/.test(t)), chunk: v.some((t) => /Guide · SmolLM2 135M — chunk model/.test(t)),
      sinTitulo: all.filter((li) => !li.dataset.speaker).map((li) => li.textContent.slice(0, 40)) }); })()`));
  medidas.voces = voces;
  ok(voces.n === 9 && voces.claude && voces.chunk, 'the voices are not listed one by one from the table: ' + JSON.stringify(voces));
  ok(voces.sinTitulo.length === 0, 'a conversation line has no speaker: ' + voces.sinTitulo.join(' | '));

  // 5 · Escape leaves: the title comes back, the button hides.
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await espera(300);
  const fuera = JSON.parse(await ev(`JSON.stringify({ titulo: document.getElementById('chat-h').textContent, hidden: document.getElementById('rack-ideas').hidden && document.getElementById('rack-jewels').hidden })`));
  medidas.fuera = fuera;
  ok(fuera.titulo === 'Guide' && fuera.hidden === true, 'leaving does not restore the guide speaker title: ' + JSON.stringify(fuera));

  console.log(JSON.stringify({ piece: 'la-voz-del-rack', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'la-voz-del-rack', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
