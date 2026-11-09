// INFANTE · the family layer of /openworld/ (odd/tasks/capa-visual-infante.md, piece e5), measured at the edge phone's
// size (360×716 CSS) after the page settles (walkers moving, radio listening):
// - R2 no visible line repeats on the first screen;
// - R3 the technical stays folded: no raw walker routes, «not measured yet», «turn not measured», cells or sha256 in the
//   visible text outside <details>, and the radio never echoes the walkers' routes;
// - R4 nothing is cut: every visible button and tab fits its own width;
// - size: the visible text of the whole page stays under a ceiling (measured on the real phone, 2026-11-03: 10,520 chars).
// Red first: PUBLICO=<main checkout>/public serves today's main ⇒ ROJO. Uso: node atlas/infant_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = process.env.PUBLICO || join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const W = 360, H = 716;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
const TECNICO = /walker of |not measured yet|turn not measured|\bcells\b|sha256|Δ /;
const TECHO = 6000;
async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + ((process.pid + 71) % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Network.setBlockedURLs', { urls: ['https://*'] });
  await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(7000);
  const r = JSON.parse(await ev(`JSON.stringify((() => {
    const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const lineas = [], primera = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      const t = n.textContent.trim(), p = n.parentElement; if (!t || !p || !vis(p) || p.closest('details:not([open]) > :not(summary)') || p.closest('script,style')) continue;
      const top = p.getBoundingClientRect().top + scrollY; lineas.push(t); if (top < innerHeight) primera.push(t);
    }
    const largas = (a) => a.filter((t) => t.length > 12);
    const p1 = largas(primera), dup = [...new Set(p1.filter((t, i) => p1.indexOf(t) !== i))];
    const tecnico = lineas.filter((t) => ${TECNICO.toString()}.test(t)).slice(0, 6);
    const ctl = [...document.querySelectorAll('button,[role=tab],summary,a[href]')].filter(vis);
    const cortados = ctl.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim().slice(0, 30));
    const radio = [...document.querySelectorAll('#radio-chat-lista li')].map((li) => li.textContent);
    return { dup, tecnico, cortados, chars: lineas.join(' ').length, radio: radio.length, radioCaminantes: radio.filter((t) => /walker of /.test(t)).map((t) => t.slice(0, 180)) };
  })())`));
  medidas.infante = r;
  ok(r.dup.length === 0, 'R2 a line repeats on the first screen: ' + r.dup.slice(0, 3).join(' | '));
  ok(r.tecnico.length === 0, 'R3 technical text is visible: ' + r.tecnico.slice(0, 3).join(' | ').slice(0, 300));
  ok(r.radioCaminantes.length === 0, 'R3 the radio echoes the walkers: ' + r.radioCaminantes.join(' | '));
  ok(r.cortados.length === 0, 'R4 cut at 360 px: ' + r.cortados.join(' | '));
  ok(r.chars < TECHO, 'the visible text is over ' + TECHO + ' chars: ' + r.chars);
  console.log(JSON.stringify({ piece: 'infante', publico: process.env.PUBLICO ? 'override' : 'branch', receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'infante', receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
