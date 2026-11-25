// The beacon, together, on the real page (COOP-01, Mesa #34, ROUND 5). Two clients on /openworld/ (two Chromium
// processes at 360×716, or two physical phones with PHONES="serialA,serialB"), one TEST authority with the real baked
// floor and a law that admits cooperation. Nobody else is connected, nothing is published, nothing is granted.
// The whole thread, read on PIXELS, words, notes and machine events, never on a click alone:
//   1. far from the beacon, A asks B → the authority refuses (too far) → A's page dims and says why; NO light is drawn
//   2. both walk to the beacon (each hex a signed step the authority accepts)
//   3. A asks → B is offered «Yes» → B says yes → the authority lights the beacon ONCE
//   4. both pages: the same event id, a lamp on the canvas (luminance measured against the unlit frame), BEACON · LIT
//      written on the canvas, the sentence in the live region on the stage (inside the first screen), notes handed to
//      Web Audio, ONE «acho:event» of kind coop.beacon_lit
//   5. B asked for reduced motion: its beacon is already at rest, nothing moves
//   6. A walks away: B is told the move, and the lighting is NOT said again
// Sabotages, each must turn the receipt red: SABOTAJE=rechazo-brilla (a refusal plays the lighting score),
// SABOTAJE=sin-heard (the line forgets which events were said), SABOTAJE=sin-luz (the lamp is never drawn).
// Uso: node atlas/coop_beacon_browser.mjs   |   PHONES="<serialA>,<serialB>" node atlas/coop_beacon_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { authority, realFloor } from './crab_presence_authority.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SAB = process.env.SABOTAJE || '', PHONES = (process.env.PHONES || '').split(',').filter(Boolean);
const num = (k, d) => { const n = Number(process.env[k]); return Number.isSafeInteger(n) && n > 0 ? n : d; };
const TICK_MS = num('TICK_MS', 500), POLL_MS = num('POLL_MS', 300), BEAT_MS = num('BEAT_MS', 1000);
// Experiment parameters, not policy: the beacon admits crabs within 2 hexes; a request waits 40 ticks.
const LAW = { stale_after: 12, gone_after: 24, max_visits: 8, beat_gap: 1, meet_radius: 1, coop_radius: 2, coop_wait: 40 };
const WEB_PORT = num('WEB_PORT', PHONES.length ? 8811 : 0), AUTH_PORT = num('AUTH_PORT', PHONES.length ? 8812 : 0);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = { clients: PHONES.length ? 'two physical phones over adb' : 'two Chromium processes at 360x716', law: LAW };
const ok = (c, que) => { if (!c) { fallos.push(que); } return !!c; };
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const adb = (serial, ...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8' }).trim();
const SABS = {
  'rechazo-brilla': ['/game/coop_beacon.js', "fx = play(S.refused(kind, cause,", "lit = play(S.lit({ id: 'sabotage', who: [], cell: [beacon.q, beacon.r] }), false); fx = play(S.refused(kind, cause,"],
  'sin-heard': ['/game/shared_crabs.js', 'describe(v, id, root.AtlasStateFrames, others, heard)', 'describe(v, id, root.AtlasStateFrames, others)'],
  'sin-luz': ['/game/coop_beacon.js', 'if (L && L.lamp > 0) {', 'if (false) {']
};

function site() {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(PUBLIC, '.' + ruta); if (!f.startsWith(resolve(PUBLIC))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      const sb = SABS[SAB];
      if (sb && ruta === sb[0]) { const t = String(cuerpo); if (!t.includes(sb[1])) { fallos.push('sabotage line not found: ' + SAB); } cuerpo = Buffer.from(t.replace(sb[1], sb[2])); }
      if (ruta === '/sw.js') { res.writeHead(404); res.end(); return; } // no service worker in the experiment
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(WEB_PORT, '127.0.0.1', () => r(s)));
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
async function local(port, url, reduced) {
  const ch = launchChrome(port); let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const t = await attach(lista.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await t.cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  if (reduced) { await t.cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); }
  await t.cmd('Page.navigate', { url });
  return { ...t, name: 'chromium:' + port + (reduced ? ':reduced-motion' : ''), end: () => { t.close(); ch.close && ch.close(); } };
}
async function phone(serial, cdp, url, ports, reduced) {
  ports.forEach((p) => adb(serial, 'reverse', 'tcp:' + p, 'tcp:' + p));
  adb(serial, 'forward', 'tcp:' + cdp, 'localabstract:chrome_devtools_remote');
  adb(serial, 'shell', 'am', 'start', '--user', '0', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-a', 'android.intent.action.VIEW', '-d', "'" + url + "'");
  let made = null;
  for (let i = 0; i < 40 && !made; i++) { await espera(500); try { made = (await (await fetch(`http://127.0.0.1:${cdp}/json`)).json()).find((x) => x.type === 'page' && x.url.startsWith(url.split('?')[0])); } catch {} }
  if (!made) { throw new Error('NO_DATA: the tab did not open on ' + serial); }
  const t = await attach(made.webSocketDebuggerUrl);
  if (reduced) { await t.cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); }
  const model = adb(serial, 'shell', 'getprop', 'ro.product.model');
  return { ...t, name: model + (reduced ? ':reduced-motion' : ''), end: async () => { try { await fetch(`http://127.0.0.1:${cdp}/json/close/${made.id}`); } catch {} t.close(); try { adb(serial, 'forward', '--remove', 'tcp:' + cdp); ports.forEach((p) => adb(serial, 'reverse', '--remove', 'tcp:' + p)); } catch {} } };
}
const until = async (t, expr, ms = 15000, every = 150) => { const t0 = Date.now(); let v = null; while (Date.now() - t0 < ms) { v = await t.ev(expr); if (v) { return v; } await espera(every); } return v; };
// The pixels around the lamp: mean luminance of a 7×7 square at the lamp's point, and the centre colour.
const LAMP = `(() => { const cv = document.getElementById('surface'), b = JSON.parse(cv.dataset.beacon || 'null'); if (!b) { return null; }
  const [x, y] = b.light; if (x < 3 || y < 3 || x > cv.width - 4 || y > cv.height - 4) { return { off_canvas: true, b }; }
  const d = cv.getContext('2d').getImageData(x - 3, y - 3, 7, 7).data; let sum = 0; for (let i = 0; i < d.length; i += 4) { sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; }
  const c = Array.from(cv.getContext('2d').getImageData(x, y, 1, 1).data).slice(0, 3), H = AtlasMapPainter.view().H, paper = H.rgbOf(H.T.NEUTRAL.paper);
  const tg = Array.from(cv.getContext('2d').getImageData(b.tag[0], b.tag[1], 1, 1).data).slice(0, 3);
  return { lum: Math.round(sum / 49), centre: c, paper_centre: c.every((v, i) => Math.abs(v - paper[i]) <= 8), tag_paper: tg.every((v, i) => Math.abs(v - paper[i]) <= 8), b }; })()`;
// Above the fold: the live sentence on the stage must be inside the first screen.
const FOLD = `(() => { const e = document.getElementById('coop-result'); if (!e) { return null; } const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight, inside: r.top >= 0 && r.bottom <= innerHeight }; })()`;

let A = null, B = null, srv = null, au = null;
async function main() {
  const cells = await realFloor();
  if (!ok(cells.beacon, 'NO_DATA: the real floor names no beacon (Model tower)')) { return; }
  medidas.beacon = cells.beacon;
  au = authority({ law: LAW, cells, tick_ms: TICK_MS, port: AUTH_PORT });
  const auth = await au.listen(), authPort = Number(new URL(auth).port); srv = await site();
  const webPort = srv.address().port, url = `http://127.0.0.1:${webPort}/openworld/?colony=alone&presence=${authPort}&poll=${POLL_MS}&beat=${BEAT_MS}`;
  if (PHONES.length === 2) { A = await phone(PHONES[0], 9601, url, [webPort, authPort], false); B = await phone(PHONES[1], 9602, url, [webPort, authPort], true); }
  else { const base = 9600 + (process.pid % 80); [A, B] = await Promise.all([local(base, url, false), local(base + 1, url, true)]); }
  medidas.devices = [A.name, B.name];

  const SPY = `(() => { window.__acho = []; document.addEventListener('acho:event', (e) => window.__acho.push({ id: e.detail.id, kind: e.detail.event ? e.detail.event.kind : 'presence', status: e.detail.event ? e.detail.event.status : null, light: e.detail.score ? e.detail.score.light : null, r: e.detail.frame.atoms[0].r }));
    window.__osc = 0; const P = window.AudioContext || window.webkitAudioContext; if (P && !P.prototype.__spied) { const make = P.prototype.createOscillator; P.prototype.createOscillator = function () { window.__osc++; return make.call(this); }; P.prototype.__spied = true; } return true; })()`;
  const enter = async (t) => {
    await until(t, `document.readyState === 'complete'`, 30000);
    if (await t.ev(`!!(navigator.serviceWorker && navigator.serviceWorker.controller)`)) {
      await t.ev(`(async () => { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); return true; })()`);
      await t.cmd('Page.reload', { ignoreCache: true }); await espera(1500); await until(t, `document.readyState === 'complete'`, 30000);
    }
    if (!ok(await until(t, `!!(window.AtlasSharedCrabs && window.AtlasSharedCrabs.mounted && document.getElementById('play-now'))`, 30000), t.name + ': the page did not mount shared crabs')) { throw new Error('NO_DATA: ' + t.name + ' cannot run'); }
    await t.ev(SPY);
    await t.ev(`(document.getElementById('play-now').click(), true)`); await new Promise((r) => setTimeout(r, 200)); await t.ev(`(document.getElementById('welcome-play') && document.getElementById('welcome-play').offsetParent && document.getElementById('welcome-play').click(), true)`);
    ok(await until(t, `(() => { const b = document.getElementById('shared-crabs-join'); return !!b && !b.hidden; })()`, 20000), t.name + ': no share button');
    ok(await t.ev(`!document.getElementById('coop-beacon')`), t.name + ': the beacon bar must not exist before consent');
    await t.ev(`(document.getElementById('shared-crabs-join').click(), true)`);
    const id = await until(t, `AtlasSharedCrabs.mounted.state().id`, 20000);
    ok(/^crab-[0-9a-f]{8}$/.test(id || ''), t.name + ': the authority did not open the visit');
    ok(await until(t, `!!document.getElementById('coop-beacon') && !!window.AtlasAchoScore`, 10000), t.name + ': the beacon bar did not mount after consent');
    return id;
  };
  const a = await enter(A), b = await enter(B);
  ok(a && b && a !== b, 'two devices must be two crabs');
  medidas.crabs = { [A.name]: a, [B.name]: b };
  const dist = (p) => { const dq = cells.beacon.q - p[0], dr = cells.beacon.r - p[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; };
  const where = (t) => t.ev(`(() => { const w = AtlasOpenworldView().controls.walker(); return [w.q, w.r]; })()`);

  // 1 · Far from the beacon: an ask is refused with its cause and draws no light.
  await until(A, `AtlasSharedCrabs.mounted.state().beacon && AtlasSharedCrabs.mounted.state().beacon.ask`, 10000);
  const far = await where(A); medidas.far = { at: far, hexes: dist(far) };
  if (dist(far) > LAW.coop_radius) {
    const before = await A.ev(LAMP);
    await A.ev(`(document.getElementById('coop-ask').click(), true)`);
    const said = await until(A, `(() => { const t = document.getElementById('coop-result').textContent; return /Refused/.test(t) ? t : null; })()`, 8000);
    await espera(200); const during = await A.ev(LAMP); await espera(600); const after = await A.ev(LAMP);
    const offc = !before || before.off_canvas;
    medidas.refusal = { said, lum: offc ? 'NO_DATA: the beacon is outside this screen; only its state is read' : [before.lum, during && during.lum, after && after.lum], drawn: after && after.b };
    ok(said && /too far from the beacon/.test(said) && /nothing was lit/.test(said), 'A must say the refusal and its cause: ' + said);
    ok(during && after && !during.b.lit && !after.b.lit && during.b.lamp === 0 && after.b.lamp === 0, 'a refusal must draw no lamp: ' + JSON.stringify([during && during.b, after && after.b]));
    if (!offc) { ok(during.lum <= before.lum + 8 && after.lum <= before.lum + 8, 'a refusal must not brighten the pixels: ' + JSON.stringify(medidas.refusal.lum)); }
    ok(await A.ev(`window.__acho.some((e) => e.kind === 'coop.ask' && e.status === 'refused' && e.light === false)`), 'the refusal must reach machines as refused, without light');
    ok((await B.ev(`window.__acho.filter((e) => e.kind === 'coop.beacon_lit').length`)) === 0, 'B must hear nothing of A\'s refused ask');
  } else { medidas.refusal = 'NO_DATA: the visit started within the beacon radius'; }

  // 2 · Both walk to the beacon, hex by hex. Each step is the page's own control; the authority holds the cell.
  const DIRS = { east: [1, 0], 'north-east': [1, -1], 'north-west': [0, -1], west: [-1, 0], 'south-west': [-1, 1], 'south-east': [0, 1] };
  // The way to the beacon: breadth-first over the very floor the authority walks (water and keepout block).
  const free = (q, r) => { const c = cells.at[q + ',' + r]; return !!c && c[3] !== 'water' && c[3] !== 'keepout'; };
  const route = (from) => {
    const key = (p) => p[0] + ',' + p[1], prev = { [key(from)]: null }, queue = [from];
    while (queue.length) {
      const p = queue.shift();
      if (dist(p) <= 1) { const out = []; let k = key(p); while (prev[k]) { out.unshift(prev[k][1]); k = key(prev[k][0]); } return out; }
      for (const d of Object.keys(DIRS)) { const n = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]]; if (!(key(n) in prev) && free(n[0], n[1]) && Math.abs(n[0]) < 40 && Math.abs(n[1]) < 40) { prev[key(n)] = [p, d]; queue.push(n); } }
    }
    return null;
  };
  const approach = async (t, id) => {
    const plan = route(await where(t)), path = [];
    if (!plan) { return { path, at: await where(t), cause: 'NO_DATA: no way to the beacon on this floor' }; }
    for (const d of plan) {
      const p = await where(t), q = await t.ev(`(() => { const C = AtlasOpenworldView().controls; C.step(${JSON.stringify(d)}); const w = C.walker(); return [w.q, w.r]; })()`);
      if (q[0] === p[0] && q[1] === p[1]) { return { path, at: q, cause: 'the page refused ' + d + ' at ' + p }; }
      path.push(d);
      await until(t, `(() => { const s = AtlasSharedCrabs.mounted.state(), c = s.view && s.view.crabs.find((x) => x.id === ${JSON.stringify(id)}); return c && c.q === ${q[0]} && c.r === ${q[1]}; })()`, 5000, 60);
    }
    return { path, at: await where(t) };
  };
  const wa = await approach(A, a), wb = await approach(B, b);
  medidas.walk = { [A.name]: wa, [B.name]: wb, refused_by_authority: au.counts.refused };
  if (!ok(dist(wa.at) <= LAW.coop_radius && dist(wb.at) <= LAW.coop_radius, 'both crabs must reach the beacon: ' + JSON.stringify([wa.at, wb.at]))) { return; }
  await espera(POLL_MS * 3);
  const unlitA = await A.ev(LAMP), unlitB = await B.ev(LAMP);
  medidas.unlit = { [A.name]: unlitA && { lum: unlitA.lum, words: unlitA.b.words }, [B.name]: unlitB && { lum: unlitB.lum, words: unlitB.b.words } };

  // 3 · A asks, B is offered yes, B says yes.
  ok(await until(A, `(() => { const e = document.getElementById('coop-ask'); return e && !e.hidden && e.getBoundingClientRect().height >= 44 ? e.textContent : null; })()`, 8000), 'A must be offered the ask (44 px)');
  await A.ev(`(document.getElementById('coop-ask').click(), true)`);
  const waiting = await until(A, `(() => { const t = document.getElementById('coop-result').textContent; return /waiting for their yes/.test(t) ? t : null; })()`, 8000);
  const offered = await until(B, `(() => { const e = document.getElementById('coop-yes'); return e && !e.hidden && e.getBoundingClientRect().height >= 44 ? { text: e.textContent, said: document.getElementById('coop-result').textContent } : null; })()`, 8000);
  const asked = await B.ev(LAMP);
  medidas.ask = { a_says: waiting, b_offered: offered, b_words_on_canvas: asked && asked.b.words, b_lum: asked && asked.lum };
  ok(waiting, 'A must say it waits for the yes'); ok(offered && /asks you to light the beacon/.test(offered.said), 'B must be told and offered yes');
  ok(asked && !asked.b.lit && asked.lum <= unlitB.lum + 8, 'a request must draw no light: ' + JSON.stringify(asked && [asked.lum, unlitB.lum]));
  const osc0 = { a: await A.ev(`window.__osc`), b: await B.ev(`window.__osc`) };
  const t0 = Date.now();
  await B.ev(`(document.getElementById('coop-yes').click(), true)`);

  // 4 · Both pages: one event, lit in pixels, words, notes and machine.
  const litA = await until(A, `(() => { const b = JSON.parse(document.getElementById('surface').dataset.beacon || 'null'); return b && b.lit ? b : null; })()`, 8000, 50);
  const msA = Date.now() - t0;
  const litB = await until(B, `(() => { const b = JSON.parse(document.getElementById('surface').dataset.beacon || 'null'); return b && b.lit ? b : null; })()`, 8000, 50);
  const msB = Date.now() - t0;
  const reducedB = litB && litB.moving === false && litB.lamp === 1;
  if (process.env.CAPTURA) { await espera(300); for (const t of [A, B]) { const g = await t.cmd('Page.captureScreenshot', { format: 'png' }); if (g.result && g.result.data) { writeFileSync(join(process.env.CAPTURA, 'coop-beacon-' + t.name.replace(/\W+/g, '') + '.png'), Buffer.from(g.result.data, 'base64')); } } }
  await espera(2200);   // longer than the score: both at rest now
  const read = async (t, unlit) => {
    const px = await t.ev(LAMP), fold = await t.ev(FOLD);
    const said = await t.ev(`document.getElementById('coop-result').textContent`);
    const ev = await t.ev(`window.__acho.filter((e) => e.kind === 'coop.beacon_lit' && e.status === 'accepted')`);
    return { id: px && px.b.id, words: px && px.b.words, lum: px && px.lum, unlit: unlit && unlit.lum, centre_is_lamp: px && px.paper_centre, tag_visible: px && px.tag_paper, said, fold, events: ev.map((e) => e.id), notes: (await t.ev(`window.__osc`)) };
  };
  const ra = await read(A, unlitA), rb = await read(B, unlitB);
  medidas.lit = { authority_event: au.lit.map((l) => ({ id: l.id, served_ms: l.served })), seen_ms: { [A.name]: litA ? msA : null, [B.name]: litB ? msB : null }, [A.name]: ra, [B.name]: rb, reduced_motion_at_rest_on_first_frame: reducedB };
  ok(au.lit.length === 1, 'the authority must light exactly once: ' + au.lit.length);
  const eid = au.lit[0] && au.lit[0].id;
  for (const [t, r, osc] of [[A, ra, osc0.a], [B, rb, osc0.b]]) {
    ok(r.id === eid, t.name + ': the page must draw the authority\'s event id: ' + JSON.stringify([r.id, eid]));
    ok(r.words === 'BEACON · LIT' && r.tag_visible, t.name + ': BEACON · LIT must be written and visible on the canvas');
    ok(r.centre_is_lamp && r.lum >= r.unlit + 40, t.name + ': the lamp must light the pixels (luminance ' + r.unlit + ' → ' + r.lum + ')');
    ok(/The beacon is lit: you and \w{4} lit it together\./.test(r.said || ''), t.name + ': the live sentence must say who lit it: ' + r.said);
    ok(r.fold && r.fold.inside, t.name + ': the sentence must be inside the first screen: ' + JSON.stringify(r.fold));
    ok(r.events.length === 1 && r.events[0] === eid, t.name + ': ONE acho:event coop.beacon_lit with the authority id: ' + JSON.stringify(r.events));
    ok(r.notes > osc, t.name + ': the lighting must hand notes to Web Audio (' + osc + ' → ' + r.notes + ')');
  }
  ok(reducedB, B.name + ': with reduced motion the beacon must be at rest on its first lit frame: ' + JSON.stringify(litB));

  // 6 · A walks away: B hears the move, and the lighting is not said again.
  const away = Object.keys(DIRS).find(() => true);
  const p = await where(A);
  const order = Object.keys(DIRS).sort((x, y) => dist([p[0] + DIRS[y][0], p[1] + DIRS[y][1]]) - dist([p[0] + DIRS[x][0], p[1] + DIRS[x][1]]));
  for (const d of order) { const q = await A.ev(`(() => { const C = AtlasOpenworldView().controls; C.step(${JSON.stringify(d)}); const w = C.walker(); return [w.q, w.r]; })()`); if (q[0] !== p[0] || q[1] !== p[1]) { break; } }
  void away;
  const moved = await until(B, `(() => { const n = window.__acho.filter((e) => e.kind === 'presence'); return n.length && / (farther|nearer)/.test(n[n.length - 1].r) ? n.map((e) => e.r) : null; })()`, 6000, 100);
  const told = await B.ev(`window.__acho.filter((e) => e.kind === 'presence' && /The beacon is lit:/.test(e.r)).length`);
  medidas.after = { b_lines_after_move: moved && moved.slice(-2), lighting_said_times: told };
  ok(moved, 'B must be told that A moved after the lighting');
  ok(told === 1, 'the presence line must say the lighting ONCE, by its id: ' + told);
  const still = await B.ev(LAMP);
  ok(still && still.b.lit && still.lum >= unlitB.lum + 40, 'the beacon must stay lit after the crabs move');
  medidas.authority = { open: au.counts.open, step: au.counts.step, view: au.counts.view, refused: au.counts.refused };
}
main().catch((e) => { fallos.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); })
  .finally(async () => {
    console.log(JSON.stringify({ piece: 'coop-beacon-on-the-page', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
    try { A && await A.end(); B && await B.end(); } catch {} srv && srv.close(); au && await au.close(); process.exitCode = fallos.length ? 1 : 0; setTimeout(() => process.exit(), 500).unref();
  });
