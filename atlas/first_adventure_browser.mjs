// The first adventure (Mission B) and the growing town (Mission E), walked in a real Chromium: Play → the preceptor →
// Node 0's beacon → summon → Go to the coliseum hex by hex → practice → Go to a grey building → a real challenge →
// what opened → explore. Only the next button wears «!». A conquest is counted only when won; a loss says so and the
// town stays shut. Ownership is never accredited from a visit. Skip and Resume. SABOTAJE=teleport|owner|open are red.
// Uso: node atlas/first_adventure_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f); if (SAB && SABS[SAB] && ruta === SABS[SAB][0]) { cuerpo = Buffer.from(String(cuerpo).replace(SABS[SAB][1], SABS[SAB][2])); } res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const SAB = process.env.SABOTAJE || '';
const SABS = { // each must turn the test red
  teleport: ['/game/first_adventure.js', "var dirs = F.toward(a, m); for (var i = 0; i < 3; i++) { c.step(dirs[i]);", "var dirs = F.toward(a, m); for (var i = 0; i < 3; i++) { c.step(dirs[i]); c.step(dirs[i]);"], // two hexes a beat
  owner: ['/game/ow_calm.js', "return m && m.own ? 'built' : 'available';", "return m && (m.own || m.won) ? 'accredited' : 'available';"], // a visit's win made into ownership // a visit's record made into ownership
  hatch: ['/game/first_adventure.js', "['.revela .revela-ok'].concat(target(id, { at: at }))", "target(id, { at: at })"], // a hatch covers the card and nothing is marked
  open: ['/game/ow_calm.js', "OPEN.indexOf(m.id) >= 0 || i < 0 || (wins > 0 && i < 2 + wins)", "true"], // the town opens before any conquest
  // MAP-CONTINUITY-01 sabotage: tutorial finish used to unlock everything via 'free' phase
  tutorial_unlock: ['/game/ow_calm.js', "return OPEN.indexOf(m.id) >= 0 || i < 0 || (wins > 0 && i < 2 + wins) ? 'available' : 'locked';", "return (root.localStorage && /^(done|skipped)$/.test(root.localStorage.getItem('preceptoros.tour') || '')) || OPEN.indexOf(m.id) >= 0 || i < 0 || (wins > 0 && i < 2 + wins) ? 'available' : 'locked';"]
};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port;
  ch = launchChrome(0);
  const cdpPort = await ch.debugPort();
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      const que = 'exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop() + ':' + ((f.lineNumber ?? 0) + 1);
      if (!fallos.includes(que)) { fallos.push(que); }
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  await cmd('Runtime.enable'); await cmd('Page.enable');



  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); // the replay jumps to its verdict (the walk is still hex by hex)
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('!!window.AtlasFirstAdventure && document.getElementById("fa") && document.getElementById("fa").dataset.step==="play"', 15000), 'the first adventure did not mount at its first step');
  const S = `JSON.stringify({ step: (document.getElementById('fa')||{dataset:{}}).dataset.step, marks: [...document.querySelectorAll('[data-fa-next]')].map(e=>e.id||e.dataset.cat),
    bang: !document.getElementById('fa-bang').hidden, states: (()=>{const V=AtlasMapPainter.view(); return Object.fromEntries(V.world.markList.filter(m=>m.town).map(m=>[m.id, AtlasOwCalm.stateOf(m)]));})(),
    won: AtlasMapPainter.view().world.markList.filter(m=>m.won).map(m=>AtlasOwCalm.stateOf(m)) })`;
  medidas.hatches = 0;
  const st = async () => { // an egg hatching covers everything: the «!» must be on its Continue, and the test presses it
    for (let h = 0; h < 3 && await ev(`!!document.querySelector('.revela [data-fa-next]')`); h++) { await ev(`document.querySelector('.revela [data-fa-next]').click()`); medidas.hatches++; await espera(500); }
    return JSON.parse(await ev(S)); };
  const press = async () => ev(`(()=>{const e=document.querySelector('[data-fa-next]'); if(!e) return null; const id=e.id||e.dataset.cat; e.click(); return id;})()`);
  const trail = [];
  let s = await st(); trail.push(s.step);
  ok(s.marks.join() === 'gp-play' && !s.bang && await ev("document.getElementById('fa').hidden"),
    'arrival must keep only Welcome, with Play highlighted but no second adventure card or marker: ' + JSON.stringify(s.marks));
  ok(['workshop', 'agora', 'lottery', 'choir', 'customs', 'tower', 'visitor-house'].every((k) => s.states[k] === 'locked') && ['hostel', 'coliseum', 'doctor'].every((k) => s.states[k] === 'available'), 'before a conquest the town is not reduced to hall, hostel, coliseum and doctor: ' + JSON.stringify(s.states));
  const told = await ev(`(()=>{const V=AtlasMapPainter.view(), m=V.world.markList.find(x=>x.town&&x.id==='lottery'); return AtlasOwCalm.tell(m,'Lottery');})()`);
  ok(/^Lottery is locked: it opens after your first conquest/.test(told || ''), 'a locked building does not say what opens it: ' + told);
  // Welcome owns arrival; Play starts the visit, then the first-adventure marker guides the remaining steps.
  for (let i = 0; i < 12; i++) {
    s = await st(); if (s.step === 'practice') { break; }
    ok(s.marks.length <= 1, 'more than one button wears «!»: ' + JSON.stringify(s.marks));
    const p = await press(); await espera(p === 'gp-play' ? 2600 : 900); if (trail[trail.length - 1] !== s.step) { trail.push(s.step); }
  }
  ok(await hasta(`document.getElementById('fa').dataset.step==='practice' && !document.getElementById('fa-go').disabled`, 30000), 'after the summon the practice step never opens (no troop): ' + (await st()).step);
  const walkTo = async (until) => ev(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)), c=AtlasOpenworldView().controls, path=[]; const a0=c.walker(); path.push([a0.q,a0.r]);
    document.getElementById('fa-go').click(); for(let i=0;i<80;i++){ await w(100); const a=c.walker(); const l=path[path.length-1]; if(l[0]!==a.q||l[1]!==a.r) path.push([a.q,a.r]); if(${until}) break; } await w(300); return JSON.stringify(path); })()`);
  const hop = (path) => path.every((p, i) => !i || ((d) => (Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[0] + d[1])) / 2 === 1)([p[0] - path[i - 1][0], p[1] - path[i - 1][1]]));
  let path = JSON.parse(await walkTo(`!!document.getElementById('bs-challenge')`)); medidas.toColiseum = path.length - 1;
  ok(path.length >= 3 && hop(path), 'Go to the coliseum is not a walk of one hex per step: ' + JSON.stringify(path));
  s = await st(); ok(s.marks.join() === 'bs-challenge', 'at the coliseum «!» is not on the practice wave: ' + JSON.stringify(s.marks));
  await press(); ok(await hasta(`document.getElementById('fa').dataset.step==='conquest'`, 30000), 'the practice wave does not move the adventure on'); trail.push('practice');
  s = await st(); ok(Object.values(s.states).filter((v) => v === 'locked').length === 7, 'a practice wave opened buildings: it must win nothing');
  await ev(`(()=>{const b=document.querySelector('#building-sheet .bs-bar button:last-child'); if(b) b.click(); return 1})()`); await espera(300);
  // the real fight waits for the whole squad: while an egg hatches Go is off and the card says why (no silent block)
  if (await ev(`document.getElementById('fa-go').disabled`)) {
    ok(/still hatching/.test(await ev(`document.querySelector('#fa .fa-line').textContent`)), 'Go is off at the real fight without saying the egg is hatching');
    await ev(`(()=>{window.AtlasVisitorEggs.clock.skip(120000); document.getElementById('visitor-play').dispatchEvent(new CustomEvent('visitor:tick')); return 1})()`);
  }
  for (let i = 0; i < 40; i++) { const r = await ev(`(()=>{const b=document.querySelector('#stage > .revela.on-map .revela-ok'); if(b){b.click(); return 1} return document.getElementById('fa-go').disabled?2:0})()`); if (!r) { break; } await espera(500); }
  path = JSON.parse(await walkTo(`!!document.getElementById('bs-challenge') && /Challenge the NPC/.test(document.getElementById('bs-challenge').textContent)`)); medidas.toGrey = path.length - 1;
  ok(path.length >= 2 && hop(path), 'Go to the grey building is not a walk of one hex per step: ' + JSON.stringify(path.slice(0, 12)));
  s = await st(); ok(s.marks.join() === 'bs-challenge', 'at the grey building «!» is not on the challenge: ' + JSON.stringify(s.marks));
  await press(); await hasta(`/wins|Draw/.test((document.getElementById('visitor-battle-result')||{}).textContent||'')`, 90000); await espera(1200);
  const verdict = await ev(`(document.getElementById('visitor-battle-result')||{}).textContent||''`); s = await st(); medidas.conquest = verdict.slice(0, 60);
  const won = await ev(`AtlasOwCalm.wins()`);
  if (won > 0) {
    trail.push('conquest');
    ok(s.step === 'town' && ['workshop', 'agora', 'visitor-house'].every((k) => s.states[k] === 'available') && s.states.lottery === 'locked', 'a real win does not open the three basics (and only them): ' + JSON.stringify(s));
  } else {
    ok(s.step === 'conquest' && Object.values(s.states).filter((v) => v === 'locked').length === 7, 'a lost fight moved the adventure or opened the town: ' + JSON.stringify(s));
    const said = await ev(`document.querySelector('#fa .fa-line').textContent + ' | ' + document.getElementById('fa-ok').textContent`); medidas.lossSaid = said.slice(0, 90);
    ok(/^The guardian wins this time \(1 try\): nothing is conquered/.test(said) && /\| Later$/.test(said), 'a loss is not said honestly with a way to put it off: ' + said);
    await ev(`(()=>{const V=AtlasMapPainter.view(); const m=V.world.markList.find(x=>x.fog); m.won=true; m.fog=false; AtlasFirstAdventure.draw(); return 1})()`); // SYNTHETIC win, to walk the rest
    await espera(400);
    s = await st(); ok(s.step === 'town', 'after a win the town step does not come: ' + s.step); medidas.syntheticWin = true;
  }
  ok(s.won.length >= 1 && Object.values(s.states).concat(s.won).every((v) => v !== 'accredited'), 'a visit\'s win was shown as accredited ownership: ' + JSON.stringify(s.won));
  // after a win the «!» first asks to record it (visitor_conquest.js verifies the receipt against this visit), then OK
  await espera(300); s = await st();
  if (s.step === 'town' && s.marks.join() === 'visitor-conquer') { await ev(`document.getElementById('visitor-conquer').click()`); ok(await hasta(`/Conquest recorded for this visit/.test(document.getElementById('visitor-conquer').textContent)`, 8000), 'the verified win was not recorded'); await ev(`(()=>{const d=document.getElementById('visitor-conquer').closest('dialog'); if(d) d.close(); return 1})()`); }
  for (const want of ['town', 'explore']) { await espera(300); if (await ev(`!!document.querySelector('#stage > dialog[open] [data-fa-next]')`)) { await ev(`document.querySelector('#stage > dialog[open] [data-fa-next]').click()`); await espera(500); } s = await st();
    ok(s.step === want && s.marks.join() === 'fa-ok', want + ' is not marked on OK: ' + JSON.stringify(s) + ' open: ' + await ev(`JSON.stringify({sheet:!!document.querySelector('.bs-sheet:not([hidden])'),voices:!!document.querySelector('#voices.map-voices:not([hidden])'),dialog:[...document.querySelectorAll('dialog[open]')].map(d=>d.className+'|'+d.textContent.slice(0,40)),revela:document.querySelectorAll('.revela').length})`)); await ev(`document.getElementById('fa-ok').click()`); await espera(300); trail.push(want); }
  ok(await ev(`localStorage.getItem('preceptoros.tour')==='done' && document.getElementById('fa').hidden && document.documentElement.dataset.owPhase==='visit'`), 'explore finishes the adventure but phase stays visit (not free)');
  s = await st(); ok(Object.values(s.states).some((v) => v === 'locked'), 'finishing the tutorial does not unlock the town — locked buildings remain locked: ' + JSON.stringify(s.states));
  // Skip and Resume
  await ev(`AtlasFirstAdventure.resume()`); ok(await ev(`!document.getElementById('fa').hidden && document.documentElement.dataset.owPhase==='visit'`), 'Resume does not bring the adventure back');
  await ev(`document.getElementById('fa-skip').click()`); ok(await ev(`localStorage.getItem('preceptoros.tour')==='skipped' && document.getElementById('fa').hidden && document.getElementById('fa-bang').hidden`), 'Skip tutorial does not put the card and the «!» away');
  medidas.trail = trail;
  console.log(JSON.stringify({ piece: 'first_adventure', sabotage: SAB || null, medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
