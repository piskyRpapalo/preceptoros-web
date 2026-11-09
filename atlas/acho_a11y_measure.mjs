// Inventario medido de las funciones de accesibilidad de la Burbuja en /openworld/ (buzon#30, 2026-11-02).
// Cada fila sale de una medida en un navegador real (CDP), nunca de memoria. Lo que no se puede medir aquí es NO_DATA
// con su causa exacta. Uso: node atlas/acho_a11y_measure.mjs  → una línea JSON con las filas.
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
const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9500 + (process.pid % 90), ch = launchChrome(cdpPort);
let lista = null, id = 0; const pend = new Map();
for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
if (!lista) { console.log(JSON.stringify({ fallo: ch.diagnostic() })); process.exit(1); }
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Accessibility.enable'); await cmd('DOM.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2000);

// 1-2 · what a screen reader gets: the accessible text of each voice and of each log line (Chromium AX tree, ::before included).
const ax = (await cmd('Accessibility.getFullAXTree')).result.nodes;
const porId = new Map(ax.map((n) => [n.nodeId, n]));
const texto = (n) => n.role?.value === 'StaticText' ? n.name?.value || '' : (n.childIds || []).map((c) => porId.get(c)).filter(Boolean).map(texto).join('');
const items = ax.filter((n) => n.role?.value === 'listitem' && !n.ignored).map((n) => texto(n).trim()).filter(Boolean);
const voces = ['Guide', 'Tutorial', 'Map', 'Floor', 'Walkers', 'Zoom', 'House', 'Army', 'Radio'];
const vozAX = voces.filter((v) => items.some((t) => t.startsWith(v)));
// The speaker of a log line is CSS ::before text: Chromium exposes it as its own StaticText node before the line's text.
// 12-13 (filled 2026-11-02): focusable proxies over the drawn bubbles, and live regions whose AX text starts with «Speaker:».
const vivoAX = [...new Set(ax.filter((n) => n.role?.value === 'StaticText' && /^(Tutorial|Welcome|Guide|Map|Floor|Walkers|Zoom|House|Army|Radio):\s?$/.test(n.name?.value || '')).map((n) => n.name.value.replace(/:\s?$/, '')))];
const logAX = ax.filter((n) => n.role?.value === 'StaticText' && /^Guide · $/.test(n.name?.value || '')).length, logLi = await ev("document.querySelectorAll('#log li.who-before').length");
const fila = await ev(`JSON.stringify((() => {
  const frases = document.querySelectorAll('#frases li').length, radio = [...document.querySelectorAll('#radio-chat-lista li')];
  const conQuien = radio.filter((li) => (li.querySelector('b') || {}).textContent).length;
  document.documentElement.style.fontSize = '200%'; const ancho200 = document.documentElement.scrollWidth; document.documentElement.style.fontSize = '';
  const canvas = document.getElementById('surface');
  return { frases, radio: radio.length, conQuien, ancho200, vista: innerWidth, canvasLabel: canvas.getAttribute('aria-label'), canvasRole: canvas.getAttribute('role'),
    seals: [...document.querySelectorAll('.radio-msg-sello')].filter((x) => x.textContent).length,
    hitlKeys: [...document.querySelectorAll('.hitl-mark')].filter((b) => b.tabIndex >= 0).length,
    proxies: [...document.querySelectorAll('.map-proxy')].filter((b) => b.tabIndex >= 0 && b.offsetWidth >= 44 && b.offsetHeight >= 44).length,
    lang: document.documentElement.lang };
})())`);
const m = JSON.parse(fila);
// Focus ring by the real keyboard: Tab until «Play now» has focus, then read its outline (the browser's own ring is 'auto').
for (let i = 0; i < 40 && (await ev("document.activeElement.id")) !== 'play-now'; i++) { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); }
m.foco = await ev("(() => { const e = document.activeElement, s = getComputedStyle(e); return e.id + ' ' + s.outlineStyle + ' ' + s.outlineWidth; })()");
// 3 · reduced motion: the palette cycle stops (t does not advance) and the surface has no transition.
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(1500);
const quieto = JSON.parse(await ev(`(async () => { const a = AtlasOpenworldView().t; await new Promise((r) => setTimeout(r, 2200)); return JSON.stringify({ a, b: AtlasOpenworldView().t, tr: getComputedStyle(document.getElementById('surface')).transitionDuration }); })()`));
// 4 · forced colours (Windows high contrast): does any Acho rule answer to it?
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(1500);
const forzado = JSON.parse(await ev(`JSON.stringify({ reglas: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).filter((r) => /forced-colors|prefers-contrast/.test(r.conditionText || r.media?.mediaText || '')).length, aplicadas: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).filter((r) => /forced-colors|prefers-contrast/.test(r.conditionText || '') && matchMedia(r.conditionText).matches).reduce((n, r) => n + r.cssRules.length, 0), lienzo: AtlasComicAtoms.highContrast ? AtlasComicAtoms.highContrast() : 'NO_DATA' })`));
console.log(JSON.stringify({ medida: '2026-11-02', vozAX, vivoAX, logAX, logLi, items: items.length, ...m, quieto, forzado }));
ws.close(); ch.close && ch.close(); srv.close(); process.exit(0);
