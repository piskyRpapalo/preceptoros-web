// G1 · LA VENTANA GRANDE (odd/tasks/mundo-grande.md, web#608), proved in a real browser on /openworld/ at the edge phone's
// size (360×716 CSS). Laws:
// - before Explore, the map keeps its measured half (this is the starting point, not a law);
// - Explore enlarges the canvas while the chat remains visible, and canvas pixels follow;
// - the button is a 44 px target in the map tools, with aria-pressed and words; Escape restores the map size;
// - openworld_page.js and openworld/index.html do not grow; map_wide.js stays under 4 KiB.
// Sabotage: SABOTAJE=sin-ancho serves map_wide.js without its CSS ⇒ the canvas keeps its half ⇒ red.
// Uso: node atlas/map_wide_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const W = Number(process.env.VIEWPORT_WIDTH || 360), H = Number(process.env.VIEWPORT_HEIGHT || 716);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/map_wide.js' && SAB === 'sin-ancho') { cuerpo = Buffer.from(String(cuerpo).replace('st.textContent = CSS;', '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
const deMain = (p) => { try { return execFileSync('git', ['show', 'origin/main:' + p], { cwd: RAIZ, maxBuffer: 1 << 24 }).length; } catch { return null; } };

async function main() {
  // Weight law first: the monolith and the page HTML do not grow; the new piece stays small.
  for (const [k, p] of [['openworld_page', 'public/game/openworld_page.js'], ['index_html', 'public/openworld/index.html']]) {
    const ahora = statSync(join(RAIZ, p)).size, enMain = deMain(p);
    medidas[k] = { ahora, main: enMain };
    ok(enMain === null || ahora <= enMain, p + ' grew: ' + ahora + ' > ' + enMain);
  }
  const wide = join(PUBLIC, 'game/map_wide.js');
  medidas.map_wide = existsSync(wide) ? statSync(wide).size : null;
  ok(medidas.map_wide !== null && medidas.map_wide < 4096, 'map_wide.js missing or over 4 KiB: ' + medidas.map_wide);

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
  await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
  await ev("document.querySelector('.cats [data-cat=Map]').click(), true");

  const caja = async () => JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('surface'), r = c.getBoundingClientRect(), b = document.getElementById('map-wide'), br = b ? b.getBoundingClientRect() : null;
    return { h: Math.round(r.height), w: Math.round(r.width), px: c.height, alto: innerHeight, chat: getComputedStyle(document.getElementById('chat')).display,
      boton: b ? { w: Math.round(br.width), h: Math.round(br.height), pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), enBarra: b.parentElement && b.parentElement.id } : null,
      say: (document.getElementById('zoom-state') || {}).textContent || '' }; })())`));

  // 1 · the starting point, measured: the map has about half the window.
  const a = await caja();
  medidas.antes = { alto_mapa: a.h, ventana: a.alto, fraccion: +(a.h / a.alto).toFixed(2) };
  ok(!!a.boton, 'there is no Explore button in the map tools');
  ok(a.boton && a.boton.w >= 44 && a.boton.h >= 44, 'the Explore button is under 44 px: ' + JSON.stringify(a.boton));
  ok(a.boton && a.boton.enBarra === 'zoom-controls' && a.boton.pressed === 'false' && /Explore/.test(a.boton.label || ''), 'the Explore button is not a labelled toggle in the map tools: ' + JSON.stringify(a.boton));
  await foto('g1-antes.png');
  await ev("document.querySelector('.cats [data-cat=Map]').click(), true");

  // The terminal controls belong below the map; panels cover the map, not the conversation.
  const terminal = await ev(`(() => { const stage = document.getElementById('stage'), voices = document.getElementById('voices'),
    bar = document.querySelector('.cats'), chat = document.getElementById('chat'), pad = stage.querySelector('.walk-pad'),
    composer = document.getElementById('entry'), buttons = bar && bar.querySelectorAll('button');
    if (!bar || !pad || !buttons || buttons.length < 2) return null;
    buttons[1].click();
    const out = { panelOnMap: voices.parentElement === stage && !voices.hidden,
      barBelowMap: bar.parentElement.id === 'map' && bar.getBoundingClientRect().top >= stage.getBoundingClientRect().bottom,
      padOnMap: pad.parentElement === stage, chatVisible: getComputedStyle(chat).display !== 'none',
      composerVisible: composer.getBoundingClientRect().height > 0 && composer.getBoundingClientRect().bottom <= innerHeight, pressed: buttons[1].getAttribute('aria-pressed'),
      noInvisibleTargets: !stage.querySelector('#map-proxies, .hitl-mark') };
    buttons[1].click(); out.closed = voices.hidden;
    out.allPanels = Array.from(buttons).every(b => { b.click(); const ok = b.getAttribute('aria-pressed') === 'true' && !voices.hidden &&
      Array.from(voices.querySelectorAll('[data-speaker]')).some(v => v.dataset.cat === b.dataset.cat && getComputedStyle(v).display !== 'none'); b.click(); return ok && voices.hidden; });
    return out; })()`);
  medidas.terminal = terminal;
  ok(terminal && Object.values(terminal).every(v => v === true || v === 'true'), 'terminal layout or panel toggle failed: ' + JSON.stringify(terminal));

  // 2 · Explore: the canvas grows, its pixels follow, and the chat remains available.
  await ev("document.getElementById('map-wide').click(), true"); await espera(700);
  const b = await caja();
  medidas.explore = { alto_mapa: b.h, ventana: b.alto, fraccion: +(b.h / b.alto).toFixed(2), px: b.px, chat: b.chat };
  ok(W < 900 ? b.h > a.h : b.w > a.w, 'Explore did not enlarge the map: ' + JSON.stringify(medidas.explore));
  ok(b.px >= b.h, 'the canvas pixels did not follow the new height (no redraw): ' + JSON.stringify(medidas.explore));
  ok(b.chat !== 'none' && b.boton.pressed === 'true', 'the chat disappeared or the button is not pressed');
  ok(/Explore/.test(b.say), 'Explore is not spoken: ' + b.say);
  await foto('g1-explore.png');

  // 3 · Escape brings the chat back and the map its half.
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await espera(500);
  const c = await caja();
  medidas.escape = { alto_mapa: c.h, chat: c.chat };
  ok(c.chat !== 'none' && c.boton.pressed === 'false' && (W < 900 ? c.h < b.h : c.w < b.w), 'Escape did not restore the map: ' + JSON.stringify(medidas.escape));

  console.log(JSON.stringify({ piece: 'g1-ventana-grande', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'g1-ventana-grande', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
