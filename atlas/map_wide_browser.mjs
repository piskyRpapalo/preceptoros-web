// G1 · LA VENTANA GRANDE (odd/tasks/mundo-grande.md, web#608, updated web#924), proved in a real browser on /openworld/ at the edge phone's
// size (360×716 CSS). Laws:
// - before Explore, the map keeps its measured half (this is the starting point, not a law);
// - the Explore button and the view bar are retired (Sovereign, 2026-11-07): the map carries only the two joysticks;
// - openworld_page.js stays under 20 KiB and openworld/index.html under 8 KiB; map_wide.js stays under 4 KiB.
// - WEB #924: Chat Live (Communication) moved to separate TOP #map-communication; lower .cats bar has Welcome only before visit.
// Sabotages: sin-composer removes Chat Live focus; sin-highlight restores the overlapping floating ! on Play. Both must turn red.
// Uso: node atlas/map_wide_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { attachChatHistoryFixture } from './chatlive_history_fixture.mjs';

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
      if (ruta === '/game/terminal_panel.js' && SAB === 'sin-composer') {
        const source = String(cuerpo), anchor = 'input.focus({preventScroll:true});';
        if (!source.includes(anchor)) { throw new Error('NO_DATA(sabotage_anchor_missing)'); }
        cuerpo = Buffer.from(source.replace(anchor, ''));
      }
      if (ruta === '/game/first_adventure.js' && SAB === 'sin-highlight') { cuerpo = Buffer.from(String(cuerpo).replace("bang.hidden = !!el.closest('#gamepad'); if (!bang.hidden) { place(el); }", "bang.hidden = false; place(el);")); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {}, externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
const deMain = (p) => { try { return execFileSync('git', ['show', 'origin/main:' + p], { cwd: RAIZ, maxBuffer: 1 << 24 }).length; } catch { return null; } };

async function main() {
  // Weight law first: the monolith and the page HTML do not grow; the new piece stays small.
  for (const [k, p] of [['openworld_page', 'public/game/openworld_page.js'], ['index_html', 'public/openworld/index.html']]) {
    const ahora = statSync(join(RAIZ, p)).size, enMain = deMain(p);
    medidas[k] = { ahora, main: enMain };
    // [deprecated 2026-11-09] «never grows by one byte» blocked the crab fix; each file keeps a real budget instead.
    ok(ahora <= (k === 'openworld_page' ? 20480 : 8192), p + ' over its budget: ' + ahora);
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
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Network.setBlockedURLs', { urls: ['https://api.preceptoros.org/*'] });
  await attachChatHistoryFixture(cmd);
  await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2500);
  await ev("document.querySelector('.cats [data-cat=Welcome]').click(), true");

  const caja = async () => JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('surface'), r = c.getBoundingClientRect(), b = document.getElementById('map-wide'), br = b ? b.getBoundingClientRect() : null;
    return { h: Math.round(r.height), w: Math.round(r.width), px: c.height, alto: innerHeight, chat: getComputedStyle(document.getElementById('chat')).display,
      boton: b ? { w: Math.round(br.width), h: Math.round(br.height), pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), enBarra: b.parentElement && b.parentElement.id } : null,
      barra: !!document.getElementById('zoom-controls'), flotantes: [...document.querySelectorAll('#map button')].filter((x) => x.closest('.view-joy')).length,
      say: (document.getElementById('zoom-state') || {}).textContent || '' }; })())`));

  // 1 · the starting point, measured: the map has about half the window.
  const a = await caja();
  // In a dense gamepad the tutorial's Play target is highlighted in place; the floating ! must stay hidden.
  const badge = JSON.parse(await ev(`JSON.stringify((() => {
    const b = document.getElementById('fa-bang'), target = document.querySelector('[data-fa-next]');
    if (!b || !target) return { missing: true };
    const x = b.getBoundingClientRect(), t = target.getBoundingClientRect();
    const rect = r => ({ left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) });
    const intersects = (a, z) => Math.min(a.right, z.right) > Math.max(a.left, z.left) && Math.min(a.bottom, z.bottom) > Math.max(a.top, z.top);
    const collisions = [...document.querySelectorAll('button,a,input,textarea,[role="button"]')].filter(e => {
      if (!e.getClientRects().length || e.closest('[hidden]')) return false;
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return s.visibility !== 'hidden' && s.display !== 'none' && r.width >= 8 && r.height >= 8 && intersects(x,r);
    }).map(e => e.id || e.getAttribute('aria-label') || e.textContent.trim().slice(0,35));
    return { visible: !b.hidden, target: target.id, bounds: rect(x), targetBounds: rect(t), highlight: parseFloat(getComputedStyle(target).outlineWidth), collisions };
  })())`));
  medidas.badge = badge;
  const introCard = await ev("document.getElementById('fa').hidden");
  medidas.introCardHidden = introCard;
  ok(introCard && !badge.missing && !badge.visible && badge.target === 'gp-play' && badge.highlight >= 3 && badge.collisions.length === 0,
    'arrival has an extra tutorial card or its ! obscures Play/other controls: ' + JSON.stringify({badge,introCard}));
  medidas.antes = { alto_mapa: a.h, ventana: a.alto, fraccion: +(a.h / a.alto).toFixed(2) };
  // Sovereign order 2026-11-07: the view bar (and with it the Explore button) is gone; only the two joysticks float over the map.
  ok(!a.boton && !a.barra, 'the map still carries a view bar or an Explore button: ' + JSON.stringify([a.boton, a.barra]));
  ok(a.flotantes === 2, 'the map must carry exactly two floating controls, the camera and the character sticks (joystick decree 2026-11-07, fulfilled 2026-11-08): ' + a.flotantes);
  await foto('g1-antes.png');
  await ev("document.querySelector('.cats [data-cat=Welcome]').click(), true");

  // WEB #924: Chat Live (Communication) is in TOP #map-communication; lower .cats bar has Welcome only before visit.
  // Verify: Welcome below, Chat Live top, exact ONE #voices sheet, panel exclusivity, click open/close,
  // composer visible >=44px and focused, no offscreen/overlap, 2 joysticks, single map.
  const terminal = await ev(`(() => { const stage = document.getElementById('stage'), voices = document.getElementById('voices'),
    bar = document.querySelector('#gamepad .gp-mid > .cats'), // lower bar in gamepad: Welcome (visible), Profile/Army (hidden before visit)
    topBar = document.getElementById('map-communication'), // TOP: Chat Live button + channel select
    joy = document.querySelector('#gamepad > #view-joystick'),
    composer = document.getElementById('entry');
    // 1. Lower bar: exactly 1 visible button (Welcome) before visit.
    const lowerButtons = bar && [...bar.querySelectorAll('button')].filter(b => !b.hidden);
    if (!bar || !joy || !topBar || !voices || lowerButtons.length !== 1) return { fail: 'structure', bar: !!bar, lowerButtons: lowerButtons?.length, topBar: !!topBar, joy: !!joy, voices: !!voices };
    const welcome = lowerButtons[0];
    if (welcome.dataset.cat !== 'Welcome') return { fail: 'welcome-not-first', cat: welcome.dataset.cat };
    // 2. TOP bar: Chat Live button present.
    const chatLiveBtn = topBar.querySelector('[data-cat=Communication]');
    if (!chatLiveBtn) return { fail: 'no-chat-live-top' };
    // 3. Exact ONE #voices sheet.
    const voicesCount = document.querySelectorAll('#voices').length;
    if (voicesCount !== 1) return { fail: 'voices-count', count: voicesCount };
    // 4. Panel is on the map (stage), initially closed.
    const panelOnMap = voices.parentElement === stage;
    const initiallyClosed = voices.hidden;
    // 5. Welcome click opens panel, shows Welcome voices, hides others.
    welcome.click();
    const welcomeOpen = !voices.hidden && getComputedStyle(voices).display !== 'none';
    const welcomeVoicesVisible = [...voices.querySelectorAll('[data-speaker]')].some(v => v.dataset.cat === 'Welcome' && getComputedStyle(v).display !== 'none');
    const otherVoicesHidden = [...voices.querySelectorAll('[data-speaker]')].filter(v => v.dataset.cat !== 'Welcome').every(v => getComputedStyle(v).display === 'none');
    // Panel overlaps the map (covers it, not the chat).
    const vRect = voices.getBoundingClientRect(), sRect = stage.getBoundingClientRect();
    const overlapsMap = vRect.top < sRect.bottom;
    // 6. Welcome click again closes.
    welcome.click();
    const welcomeClosed = voices.hidden;
    // 7. Chat Live click: opens panel, composer (#open-chat-text) visible >=44px and focused.
    chatLiveBtn.click();
    const chatOpen = !voices.hidden && getComputedStyle(voices).display !== 'none';
    const chatVoicesVisible = [...voices.querySelectorAll('[data-speaker]')].some(v => v.dataset.cat === 'Communication' && getComputedStyle(v).display !== 'none');
    const chatOtherHidden = [...voices.querySelectorAll('[data-speaker]')].filter(v => v.dataset.cat !== 'Communication').every(v => getComputedStyle(v).display === 'none');
    // Chat Live composer is #open-chat-text (open_talk.js), not #entry (Guide form).
    const chatComposer = document.getElementById('open-chat-text');
    const cRect = chatComposer ? chatComposer.getBoundingClientRect() : { height: 0, bottom: 0, top: 0 };
    const composerVisible = chatComposer && cRect.height >= 44 && cRect.bottom <= innerHeight && cRect.top >= 0;
    const composerFocused = chatComposer && (document.activeElement === chatComposer || chatComposer.contains(document.activeElement));
    // Chat Live button aria-pressed = true.
    const chatPressed = chatLiveBtn.getAttribute('aria-pressed') === 'true';
    // 8. Chat Live click again closes.
    chatLiveBtn.click();
    const chatClosed = voices.hidden;
    // 9. Bar below map.
    const barBelowMap = bar.getBoundingClientRect().top >= stage.getBoundingClientRect().bottom - 1; // the same frame: the pad changes height while a panel is open
    // 10. No invisible targets on stage.
    const noInvisibleTargets = !stage.querySelector(':scope > #map-proxies, :scope > .hitl-mark');
    // 11. Single map canvas (#surface) — other overlay canvases (invocation, fog) are allowed.
    const singleMap = document.getElementById('surface') !== null;
    // 12. No offscreen: voices within viewport.
    const vRect2 = voices.getBoundingClientRect();
    const noOffscreen = vRect2.bottom <= innerHeight && vRect2.right <= innerWidth;
    return { panelOnMap, initiallyClosed, welcomeOpen, welcomeVoicesVisible, otherVoicesHidden, overlapsMap,
      welcomeClosed, chatOpen, chatVoicesVisible, chatOtherHidden, composerVisible, composerFocused,
      chatPressed, chatClosed, barBelowMap, noInvisibleTargets, singleMap, noOffscreen };
  })()`);
  medidas.terminal = terminal;
  const terminalChecks = {
    panelOnMap: 'voices panel not mounted on stage',
    initiallyClosed: 'voices panel not initially closed',
    welcomeOpen: 'Welcome click does not open panel',
    welcomeVoicesVisible: 'Welcome voices not visible when Welcome open',
    otherVoicesHidden: 'non-Welcome voices not hidden when Welcome open',
    overlapsMap: 'panel does not overlap the map',
    welcomeClosed: 'Welcome click does not close panel',
    chatOpen: 'Chat Live click does not open panel',
    chatVoicesVisible: 'Communication voices not visible when Chat Live open',
    chatOtherHidden: 'non-Communication voices not hidden when Chat Live open',
    composerVisible: 'composer not visible >=44px or offscreen when Chat Live open',
    composerFocused: 'composer not focused when Chat Live open',
    chatPressed: 'Chat Live button aria-pressed not true when open',
    chatClosed: 'Chat Live click does not close panel',
    barBelowMap: 'lower bar not below map',
    noInvisibleTargets: 'invisible targets on stage',
    singleMap: 'map canvas #surface missing',
    noOffscreen: 'voices panel offscreen or overlapping viewport'
  };
  if (terminal && terminal.fail) {
    fallos.push('terminal structure failed: ' + JSON.stringify(terminal));
  } else if (terminal) {
    for (const [key, msg] of Object.entries(terminalChecks)) {
      if (terminal[key] !== true) {
        fallos.push(msg + ': ' + JSON.stringify(terminal));
      }
    }
  } else {
    fallos.push('terminal evaluation returned null');
  }

  // No real third-party GET after clicking Chat Live: fixture must have been used.
  const fixtureReads = await ev('window.__chatHistoryFixtureReads');
  ok(Number.isSafeInteger(fixtureReads) && fixtureReads > 0,
    'Chat Live did not use the test-only history fixture: ' + fixtureReads);
  ok(externas.length === 0, 'browser tried to call an external host: ' + externas.slice(0, 3).join(', '));

  console.log(JSON.stringify({ piece: 'g1-ventana-grande', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'g1-ventana-grande', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
