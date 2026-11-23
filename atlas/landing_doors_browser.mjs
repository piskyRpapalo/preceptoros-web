// The landing in a real browser (2026-11-09: only its top remains; the doors of P3 [1d] are retired), with
// the same three links, the same footer, the titles still readable by screen readers, no exception
// and no external request. Uso: node atlas/landing_doors_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      if (ruta === '/api/world-state') {
        const fixture = { esquema: 'preceptoros.openworld-estado/2', cobertura: { estado: 'MEDIDO' },
          colonia: { nodes: [
            { id: 'fixture-node-one', alive: true, seal: 'LIVE', since: '2026-11-23', q: 0, r: 0 },
            { id: 'fixture-node-two', alive: true, seal: 'LIVE', since: '2026-11-23', q: 1, r: 0 }
          ], buildings: [], units: [] } };
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(fixture)); return;
      }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, medida = null;
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
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd('Page.navigate', { url: origen + '/' });
  for (let t = 0; t < 15000 && !(await ev("!!document.getElementById('start')")); t += 250) { await espera(250); }
  // 2026-11-09 (the Sovereign): the landing keeps only its top: the title, the lead and the «Welcome to OpenWorld» card.
  // The old doors (OpenWorld, Tools), the Tools device list, «Get the app» and the closing note are gone for good.
  medida = JSON.parse(await ev(`JSON.stringify({ h1: (document.querySelector('h1') || {}).textContent,
    welcome: (document.getElementById('welcome-title') || {}).textContent, start: (document.getElementById('start') || {}).getAttribute && document.getElementById('start').getAttribute('href'),
    restos: ['#doors', '#door-tools', '#tools-dispositivo', '#release', 'main > .note', '#web-app'].filter((q) => document.querySelector(q)),
    tras: (() => { const c = document.querySelector('.welcome-card'); let n = 0; for (let e = c && c.nextElementSibling; e; e = e.nextElementSibling) { n++; } return n; })(),
    texto: document.body.innerText })`));
  ok(medida.h1 === 'PreceptorOS' && medida.welcome === 'Welcome to OpenWorld' && medida.start === '/openworld/', 'the landing top changed: ' + JSON.stringify([medida.h1, medida.welcome, medida.start]));
  // Day D (V5.1): landing keeps only three guide links under "OpenWorld Today" details;
  // building proposal moved inside /get-the-app/ visitor flow. Feedback is owner-local.
  medida.daydHome = JSON.parse(await ev(`JSON.stringify({
    download: document.getElementById('dayd-download')?.getAttribute('href'),
    update: document.getElementById('ta-update')?.getAttribute('href'),
    companion: document.getElementById('dayd-companion')?.getAttribute('href'),
    nav: !!document.querySelector('nav[aria-label="Installation and guides"]'),
    details: !!document.querySelector('details.honest summary'),
    summary: (document.querySelector('details.honest summary') || {}).textContent,
    paths: [...document.querySelectorAll('nav[aria-label="Installation and guides"] a')].map(x=>x.getAttribute('href')),
    feedback: [...document.querySelectorAll('.welcome-card p')].some(x=>/Feedback stays on the owner/.test(x.textContent)),
    noBuilding: !document.getElementById('dayd-building')
  })`));
  ok(medida.daydHome.download==='/get-the-app/#doors' &&
    medida.daydHome.update==='/get-the-app/#update-existing-app' &&
    medida.daydHome.companion==='/get-the-app/#companion-path' &&
    medida.daydHome.nav && medida.daydHome.details &&
    medida.daydHome.summary==='OpenWorld Today' &&
    medida.daydHome.paths.join()==='/get-the-app/#doors,/get-the-app/#update-existing-app,/get-the-app/#companion-path' &&
    medida.daydHome.feedback && medida.daydHome.noBuilding,
    'Day D home path or feedback copy missing: '+JSON.stringify(medida.daydHome));
  ok(medida.restos.length === 0 && medida.tras === 0, 'old landing text is back under the welcome card: ' + JSON.stringify(medida.restos) + ' · after the card: ' + medida.tras);
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the landing');
  const world = JSON.parse(await ev(`(async()=>{const f=document.getElementById('landing-world');
    for(let t=0;t<80;t++){const c=f.contentDocument?.querySelector('#surface');let n=0;if(c?.width&&c?.height){const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<x.length;i+=4)if(x[i])n++;}if(n>2000)break;await new Promise(r=>setTimeout(r,100));}
    const d=f.contentDocument, canvas=d?.querySelector('#surface'), before=d?.defaultView?.performance?.timeOrigin;
    for(let t=0;t<80 && !/state\.json lists no node/.test(d?.getElementById('state-tech')?.textContent||'');t++) await new Promise(r=>setTimeout(r,100));
    const feedBefore=d?.getElementById('online-nodes-state')?.dataset.cause;
    const ink=canvas?(()=>{const x=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let n=0;for(let i=3;i<x.length;i+=4)if(x[i])n++;return n;})():0;
    document.getElementById('look-around').click();
    for(let t=0;t<80 && d?.getElementById('online-node-select')?.options.length!==3;t++) await new Promise(r=>setTimeout(r,100));
    const nodeState=d?.getElementById('online-nodes-state'), feedAfter=nodeState?.textContent,
      options=[...(d?.getElementById('online-node-select')?.options||[])].map(x=>x.value),
      machine=(()=>{try{return JSON.parse(nodeState?.dataset.acho||'')}catch(e){return null}})(),
      machineSentence=machine?.atoms?.find(x=>x.k==='world/nodes')?.r, mapState=d?.getElementById('state')?.textContent;
    document.getElementById('start').click(); await new Promise(r=>setTimeout(r,250));
    const entered=document.body.classList.contains('world-active') && getComputedStyle(document.querySelector('main')).display==='none' && f.getAttribute('aria-hidden')==='false';
    const same=d===f.contentDocument && before===d?.defaultView?.performance?.timeOrigin && d?.querySelectorAll('canvas').length===1;
    history.back(); await new Promise(r=>setTimeout(r,150));
    history.back(); await new Promise(r=>setTimeout(r,150));
    return JSON.stringify({loaded:!!canvas,canvases:d?.querySelectorAll('canvas').length||0,ink,entered,same,restored:!document.body.classList.contains('world-active'),feedBefore,feedAfter,options,feedStatus:nodeState?.dataset.state,machineSentence,mapState});})()`));
  ok(world.loaded && world.canvases === 1 && world.ink > 2000, 'the intro has no painted shared map behind it: ' + JSON.stringify(world));
  ok(world.entered && world.same && world.restored, 'OpenWorld did not reveal and preserve the same single map instance: ' + JSON.stringify(world));
  ok(world.feedBefore === 'node_feed_not_checked',
    'hidden landing preview unexpectedly rendered node feed before entry: ' + JSON.stringify(world));
  ok(world.options.join() === ',fixture-node-one,fixture-node-two' && /2 independently reported LIVE nodes/.test(world.feedAfter || ''),
    'explicit landing entry did not activate the authoritative node feed: ' + JSON.stringify(world));
  ok(world.feedStatus === 'MEDIDO' && world.machineSentence === world.feedAfter && /Nodes online: 2/.test(world.mapState || ''),
    'visible, map and machine-readable node states disagree: ' + JSON.stringify(world));
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  // North D1: the install guide, at phone width: nothing external, no sideways scroll, no missing value, the landing links it.
  // /get-the-app/ is reached from the map's Help and Settings now (settings_sheet.js, map_links.js), not from the landing.
  await cmd('Page.navigate', { url: origen + '/get-the-app/' }); await espera(1500);
  medida.guia = JSON.parse(await ev("JSON.stringify({ h1: (document.querySelector('h1') || {}).textContent, ancho: document.documentElement.scrollWidth, vista: innerWidth, bajas: document.querySelectorAll('a[href*=\"/releases/download/\"]').length, nativeRoute: document.getElementById('native-app-primary')?.getAttribute('href'), nativeDoorRoute: document.getElementById('native-android-download')?.getAttribute('href'), nativeSha: document.querySelector('[data-asset=\"native-v7-apk\"]')?.textContent, huellas: document.querySelectorAll('code.sha[data-asset]').length, filas: document.querySelectorAll('.pruebas tbody tr').length, texto: document.body.innerText })"));
  ok(medida.guia.h1 === 'Get the app', '/get-the-app/ did not load');
  medida.daydDraft = JSON.parse(await ev(`JSON.stringify((()=>{
    const form=document.getElementById('dayd-building-form'),name=document.getElementById('dayd-building-name'),
      purpose=document.getElementById('dayd-building-purpose'),button=document.getElementById('dayd-building-make');
    if(!form || !name || !purpose || !button) return {missing:true};
    name.value='River Library'; purpose.value='Help visitors learn about local river ecology.';
    name.dispatchEvent(new Event('input',{bubbles:true})); purpose.dispatchEvent(new Event('input',{bubbles:true}));
    form.requestSubmit();
    const status=document.getElementById('dayd-building-status'),text=document.getElementById('dayd-building-output'),
      file=document.getElementById('dayd-building-download');
    return {buttonReady:!button.disabled,formAction:form.getAttribute('action'),data:text.value,
      visible:!text.hidden,download:!file.hidden&&file.download==='BUILDING_PROPOSAL.md'&&file.href.startsWith('blob:'),
      status:status.textContent,links:[...document.querySelectorAll('#building-draft .dayd-path a')].map(x=>x.getAttribute('href')),
      feedback:document.getElementById('building-draft').textContent.includes("Feedback stays only on the node owner's device"),
      shipDoor:(()=>{const d=document.getElementById('doors');return !!d && d.getBoundingClientRect().height>44 && !!d.querySelector('nav.os-chooser a#os-ubuntu[href="#steps"]') && !!d.querySelector('nav.os-chooser a#os-windows[href="#windows"]')})()};
  })())`));
  ok(!medida.daydDraft.missing && medida.daydDraft.buttonReady && medida.daydDraft.visible &&
    medida.daydDraft.download && medida.daydDraft.data.includes('Status: DRAFT_ONLY') &&
    medida.daydDraft.data.includes('NO_DATA(world_publication_not_verified)') &&
    medida.daydDraft.status.includes('nothing was sent or registered') &&
    medida.daydDraft.links.join()==='/openworld/,#doors,#companion-path' &&
    medida.daydDraft.feedback && medida.daydDraft.shipDoor && !medida.daydDraft.formAction,
    'Day D building draft not safely downloadable: '+JSON.stringify(medida.daydDraft));
  ok(medida.guia.ancho <= medida.guia.vista, '/get-the-app/ scrolls sideways: ' + medida.guia.ancho + ' > ' + medida.guia.vista);
  // The v7 APK cannot be hosted as a Cloudflare asset: two native links use
  // one exact Worker redirect; GitHub links remain the other public downloads.
  // Count it only when BOTH on-page paths and its SHA match the release contract.
  // A 156 MB APK cannot be relied on as a public static Cloudflare asset.
  // The observed local Worker route returned 404 in production on 2026-11-20.
  // Both visible CTAs must go directly to the official signed GitHub Release.
  const native = 'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v7-20261119/PreceptorOS-android-0.3.0-v7.apk';
  const pinned = medida.guia.nativeRoute === native && medida.guia.nativeDoorRoute === native &&
    medida.guia.nativeSha === '9c4d227db2ba395cdb232bdd3eb6a52f83d344f3386a99bb5274d42837eebe6b';
  ok(medida.guia.bajas + (pinned ? 1 : 0) >= 3 && medida.guia.huellas >= 2 && medida.guia.filas >= 4,
    '/get-the-app/ lost direct verified GitHub Release, fingerprints or test table');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.guia.texto), 'missing value shown on /get-the-app/');
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'get-the-app.png'), Buffer.from(g.result.data, 'base64')); }
  ok(externas.length === 0, 'external requests after /get-the-app/: ' + externas.slice(0, 3));
  // NORTE 5 a1: the launch gate. Three lanes; the app lane asleep with its cause (no signed receipt); the model with its
  // measured figure and no download (no sha256); valida() = []. Then the browser's install offer (synthetic here) wakes the
  // web-app button, and one click makes the prompt.
  const gate = () => ev(`JSON.stringify([...document.querySelectorAll('#gate-carriles .gate-carril')].map((li) => { const b = li.querySelector('.gate-boton');
    return { id: li.dataset.carril, tag: b && b.tagName, off: !!(b && b.disabled), causa: (li.querySelector('.gate-causa') || {}).textContent || null, cifra: (li.querySelector('.gate-cifra') || {}).textContent || null, alto: b ? b.getBoundingClientRect().height : 0 }; })
    .concat([{ fallos: document.getElementById('gate-carriles').dataset.fallos }]))`).then(JSON.parse);
  medida.gate = await gate();
  const lane = (id) => medida.gate.find((x) => x.id === id) || {};
  medida.gateOfertaReal = !lane('pwa').off;   // Chrome may offer the install by itself (measured 2026-10-27: it does)
  ok(medida.gate.length === 4 && !lane('app').off && lane('app').tag === 'A', 'a1: the gate lanes are not as measured: ' + JSON.stringify(medida.gate));
  ok(/^1\.36 GB · .+ · 2026-09-07$/.test(lane('mini').cifra || '') && lane('mini').off && /sha256 or size not measured/.test(lane('mini').causa || ''), 'a1: the model lane is not honest: ' + JSON.stringify(lane('mini')));
  ok(medida.gate.every((x) => x.fallos === undefined || x.fallos === '0') && medida.gate.filter((x) => x.id).every((x) => x.alto >= 44), 'a1: valida() failed or a button is under 44 px');
  await ev(`(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__oferta = (window.__oferta || 0) + 1; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); return true; })()`);
  medida.gateOferta = await gate();
  await ev("document.querySelector('[data-carril=pwa] .gate-boton').click()"); await espera(300);
  medida.gatePrompt = await ev('window.__oferta || 0');
  ok(!(medida.gateOferta.find((x) => x.id === 'pwa') || {}).off && medida.gatePrompt === 1, 'a1: the install offer did not wake the one-click button: ' + JSON.stringify(medida.gateOferta) + ' prompt ' + medida.gatePrompt);
  // North N2: /aduana/ is observant. The checker mounts, the registry reads NO_DATA from the contract, sending is
  // asleep (the send button disabled, envia() sends nothing), nothing external, no sideways scroll.
  await cmd('Page.navigate', { url: origen + '/aduana/' }); await espera(2000);
  medida.aduana = JSON.parse(await ev(`(async () => { const b = [...document.querySelectorAll('#comprueba button')];
    const r = window.AtlasAduana ? await AtlasAduana.envia({ pares: [{}] }) : null;
    return JSON.stringify({ h1: (document.querySelector('h1') || {}).textContent, botones: b.length, envioOff: b.length ? b[b.length - 1].disabled : null,
      registro: (document.getElementById('estado-registro') || {}).textContent, envia: r && { sent: r.sent, code: r.code },
      ancho: document.documentElement.scrollWidth, vista: innerWidth, texto: document.body.innerText }); })()`));
  ok(medida.aduana.h1 === 'Create a node', '/aduana/ did not load');
  ok(medida.aduana.botones >= 3 && medida.aduana.envioOff === true, '/aduana/ checker not mounted, or its send is awake');
  ok(medida.aduana.registro === 'NO_DATA' && medida.aduana.envia && medida.aduana.envia.sent === false && medida.aduana.envia.code === 'registry_not_deployed', '/aduana/ is not asleep: ' + JSON.stringify(medida.aduana.envia));
  ok(medida.aduana.ancho <= medida.aduana.vista, '/aduana/ scrolls sideways');
  // North N3: the catalogue is asleep at load; fed a stub list it shows only real nodes, and a row with a key empties it.
  medida.catalogo = JSON.parse(await ev(`(async () => {
    const off = document.getElementById('catalogo-carga').disabled, oculta = document.getElementById('catalogo').hidden;
    const f = (nodo, x) => Object.assign({ nodo, estado: 'pendiente', causa: 'ancla_ausente', recibido: '2026-10-26T23:00:00.000Z', recibo_sha256: 'ab'.repeat(32) }, x || {});
    const stub = (cedulas) => async () => ({ json: async () => ({ esquema: 'preceptoros.catalogo-cedulas/1', solo_lectura: true, cedulas }) });
    await AtlasAduana.catalogo(stub([f('nodo.5.vecino'), f('nodo.9101.claude-test', { causa: 'cuenta_de_prueba' })]));
    const filas = [...document.querySelectorAll('#catalogo tbody tr')].map((tr) => tr.cells[0].textContent);
    await AtlasAduana.catalogo(stub([f('nodo.6.malo', { clave: 'cd'.repeat(32) })]));
    return JSON.stringify({ off, oculta, filas, trasClave: document.getElementById('catalogo').hidden, nota: document.getElementById('catalogo-estado').textContent,
      clave: document.body.innerText.includes('cd'.repeat(32)) }); })()`));
  ok(medida.catalogo.off && medida.catalogo.oculta, '/aduana/ catalogue is not asleep at load');
  ok(JSON.stringify(medida.catalogo.filas) === JSON.stringify(['nodo.5.vecino']), 'catalogue rows wrong (test node listed?): ' + medida.catalogo.filas);
  ok(medida.catalogo.trasClave && !medida.catalogo.clave && /NO_DATA/.test(medida.catalogo.nota), 'a catalogue row with a key was shown');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.aduana.texto), 'missing value shown on /aduana/');
  if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(CAPTURA, 'aduana.png'), Buffer.from(g.result.data, 'base64')); }
  ok(externas.length === 0, 'external requests after /aduana/: ' + externas.slice(0, 3));
  if (CAPTURA) {
    const s = await cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(CAPTURA, 'landing-doors.png'), Buffer.from(s.result.data, 'base64'));
  }
  console.log(JSON.stringify({ piece: 'P3-1d', receipt: 'MEDIDO', dibujos: medida.dibujos, lados: medida.lados, catalogo: medida.catalogo && { off: medida.catalogo.off, filas: medida.catalogo.filas, trasClave: medida.catalogo.trasClave }, aduana: medida.aduana && { botones: medida.aduana.botones, envioOff: medida.aduana.envioOff, registro: medida.aduana.registro, envia: medida.aduana.envia, ancho: medida.aduana.ancho }, gate: medida.gate, gateOfertaReal: medida.gateOfertaReal, gatePrompt: medida.gatePrompt, guia: medida.guia && { ancho: medida.guia.ancho, vista: medida.guia.vista, bajas: medida.guia.bajas, huellas: medida.guia.huellas, filas: medida.guia.filas }, enlaces: medida.enlaces, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P3-1d', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
