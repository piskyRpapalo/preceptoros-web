// P3 · the visitor's chat with Hexelion (odd/tasks/chat-del-aula.md · doctrine ·6593579266), in a real browser.
// A spy installed before any script answers the door (api.preceptoros.org) from a queue and counts every fetch.
// Law held here:
// - zero requests when /chat/ opens (and again when it reopens with history);
// - one request per Send, a CIEF under 1 KB whose visit is the crab's seed and whose next turn carries the seal;
// - the bubble shows as Hexelion's and is kept in this device's IndexedDB;
// - when Hexelion sleeps or the door limits, the visitor reads NO_DATA in plain words, never silence;
// - the AI is disclosed on screen; every control is at least 44 px.
// Sabotage: SABOTAJE=fetch-al-cargar makes the module call the door on load ⇒ this file turns red.
// Uso: node atlas/classroom_chat_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const SAB = process.env.SABOTAJE || '';
const sha = (t) => createHash('sha256').update(t).digest('hex');
let apiLocal = 0;
function sirve(raiz) {
  const s = createServer((req, res) => {
    const ruta0 = new URL(req.url, 'http://local').pathname;
    if (ruta0.startsWith('/api/')) { apiLocal++; res.writeHead(404); res.end(); return; }
    try {
      let ruta = decodeURIComponent(ruta0); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/classroom_chat.js' && SAB === 'fetch-al-cargar') { cuerpo = Buffer.concat([cuerpo, Buffer.from("\n;fetch('https://api.preceptoros.org/api/v1/chat',{method:'POST',body:'{}'}).catch(function(){});\n")]); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
// Runs in the page before any script: every call to the door is recorded and answered from window.__cola.
const ESPIA = `(() => {
  window.__llamadas = []; window.__cola = [];
  const real = window.fetch.bind(window);
  window.fetch = (url, init) => {
    const u = String(url && url.url || url);
    if (!u.startsWith('https://api.preceptoros.org/')) return real(url, init);
    window.__llamadas.push({ url: u, body: init && init.body });
    const r = window.__cola.shift() || { status: 503, body: { v: 'preceptoros.chat/1', estado: 'NO_DATA', causa: 'nodo_dormido' } };
    return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } }));
  };
})();`;
const fallos = [], excepciones = [];
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
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; excepciones.push(String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 150) { if (await ev(e) === true) { return true; } await espera(150); } return false; };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: ESPIA });
  const log = () => ev("document.getElementById('chat-log').innerText");
  const envia = async (texto) => {
    await ev("document.getElementById('chat-text').focus(), true");
    await cmd('Input.insertText', { text: texto });
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  };

  // Open: zero requests, the AI disclosed, 44 px everywhere.
  await cmd('Page.navigate', { url: origen + '/chat/' }); await espera(1500);
  ok(await ev('window.__llamadas.length') === 0 && apiLocal === 0, 'the page called the door on load: ' + JSON.stringify(await ev('window.__llamadas')));
  ok(/You are talking to Hexelion, an AI/.test(await ev("document.getElementById('chat-ai').textContent")), 'the AI is not disclosed at the start');
  const chicos = await ev("[...document.querySelectorAll('button,textarea')].filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map(e => e.id)");
  ok(chicos && chicos.length === 0, 'controls under 44 px: ' + JSON.stringify(chicos));

  // Turn 1: Hexelion answers; one CIEF, the crab's seed as visit; the bubble stays on this device.
  const BURBUJA = 'Hello. I am Hexelion; I advise and never sign.';
  await ev(`window.__cola.push({ status: 200, body: { v: 'preceptoros.chat/1', estado: 'OK', voz: 'Hexelion', burbuja: { texto: ${JSON.stringify(BURBUJA)}, recortada: false }, sello: { tic: 1, hash: '${sha(BURBUJA)}', firma: 'f'.repeat(64) } } }), true`);
  await envia('Who are you?');
  ok(await hasta("document.getElementById('chat-log').innerText.includes('Hexelion · Hello. I am Hexelion')", 5000), 'the answer is not shown as Hexelion\'s Acho speech: ' + await log());
  const c1 = JSON.parse((await ev('window.__llamadas[0] && window.__llamadas[0].body')) || '{}');
  ok(await ev('window.__llamadas.length') === 1, 'one Send made more than one request');
  ok(c1.v === 'preceptoros.chat/1' && c1.tic === 1 && c1.hash_esperado === null && /^[0-9a-f]{64}$/.test(c1.estado?.visita || '') && c1.contexto?.texto === 'Who are you?', 'turn 1 is not a CIEF: ' + JSON.stringify(c1));
  ok(new TextEncoder().encode(JSON.stringify(c1)).length < 1024, 'the CIEF is not under 1 KB');

  // Turn 2: Hexelion sleeps → plain words with the cause; the request carried the seal and the expected hash.
  await envia('Are you there?');
  ok(await hasta("document.getElementById('chat-log').innerText.includes('Hexelion is asleep right now.')", 5000), 'a sleeping Hexelion is not said in plain words: ' + await log());
  const c2 = JSON.parse((await ev('window.__llamadas[1] && window.__llamadas[1].body')) || '{}');
  ok(c2.tic === 2 && c2.hash_esperado === sha(BURBUJA) && c2.sello && c2.sello.tic === 1 && c2.estado?.visita === c1.estado?.visita, 'turn 2 does not carry the seal of turn 1: ' + JSON.stringify(c2).slice(0, 200));

  // Turn 3: the door limits → the wait is said.
  await ev("window.__cola.push({ status: 429, body: { v: 'preceptoros.chat/1', estado: 'NO_DATA', causa: 'limite_visita', retry_after: 60 } }), true");
  await envia('Again?');
  ok(await hasta("document.getElementById('chat-log').innerText.includes('wait 60 s')", 5000), 'a limit is not said with its wait: ' + await log());

  // Reopen: history from IndexedDB, still zero requests.
  await cmd('Page.navigate', { url: origen + '/chat/' }); await espera(1500);
  const hist = await log();
  ok(/Who are you\?/.test(hist) && /Hexelion · Hello/.test(hist), 'the Acho chat did not stay on this device: ' + hist.slice(0, 160));
  ok(await ev('window.__llamadas.length') === 0, 'reopening with history called the door');

  ok(excepciones.length === 0, 'exceptions: ' + excepciones.join(' | '));
  console.log(JSON.stringify({ piece: 'aula-chat', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'aula-chat', sabotaje: SAB || null, receipt: 'ROJO', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
