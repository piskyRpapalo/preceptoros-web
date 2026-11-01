// P3 [1a] in a real browser: the preserved Atlantis/Zombie faces load the comic letters and draw their place names with
// them, at half size, with no exception. Uso: node atlas/face_names_browser.mjs  (Chrome headless por CDP)
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
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
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, cdpPort = 9700 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      const que = 'exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop() + ':' + ((f.lineNumber ?? 0) + 1);
      if (!fallos.includes(que)) { fallos.push(que); }
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  await cmd('Runtime.enable'); await cmd('Page.enable');

  for (const mundo of ['atlantis', 'zombie']) {
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/face/${mundo}.html` });
    ok(await hasta("!!(window.AtlasBubbleLetters && document.getElementById('machine-map') && document.getElementById('machine-map').textContent.includes('\"id\":\"names\"'))", 20000), mundo + ': world and its names loaded');
    const n = JSON.parse(await ev(`JSON.stringify((() => { const f = document.getElementById('machine-map').textContent.split('\\n').map((l) => JSON.parse(l)).filter((x) => x.id === 'names')[0];
      const i = f ? f.atoms[0].i : []; return { letras: i.filter((x) => x.o === 'letters').length, total: i.length, tallas: [...new Set(i.map((x) => x.sz))] }; })())`));
    medidas[mundo] = n;
    ok(n.total > 0 && n.letras === n.total, mundo + ': names not all in comic letters ' + JSON.stringify(n));
    ok(n.tallas.length === 1 && n.tallas[0] === 12, mundo + ': name size is not 12 ' + JSON.stringify(n.tallas));
    // NORTE 5 [2]: the chat terminal (the radio chat /play/ had) is THE chat panel of the world: mounted in the chat section,
    // open, three channels; a line you write lands in it as You · LIVE-or-NO_DATA (by the game cycle), and the answer as NO_DATA.
    await ev("(() => { const i = document.getElementById('reply'); i.value = 'hello from the check'; document.getElementById('ask').requestSubmit(); return true; })()");
    await espera(400);
    const t = JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('radio-chat');
      return { en: !!(c && c.parentElement.closest('section') && c.parentElement.closest('section').querySelector('#log')), abierto: !!c && !c.classList.contains('plegado'), canales: c ? c.querySelectorAll('[role=tab]').length : 0,
        msgs: c ? [...c.querySelectorAll('#radio-chat-lista .radio-msg')].map((li) => [li.dataset.quien, li.dataset.sello, li.dataset.fuente]) : [] }; })())`));
    medidas[mundo].terminal = t;
    const tuyo = t.msgs.find((m) => m[0] === 'You' && m[2] === 'chat'), resp = t.msgs.find((m) => m[0] === 'Preceptor' && m[1] === 'NO_DATA');
    ok(t.en && t.abierto && t.canales === 3 && tuyo && /^(LIVE|NO_DATA)$/.test(tuyo[1]) && resp, mundo + ': [2] the chat terminal is not the chat panel ' + JSON.stringify(t));
  }
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/face/basic.html` });
  ok(await hasta("!!(window.AtlasOpenworldState && window.AtlasColonyControls && document.getElementById('joy'))", 20000), 'basic: shared terminal loaded');
  const terminal = JSON.parse(await ev(`JSON.stringify({ joy: !!document.getElementById('joy'), map: !!document.getElementById('map'), privateWorld: !!window.AtlasFaceWorld })`));
  medidas.basic_terminal = terminal;
  ok(terminal.joy && terminal.map && !terminal.privateWorld, 'basic: terminal is not a private map');
  console.log(JSON.stringify({ piece: 'P3-1a+N5-2', receipt: 'MEDIDO', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P3-1a', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
