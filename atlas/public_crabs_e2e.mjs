// N crabs on the PUBLIC site (https://preceptoros.org/openworld/) through the PUBLIC presence authority — the real
// multiplayer road, not the loopback rehearsal of shared_crabs_browser.mjs. Each crab is a person's visit: Play, the
// consent box, «Share». Then every crab walks one hex and every other crab must hold it at that cell, LIVE; then one
// page closes and the others must read it STALE, then gone; with 3+ clients a second one disconnects and reconnects
// (instant re-open refused as visit_already_open; after the TTL the same ephemeral visit returns as the same crab). Short on purpose (~2 min): the authority runs on a daily
// request quota (2026-11-23), and shared_crabs.js paces its looks (pace(): 1 s together, 4 s alone).
// Clients: N local Chromium processes (CRABS=3 default) and, with PHONES="<serial>[,<serial>]", the Chrome of those
// phones over adb (DevTools socket forwarded; the phone opens the public URL like a person would).
// Prints one JSON receipt { piece, receipt VERDE|ROJO, medidas, fallos }. Nothing is published; visits are ephemeral.
// FULL=1 adds the whole tutorial, walked by every shared crab at once (pressing only the «!»).
// Uso: node atlas/public_crabs_e2e.mjs   |   FULL=1 node atlas/public_crabs_e2e.mjs   |   CRABS=2 PHONES=<serial> …
import { execFileSync } from 'node:child_process';
import { launchChrome } from './chrome_launch.mjs';

