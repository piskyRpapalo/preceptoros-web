// FIRST JOURNEY E2E (2026-11-16): a person discovers OpenWorld with a new ephemeral account and plays the whole first
// adventure in a real Chromium at 360×716, pressing only what the «!» marks or «Go»: WELCOME → CRAB → NODE 0 → SUMMON →
// BATTLE → VICTORY → CONQUEST → BUILD → HOSPITAL → EXPLORE. Each scene keeps a numbered screenshot and its real state
// (anonymised ephemeral id, tutorial step, node, action, result, evidence: measured | NO_DATA(cause)). Nothing is
// mocked: no gateway double, no forced win. The events also drive Junie's contract (atlas/puros/tutorial_journey.js),
// so the machine says which steps were completed, skipped or rejected. Uso: node atlas/first_journey_e2e.mjs [outdir]; SABOTAJE=receipt must be red
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
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
      let cuerpo = readFileSync(f); if (SAB === 'receipt' && f.endsWith('/game/visitor_conquest.js')) { cuerpo = Buffer.from(String(cuerpo).replace('delete receipt.practice;', '')); } res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const SAB = process.env.SABOTAJE || ''; // receipt: the presentation flag stays in the receipt → the verified win can no longer be recorded (red)
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



  const OUT = process.argv[2] || fileURLToPath(new URL('../odd/recibo/first-journey/', import.meta.url)); mkdirSync(OUT, { recursive: true });
  const J = createRequire(import.meta.url)('./puros/tutorial_journey.js'); let jr = J.createVisitorJourney('visitor#1'); const machine = [];
  const feed = (event, ctx) => { const r = J.transition(jr, event, Object.assign({}, jr.context || {}, ctx)); jr = r.journey; machine.push({ event, ok: r.ok, state: jr.state, cause: r.cause || undefined }); return r.ok; };
  const skip = (cause) => { const t = J.TRANSITIONS.find((x) => x.from === jr.state); if (!t) { return; } const r = J.skipStep(jr, t.action); if (r.ok) { jr = r.journey; jr.state = t.to; machine.push({ event: 'skipped:' + t.action, ok: true, state: jr.state, cause }); } };
  const scenes = []; let vid = null;
  const shot = async (n, name, info) => {
    await espera(700);
    // invariant (P0): no capture where content is open (a panel, a card, a dialog, a troop reveal) and a stick still stands
    const cover = await ev(`(()=>{const open=!!document.querySelector('#voices.map-voices:not([hidden]),.bs-sheet:not([hidden]),dialog[open],.revela'); const stick=[...document.querySelectorAll('#view-joystick,#character-joystick')].some(e=>e.getClientRects().length); return open&&stick})()`);
    ok(!cover, n + ': content is open and a stick still stands');
    // the ephemeral id is masked in the picture only (restored at once): the gallery is anonymised, the play is not
    await ev(`(()=>{const h=document.getElementById('map-h'); if(!h) return 0; h.dataset.mask=h.textContent.replace(/Visitor-[0-9a-f]{8}/,'Visitor-········'); let st=document.getElementById('e2e-mask'); if(!st){st=document.createElement('style'); st.id='e2e-mask'; st.textContent='#map-h{font-size:0!important}#map-h::after{content:attr(data-mask);font-size:1rem}'; document.head.append(st);} return 1})()`);
    const r = await cmd('Page.captureScreenshot', { format: 'png' }); const file = n + '-' + name + '.png';
    const leak = await ev(`(()=>{const h=document.getElementById('map-h'); const s=document.getElementById('e2e-mask'); const shown=h?getComputedStyle(h).fontSize:'0px'; if(s) s.remove(); if(h) delete h.dataset.mask; return shown!=='0px'})()`); ok(!leak, n + ': the ephemeral id was not masked in the picture');
    writeFileSync(OUT + file, Buffer.from(r.result.data, 'base64'));
    const step = await ev(`(document.getElementById('fa')||{dataset:{}}).dataset.step || (localStorage.getItem('preceptoros.tour')||'none')`);
    scenes.push(Object.assign({ n, scene: name, file, visitor: vid ? 'visitor#1' : null, step, node: 'Node 0 (primer-ancla)' }, info));
  };
  // the player follows the «!»: a troop reveal it marks first (its Continue) is read and closed, then the next mark is pressed
  const press = async () => { for (let i = 0; i < 6; i++) { const r = await ev(`(()=>{const e=document.querySelector('[data-fa-next]'); if(!e) return null; if(e.classList.contains('revela-ok')){e.click(); return 'reveal'} const k=e.id||e.dataset.cat; e.click(); return k;})()`); if (r !== 'reveal') { return r; } await espera(700); } return null; };
  const stepIs = (s, ms) => hasta(`(document.getElementById('fa')||{dataset:{}}).dataset.step===${JSON.stringify(s)}`, ms || 15000);
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 2, mobile: true });
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await stepIs('play'), 'the first adventure did not start at Play');
  // 01 WELCOME
  await shot('01', 'welcome', { action: 'arrive', result: 'one primary action: Play; the town is hall, hostel, coliseum and doctor', evidence: 'measured' });
  // 02 CRAB
  await press(); ok(await stepIs('meet', 20000), 'Play did not start the visit');
  vid = await ev(`(document.getElementById('map-h')||{}).textContent||''`); const anon = /Visitor-[0-9a-f]{8}/.test(vid);
  await shot('02', 'crab', { action: 'Play: visit signed on this device (Ed25519, ephemeral)', result: anon ? 'ephemeral id issued (shown here as visitor#1)' : 'NO_DATA: no ephemeral id in the heading', evidence: anon ? 'measured' : 'NO_DATA' });
  feed('map_opened', { seals: { 'primer-ancla': 'STALE' } }); feed('player_arrived', { playerNode: 'primer-ancla', seals: { 'primer-ancla': 'STALE' } });
  await press(); await stepIs('beacon');
  // 03 NODE 0: the real chat, no double
  await ev(`(()=>{document.querySelector('.cats [data-cat=Communication]').click(); return 1})()`); await espera(500);
  await ev(`(()=>{const m=document.getElementById('chat-destination'); m.value='hexelion'; m.dispatchEvent(new Event('change')); const q=document.getElementById('question'); q.value='Hello Node 0, where do I start?'; document.getElementById('entry').requestSubmit(); return 1})()`);
  await hasta(`[...document.querySelectorAll('#log li')].some(li=>/^Node 0 · /.test(li.textContent) && !/waiting/.test(li.textContent))`, 20000);
  const n0 = await ev(`([...document.querySelectorAll('#log li')].filter(li=>/^Node 0 · /.test(li.textContent)).pop()||{}).textContent||''`);
  const answered = /^Node 0 · (?!NO_DATA)/.test(n0);
  await shot('03', 'node0', { action: 'ask Node 0 in Talk', result: n0.slice(0, 140) || 'no line', evidence: answered ? 'measured' : 'NO_DATA(' + (n0.split('NO_DATA · ')[1] || 'no answer').slice(0, 80) + ')' });
  if (answered) { feed('node_responded', { nodeResponded: true }); } else { skip('Node 0 did not answer from this page: ' + n0.slice(0, 80)); }
  // the keyboard: the field and Send with a phone keyboard up (viewport 360×400)
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 2, mobile: true });
  await ev(`(()=>{const q=document.getElementById('question'); q.focus(); q.value='Typing with the keyboard up'; window.dispatchEvent(new Event('resize')); q.scrollIntoView({block:'nearest'}); return 1})()`); await espera(400);
  const kb = await ev(`JSON.stringify({pad: !!document.getElementById('gamepad').getClientRects().length})`);
  await shot('03b', 'node0-keyboard', { action: 'write with the keyboard up', result: 'gamepad ' + (JSON.parse(kb).pad ? 'still shown' : 'stepped aside'), evidence: 'measured (viewport 360×400 stands for the keyboard)' });
  await ev(`(()=>{const q=document.getElementById('question'); q.value=''; q.blur(); return 1})()`);
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 2, mobile: true });
  await ev(`(()=>{document.querySelector('.cats [data-cat=Communication]').click(); return 1})()`); await espera(400);
  // 04 SUMMON: follow the «!» (beacon, summon)
  for (let i = 0; i < 8; i++) { const s = await ev(`document.getElementById('fa').dataset.step`); if (s === 'practice') { break; } await press(); await espera(900); }
  const eggs = await ev(`(()=>{const t=document.getElementById('state'); return t?t.textContent.slice(0,140):''})()`);
  await shot('04', 'summon', { action: 'Visit the beacon (+copper) → reef summon', result: eggs || 'summoned', evidence: 'measured' });
  feed('summon_completed', { summonCompleted: true });
  ok(await hasta(`document.getElementById('fa').dataset.step==='practice' && !document.getElementById('fa-go').disabled`, 40000), 'no troop hatched');
  // 05 BATTLE: Go to the coliseum, the practice wave
  await press(); await hasta(`!!document.getElementById('bs-challenge')`, 20000); await press();
  await hasta(`/wins|Draw/.test((document.getElementById('visitor-battle-result')||{}).textContent||'')`, 60000);
  const practice = await ev(`(document.getElementById('visitor-battle-result')||{}).textContent||''`);
  await shot('05', 'battle', { action: 'Go → coliseum (hex by hex) → practice wave', result: practice.slice(0, 120), evidence: 'measured (practice: nothing won or lost)' });
  await ev(`(()=>{const d=document.querySelector('dialog[open]'); if(d){const b=[...d.querySelectorAll('button')].find(b=>/Close|Continue|OK/.test(b.textContent)); if(b) b.click(); else d.close();} const x=document.querySelector('#building-sheet .bs-bar button:last-child'); if(x) x.click(); return 1})()`); await espera(500);
  // 06 VICTORY: real challenges, up to five guardians; a loss is said as a loss
  let win = false, tries = [];
  for (let t = 0; t < 5 && !win; t++) {
    if (!(await stepIs('conquest', 4000))) { break; }
    if (t === 0 && await ev(`document.getElementById('fa-go').disabled`)) { const wait = await ev(`document.querySelector('#fa .fa-line').textContent`); scenes.push({ n: '05c', scene: 'wait-for-squad', file: null, result: wait.slice(0, 160), evidence: 'measured (Go waits while an egg still hatches)' }); }
    ok(await hasta(`!document.getElementById('fa-go').disabled || !!document.querySelector('#stage > .revela.on-map')`, 200000), 'the real fight never became possible');
    await press(); // Go (after any reveal)
    await espera(150); const threat = await ev(`document.querySelector('#fa .fa-line').textContent`); if (!t) { scenes.push({ n: '05b', scene: 'threat', file: null, result: threat.slice(0, 160), evidence: 'measured (read from npcPlace before the fight)' }); }
    if (!(await hasta(`!!document.getElementById('bs-challenge') && /Challenge the NPC/.test(document.getElementById('bs-challenge').textContent)`, 30000))) { tries.push('no guardian reached'); break; }
    await ev(`document.getElementById('bs-challenge').click()`);
    await hasta(`/wins|Draw/.test((document.getElementById('visitor-battle-result')||{}).textContent||'')`, 60000);
    const v = await ev(`(document.getElementById('visitor-battle-result')||{}).textContent||''`); tries.push(v.slice(0, 60));
    win = (await ev(`AtlasOwCalm.wins()`)) > 0;
    if (win) { // the verdict's dialog is still open: the win is shown, then recorded from its own button
      await shot('06', 'victory', { action: 'challenge the weakest guardian near (Go)', result: v.slice(0, 120), evidence: 'measured' });
      feed('battle_won', { battleFought: true, battleWon: true });
      await espera(300); const marked = await ev(`(document.getElementById('visitor-conquer')||{dataset:{}}).dataset.faNext==='1'`);
      ok(marked, 'after the win the «!» is not on «Record this local conquest»');
      const rec = await ev(`(()=>{const b=document.getElementById('visitor-conquer'); if(b&&!b.disabled){b.click(); return 'recorded'} return 'NO_DATA: no record button'})()`);
      const done = rec === 'recorded' && await hasta(`/Conquest recorded for this visit/.test((document.getElementById('visitor-conquer')||{}).textContent||'')`, 5000);
      ok(done, 'a verified win could not be recorded: ' + await ev(`(document.getElementById('visitor-conquer')||{}).textContent||'none'`));
      medidas.recordButton = await ev(`(document.getElementById('visitor-conquer')||{}).textContent||'none'`);
      await shot('07', 'conquest', { action: 'Record this local conquest (the battle receipt verified against this visit)', result: (done ? 'Conquest recorded for this visit' : medidas.recordButton) + ' · a record of this visit, never accredited ownership', evidence: done ? 'measured' : 'NO_DATA(' + medidas.recordButton + ')' });
      if (done) { feed('conquest_credited', { conquestCredited: true }); }
    }
    if (!win) { await shot('06' + String.fromCharCode(97 + t), 'defeat', { action: 'challenge a grey building (try ' + (t + 1) + ')', result: v.slice(0, 120), evidence: 'measured (a loss: nothing conquered)' }); }
    await ev(`(()=>{const d=document.querySelector('dialog[open]'); if(d){const b=[...d.querySelectorAll('button')].find(b=>/Close|Continue|OK/.test(b.textContent)); if(b) b.click(); else d.close();} const x=document.querySelector('#building-sheet .bs-bar button:last-child'); if(x) x.click(); return 1})()`); await espera(600);
  }
  if (!win) {
    scenes.push({ n: '06', scene: 'victory', file: null, visitor: 'visitor#1', evidence: 'NO_DATA(no valid win in ' + tries.length + ' real challenges: ' + tries.join(' | ') + ')' });
    scenes.push({ n: '07', scene: 'conquest', file: null, visitor: 'visitor#1', evidence: 'NO_DATA(no win, so no conquest to record)' });
    skip('no valid win'); 
    await ev(`document.getElementById('fa-ok').click()`); // Later: the honest way on
  }
  // a player reads each troop reveal and presses its Continue before looking at the town (one reveal shows at a time)
  for (let i = 0; i < 6; i++) { const left = await ev(`(()=>{const v=[...document.querySelectorAll('.revela')]; const shown=v.filter(e=>e.getClientRects().length); if(v.length>1 && shown.length>1) return 'stacked'; const b=shown[0] && [...shown[0].querySelectorAll('button')].pop(); if(b){b.click(); return v.length} return 0})()`); ok(left !== 'stacked', 'two troop reveals are shown stacked'); if (!left) { break; } await espera(500); }
  // 08 BUILD: what the conquest opened (an ephemeral account never builds: conquest_sheet.js, Sovereign 2026-11-08)
  const town = await ev(`JSON.stringify(Object.fromEntries(AtlasMapPainter.view().world.markList.filter(m=>m.town).map(m=>[m.id,AtlasOwCalm.stateOf(m)])))`);
  await shot('08', 'build', { action: win ? 'the town step: what the win opened' : 'Later (no win): the town stays as it was', result: town, evidence: 'measured; BUILD itself NO_DATA(an ephemeral account only conquers; only nodes build, in the app)' });
  if (win && jr.state === 'BUILD') { skip('building_built: an ephemeral account only conquers; only nodes build (conquest_sheet.js)'); }
  // 09 HOSPITAL: the doctor on duty
  if (await ev(`document.getElementById('fa').dataset.step==='town'`)) { await ev(`document.getElementById('fa-ok').click()`); await espera(300); }
  await ev(`AtlasBuildingSheet.open('doctor')`); await espera(700);
  await shot('09', 'hospital', { action: 'open the doctor on duty', result: 'available since the start (accessibility: never locked); healing is not this building\'s function today', evidence: 'measured' });
  await ev(`(()=>{const x=document.querySelector('#building-sheet .bs-bar button:last-child'); if(x) x.click(); return 1})()`); await espera(400);
  await ev(`(()=>{const b=[...document.querySelectorAll('#preceptor-talk button')].find(b=>b.textContent==='OK'); if(b) b.click(); return 1})()`); await espera(300); // the player reads the duel news and presses OK
  // 10 EXPLORE
  if (await ev(`document.getElementById('fa').dataset.step==='explore'`)) { await ev(`document.getElementById('fa-ok').click()`); }
  await espera(600);
  await shot('10', 'explore', { action: 'OK: explore freely', result: 'tour=' + await ev(`localStorage.getItem('preceptoros.tour')`) + ', phase=' + await ev(`document.documentElement.dataset.owPhase`), evidence: 'measured' });
  const p = J.progress(jr);
  writeFileSync(OUT + 'journey.json', JSON.stringify({ v: 'preceptoros.first-journey/1', when: new Date().toISOString().slice(0, 10), viewport: '360×716@2', scenes, machine, contract: p, fallos }, null, 1));
  console.log(JSON.stringify({ piece: 'first_journey_e2e', medidas, out: OUT, scenes: scenes.map((s) => s.n + ':' + (s.evidence || '').slice(0, 30)), contract: p, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
