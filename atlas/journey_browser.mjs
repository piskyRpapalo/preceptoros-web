// JOURNEY-01 · the adventure, walked once as a newcomer would (Mesa #34, ROUND 5). A MEASUREMENT, not a gate: it
// presses only what a person can see on /openworld/ at 360×716 (Chromium), reads the visit's own state after each
// stage, and records for every stage: did it work, what the guide said next, and whether the result was inside the
// first screen. The receipt names the FIRST BREAK of the chain:
//   enter → walk → reward → odds → summon → incubate → hatch → army → fight → return
// Nothing is changed in the page: no hook is added, only listened to (visitor:render) and read.
// Uso: node atlas/journey_browser.mjs   ·   CAPTURA=<folder> keeps a picture per stage   ·   PHONES=<serial> on a phone
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const PHONES = (process.env.PHONES || '').split(',').filter(Boolean);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.bin': 'application/octet-stream' };
const stages = [], errores = [];
function site() {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(PUBLIC, '.' + ruta); if (!f.startsWith(resolve(PUBLIC))) { res.writeHead(403); res.end(); return; }
      if (ruta === '/sw.js') { res.writeHead(404); res.end(); return; }
      const body = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(PHONES.length ? 8811 : 0, '127.0.0.1', () => r(s)));
}
async function attach(wsUrl) {
  const ws = new WebSocket(wsUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined || v === null ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  return { ev, cmd, close: () => { try { ws.close(); } catch {} } };
}
async function open(url) {
  if (PHONES.length) {
    const serial = PHONES[0], adb = (...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8' }).trim();
    adb('reverse', 'tcp:8811', 'tcp:8811'); adb('forward', 'tcp:9701', 'localabstract:chrome_devtools_remote');
    adb('shell', 'am', 'start', '--user', '0', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-a', 'android.intent.action.VIEW', '-d', "'" + url + "'");
    let made = null; for (let i = 0; i < 40 && !made; i++) { await espera(500); try { made = (await (await fetch('http://127.0.0.1:9701/json')).json()).find((x) => x.type === 'page' && x.url.startsWith(url.split('?')[0])); } catch {} }
    if (!made) { throw new Error('NO_DATA: the tab did not open on the phone'); }
    const t = await attach(made.webSocketDebuggerUrl);
    return { ...t, name: adb('shell', 'getprop', 'ro.product.model'), end: async () => { try { await fetch('http://127.0.0.1:9701/json/close/' + made.id); } catch {} t.close(); try { adb('forward', '--remove', 'tcp:9701'); adb('reverse', '--remove', 'tcp:8811'); } catch {} } };
  }
  const port = 9750 + (process.pid % 40), ch = launchChrome(port); let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const t = await attach(lista.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await t.cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  await t.cmd('Page.navigate', { url });
  return { ...t, name: 'chromium:360x716', end: () => { t.close(); ch.close && ch.close(); } };
}
const until = async (t, expr, ms = 15000, every = 150) => { const t0 = Date.now(); let v = null; while (Date.now() - t0 < ms) { v = await t.ev(expr); if (v) { return v; } await espera(every); } return v; };

// What a newcomer can read right now: the guide's next step, the preceptor's bubble, the stage's brief line.
const READ = `(() => { const tx = (s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 160) : null; };
  const pt = document.getElementById('preceptor-talk'); const st = window.__s;
  return { next: tx('#next-text'), bubble: pt && !pt.classList.contains('pt-min') ? tx('#preceptor-talk .pt-line') : null, brief: tx('#ow-brief'), status: tx('#visitor-play > p[role=status]'),
    state: st ? { copper: st.copper, light: st.light, step: st.step, eggs: st.eggs.map((e) => e.remaining), troops: st.troops.length } : null }; })()`;
// fold(selector) → where an element is, and whether a person sees it without scrolling.
const fold = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) { return { exists: false }; } const r = e.getBoundingClientRect();
  let hidden = !e.offsetParent && getComputedStyle(e).position !== 'fixed'; for (let p = e.parentElement; p; p = p.parentElement) { if (p.tagName === 'DETAILS' && !p.open && !(p.firstElementChild && p.firstElementChild.contains(e))) { hidden = true; } }
  return { exists: true, hidden, top: Math.round(r.top), bottom: Math.round(r.bottom), first_screen: !hidden && r.top >= 0 && r.bottom <= innerHeight && r.height > 0, text: e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 120) }; })()`;
// press(sel): only what a person can reach. A control inside a closed panel is not pressed: it is reported unreachable.
const press = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.disabled || !e.offsetParent) { return false; } e.scrollIntoView({ block: 'center' }); e.click(); return true; })()`;
// house(t): the visit's House lives in the «Profile» panel on a phone; a person opens it with the gamepad button.
async function house(t) {
  if (await t.ev(`!!(document.getElementById('visitor-play') && document.getElementById('visitor-play').offsetParent)`)) { return 'already open'; }
  const ok = await t.ev(`(() => { const b = [...document.querySelectorAll('#gamepad button')].find((x) => x.getAttribute('aria-label') === 'Profile'); if (!b) { return false; } b.click(); return true; })()`);
  await espera(300); return ok ? 'opened Profile' : 'NO_DATA: no Profile button';
}
async function closeHouse(t) { await t.ev(`(() => { const v = document.getElementById('voices'); if (v && !v.hidden) { const b = [...document.querySelectorAll('#gamepad button')].find((x) => x.getAttribute('aria-label') === 'Profile'); if (b) { b.click(); } } return true; })()`); await espera(200); }

