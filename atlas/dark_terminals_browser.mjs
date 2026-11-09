// Terminals are always dark (Sovereign, 2026-11-08), proved in a real browser on /openworld/ at 420×642 in the light
// and the dark theme. Laws: the open Welcome terminal (#voices) is dark (color-scheme dark, background luminance
// < 0.05) in both themes; its text keeps >= 4.5:1; the page outside the terminals keeps the visitor's light theme.
// Sabotage: SABOTAJE=sin-oscuro (the CSS rule loses color-scheme) ⇒ red.
// Uso: node atlas/dark_terminals_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/assets/openworld.css' && SAB === 'sin-oscuro') { cuerpo = Buffer.from(String(cuerpo).replace('#chat,#voices,#building-sheet,.radio-chat{color-scheme:dark;', '#chat,#voices,#building-sheet,.radio-chat{')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
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
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  await cmd('Runtime.enable'); await cmd('Page.enable');


  // Luminance (WCAG) of an rgb() string; contrast of two.
  const MEDIR = `JSON.stringify((() => {
    const rgb = (s) => (s.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
    const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const bgOf = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (!/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) return c; } return 'rgb(255, 255, 255)'; };
    const w = document.querySelector('.cats [data-cat=Welcome]'); if (w) w.click();
    const out = {};
    for (const s of ['#voices', '#chat']) {
      const e = document.querySelector(s); if (!e) { out[s] = null; continue; }
      const bg = rgb(bgOf(e)), texts = [...e.querySelectorAll('*')].filter((x) => x.children.length === 0 && /\\S/.test(x.textContent) && x.getBoundingClientRect().height > 0).slice(0, 12);
      const worst = texts.map((x) => { const a = L(rgb(getComputedStyle(x).color)), b = L(rgb(bgOf(x))); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); });
      if (!texts.length) { out[s] = null; continue; }
      out[s] = { bgL: Math.round(L(bg) * 1000) / 1000, scheme: getComputedStyle(e).colorScheme, texts: texts.length, minContrast: worst.length ? Math.round(Math.min(...worst) * 10) / 10 : null };
    }
    out.page = Math.round(L(rgb(bgOf(document.body))) * 1000) / 1000;
    return out;
  })())`;
  for (const scheme of ['light', 'dark']) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: 420, height: 642, deviceScaleFactor: 1, mobile: true });
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2500);
    const m = JSON.parse(await ev(MEDIR)); medidas[scheme] = m;
    const v = m['#voices'];
    ok(v && v.texts > 0, scheme + ': the Welcome terminal is not open with text: ' + JSON.stringify(v));
    if (!v) { continue; }
    ok(v.scheme === 'dark' && v.bgL < 0.05, scheme + ': the terminal is not dark: ' + JSON.stringify(v));
    ok(v.minContrast >= 4.5, scheme + ': terminal text under 4.5:1: ' + JSON.stringify(v));
    await foto('terminal-' + scheme + '.png');
  }
  ok(medidas.light && medidas.light.page > 0.5, 'the page outside the terminals does not keep the light theme: ' + JSON.stringify(medidas.light && medidas.light.page));
  console.log(JSON.stringify({ piece: 'dark-terminals', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'dark-terminals', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
