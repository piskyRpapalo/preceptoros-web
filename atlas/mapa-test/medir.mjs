// Runner of the test map: loads it in headless Chrome, saves a screenshot, and measures every frame with checkFrame.
// Uso: node atlas/mapa-test/medir.mjs [out-dir]   (out-dir default: a scratch folder given as argument)
import { launchChrome } from '../chrome_launch.mjs';
import { checkFrame } from '../param_gate.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out = process.argv[2] || '.';
const PORT = Number(process.env.MAPA_TEST_PORT || 8799);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = launchChrome(0);
const cdp = await ch.debugPort();
let lista = null;
for (let i = 0; i < 60 && !lista; i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdp}/json`)).json(); } catch {} }
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const errores = [];
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errores.push(String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0].slice(0, 160)); });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1100, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url: `http://127.0.0.1:${PORT}/atlas/mapa-test/index.html` });
for (let i = 0; i < 40; i++) { await espera(250); if (await ev('!!window.__frames')) break; }
const frames = await ev('window.__frames');
const shot = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(join(out, 'mapa-test.png'), Buffer.from(shot.result.data, 'base64'));
let ok = 0; const filas = [];
for (const f of frames || []) {
  const r = checkFrame(f.frame);
  const bytes = Buffer.byteLength(JSON.stringify(f.frame));
  if (r.ok) ok++;
  filas.push({ angle: f.angle, kind: f.kind, id: f.id, bytes, ok: r.ok, causes: r.ok ? [] : (r.causes || [r.cause]).slice(0, 2) });
}
const resumen = { frames: (frames || []).length, pass: ok, fail: filas.length - ok, errors_in_page: errores, fails: filas.filter((x) => !x.ok) };
writeFileSync(join(out, 'mapa-test-medicion.json'), JSON.stringify({ resumen, filas }, null, 1));
console.log(JSON.stringify(resumen));
ws.close(); ch.close ? ch.close() : null; process.exit(0);