async function stage(t, name, fn) {
  const before = await t.ev(READ);
  let out; try { out = await fn(before); } catch (e) { out = { ok: false, cause: 'harness: ' + String(e && e.message || e).slice(0, 120) }; }
  const after = await t.ev(READ);
  const row = { stage: name, ok: !!out.ok, cause: out.cause || '', evidence: out.evidence || null, guide_before: before && before.next, guide_after: after && after.next, bubble: after && after.bubble, brief: after && after.brief, state: after && after.state };
  stages.push(row);
  if (process.env.CAPTURA) { const g = await t.cmd('Page.captureScreenshot', { format: 'png' }); if (g.result && g.result.data) { writeFileSync(join(process.env.CAPTURA, 'journey-' + String(stages.length).padStart(2, '0') + '-' + name + '.png'), Buffer.from(g.result.data, 'base64')); } }
  await t.ev(`(window.scrollTo(0, 0), true)`);
  return row;
}
// walk(t, n) → presses the visible direction buttons n times, alternating to stay on walkable floor.
async function walk(t, n) {
  await t.ev(`(() => { const b = document.getElementById('ow-controls'); if (b && b.getAttribute('aria-expanded') !== 'true') { b.click(); } return true; })()`);
  let moved = 0;
  for (let i = 0; i < n * 3 && moved < n; i++) {
    for (const d of ['east', 'west', 'south-east', 'north-west', 'south-west', 'north-east']) {
      const r = await t.ev(`(() => { const s0 = window.__s ? window.__s.step : -1; const b = document.querySelector('#ow-directions button[data-dir="${d}"]'); if (!b) { return null; } b.click(); return { s0, s1: window.__s ? window.__s.step : -1 }; })()`);
      if (r && r.s1 > r.s0) { moved++; break; }
    }
    await espera(30);
  }
  await t.ev(`(() => { const b = document.getElementById('ow-controls'); if (b && b.getAttribute('aria-expanded') === 'true') { b.click(); } return true; })()`);
  return moved;
}

