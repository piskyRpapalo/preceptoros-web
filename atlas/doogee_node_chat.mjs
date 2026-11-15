// doogee_node_chat.mjs · from one device's ephemeral account, see the Beelink's node and talk with its chatbot
// (Sovereign 2026-11-15). The phone opens the LIVE site in its own Chrome (as a person would), presses Play (a new
// ephemeral crab), reads the node the page shows, sends one question to Hexelion (the Beelink's chatbot through the
// gateway) and waits for the answer. Read-only for the device: one Chrome tab, closed at the end; adb forward removed.
// Uso: SERIAL=<adb serial> [URL=https://preceptoros.org/openworld/] [CAPTURA=dir] node atlas/doogee_node_chat.mjs
import { execFileSync } from 'node:child_process'; import { writeFileSync } from 'node:fs'; import { join } from 'node:path';
const SERIAL = process.env.SERIAL, URL0 = process.env.URL || 'https://preceptoros.org/openworld/', CAPTURA = process.env.CAPTURA || '', CDP = 9611;
const adb = (...a) => execFileSync('adb', ['-s', SERIAL, ...a], { encoding: 'utf8' }).trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { piece: 'doogee-node-chat', url: URL0, device: null, steps: {}, receipt: 'ROJO', fallos: [] };
async function attach(wsUrl) {
  const ws = new WebSocket(wsUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  return { ev, cmd, close: () => { try { ws.close(); } catch {} } };
}
const until = async (t, e, ms) => { const t0 = Date.now(); let v = null; while (Date.now() - t0 < ms) { v = await t.ev(e); if (v) { return v; } await espera(400); } return v; };
let t = null, made = null;
try {
  if (!SERIAL) { throw new Error('NO_DATA: SERIAL is required'); }
  out.device = adb('shell', 'getprop', 'ro.product.model');
  adb('forward', 'tcp:' + CDP, 'localabstract:chrome_devtools_remote');
  const url = URL0 + (URL0.includes('?') ? '&' : '?') + 'probe=' + Date.now();
  adb('shell', 'am', 'start', '--user', '0', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-a', 'android.intent.action.VIEW', '-d', "'" + url + "'");
  for (let i = 0; i < 60 && !made; i++) { await espera(500); try { made = (await (await fetch(`http://127.0.0.1:${CDP}/json`)).json()).find((x) => x.type === 'page' && x.url === url); } catch {} }
  if (!made) { throw new Error('NO_DATA: the tab did not open'); }
  t = await attach(made.webSocketDebuggerUrl);
  await until(t, `!!document.getElementById('visitor-play') && !!window.AtlasOpenworldView`, 30000);
  out.steps.version = await t.ev(`fetch('/sw.js',{cache:'no-store'}).then(r=>r.text()).then(s=>(s.match(/const VERSION = '([^']+)'/)||[])[1]||null)`);
  // 1 · the ephemeral account: Play.
  await t.ev(`(() => { window.__visit = null; document.getElementById('visitor-play').addEventListener('visitor:render', (e) => { try { window.__visit = e.detail.account.info().seed.slice(0, 12); } catch (_) { window.__visit = 'started'; } }); return true; })()`);
  out.steps.pressed = await t.ev(`(() => { const vis = (e) => e && !e.hidden && e.offsetParent; const b = ['#welcome-play', '#gp-play', '#play-now'].map((s) => document.querySelector(s)).find(vis); if (b) { b.click(); return '#' + b.id; } return null; })()`);
  out.steps.visit = await until(t, `window.__visit`, 20000); // the ephemeral account's seed prefix (a hash, nothing personal)
  // 2 · the other's node: what the world says, and the mast on the map when the page has node_beacon.js.
  out.steps.world = await t.ev(`fetch('/api/world-state',{cache:'no-store'}).then(r=>r.json()).then(d=>d.colonia.nodes.map(n=>n.id+':'+n.seal+':'+n.since))`);
  out.steps.beacon = await t.ev(`(() => { const B = window.AtlasNodeBeacon; if (!B) { return 'NO_DATA: node_beacon.js is not on this LIVE version yet'; } const s = document.getElementById('surface'); let hit = null; for (let y = 0; y < s.height && !hit; y += 8) for (let x = 0; x < s.width && !hit; x += 8) { if (B.hitAt(x, y)) hit = [x, y]; } if (!hit) { return 'NO_DATA: no node mast in view'; } const r = s.getBoundingClientRect(), k = r.width / s.width; s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + hit[0] * k, clientY: r.top + hit[1] * k })); return 'tapped the mast'; })()`);
  await espera(800);
  // 2b · the keyboard door (one button per node; the same open() as the mast) and what Talk shows after it.
  out.steps.door = await t.ev(`(() => { const d = document.getElementById('node-door-primer-ancla'); if (!d) { return 'NO_DATA: no node door on this version'; } d.focus(); const ok = document.activeElement === d; d.click(); return ok ? d.getAttribute('aria-label') : 'door not focusable'; })()`);
  await espera(600);
  out.steps.talk_title = await t.ev(`(document.getElementById('voices-title') || {}).textContent || null`);
  out.steps.attribution = await t.ev(`(document.querySelector('#log .node-intro') || {}).textContent || null`);
  // 3 · the chatbot: Who answers = Hexelion, one question, one answer.
  out.steps.chat_open = await t.ev(`(() => { const m = document.getElementById('chat-destination'); if (!m) { return false; } m.value = 'hexelion'; m.dispatchEvent(new Event('change')); const c = document.querySelector('.cats [data-cat=Communication]'); const v = document.getElementById('voices'); if (c && (v.hidden || v.dataset.activeCategory !== 'Communication')) { c.click(); } return true; })()`);
  await espera(600);
  const before = await t.ev(`document.getElementById('log').children.length`);
  const asked = 'Hello from a Doogee phone. Which machine are you running on? One sentence.';
  out.steps.sent = await t.ev(`(() => { const q = document.getElementById('question'), f = document.getElementById('entry'); if (!q || !f) { return false; } q.value = ${JSON.stringify(asked)}; q.dispatchEvent(new Event('input', { bubbles: true })); f.requestSubmit ? f.requestSubmit() : f.querySelector('button').click(); return true; })()`);
  out.steps.answer = await until(t, `(() => { const l = [...document.getElementById('log').children].slice(${before}); const a = l.map((x) => x.textContent.trim()).filter((x) => x && x.indexOf(${JSON.stringify(asked.slice(0, 20))}) < 0); return a.length ? a.join(' | ').slice(0, 400) : null; })()`, 60000);
  // 4 · back to the map without losing the visit: close the sheet, the same ephemeral account is still on the map.
  out.steps.back = await t.ev(`(() => { const x = document.getElementById('voices-x'); if (x) { x.click(); } const v = document.getElementById('voices'); return { closed: !v || v.hidden || !v.dataset.activeCategory, heading: (document.body.innerText.match(/Visitor-[0-9a-f]{8}/) || [null])[0] }; })()`);
  if (CAPTURA) { const g = await t.cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'doogee-node-chat.png'), Buffer.from(g.result.data, 'base64')); }
  const same = out.steps.back && out.steps.back.heading && out.steps.back.heading.slice(8) === String(out.steps.visit).slice(0, 8);
  if (!same) { out.fallos.push('the visit changed or vanished after closing Talk'); }
  const ok = !!out.steps.visit && !!out.steps.answer && !/NO_DATA/.test(out.steps.answer) && same;
  if (!out.steps.visit) { out.fallos.push('no ephemeral visit after Play'); }
  if (!out.steps.answer) { out.fallos.push('no answer from the chatbot within 60 s'); } else if (/NO_DATA/.test(out.steps.answer)) { out.fallos.push('the chatbot answered NO_DATA: ' + out.steps.answer); }
  out.receipt = ok ? 'VERDE' : 'ROJO';
} catch (e) { out.fallos.push(String(e && e.message || e)); }
finally {
  try { if (made) { await fetch(`http://127.0.0.1:${CDP}/json/close/${made.id}`); } } catch {}
  if (t) { t.close(); } try { adb('forward', '--remove', 'tcp:' + CDP); } catch {}
  console.log(JSON.stringify(out)); process.exitCode = out.receipt === 'VERDE' ? 0 : 1;
}