const URL0 = process.env.URL || 'https://preceptoros.org/openworld/';
const PHONES = (process.env.PHONES || '').split(',').filter(Boolean), APPS = (process.env.APPS || '').split(',').filter(Boolean);
const CRABS = Math.max(0, Number(process.env.CRABS || 3) - PHONES.length - APPS.length);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = { url: URL0, clients: [] };
const ok = (c, que) => { if (!c) { fallos.push(que); } return !!c; };
const adb = (serial, ...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8' }).trim();

async function attach(wsUrl) {
  const ws = new WebSocket(wsUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  // A DevTools call that never answers (a paused WebView, a closed socket) used to hang the whole run with no receipt
  // (FULL=1 with the APP, 2026-11-24: killed by the outer timeout, nothing printed). Now each call has a deadline and a
  // closed socket fails every pending call — the receipt names the call and the client instead of going silent.
  const CDP_MS = Number(process.env.CDP_MS || 45000);
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id).ok(d); pend.delete(d.id); } });
  ws.addEventListener('close', () => { for (const [, p] of pend) { p.no(new Error('CDP socket closed during ' + p.method)); } pend.clear(); });
  const cmd = (method, params = {}) => new Promise((ok, no) => {
    const i = ++id, timer = setTimeout(() => { pend.delete(i); no(new Error('CDP no answer in ' + CDP_MS + ' ms: ' + method + ' ' + String(params.expression || params.url || '').slice(0, 90))); }, CDP_MS);
    pend.set(i, { method, ok: (d) => { clearTimeout(timer); ok(d); }, no: (e) => { clearTimeout(timer); no(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  return { ev, cmd, close: () => { try { ws.close(); } catch {} } };
}
async function local(port) {
  const ch = launchChrome(port); let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const t = await attach(lista.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await t.cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 2, mobile: true });
  await t.cmd('Page.navigate', { url: URL0 });
  return { ...t, name: 'chromium:' + port, gone: () => t.cmd('Page.navigate', { url: 'about:blank' }), end: () => { t.close(); ch.close && ch.close(); } };
}
// app(cdp) → the OpenWorld page already open INSIDE the PreceptorOS APP (OpenWorldActivity's WebView), reached through
// its DevTools socket (adb forward tcp:<cdp> localabstract:webview_devtools_remote_<pid>; debuggable builds only).
// It is not reloaded: the APP opened it the way a person does (Open World → Explore public Open World).
async function app(cdp) {
  const made = (await (await fetch(`http://127.0.0.1:${cdp}/json`)).json()).find((x) => x.type === 'page' && x.url.startsWith(URL0));
  if (!made) { throw new Error('NO_DATA: no OpenWorld page inside the APP on ' + cdp); }
  const t = await attach(made.webSocketDebuggerUrl), ua = await t.ev('navigator.userAgent');
  return { ...t, name: 'APP-webview:' + cdp + (/; wv\)/.test(ua || '') ? '' : '?'), gone: () => t.ev(`(document.getElementById('online-disconnect').click(), true)`), end: () => t.close() };
}
async function phone(serial, cdp) {
  adb(serial, 'forward', 'tcp:' + cdp, 'localabstract:chrome_devtools_remote');
  adb(serial, 'shell', 'am', 'start', '--user', '0', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-a', 'android.intent.action.VIEW', '-d', "'" + URL0 + "'");
  let made = null;
  for (let i = 0; i < 40 && !made; i++) { await espera(500); try { made = (await (await fetch(`http://127.0.0.1:${cdp}/json`)).json()).find((x) => x.type === 'page' && x.url.startsWith(URL0)); } catch {} }
  if (!made) { throw new Error('NO_DATA: the tab did not open on ' + serial); }
  const t = await attach(made.webSocketDebuggerUrl);
  return { ...t, name: adb(serial, 'shell', 'getprop', 'ro.product.model'), gone: () => t.cmd('Page.navigate', { url: 'about:blank' }),
    end: async () => { try { await fetch(`http://127.0.0.1:${cdp}/json/close/${made.id}`); } catch {} t.close(); try { adb(serial, 'forward', '--remove', 'tcp:' + cdp); } catch {} } };
}
const until = async (t, expr, ms = 20000, every = 250) => { const t0 = Date.now(); let v = null; while (Date.now() - t0 < ms) { try { v = await t.ev(expr); } catch { v = null; } if (v) { return v; } await espera(every); } return v; };
const STATE = `(() => { const m = window.AtlasSharedCrabs && AtlasSharedCrabs.mounted; return m ? m.state() : null; })()`;

let T = [];
async function enter(t) {
  ok(await until(t, `document.readyState === 'complete' && !!(window.AtlasSharedCrabs && AtlasSharedCrabs.mounted && document.getElementById('play-now'))`, 40000), t.name + ': shared crabs not mounted');
  await t.ev(`(document.getElementById('play-now').click(), true)`);
  ok(await until(t, `!!document.getElementById('visitor-beacon')`, 60000), t.name + ': the visit did not start after Play'); // an old WebView signs with ed25519_lite: loading it and making the key takes seconds
  await until(t, `(() => { const b = document.getElementById('online-share'); return !!b && !b.disabled; })()`, 30000); // a reused page (the APP's) may keep Share busy a moment; the crab id below is the proof
  await t.ev(`(() => { const c = document.getElementById('online-consent'); if (!c.checked) { c.click(); } document.getElementById('online-share').click(); return true; })()`);
  const id = await until(t, `(() => { const s = ${STATE}; return s && s.id; })()`, 30000);
  ok(/^crab-[0-9a-f]{8}$/.test(id || ''), t.name + ': the public authority did not open the visit: ' + JSON.stringify(await t.ev(`({ line: document.getElementById('online-status').textContent, cause: document.getElementById('online-status').dataset.cause })`)));
  return id;
}
async function main() {
  for (let i = 0; i < CRABS; i++) { T.push(await local(9700 + (process.pid % 50) * 4 + i)); }
  for (let i = 0; i < PHONES.length; i++) { T.push(await phone(PHONES[i], 9690 + i)); }
  for (const p of APPS) { T.unshift(await app(p)); } // the APP crab first: it is the one that later leaves
  medidas.clients = T.map((t) => t.name);
  const ids = []; for (const t of T) { ids.push(await enter(t)); }
  medidas.crabs = ids; ok(new Set(ids).size === T.length && ids.every(Boolean), 'every client must be its own crab: ' + JSON.stringify(ids));
  // Everyone sees everyone LIVE.
  const all = async (t, me) => until(t, `(() => { const s = ${STATE}, v = s && s.view; if (!v) { return null; } const live = v.crabs.filter((c) => c.seal === 'LIVE').map((c) => c.id); return ${JSON.stringify(ids)}.every((x) => live.includes(x)) ? live.length : null; })()`, 30000);
  medidas.everyone_sees = await Promise.all(T.map((t, i) => all(t, ids[i])));
  medidas.everyone_sees.forEach((n, i) => ok(n >= T.length, T[i].name + ' does not see all ' + T.length + ' crabs LIVE'));
  // Each walks one hex; each other must hold it at the new cell.
  medidas.steps = [];
  for (let i = 0; i < T.length; i++) {
    const moved = await T[i].ev(`(() => { const C = AtlasOpenworldView().controls, w0 = C.walker(); for (const d of ['east', 'south-east', 'north-east', 'west']) { C.step(d); const w = C.walker(); if (w.q !== w0.q || w.r !== w0.r) { return { d, to: [w.q, w.r] }; } } return null; })()`);
    if (!ok(moved, T[i].name + ' could not walk')) { continue; }
    const t0 = Date.now();
    const seen = await Promise.all(T.map((o, j) => j === i ? true : until(o, `(() => { const s = ${STATE}, c = s && s.view && s.view.crabs.find((x) => x.id === ${JSON.stringify(ids[i])}); return c && c.q === ${moved.to[0]} && c.r === ${moved.to[1]} ? c.seal : null; })()`, 15000, 200)));
    medidas.steps.push({ who: T[i].name, to: moved.to, seen_by_all_ms: Date.now() - t0, seals: seen });
    seen.forEach((s, j) => ok(j === i || s === 'LIVE', T[j].name + ' does not hold ' + T[i].name + ' at ' + moved.to.join(',')));
  }
  // FULL=1 · the full journey (Sovereign 2026-11-24 «hasta el full recorrido»): every shared crab, at once, finishes the
  // whole tutorial pressing only the blinking «!» ([data-fa-next]) — practice, conquest, town, explore — and stays
  // shared the whole way; at the end each sees every other LIVE at the cell where that one actually stands.
  if (process.env.FULL) {
    const LOOK = `(() => { const e = document.querySelector('[data-fa-next]'), fa = document.getElementById('fa'), s = ${STATE}, w = window.AtlasOpenworldView && AtlasOpenworldView().controls.walker();
      return { step: fa && fa.dataset.step, next: e ? (e.id || e.tagName) : '', id: s && s.id, at: w ? [w.q, w.r] : null }; })()`;
    const journey = async (t, id) => {
      const log = []; const t0 = Date.now();
      for (let n = 0; n < 45; n++) {
        const L = await t.ev(LOOK); log.push(L);
        if (!L || L.step === 'explore') { break; }
        if (L.id !== id) { fallos.push(t.name + ' stopped being shared at ' + L.step + ' (' + L.id + ')'); break; }
        if (!L.next && /hatching/.test(await t.ev(`(document.querySelector('#fa .fa-line') || {}).textContent || ''`))) { // the egg hatches: waiting, with words, is the step
          const h0 = Date.now(); await until(t, `!!document.querySelector('[data-fa-next]')`, 90000, 500); (medidas.hatch_ms = medidas.hatch_ms || []).push(Date.now() - h0); continue; }
        if (!L.next) { await espera(1500); if (!(await t.ev(LOOK)).next) { fallos.push(t.name + ': dead end at ' + L.step + ' ' + JSON.stringify(await t.ev(`(() => { const g = document.getElementById('fa-go'), c = document.getElementById('bs-challenge'), bs = document.getElementById('building-sheet'), st = window.AtlasVisitorPlay && AtlasVisitorPlay.state ? AtlasVisitorPlay.state() : null;
          return { go: g && { hidden: g.hidden, dis: g.disabled, txt: g.textContent }, chal: c && { dis: c.disabled, txt: c.textContent.slice(0, 60) }, sheet: bs && !bs.hidden, h: bs && (bs.querySelector('h2,h3') || {}).textContent, line: (document.querySelector('#fa .fa-line') || {}).textContent, sel: document.getElementById('surface').dataset.sel, panel: !document.getElementById('online-players').hidden }; })()`))); break; } continue; }
        await t.ev(`(() => { const e = document.querySelector('[data-fa-next]'); e && e.click(); return 1; })()`);
        await espera(L.step === 'practice' || L.step === 'conquest' ? 6000 : 1800);
      }
      const end = log[log.length - 1] || {};
      return { reached: end.step, presses: log.length - 1, ms: Date.now() - t0, steps: [...new Set(log.map((x) => x && x.step))], at: end.at, still: end.id === id };
    };
    medidas.full = await Promise.all(T.map((t, i) => journey(t, ids[i]).catch((e) => { fallos.push(t.name + ' · FULL: ' + e.message); return { reached: 'NO_DATA', error: e.message }; })));
    medidas.full.forEach((j, i) => { ok(j.reached === 'explore', T[i].name + ' did not finish the tutorial: ' + j.reached); ok(j.still, T[i].name + ' was not shared at the end'); });
    const where = medidas.full.map((j) => j.at);
    medidas.full_seen = await Promise.all(T.map((t, i) => until(t, `(() => { const s = ${STATE}, v = s && s.view; if (!v) { return null; } const W = ${JSON.stringify(where)}, I = ${JSON.stringify(ids)};
      return I.every((x, k) => k === ${i} || v.crabs.some((c) => c.id === x && c.seal === 'LIVE' && W[k] && c.q === W[k][0] && c.r === W[k][1])) ? true : null; })()`, 20000)));
    medidas.full_seen.forEach((v, i) => ok(v, T[i].name + ' does not see every other crab LIVE where it ended the tutorial'));
  }
  // The first page closes: the others read it STALE, then gone (the authority forgets it whole).
  if (T.length < 2) { return; } // leaving needs someone left to watch it
  const last = T.length - 1, a = ids[0], t0 = Date.now(); await T[0].gone();
  // RECONNECT (needs 3 clients: one leaves, one reconnects, one watches). At the same moment the first page closes,
  // the second disconnects its visit and comes back on the SAME page. The identity contract stays whole: the key is
  // ephemeral and lives only in this visit, so asking again at once is refused (visit_already_open, no replay, no
  // second crab); only after the authority forgets the visit (TTL) may the same visit open again, with a fresh
  // genesis — same crab id (the id is derived from the key), LIVE for the others, and its next signed step accepted.
  const b = ids[1], R = T.length >= 3 ? T[1] : null;
  const share = `(() => { const c = document.getElementById('online-consent'); if (!c.checked) { c.click(); } document.getElementById('online-share').click(); return true; })()`;
  const sees = (id, seal) => `(() => { const s = ${STATE}, v = s && s.view; if (!v) { return null; } const c = v.crabs.find((x) => x.id === ${JSON.stringify(id)}); return ${seal ? `c && c.seal === '${seal}' ? c : null` : '!c ? true : null'}; })()`;
  let again = null;
  if (R) {
    await R.ev(`(document.getElementById('online-disconnect').click(), true)`);
    ok(!(await R.ev(STATE)).id, R.name + ': still shared after «Disconnect my visit»');
    await R.ev(share);
    again = await until(R, `(() => { const l = document.getElementById('online-status'), s = ${STATE}; return s && s.id ? 'OPENED:' + s.id : (l.dataset.cause && l.dataset.cause !== 'connecting' && l.dataset.cause !== 'visit_not_shared' ? l.dataset.cause : null); })()`, 20000);
    ok(again === 'visit_already_open', R.name + ': an instant re-open must be refused as visit_already_open, got ' + again);
  }
  const stale = await until(T[last], sees(a, 'STALE'), 40000, 300);
  const tStale = Date.now() - t0;
  const gone = await until(T[last], sees(a, null), 60000, 500);
  medidas.leave = { stale_after_ms: stale ? tStale : null, gone_after_ms: gone ? Date.now() - t0 : null };
  ok(stale, 'the others must read the closed crab STALE'); ok(gone, 'the authority must forget the closed crab');
  if (R) {
    const forgot = await until(T[last], sees(b, null), 60000, 500), t1 = Date.now();
    ok(forgot, 'the authority must forget the disconnected visit before it may open again');
    await R.ev(share);
    const id2 = await until(R, `(() => { const s = ${STATE}; return s && s.id; })()`, 30000);
    const back = id2 && await until(T[last], sees(b, 'LIVE'), 30000, 300);
    const moved = back && await R.ev(`(() => { const C = AtlasOpenworldView().controls, w0 = C.walker(); for (const d of ['east', 'south-east', 'north-east', 'west']) { C.step(d); const w = C.walker(); if (w.q !== w0.q || w.r !== w0.r) { return [w.q, w.r]; } } return null; })()`);
    const held = moved && await until(T[last], `(() => { const c = (${sees(b, 'LIVE')}); return c && c.q === ${moved[0]} && c.r === ${moved[1]} ? true : null; })()`, 15000, 200);
    medidas.reconnect = { who: R.name, instant: again, forgotten_after_ms: forgot ? t1 - t0 : null, same_id: id2 === b, live_again_ms: back ? Date.now() - t1 : null, step_after: moved, step_seen: !!held };
    ok(id2 === b, R.name + ': the same visit must come back as the same crab (' + b + '), got ' + id2);
    ok(back, T[last].name + ' does not see ' + b + ' LIVE again'); ok(held, T[last].name + ' does not hold the reconnected crab after its first new step');
  } else { medidas.reconnect = 'NO_DATA(needs_three_clients)'; }
  // Disconnect the rest on purpose (consent off): nothing stays shared after the test.
  for (const t of T.slice(1)) { try { await t.ev(`(document.getElementById('online-disconnect').click(), true)`); } catch {} }
}
main().catch((e) => { fallos.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); })
  .finally(async () => {
    console.log(JSON.stringify({ piece: 'public-crabs-e2e', receipt: fallos.length ? 'ROJO' : 'VERDE', at: new Date().toISOString(), medidas, fallos }));
    for (const t of T) { try { await t.end(); } catch {} }
    process.exitCode = fallos.length ? 1 : 0; setTimeout(() => process.exit(), 500).unref();
  });