let T = null, srv = null;
async function main() {
  srv = await site();
  const url = `http://127.0.0.1:${srv.address().port}/openworld/?colony=alone`;
  T = await open(url);
  await until(T, `document.readyState === 'complete' && !!document.getElementById('surface')`, 30000);
  await T.ev(`(() => { window.__s = null; window.__game = null; document.getElementById('visitor-play').addEventListener('visitor:render', (e) => { window.__s = e.detail.state; window.__game = e.detail.game; }); return true; })()`);
  await espera(1500);

  await stage(T, 'enter', async () => {
    const play = await T.ev(fold('#play-now')), welcome = await T.ev(fold('#welcome-play')), pad = await T.ev(fold('#gp-play'));
    const target = welcome.exists && !welcome.hidden ? '#welcome-play' : pad.exists && !pad.hidden ? '#gp-play' : '#play-now';
    const ok = await T.ev(press(target)); const s = await until(T, `window.__s`, 10000);
    return { ok: ok && !!s, cause: !ok ? 'no visible Play button' : s ? '' : 'pressing Play started no visit', evidence: { play, welcome, gamepad_play: pad, pressed: target } };
  });
  await stage(T, 'walk', async (b) => {
    const toggle = await T.ev(fold('#ow-controls')), n = await walk(T, 3), s = await T.ev(`window.__s`);
    return { ok: n === 3 && s && s.step === (b.state ? b.state.step : 0) + 3, cause: n === 3 ? '' : 'only ' + n + ' of 3 hexes walked', evidence: { walk_button: toggle, hexes: n } };
  });
  await stage(T, 'reward', async (b) => {
    const at = await T.ev(`(() => { const w = AtlasOpenworldView().controls.walker(); return [w.q, w.r]; })()`), closed = await T.ev(fold('#visitor-beacon')), panel = await house(T);
    const btn = await T.ev(fold('#visitor-beacon')), ok = await T.ev(press('#visitor-beacon')); await espera(400); await closeHouse(T);
    const s = await T.ev(`window.__s`), shown = await T.ev(fold('#ow-brief'));
    const gained = s && b.state && s.copper - b.state.copper;
    return { ok: ok && gained === 100, cause: !ok ? 'the beacon reward button is not there' : gained !== 100 ? 'copper did not rise by 100' : '',
      evidence: { button_before_any_panel: closed, panel, button: btn, crab_at: at, map_place_required: false, result_line: shown, result_says_copper: shown && /copper \+100/.test(shown.text || '') } };
  });
  await stage(T, 'odds', async () => {
    const panel = await house(T);
    const lines = await T.ev(`(() => [...document.querySelectorAll('#visitor-play p')].filter((p) => /odds per thousand/.test(p.textContent)).map((p) => { let hidden = !p.offsetParent; for (let e = p.parentElement; e; e = e.parentElement) { if (e.tagName === 'DETAILS' && !e.open) { hidden = true; } } return { text: p.textContent.slice(0, 90), hidden }; }))()`);
    const btn = await T.ev(fold('#visitor-summon-tc1'));
    const seen = (lines || []).filter((l) => !l.hidden);
    return { ok: seen.length > 0, cause: !lines || !lines.length ? 'no odds line on the page' : seen.length ? '' : 'the odds exist but are folded away (closed details) when the summon button is shown',
      evidence: { panel, odds_lines: (lines || []).length, odds_visible: seen.length, summon_button: btn, label_says_odds: btn && /odds|per thousand/i.test(btn.text || '') } };
  });
  await stage(T, 'summon', async (b) => {
    const panel = await house(T), ok = await T.ev(press('#visitor-summon-tc1')); const s = await until(T, `window.__s && window.__s.eggs.length ? window.__s : null`, 8000); await closeHouse(T);
    return { ok: ok && !!s, cause: !ok ? 'the summon button is missing, hidden or disabled (copper ' + (b.state && b.state.copper) + ')' : s ? '' : 'no egg after summoning', evidence: { panel, eggs: s && s.eggs } };
  });
  await stage(T, 'incubate', async (b) => {
    const need = b.state && b.state.eggs.length ? b.state.eggs[0] : null;
    if (need === null) { return { ok: false, cause: 'no egg to incubate' }; }
    const says = /walk/i.test(b.next || '') && new RegExp(String(need)).test(b.next || '');
    const n = await walk(T, need);
    return { ok: n === need, cause: n === need ? '' : 'only ' + n + ' of ' + need + ' steps walked', evidence: { steps_needed: need, guide_named_the_steps: says } };
  });
  await stage(T, 'hatch', async () => {
    const s = await until(T, `window.__s && window.__s.troops.length ? window.__s : null`, 10000);
    const reveal = await T.ev(`(() => { const d = [...document.querySelectorAll('dialog[open], [role=dialog]:not([hidden])')].map((x) => x.getAttribute('aria-label') || x.id || x.className); return d; })()`);
    return { ok: !!s, cause: s ? '' : 'the ready egg did not hatch into the army', evidence: { open_dialogs: reveal } };
  });
  await stage(T, 'army', async () => {
    const panel = await house(T), s = await T.ev(`window.__s`), shown = await T.ev(fold('#visitor-play .squad, #visitor-play [class*=squad], #terminal-army, #army-visit')); await closeHouse(T);
    return { ok: !!(s && s.troops >= 1 || (s && s.troops && s.troops.length >= 1)), cause: '', evidence: { panel, troops: s && (s.troops.length || s.troops), squad_panel: shown } };
  });
  await stage(T, 'fight', async () => {
    // A person reads «walk to a grey NPC building on the map and challenge it», looks at the map, and taps one.
    await house(T); const legend = await T.ev(fold('#house-fights'));
    // The legend names the Coliseum (practice wave, 2026-11-15): the person taps «Go to the Coliseum» and its card offers the practice.
    if (legend && /Coliseum/.test(legend.text || '') && await T.ev(press('#house-coliseum'))) {
      const offer = await until(T, `(() => { const b = document.getElementById('bs-challenge'); return b ? { text: b.textContent, disabled: b.disabled } : null; })()`, 8000);
      if (!offer) { return { ok: false, cause: 'the Coliseum card offered no practice', evidence: { legend } }; }
      if (offer.disabled) { return { ok: false, cause: 'the practice button is off: ' + offer.text, evidence: { legend, offer } }; }
      const before = await T.ev(`(() => { const c = [...document.querySelectorAll('#voices *')].filter((e) => /^(Fight once|Win a fight)$/.test((e.textContent || '').trim())).map((e) => (e.closest('.card, li, article, section, div') || e).textContent.replace(/\\s+/g, ' ').trim()); return 'held ' + [...document.querySelectorAll('.holdings-news')].map((e) => e.textContent).join(' / ') + ' · conquer ' + !!document.getElementById('visitor-conquer') + ' · ' + (c.join(' | ') || 'NO_DATA: no fight mission found'); })()`);
      await T.ev(press('#bs-challenge'));
      const said = await until(T, `(() => { const p = document.getElementById('visitor-battle-result'); if (!p) { return null; } const d = p.closest('dialog'); const fast = d && [...d.querySelectorAll('button')].filter((b) => /^×/.test(b.textContent)).pop(); if (fast && fast.getAttribute('aria-pressed') !== 'true') { fast.click(); } return /wins|Draw/.test(p.textContent) ? p.textContent : null; })()`, 60000);
      await espera(600); const after = await T.ev(`(() => { const c = [...document.querySelectorAll('#voices *')].filter((e) => /^(Fight once|Win a fight)$/.test((e.textContent || '').trim())).map((e) => (e.closest('.card, li, article, section, div') || e).textContent.replace(/\\s+/g, ' ').trim()); return 'held ' + [...document.querySelectorAll('.holdings-news')].map((e) => e.textContent).join(' / ') + ' · conquer ' + !!document.getElementById('visitor-conquer') + ' · ' + (c.join(' | ') || 'NO_DATA: no fight mission found'); })()`);
      const kept = before === after; // practice gives nothing: no holding, no conquest button, the fight missions unchanged — before and after read the same
      return { ok: !!said && /no reward/.test(said || '') && kept, cause: !said ? 'the practice never told its winner' : !/no reward/.test(said) ? 'the practice result does not say it gives nothing' : kept ? '' : 'the practice changed the visit: ' + before + ' → ' + after, evidence: { legend, offer, result: said, brief_before: before, brief_after: after } };
    }
    await closeHouse(T);
    const grey = await T.ev(`(() => { const V = AtlasMapPainter.view(), cv = document.getElementById('surface'), rc = cv.getBoundingClientRect(), k = rc.width / cv.width;
      const list = (V.world.markList || []).filter((m) => m.fog).map((m) => { const c = V.world.cells.at[m.q + ',' + m.r], h = V.P(m.q, m.r), p = V.turn(h.x, h.y);
        const x = V.G.cx + p.x * V.G.k, y = V.G.cy + p.y * V.G.k - (c ? V.height(c) * V.HSTEP : 0) * V.G.k; return { id: m.id, q: m.q, r: m.r, x: rc.left + x * k, y: rc.top + y * k - 8 }; });
      return { total: list.length, on_screen: list.filter((m) => m.x > rc.left + 10 && m.x < rc.right - 10 && m.y > rc.top + 10 && m.y < rc.bottom - 10) }; })()`);
    if (!grey || !grey.total) { return { ok: false, cause: 'no grey NPC building on the map', evidence: { legend, grey } }; }
    if (!grey.on_screen.length) { return { ok: false, cause: 'no grey NPC building inside the map view; the legend says «walk to one» but the map does not point to any', evidence: { legend, grey_total: grey.total } }; }
    const m = grey.on_screen[0];
    for (const type of ['mousePressed', 'mouseReleased']) { await T.cmd('Input.dispatchMouseEvent', { type, x: m.x, y: m.y, button: 'left', clickCount: 1 }); }
    const offer = await until(T, `(() => { const b = document.getElementById('bs-challenge'); return b ? { text: b.textContent, disabled: b.disabled } : null; })()`, 6000);
    if (!offer) { const sel = await T.ev(`({ sel: document.getElementById('surface').dataset.sel || null, sheet: !document.getElementById('building-sheet').hidden })`); return { ok: false, cause: 'tapping the grey building offered no challenge', evidence: { legend, tapped: m, after_tap: sel } }; }
    await T.ev(press('#bs-challenge'));
    const result = await until(T, `(() => { const p = document.getElementById('visitor-battle-result'); if (!p) { return null; } const d = p.closest('dialog'); const fast = d && [...d.querySelectorAll('button')].filter((b) => /^×/.test(b.textContent)).pop(); if (fast && fast.getAttribute('aria-pressed') !== 'true') { fast.click(); } return /Round by round/.test(p.textContent) ? null : p.textContent; })()`, 60000, 300);
    return { ok: !!result, cause: result ? '' : 'the battle never told its winner', evidence: { legend, tapped: m, offer, result } };
  });
  await stage(T, 'return', async (b) => {
    const ok = await T.ev(`(() => { const b = [...document.querySelectorAll('dialog[open] button')].find((x) => /Return to the map/.test(x.textContent)); if (!b) { return false; } b.click(); return true; })()`);
    await espera(400);
    const map = await T.ev(fold('#surface')), open = await T.ev(`document.querySelectorAll('dialog[open]').length`);
    return { ok: ok && open === 0 && map.exists, cause: !ok ? 'no «Return to the map» button (no battle was shown)' : open ? 'a dialog stays open' : '', evidence: { map, guide_after_fight: b.next } };
  });
}
main().catch((e) => { errores.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); })
  .finally(async () => {
    const first = stages.find((s) => !s.ok) || null;
    console.log(JSON.stringify({ piece: 'journey-01', device: T && T.name, receipt: errores.length ? 'NO_DATA' : 'MEDIDO', first_break: first && { stage: first.stage, cause: first.cause }, passed: stages.filter((s) => s.ok).map((s) => s.stage), stages, errores }));
    try { T && await T.end(); } catch {} srv && srv.close(); process.exitCode = errores.length ? 1 : 0; setTimeout(() => process.exit(), 500).unref();
  });
