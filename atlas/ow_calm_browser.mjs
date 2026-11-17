// OpenWorld, calm (Mission A, 2026-11-16): before a visit one primary action (Play) and a clear map; every middle
// button says its name and is at least 44 px; the crab's steps, the guardian arrow and the builders' embers appear when
// they can act; nothing is removed. Measured at 360, 420 and 1280 px. Uso: node atlas/ow_calm_browser.mjs
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
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
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



  const MEASURE = `(()=>{ const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>2&&r.height>2&&s.visibility!=='hidden'&&s.display!=='none';};
    const mid=[...document.querySelectorAll('#gamepad .gp-mid button')].filter(vis).map(b=>{const r=b.getBoundingClientRect();return {name:b.dataset.name||'',aria:b.getAttribute('aria-label')||'',w:r.width,h:r.height,cs:getComputedStyle(b,'::after').content};});
    const play=document.getElementById('gp-play'), pr=play&&play.getBoundingClientRect(), bg=(b)=>getComputedStyle(b).backgroundColor, others=[...document.querySelectorAll('#gamepad .gp-mid button')].filter(b=>vis(b)&&b!==play);
    const H=window.AtlasMissionHotspots, MP=window.AtlasMapPainter, V=MP&&MP.view&&MP.view(); let embers=null;
    try { const c=document.createElement('canvas').getContext('2d'); embers = H && V && V.world ? H.draw(c, V, 1).length : null; } catch(e) { embers='err '+e.message; }
    const page=document.documentElement; return JSON.stringify({ phase:page.dataset.owPhase, mid, play: pr?{w:pr.width,h:pr.height,vis:vis(play),border:parseFloat(getComputedStyle(play).borderTopWidth),alone:others.every(b=>bg(b)!==bg(play)&&parseFloat(getComputedStyle(b).borderTopWidth)<3)}:null, padH:document.getElementById('gamepad').getBoundingClientRect().height,
      walk:vis(document.getElementById('ow-controls')), coordsW:(document.getElementById('ow-coords')||{getBoundingClientRect:()=>({width:0})}).getBoundingClientRect().width,
      embers, hscroll: page.scrollWidth > innerWidth + 1 });})()`;
  const seen = {};
  for (const [w, h] of [[360, 716], [420, 680], [1280, 800]]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
    ok(await hasta('document.documentElement.dataset.owPhase==="arrive" && document.querySelectorAll("#gamepad [data-name]").length>=4', 15000), w + ': calm did not mount');
    await espera(600);
    const a = JSON.parse(await ev(MEASURE)); seen[w] = a;
    ok(a.phase === 'arrive', w + ': phase before a visit is ' + a.phase);
    ok(a.mid.length >= 4 && a.mid.every((b) => b.name && b.w >= 44 && b.h >= 44 && b.aria.toLowerCase().startsWith(b.name.toLowerCase()) && b.cs.includes(b.name)), w + ': a middle button has no visible name, is under 44 px or its name is not in its label: ' + JSON.stringify(a.mid));
    ok(a.play && a.play.vis && a.play.border >= 3 && a.play.alone, w + ': Play is not the one primary action: ' + JSON.stringify(a.play));
    ok(a.padH <= 170, w + ': the gamepad grew and took the map\'s room: ' + a.padH);
    ok(!a.walk && a.embers === 0 && a.coordsW <= 1, w + ': something that cannot act yet is over the map: ' + JSON.stringify({ walk: a.walk, embers: a.embers, coords: a.coordsW }));
    ok(!a.hscroll, w + ': the page scrolls sideways');
  }
  // keyboard: Tab reaches Play within the first stops, and Enter on it starts the visit
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('document.documentElement.dataset.owPhase==="arrive" && !!document.getElementById("gp-play")', 15000), 'reload');
  await ev('document.activeElement && document.activeElement.blur(); document.body.focus()');
  let stops = 0, onPlay = false;
  for (; stops < 40 && !onPlay; stops++) { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); onPlay = await ev('document.activeElement && (document.activeElement.id==="gp-play" || document.activeElement.id==="welcome-play")'); }
  medidas.tabsToPlay = stops; ok(onPlay, 'Tab never reaches Play');
  await ev('document.getElementById("visitor-start").click()');
  ok(await hasta('document.documentElement.dataset.owPhase==="visit"', 10000), 'a visit does not move the phase to visit');
  await espera(400);
  const v = JSON.parse(await ev(MEASURE));
  ok(v.walk && v.embers >= 0, 'during the visit the crab\'s steps must show (embers may appear with locked buildings): ' + JSON.stringify({ walk: v.walk, embers: v.embers }));
  await ev('localStorage.setItem("preceptoros.tour","skipped"); window.AtlasOwCalm.refresh()');
  ok(await hasta('document.documentElement.dataset.owPhase==="visit"', 3000), 'a skipped first adventure should stay in visit phase (not free)');
  const f = JSON.parse(await ev(MEASURE));
  ok(f.embers > 0, 'during a visit the builders\' embers are visible: ' + f.embers);
  medidas.seen = Object.fromEntries(Object.entries(seen).map(([k, x]) => [k, x.mid.map((b) => b.name + ' ' + Math.round(b.w))]));
  console.log(JSON.stringify({ piece: 'ow_calm', medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
