// Gamepad (Sovereign, 2026-11-07), proved in a real browser on /openworld/ at the mini app window (420×642) and at a
// phone (360×740). Laws:
// - three pieces only: one status line on top (the place name), the map in the middle, one gamepad at the bottom;
// - the gamepad holds the pan stick (left), the account buttons (middle) and the character stick, off (right):
//   NO_DATA with cause character_not_born, never a fake move;
// - every control is at least 44 px and carries its Acho spectrum (a floor colour); no horizontal overflow;
// - a gamepad button gives a gesture along its curve; with prefers-reduced-motion it stays still;
// - Play on the gamepad starts the visit through the page's own «Play now» (no new function).
// Sabotage: SABOTAJE=sin-gamepad serves map_view_joystick.js without loading gamepad.js ⇒ red.
// Uso: node atlas/gamepad_browser.mjs [carpeta-captura]  (writes gamepad-420.png and gamepad-360.png there)
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
      if (ruta === '/game/map_view_joystick.js' && SAB === 'sin-gamepad') { cuerpo = Buffer.from(String(cuerpo).replace("pad.src = '/game/gamepad.js'; doc.head.appendChild(pad);", '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

const MEDIR = `JSON.stringify((() => {
  const q = (s) => document.querySelector(s), box = (e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const map = q('#map'), top = q('#map > .topbar'), h1 = q('#map-h'), stage = q('#stage'), pad = q('#gamepad');
  if (!pad) return { pad: false };
  const kids = [...map.children].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== 'absolute').map((e) => e.id || e.className);
  const joy = pad.querySelector(':scope > #view-joystick'), mid = pad.querySelector(':scope > .gp-mid'), off = pad.querySelector(':scope > #character-joystick') || pad.querySelector(':scope > .gp-off');
  const walk = off && off.querySelector('button.view-stick');
  const ctrls = [...pad.querySelectorAll('button')].filter((b) => !b.hidden && b.getBoundingClientRect().width > 0);
  const all = [...document.querySelectorAll('#map *')].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('#voices'));
  return { pad: true, kids, top: box(top), h1: box(h1), place: h1.textContent, topOnly: top.children.length === 1 && top.firstElementChild === h1,
    stage: box(stage), gp: box(pad), alto: innerHeight, ancho: innerWidth, scroll: document.documentElement.scrollWidth,
    order: !!joy && !!mid && !!off && joy.nextElementSibling === mid && mid.nextElementSibling === off,
    mid: [...mid.querySelectorAll('button')].filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label')),
    small: ctrls.filter((b) => b.getBoundingClientRect().width < 44 || b.getBoundingClientRect().height < 44).map((b) => b.getAttribute('aria-label')),
    sinEspectro: [...ctrls, ...(off && off.classList.contains('gp-off') ? [off] : [])].filter((b) => !b.classList.contains('gp-acho') || !b.style.getPropertyValue('--gp')).map((b) => b.getAttribute('aria-label') || b.className),
    walk: walk && { label: walk.getAttribute('aria-label'), w: Math.round(walk.getBoundingClientRect().width), group: off.getAttribute('aria-label') },
    offW: off.getBoundingClientRect().width, desbordan: all.filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).length };
})())`;

async function main() {
  medidas.bytes = { gamepad: statSync(join(PUBLIC, 'game/gamepad.js')).size };
  ok(medidas.bytes.gamepad <= 9000, 'gamepad.js over 9000 B: ' + medidas.bytes.gamepad);
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

  for (const [W, H, n] of [[420, 642, '420'], [360, 740, '360']]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
    const m = JSON.parse(await ev(MEDIR)); medidas[n] = m;
    ok(m.pad, n + ': the gamepad is not on the page');
    if (!m.pad) { continue; }
    ok(m.kids.join(',') === 'topbar,stage,gamepad', n + ': the map is not three pieces (status line, map, gamepad): ' + m.kids.join(','));
    ok(m.topOnly && m.h1.h <= 24 && /\S/.test(m.place), n + ': the top is not one thin status line with the place name: ' + JSON.stringify([m.topOnly, m.h1, m.place]));
    ok(m.top.b <= m.stage.t && m.stage.b <= m.gp.t && m.gp.b <= m.alto, n + ': the pieces are not stacked top, map, gamepad inside the window');
    ok(m.stage.h >= m.alto * 0.5, n + ': the map does not take the space: ' + m.stage.h + ' of ' + m.alto);
    ok(m.order, n + ': the gamepad is not pan stick, buttons, character stick');
    ok(m.mid.length >= 3, n + ': the gamepad middle has fewer than 3 account buttons: ' + JSON.stringify(m.mid));
    ok(m.small.length === 0, n + ': gamepad controls under 44 px: ' + JSON.stringify(m.small));
    ok(m.sinEspectro.length === 0, n + ': gamepad controls without an Acho spectrum: ' + JSON.stringify(m.sinEspectro));
    // Decree 2026-11-07, fulfilled 2026-11-08: the right stick is born with the character (the visitor's crab) and walks it.
    ok(m.walk && /Walk your character/.test(m.walk.label) && m.walk.group === 'Character control' && m.walk.w >= 44,
      n + ': the character stick is not a real walking control: ' + JSON.stringify(m.walk));
    ok(m.scroll <= m.ancho && m.desbordan === 0, n + ': horizontal overflow: ' + JSON.stringify([m.scroll, m.ancho, m.desbordan]));
    await foto('gamepad-' + n + '.png');
  }

  // Gesture along the curve, and stillness under reduced motion.
  const gesto = async () => ev(`(() => { const b = document.querySelector('#gamepad .cats [data-cat=Welcome]'); b.click(); const n = b.getAnimations().length; b.click(); return n; })()`);
  medidas.gesto = await gesto();
  ok(medidas.gesto >= 1, 'a gamepad button gives no gesture: ' + medidas.gesto);
  await espera(800);
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  medidas.quieto = await gesto();
  ok(medidas.quieto === 0, 'a gamepad button moves under prefers-reduced-motion: ' + medidas.quieto);

  // Play on the gamepad is the page's own «Play now»: the visit starts and both Play buttons step aside.
  medidas.play = JSON.parse(await ev(`(async () => { const g = document.getElementById('gp-play'), p = document.getElementById('play-now');
    const antes = { gp: !!g && !g.hidden, real: !!p && !p.hidden }; g && g.click();
    for (let i = 0; i < 40 && p && !p.hidden; i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 50));
    return JSON.stringify({ antes, real: !!p && !p.hidden, gp: !!g && !g.hidden, profile: !document.querySelector('#gamepad .cats [data-cat=Profile]').hidden }); })()`));
  const p = medidas.play;
  ok(p.antes.gp && p.antes.real && !p.real && !p.gp && p.profile, 'gamepad Play does not start the visit through Play now: ' + JSON.stringify(p));

  console.log(JSON.stringify({ piece: 'gamepad', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'gamepad', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
