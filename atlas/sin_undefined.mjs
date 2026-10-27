// Guarda A1B8: lo ausente es NO_DATA con causa; jamas undefined ni NaN visibles en las paginas vivas (NORTE 5 [3]: /play/ salio).
// Uso: node atlas/sin_undefined.mjs  (Chrome headless por CDP y python3 sirviendo public/; sin dependencias)
import { sirve } from './sirve_publico.mjs';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ATTR_EXPR = "[...document.querySelectorAll('[aria-label],[title]')].map(e=>(e.getAttribute('aria-label')||'')+' '+(e.title||'')).join('\\n')";
const fallos = [];
let pasos = 0;
let actual = { path: '-', step: 'arranque' };
const pend = new Map();
let id = 0;
let ws = null, ch = null, srv = null;

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port;
  const cdpPort = 9300 + (process.pid % 500);

  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) throw new Error(ch.diagnostic());
  const pag = lista.find((t) => t.type === 'page');
  ws = new WebSocket(pag.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const e = d.params.exceptionDetails;
      fallos.push({ path: actual.path, step: actual.step, snippet: String(e.exception?.description || e.text).slice(0, 60) });
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalua = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable');
  // NORTE 5 [3]: WavesCraft's /play/ fixture left with /play/.

  async function revisa(paso) {
    pasos++;
    const txt = (await evalua('document.body ? document.body.innerText : ""')) ?? '';
    const attr = (await evalua(ATTR_EXPR)) ?? '';
    const total = txt + '\n' + attr;
    for (const m of total.matchAll(/\bundefined\b|\bNaN\b/g)) {
      const ini = Math.max(0, m.index - 30);
      const fin = Math.min(total.length, m.index + m[0].length + 30);
      fallos.push({ path: actual.path, step: paso, snippet: total.slice(ini, fin) });
    }
  }

  // NORTE 5 [3] (2026-10-27, decree ·6452880777): /play/ left; the walk through its descent, WavesCraft, glyph and inspector is
  // retired (docs/pruebas-retiradas/norte5-eliminacion.py). The rule stands on every surviving page: what is missing is
  // NO_DATA with its cause, never undefined or NaN, on load and on every tab of a world.
  for (const p of ['/', '/face/', '/face/basic.html', '/face/atlantis.html', '/face/zombie.html', '/get-the-app/', '/aduana/']) {
    actual = { path: p, step: 'carga' };
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}${p}` });
    await espera(2500);
    await revisa('carga');
    if (p.startsWith('/face/') && p.endsWith('.html')) {
      for (const tab of ['tab-battle', 'tab-profile', 'tab-info', 'tab-map']) {
        actual.step = tab;
        await evalua(`(t => t && t.click())(document.getElementById('${tab}'))`);
        await espera(600); await revisa(tab);
      }
    }
  }
}

let codigo = 0;
try {
  await main();
} catch (e) {
  fallos.push({ path: actual.path, step: 'harness', snippet: String(e.message) });
} finally {
  try { ws?.close(); } catch {}
  try { await ch?.close(); } catch {}
  try { srv?.close(); } catch {}
}
console.log(JSON.stringify({ fallos, pasos }, null, 2));
process.exitCode = fallos.length ? 1 : 0;
