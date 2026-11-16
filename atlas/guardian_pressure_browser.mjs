// Guardian pressure (Mesa #46 · WORLD-LIFE 17), walked in a real Chromium at 360 px. The guardians' patrol keeps its pace
// whatever the frame rate (measured with the CPU at ×1 and ×6); walking to the nearest guardian puts it on alert (it
// stops, leans toward the crab, looks at it; its profile says so; no other voice is stepped on); a beaten guardian
// withdraws away from the crab and is gone; reduced motion holds every pose still. The win that starts the retreat is
// SYNTHETIC here (the real one is first_journey_e2e.mjs). SABOTAJE=frames|blind|advance are red.
// Uso: node atlas/guardian_pressure_browser.mjs
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
const SABS = { // each must turn the test red
  frames: ['/game/guardian_pressure.js', "t = now == null ? clock() : now", "t = (at.n = (at.n || 0) + 16.7)"], // the pace a frame count again
  blind: ['/game/guardian_pressure.js', "return r4(x * x * (3 - 2 * x));", "return 0 * x;"], // the guardian never notices the crab
  advance: ['/game/guardian_pressure.js', "dx: r4(dx - ux * R.out * step), dy: r4(dy - uy * R.out * step)", "dx: r4(dx + ux * R.out * step), dy: r4(dy + uy * R.out * step)"] // the beaten one walks at you
};
const SAB = process.env.SABOTAJE || '';
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
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  await hasta('!!window.AtlasFirstAdventure', 15000);
  await ev(`localStorage.setItem('preceptoros.tour','skipped'); location.reload(); 1`); await espera(1500);
  ok(await hasta(`!!window.AtlasGuardianPressure && !!document.getElementById('gp-play')`, 15000), 'the page or guardian_pressure.js did not load');
  await ev(`document.getElementById('gp-play').click()`);
  ok(await hasta(`AtlasGuardianPressure.read().length > 0`, 20000), 'no guardian was drawn after Play');
  // 1 · the pace is a clock: turning speed of a patrolling guardian, CPU ×1 then ×6
  // the angle against the page's wall clock, sampled when a new frame appears (never the piece's own `t`)
  const rate = async () => JSON.parse(await ev(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)), G=AtlasGuardianPressure;
    const pick = () => G.read().filter(x=>x.state==='patrol' && x.a!=null)[0]; const k0 = pick(); if(!k0) return 'null'; const key = k0.key;
    const fresh = async (last) => { for(let i=0;i<200;i++){ const x=G.read().find(y=>y.key===key); if(x && x.a!==last) return [x.a, performance.now()]; await w(10); } return null; };
    const a = await fresh(k0.a), t0 = performance.now(); let n = 0, last = a && a[0]; while (performance.now() - t0 < 3000) { const f = await fresh(last); if (!f) break; last = f[0]; n++; }
    const b = await fresh(last); if(!a||!b) return 'null';
    return JSON.stringify({ rate: +((b[0]-a[0])/(b[1]-a[1])*1000).toFixed(3), draws: +(n/((performance.now()-t0)/1000)).toFixed(1) }); })()`) || 'null');
  const r1 = await rate(); await cmd('Emulation.setCPUThrottlingRate', { rate: 6 }); const r6 = await rate(); await cmd('Emulation.setCPUThrottlingRate', { rate: 1 });
  medidas.pace = { cpu1: r1, cpu6: r6 };
  ok(r1 && Math.abs(r1.rate - 2.1) < 0.21, 'the patrol pace is not 2.1 rad/s at CPU ×1: ' + JSON.stringify(r1));
  ok(r6 && Math.abs(r6.rate - 2.1) < 0.21, 'the patrol pace changes with the frame rate (CPU ×6): ' + JSON.stringify(r6));
  // 2 · walk to the nearest guardian: it notices, stops and looks at you
  await ev(`AtlasMapFog.go(); 1`);
  ok(await hasta(`!AtlasMapFog.walking()`, 60000), 'the walk to the nearest guardian never ended');
  await espera(800);
  const near = JSON.parse(await ev(`JSON.stringify(AtlasGuardianPressure.read().filter(x=>x.d<=1))`) || '[]');
  medidas.alert = near;
  ok(near.length >= 1 && near.every((x) => x.state === 'alert' && x.p === 1), 'at one hex the guardian is not on alert: ' + JSON.stringify(near));
  const still = JSON.parse(await ev(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)), G=AtlasGuardianPressure, k=G.read().find(x=>x.d<=1); if(!k) return 'null'; await w(700); const k2=G.read().find(x=>x.key===k.key); return JSON.stringify([k.dx,k.dy,k2&&k2.dx,k2&&k2.dy]); })()`) || 'null');
  ok(still && still[0] === still[2] && still[1] === still[3], 'on alert the guardian keeps walking its loop: ' + JSON.stringify(still));
  ok(await ev(`AtlasGuardianPressure.alerted().length >= 1`), 'the first alert was not recorded for the visit');
  const prof = await ev(`(()=>{ const k=AtlasGuardianPressure.read().find(x=>x.d<=1); if(!k) return ''; const m=AtlasMapPainter.view().world.markList.find(m=>m.id+':'+m.q+','+m.r===k.key); return AtlasMapFog.profile(m); })()`);
  ok(/it has seen you and stands its ground/.test(prof || ''), 'the guardian profile does not say it has seen you: ' + prof);
  const line = await ev(`(document.querySelector('.pt-news')||{}).textContent||''`);
  if (process.env.SHOT) { await ev(`(()=>{const b=document.querySelector('#building-sheet .bs-bar button:last-child'); if(b) b.click(); document.querySelectorAll('.pt-news button').forEach(b=>b.click()); return 1})()`); await espera(600);
    const { writeFileSync } = await import('node:fs'); const im = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.env.SHOT, Buffer.from(im.result.data, 'base64')); }
  medidas.voice = { cardOpen: await ev(`!!document.querySelector('.bs-sheet:not([hidden])')`), news: line.slice(0, 80) };
  // 3 · a beaten guardian withdraws (SYNTHETIC win: the flag the battle sets, set by the test)
  await ev(`(()=>{const b=document.querySelector('#building-sheet .bs-bar button:last-child'); if(b) b.click(); return 1})()`);
  const ret = JSON.parse(await ev(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)), G=AtlasGuardianPressure, k=G.read().find(x=>x.d<=1); if(!k) return 'null';
    const m=AtlasMapPainter.view().world.markList.find(m=>m.id+':'+m.q+','+m.r===k.key); const before=[k.dx,k.dy]; m.won=true; AtlasOpenworldView().redraw();
    const seen=[]; for(let i=0;i<30;i++){ await w(80); AtlasOpenworldView().redraw(); const x=G.read().find(y=>y.key===k.key); seen.push(x?x.state+':'+x.dx+','+x.dy:'none'); }
    m.won=false; return JSON.stringify({ before, seen }); })()`) || 'null');
  medidas.retreat = ret && { states: [...new Set(ret.seen.map((s) => s.split(':')[0]))], syntheticWin: true };
  const firstR = ret && ret.seen.find((s) => s.startsWith('retreating')), lastR = ret && [...ret.seen].reverse().find((s) => s.startsWith('retreating'));
  ok(!!firstR && ret.seen[ret.seen.length - 1] === 'none', 'the beaten guardian does not withdraw and go: ' + JSON.stringify(ret && ret.seen.slice(0, 6)));
  if (firstR && lastR) { // away from the crab: its lean pointed at the crab, the retreat goes the other way
    const b = ret.before, p1 = firstR.split(':')[1].split(',').map(Number), p2 = lastR.split(':')[1].split(',').map(Number);
    ok((p2[0] - p1[0]) * b[0] + (p2[1] - p1[1]) * b[1] < 0, 'the beaten guardian walks toward the crab: ' + JSON.stringify([b, p1, p2]));
  }
  // 4 · reduced motion: no loop, poses still
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await espera(400);
  const rm = JSON.parse(await ev(`(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)), G=AtlasGuardianPressure; AtlasOpenworldView().redraw(); await w(100); const a=JSON.stringify(G.read().map(x=>[x.key,x.dx,x.dy,x.a])); await w(900); AtlasOpenworldView().redraw(); await w(100); return JSON.stringify([a, JSON.stringify(G.read().map(x=>[x.key,x.dx,x.dy,x.a]))]); })()`) || 'null');
  ok(rm && rm[0] === rm[1], 'with reduced motion the guardians still move');
  ok(rm && JSON.parse(rm[0]).every((x) => x[3] === null), 'with reduced motion a patrol angle is still advancing');
  console.log(JSON.stringify({ piece: 'guardian_pressure', sabotage: SAB || null, medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
