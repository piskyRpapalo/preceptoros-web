// OpenWorld on a phone-sized screen, one visitor, five widths (2026-11-22, measured defect on the S110 at 360 px):
// the tutorial, Visitors, the beacon bar and the preceptor's note stacked over the map, Share/Players/Nodes covered the
// preceptor's line, and a tap meant for the map could land on the consent row and withdraw the sharing.
// The page is the real public/ tree served AS https://preceptoros.org (CDP Fetch interception), so the production
// online config runs; https://api.preceptoros.org is answered by the loopback TEST authority. Nothing reaches production.
// Proved per width (320, 360, 390, 420, 780): no two visible floating cards overlap; every visible online control is
// ≥ 44 px; Share → Players → Nodes by Tab; once LIVE the consent row is gone, taps over the panel's free area and
// on the map keep the visit LIVE (a map tap only closes the panel); value, seal and cause agree in text, data-* and
// the Acho frame; Welcome, Help and Listen are still on the page; «Disconnect my visit» withdraws and says why.
// Sabotage: SABOTAJE=consentimiento (the consent row stays while shared) ⇒ red; SABOTAJE=pie (the beacon bar keeps the
// stage foot under Share/Players/Nodes) ⇒ red. Uso: node atlas/openworld_overlap_browser.mjs
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { authority, realFloor } from './crab_presence_authority.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SAB = process.env.SABOTAJE || '', WIDTHS = [320, 360, 390, 420, 780];
const LAW = { stale_after: 40, gone_after: 80, max_visits: 8, beat_gap: 1 };
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.woff2': 'font/woff2' };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = {};
const ok = (c, que) => { if (!c) { fallos.push(que); } return !!c; };

function body(ruta) {
  let b = readFileSync(resolve(PUBLIC, '.' + ruta));
  if (ruta === '/game/shared_crabs.js' && SAB === 'consentimiento') { b = Buffer.from(String(b).replace("if (cl) { cl.hidden = !!me; }", 'if (cl) { cl.hidden = false; }')); }
  if (ruta === '/game/openworld_online.css' && SAB === 'pie') { b = Buffer.from(String(b).replace('#stage > #coop-beacon{bottom:56px!important}', '')); }
  return b;
}

async function attach(wsUrl, auth) {
  const ws = new WebSocket(wsUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', async (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
    if (d.method !== 'Fetch.requestPaused') { return; }
    const p = d.params, u = new URL(p.request.url);
    if (u.host === 'api.preceptoros.org') {            // the loopback TEST authority answers for the public one
      const cors = [{ name: 'access-control-allow-origin', value: 'https://preceptoros.org' }, { name: 'access-control-allow-headers', value: 'content-type' }, { name: 'content-type', value: 'application/json' }];
      if (p.request.method === 'OPTIONS') { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 204, responseHeaders: cors }); return; }
      const r = await fetch(auth + u.pathname, { method: 'POST', body: p.request.postData || '' });
      cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: cors, body: Buffer.from(await r.text()).toString('base64') });
      return;
    }
    let ruta = decodeURIComponent(u.pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
    if (ruta === '/sw.js') { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 404, body: '' }); return; } // nothing cached
    try { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: tipos[extname(ruta)] || 'text/plain' }, { name: 'cache-control', value: 'no-store' }], body: body(ruta).toString('base64') }); }
    catch { cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 404, body: '' }); }
  });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Fetch.enable', { patterns: [{ urlPattern: 'https://preceptoros.org/*', requestStage: 'Request' }, { urlPattern: 'https://api.preceptoros.org/*', requestStage: 'Request' }] });
  return { ev, cmd, close: () => { try { ws.close(); } catch {} } };
}
const until = async (t, e, ms = 20000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(e)) { return true; } await espera(200); } return false; };
const tap = (t, x, y) => t.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }).then(() => t.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
const key = (t, k, code) => t.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: code === 'Tab' ? 9 : 27 }).then(() => t.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }));

// The floating cards that may sit over the map; two visible ones must not overlap (a 4 px touch is tolerated).
const CARDS = "['fa','online-actions','online-players','online-nodes','coop-beacon','preceptor-talk','building-sheet','settings-sheet']";
const overlaps = `(() => { const ids = ${CARDS}, R = {};
  ids.forEach((id) => { const e = document.getElementById(id); if (!e) return; const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (e.hidden || cs.display === 'none' || cs.visibility === 'hidden' || r.width < 2 || r.height < 2) return; R[id] = r; });
  const out = [], k = Object.keys(R);
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = R[k[i]], b = R[k[j]];
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (x > 4 && y > 4) out.push(k[i] + '×' + k[j]); }
  return { visible: k, overlaps: out }; })()`;
