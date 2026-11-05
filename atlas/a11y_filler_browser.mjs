// The three NO_DATA of the a11y inventory, filled (buzon#30, 2026-11-02), guarded in a real browser (CDP, 390×844):
// 1 · forced colours: page rules answer to `forced-colors: active`, the canvas takes its high-contrast path (one system
//     ink), the keyboard ring stays visible, and the panel text keeps its contrast.
// 2 · Tab reaches the cabin's proxy button over the map; Enter on it enters the cabin; the ring is drawn on the canvas.
// 3 · the live region of the Map voice is spoken «Map: …» (accessibility tree) while its textContent stays as it was.
// Uso: node atlas/a11y_filler_browser.mjs → one JSON line; exit 1 on failure.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = await new Promise((r) => { const s = createServer((req, res) => {
  try { let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
    const f = resolve(PUBLIC, '.' + ruta); if (!f.startsWith(resolve(PUBLIC))) { res.writeHead(403); res.end(); return; }
    const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo); } catch { res.writeHead(404); res.end(); }
}); s.listen(0, '127.0.0.1', () => r(s)); });
const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9600 + (process.pid % 90), ch = launchChrome(cdpPort);
let lista = null, id = 0; const pend = new Map();
for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
if (!lista) { console.log(JSON.stringify({ ok: false, fallo: ch.diagnostic() })); process.exit(1); }
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
const tecla = async (key, code, vk) => { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key === 'Enter' ? '\r' : undefined }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); };
await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Accessibility.enable'); await cmd('DOM.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
const fallos = [];

// 1 · forced colours.
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2000);
const fc = JSON.parse(await ev(`JSON.stringify((() => {
  const reglas = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .filter((r) => /forced-colors/.test(r.conditionText || r.media?.mediaText || ''));
  const aplicadas = reglas.filter((r) => matchMedia(r.conditionText || r.media.mediaText).matches).reduce((n, r) => n + r.cssRules.length, 0);
  const rgb = (c) => (c.match(/\\d+(\\.\\d+)?/g) || []).slice(0, 3).map(Number);
  const lum = (c) => { const v = rgb(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const st = document.getElementById('state'), voz = st.closest('.voice');
  const a = lum(getComputedStyle(st).color), b = lum(getComputedStyle(voz).backgroundColor);
  const contraste = Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
  return { forced: matchMedia('(forced-colors: active)').matches, aplicadas, contraste, lienzo: AtlasComicAtoms.highContrast() };
})())`));
for (let i = 0; i < 40 && (await ev("document.activeElement.id")) !== 'play-now'; i++) { await tecla('Tab', 'Tab', 9); }
fc.foco = await ev("(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.id + ' ' + s.outlineStyle + ' ' + s.outlineWidth; })()");
if (!fc.forced || fc.aplicadas < 5) { fallos.push('forced-colors rules applied: ' + fc.aplicadas); }
if (fc.lienzo !== true) { fallos.push('canvas high-contrast path off'); }
if (!/^play-now solid 3px/.test(fc.foco || '')) { fallos.push('focus ring under forced colours: ' + fc.foco); }
if (!(fc.contraste >= 7)) { fallos.push('panel text contrast ' + fc.contraste); }

// 2 · Open the map panel; Tab reaches its visible cabin button and Enter enters.
await cmd('Emulation.setEmulatedMedia', { features: [] });
await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2000);
await ev("(() => { const b = document.querySelector('.cats [data-cat=Map]'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); })()");
let tabs = 0;
for (; tabs < 80 && !(await ev("document.activeElement.matches('.map-place[data-node=\"cabin\"]')")); tabs++) { await tecla('Tab', 'Tab', 9); }
await espera(200);
const proxy = JSON.parse(await ev(`JSON.stringify((() => { const b = document.activeElement, r = b.getBoundingClientRect(), c = document.getElementById('surface').getBoundingClientRect();
  return { cabina: b.matches('.map-place[data-node="cabin"]'), w: r.width, h: r.height, dentro: !!b.closest('#voices'),
    nombre: b.getAttribute('aria-label'), proxies: document.querySelectorAll('.map-place').length,
    contorno: getComputedStyle(b).outlineStyle + ' ' + getComputedStyle(b).outlineWidth }; })())`));
await tecla('Enter', 'Enter', 13); await espera(400);
proxy.tras = await ev("(document.querySelector('#joy [aria-live]') || {}).textContent || ''");
proxy.tabs = tabs;
if (!proxy.cabina) { fallos.push('Tab never reached the cabin proxy (' + tabs + ' presses)'); }
if (proxy.w < 44 || proxy.h < 44 || !proxy.dentro) { fallos.push('proxy box ' + proxy.w + '×' + proxy.h + ' inside=' + proxy.dentro); }
if (proxy.nombre !== 'Walk to cabin') { fallos.push('place name: ' + proxy.nombre); }
if (!/^solid 3px/.test(proxy.contorno)) { fallos.push('proxy outline: ' + proxy.contorno); }
if (!/terminal: /.test(proxy.tras)) { fallos.push('Enter did not enter the cabin: ' + proxy.tras); }

// 3 · the live region says its speaker in the accessibility tree; its textContent is untouched.
// TF-2 (D3): only the open category is in the tree; Map lives in Explore, so the visitor opens it first.
await ev("(() => { const b = document.querySelector('.cats [data-cat=Map]'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); })()");
const ax = (await cmd('Accessibility.getFullAXTree')).result.nodes;
const habla = ax.filter((n) => n.role?.value === 'StaticText' && /^(Map|Floor|Guide|Zoom|Walkers|Tutorial|Army|Radio|House|Welcome):\s?$/.test(n.name?.value || '')).map((n) => n.name.value.replace(/:\s?$/, ''));
const vivo = { voces: [...new Set(habla)].sort(), textoMap: await ev("document.getElementById('state').textContent") };
if (!vivo.voces.includes('Map')) { fallos.push('the Map live region does not say «Map: »'); }
if (/^Map/.test(vivo.textoMap || '')) { fallos.push('textContent changed: ' + vivo.textoMap); }

console.log(JSON.stringify({ ok: fallos.length === 0, fallos, forzado: fc, tab: proxy, vivo }));
ws.close(); ch.close && ch.close(); srv.close(); process.exit(fallos.length ? 1 : 0);
