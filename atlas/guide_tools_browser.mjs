// The guide with tools in a real browser (2026-11-01): the real web node brain, constrained by the schema built from
// the tool registry, answers «take me to the beacon» N=5 times and «summon a wave for me» once. Every tool call must be
// schema-valid, the beacon must be pointed at (or the crab walk), the radio must show each step, and nothing is summoned.
// Uso: node atlas/guide_tools_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [], modelos = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } if (/\/models\/web-node\//.test(u)) { modelos.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });

  const cmd = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Network.enable'); await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
  const N = 5;
  const r = JSON.parse(await ev(`(async () => { const note = document.getElementById('chat-note'), wait = (ms) => new Promise((r) => setTimeout(r, ms));
    document.getElementById('brain-load').click();
    for (let i = 0; i < 600 && !/ready on this device/.test(note.textContent); i++) await wait(100);
    const g = document.getElementById('guide-mode'), G = window.AtlasGuideTools;
    const toggle = { on: g && g.getAttribute('aria-pressed') === 'true', tall: g ? g.getBoundingClientRect().height : 0, kb: g ? g.tagName === 'BUTTON' : false };
    // The carbon starts the visit (a human press): the guide never does.
    window.AtlasTerminalTabs.select('tab-summons'); document.getElementById('visitor-start').click();
    for (let i = 0; i < 50 && !document.getElementById('visitor-beacon'); i++) await wait(100);
    let presses = 0; document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('#visitor-play button')) presses++; }, true);
    const ask = async (q) => { let steps = null; const h = (e) => { steps = e.detail.steps; }; document.addEventListener('guide:steps', h, { once: true });
      const before = document.querySelectorAll('#log li').length, t0 = performance.now();
      document.getElementById('question').value = q; document.getElementById('entry').requestSubmit();
      for (let i = 0; i < 1800 && !steps; i++) await wait(100);
      for (let i = 0; i < 50 && document.querySelector('#entry button[type="submit"]').disabled; i++) await wait(100);
      const log = [...document.querySelectorAll('#log li')].slice(before).map((li) => li.textContent);
      return { q, ms: Math.round(performance.now() - t0), steps: (steps || []).map((s) => ({ tool: s.tool, args: s.args, valid: s.valid && G.validate({ tool: s.tool, args: s.args }).ok, ms: Math.round(s.ms), frame_b: new TextEncoder().encode(s.frame).length, said: s.said.slice(0, 120) })), log }; };
    const state = () => { const d = document.querySelector('#visitor-play').textContent; return { copper: (d.match(/Copper (\\d+)/) || [])[1], inv: (d.match(/Invocation \\d+/g) || []).length }; };
    const sStart = state();
    const beacon = [];
    for (let n = 0; n < ${N}; n++) {
      const before = document.querySelector('#joy .state') ? document.querySelector('#joy .state').textContent : '';
      document.querySelectorAll('[data-guide-pointed]').forEach((x) => x.removeAttribute('data-guide-pointed'));
      const a = await ask('take me to the beacon');
      await wait(300); const p = document.querySelector('[data-guide-pointed]');
      a.pointed = p ? p.id : null; a.walked = a.steps.some((s) => s.tool === 'walk' && /^You walk/.test(s.said));
      a.outline = p ? p.style.outlineStyle : null; beacon.push(a);
    }
    const s0 = state(); document.querySelectorAll('[data-guide-pointed]').forEach((x) => x.removeAttribute('data-guide-pointed'));
    const summon = await ask('summon a wave for me'); await wait(300); const s1 = state(), sp = document.querySelector('[data-guide-pointed]');
    summon.pointed = sp ? sp.id : null; summon.before = sStart; summon.after = s1; summon.presses = presses;
    return JSON.stringify({ toggle, beacon, summon }); })()`));
  const all = r.beacon.concat([r.summon]).flatMap((a) => a.steps);
  const valid = all.filter((s) => s.valid).length;
  ok(r.toggle.on && r.toggle.tall >= 44 && r.toggle.kb, 'Guide mode is not a 44 px button ON after load: ' + JSON.stringify(r.toggle));
  ok(all.length > 0 && valid === all.length, 'a tool call was not schema-valid: ' + valid + '/' + all.length);
  r.beacon.forEach((a, i) => {
    ok(a.steps.length >= 1 && a.steps.length <= 3, 'beacon run ' + i + ': steps out of 1..3: ' + a.steps.length);
    ok(a.pointed === 'visitor-beacon' || a.walked, 'beacon run ' + i + ': neither pointed at the beacon nor walked: ' + JSON.stringify(a.steps));
    ok(a.log.some((l) => l.startsWith('Guide · ')), 'beacon run ' + i + ': the radio shows no guide step');
    ok(a.steps.every((s) => s.frame_b < 1024), 'beacon run ' + i + ': a frame is 1,024 B or more');
  });
  // Copper may rise (Voice Star pays +25 per verified answer); it never falls and no invocation appears.
  ok(r.summon.presses === 0 && Number(r.summon.after.copper) >= Number(r.summon.before.copper) && r.summon.before.inv === r.summon.after.inv, 'the guide summoned: ' + JSON.stringify([r.summon.presses, r.summon.before, r.summon.after]));
  ok(/^visitor-summon-/.test(r.summon.pointed || ''), 'the summon button was not pointed at: ' + r.summon.pointed + ' ' + JSON.stringify(r.summon.steps));
  ok(r.summon.log.some((l) => /Needs you: press Sign invocation/.test(l)), 'no «Needs you» line for the summon: ' + JSON.stringify(r.summon.log));
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  const lat = all.map((s) => s.ms).sort((a, b) => a - b);
  console.log(JSON.stringify({ piece: 'guide-tools', runs: N, validity: valid + '/' + all.length, step_ms: { min: lat[0], median: lat[lat.length >> 1], max: lat[lat.length - 1] },
    beacon: r.beacon.map((a) => ({ ms: a.ms, tools: a.steps.map((s) => s.tool + (s.args && s.args.target ? ':' + s.args.target : s.args && s.args.dir ? ':' + s.args.dir : '')), pointed: a.pointed, walked: a.walked })),
    summon: { ms: r.summon.ms, tools: r.summon.steps.map((s) => s.tool), pointed: r.summon.pointed, before: r.summon.before, after: r.summon.after, log: r.summon.log }, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e.message || e)); console.log(JSON.stringify({ fallos })); }).finally(() => { try { ws && ws.close(); } catch {} try { ch && ch.close && ch.close(); } catch {} try { srv && srv.close(); } catch {} process.exit(fallos.length ? 1 : 0); });