const small = `[...document.querySelectorAll('#online-actions button, #online-panels button, #online-panels select')]
  .filter((e) => !e.hidden && e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'))
  .map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 43.5 || x[2] < 43.5)`;
const status = `(() => { const s = document.getElementById('online-status'); let f = null; try { f = JSON.parse(s.dataset.acho); } catch {}
  return { text: s.textContent, state: s.dataset.state, cause: s.dataset.cause, role: s.getAttribute('role'), live: s.getAttribute('aria-live'), acho_seal: f && f.seal, acho_sentence: f && (f.sentence || f.text || null) }; })()`;

const floor = await realFloor();
const auth = authority({ law: LAW, cells: floor, genesis: true });
const authUrl = await auth.listen();
const ch = launchChrome(0); let lista = null, cdp = 0;
try { cdp = await ch.debugPort(); } catch {}
for (let i = 0; i < 60 && cdp && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdp}/json`)).json(); } catch {} }
if (!lista) { console.log(JSON.stringify({ piece: 'openworld-overlap', receipt: 'NO_DATA', cause: ch.diagnostic() })); process.exit(1); }
const t = await attach(lista.find((x) => x.type === 'page').webSocketDebuggerUrl, authUrl);
try {
  for (const w of WIDTHS) {
    const m = medidas[w] = {}, h = w > 600 ? 900 : 760;
    await t.cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 600 });
    await t.cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await t.cmd('Storage.clearDataForOrigin', { origin: 'https://preceptoros.org', storageTypes: 'all' });
    await t.cmd('Page.navigate', { url: 'https://preceptoros.org/openworld/?colony=alone&poll=300&beat=1000' });
    if (!ok(await until(t, `!!(window.AtlasOpenworldView && document.getElementById('online-share') && document.getElementById('gp-play'))`, 40000), w + ': the page did not load')) { continue; }
    m.welcome_help_listen = await t.ev(`({ welcome: !!document.getElementById('sheet-welcome'), listen: !!document.getElementById('listen'), help: !!document.querySelector('#entry-tools, [data-cat=Help], #help') })`);
    ok(m.welcome_help_listen.welcome && m.welcome_help_listen.listen && m.welcome_help_listen.help, w + ': Welcome/Help/Listen lost');
    await t.ev(`document.getElementById('gp-play').click()`); await espera(400);
    // Codex 2026-11-24 regression: Play never creates an account by itself; it reopens the one HITL entry.
    ok(await t.ev(`!document.getElementById('visitor-beacon') && !document.getElementById('visitor-step') && window.AtlasVisitorGhost === true`), w + ': Play created a visit without the HITL signature');
    await t.ev(`(() => { for (const s of ['#play-now', '#visitor-start']) { const e = document.querySelector(s); if (e && e.offsetParent) { e.click(); return s; } } return null; })()`); await espera(200);
    await t.ev(`document.getElementById('welcome-play') && document.getElementById('welcome-play').offsetParent && document.getElementById('welcome-play').click()`);
    ok(await until(t, `!!document.getElementById('visitor-step')`), w + ': the visit did not start');
    await espera(400);
    // Keyboard: Players → Nodes in that order (Share lives in Settings since 2026-11-23, ow_topbar.js).
    await t.ev(`document.getElementById('online-players-toggle').focus()`); const k1 = await t.ev(`document.activeElement && document.activeElement.id`);
    await key(t, 'Tab', 'Tab'); const k2 = await t.ev(`document.activeElement && document.activeElement.id`);
    m.tab = [k1, k2]; ok(k1 === 'online-players-toggle' && k2 === 'online-nodes-toggle', w + ': Tab order ' + m.tab);
    // Open Visitors with Share (tutorial still running): cards apart, controls ≥ 44 px, ARIA in step with the panel.
    await t.ev(`document.getElementById('online-share').click()`); await espera(500);
    m.open = await t.ev(overlaps); ok(!m.open.overlaps.length, w + ': overlap with Visitors open ' + m.open.overlaps);
    m.small = await t.ev(small); ok(!m.small.length, w + ': under 44 px ' + JSON.stringify(m.small));
    ok(await t.ev(`document.getElementById('online-players-toggle').getAttribute('aria-expanded') === 'true' && !document.getElementById('online-players').hidden`), w + ': aria-expanded out of step');
    // One HITL (2026-11-24): the signed visit shares by itself, no box; Share only if it has not started yet.
    await t.ev(`(() => { const b = document.getElementById('online-share'); if (b && !b.disabled) b.click(); })()`);
    ok(await until(t, `document.getElementById('online-status').dataset.state === 'LIVE'`), w + ': the visit never became LIVE');
    m.live = await t.ev(status);
    ok(m.live.role === 'status' && m.live.live === 'polite', w + ': status is not announced');
    ok(m.live.acho_seal === m.live.state && m.live.cause === '', w + ': seal/cause disagree ' + JSON.stringify(m.live));
    m.no_second_consent = await t.ev(`!document.querySelector('#online-players input[type=checkbox]')`);
    ok(m.no_second_consent === true, w + ': Players asks for a second consent');
    // Stray taps over the panel's free area (everything but its buttons and list): the visit stays LIVE and consented.
    const grid = await t.ev(`(() => { const r = document.getElementById('online-players').getBoundingClientRect(), pts = [];
      for (let y = r.top + 6; y < r.bottom - 4; y += 14) for (let x = r.left + 6; x < r.right - 4; x += 22) { const e = document.elementFromPoint(x, y); if (e && !e.closest('button, a, select, li')) pts.push([Math.round(x), Math.round(y)]); }
      // the gate's 18-minute budget (2026-11-22): an even sample of 10 points covers the panel's free area
      const k = Math.max(1, Math.floor(pts.length / 10)); return pts.filter((_, i) => i % k === 0).slice(0, 10); })()`);
    let tapped = 0;
    for (const [x, y] of grid) { // the list reflows on every poll: a point is re-read just before its tap
      if (await t.ev(`(() => { const e = document.elementFromPoint(${x}, ${y}); if (!e || !e.closest('#online-players') || e.closest('button, a, select, li')) return false;
        // Chrome's touch adjustment snaps a tap within reach of a control onto it (on phones too): keep 24 px clear of every control.
        return ![...document.querySelectorAll('#online-players :is(button, a, select)')].some((c) => { const r = c.getBoundingClientRect(); return r.width && ${x} > r.left - 24 && ${x} < r.right + 24 && ${y} > r.top - 24 && ${y} < r.bottom + 24; }); })()`)) { await tap(t, x, y); tapped++; } }
    await espera(400);
    m.stray = { taps: tapped, after: await t.ev(status) };
    ok(m.stray.after.state === 'LIVE', w + ': a stray tap withdrew the sharing ' + JSON.stringify(m.stray.after));
    // A tap on the visible map closes the open panel and nothing else (no step, sharing stays).
    const before = await t.ev(`(() => { const c = AtlasOpenworldView().controls.walker(); return c ? [c.q, c.r] : null; })()`);
    const free = await t.ev(`(() => { const s = document.getElementById('surface'), r = s.getBoundingClientRect(); for (let y = r.top + 10; y < r.bottom - 10; y += 12) for (let x = r.left + 10; x < r.right - 10; x += 12) { if (document.elementFromPoint(x, y) === s) return [Math.round(x), Math.round(y)]; } return null; })()`);
    if (ok(!!free, w + ': no free map point with Visitors open')) {
      await tap(t, free[0], free[1]); await espera(600);
      m.map_tap = { closed: await t.ev(`document.getElementById('online-players').hidden`), state: (await t.ev(status)).state, moved: JSON.stringify(before) !== JSON.stringify(await t.ev(`(() => { const c = AtlasOpenworldView().controls.walker(); return c ? [c.q, c.r] : null; })()`)) };
      ok(m.map_tap.closed && m.map_tap.state === 'LIVE' && !m.map_tap.moved, w + ': a map tap did more than close the panel ' + JSON.stringify(m.map_tap));
    }
    // Panel closed: the preceptor's note, the beacon bar and Share/Players/Nodes keep apart.
    await espera(500);
    m.closed = await t.ev(overlaps);
    if (process.env.CAPTURA) { const s = await t.cmd('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(process.env.CAPTURA + '/ov-' + w + '.png', Buffer.from(s.result.data, 'base64')); } ok(!m.closed.overlaps.length, w + ': overlap with panels closed ' + m.closed.overlaps);
    // Withdraw by the named button: said, sealed, and it does not come back by itself.
    await t.ev(`(() => { document.getElementById('online-players-toggle').click(); document.getElementById('online-disconnect').click(); })()`);
    await espera(500);
    await espera(1500);
    m.withdrawn = await t.ev(status);
    ok(m.withdrawn.state === 'NO_DATA' && /visitor_disconnected/.test(m.withdrawn.cause), w + ': withdrawal not said or undone by itself ' + JSON.stringify(m.withdrawn));
  }
} catch (e) { fallos.push('exception: ' + String(e).slice(0, 200)); }
t.close(); await ch.close(); await auth.close();
const receipt = fallos.length ? 'ROJO' : 'VERDE';
console.log(JSON.stringify({ piece: 'openworld-overlap', sabotaje: SAB || null, receipt, fallos, medidas }));
process.exitCode = receipt === 'VERDE' ? 0 : 1;
