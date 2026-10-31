// EU-3 in a real browser: the practice battle's replay has Pause and ×1 ×2 ×4, the scene receives the right rate for
// each control, the recorded battle still verifies at every speed, and the visit that holds it still works end to end.
// Uso: node atlas/battle_replay_controls_browser.mjs   (Chrome headless por CDP). Prints one JSON line; exit 1 on failure.
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
  const pulsaDialogo = (texto) => ev(`(() => { const d = document.querySelector('#visitor-play dialog'); if (!d) { return false; } const b = [...d.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(texto)}); if (!b) { return false; } b.click(); return true; })()`);
  await cmd('Runtime.enable'); await cmd('Page.enable');

  // The visit up to one adopted troop, as the battle browser check does it.
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await hasta('!!document.getElementById("visitor-start")', 15000), 'visitor controls available');
  await ev('document.getElementById("visitor-start").click()');
  ok(await hasta('!!document.getElementById("visitor-beacon")', 10000), 'visit started');
  await ev('document.getElementById("visitor-beacon").click()');
  ok(await hasta('document.getElementById("visitor-beacon").disabled && !document.getElementById("visitor-summon-tc1").disabled', 10000), 'beacon granted once');
  await ev('document.getElementById("visitor-summon-tc1").click()');
  ok(await hasta('!!document.getElementById("visitor-hatch-1")', 10000), 'paid egg exists');
  await ev(`(async()=>{for(let i=0;i<20;i++){document.getElementById('visitor-step').click();await new Promise(r=>setTimeout(r,0));}})()`);
  ok(await hasta('!document.getElementById("visitor-hatch-1").disabled', 10000), 'egg ready after steps');
  await ev('document.getElementById("visitor-hatch-1").click()');
  ok(await hasta('document.getElementById("visitor-play").textContent.includes("Troops 1")', 10000), 'adopted troop available');

  // Record every rate the scene receives, then open the battle. The record is snapshotted when it is handed over.
  await ev(`(() => { window.rates = []; const orig = AtlasWaveDuel.escena; AtlasWaveDuel.escena = function () { const r = orig.apply(this, arguments); const v = r.velocidad; r.velocidad = function (x) { rates.push(x); v(x); }; return r; }; })()`);
  await ev(`document.getElementById('visitor-play').addEventListener('visitor:battle', e => { window.measuredBattle = e.detail; window.snapBattle = JSON.stringify(e.detail); }, { once: true })`);
  await ev('document.getElementById("visitor-fight-arrecife").click()');
  ok(await hasta('!!document.getElementById("visitor-battle-result")', 10000), 'battle opens over the map');
  await espera(300);
  const status = () => ev(`document.querySelector('#visitor-play dialog [role=status]').textContent`);
  const inicio = await status();
  ok(inicio === 'PLAYING · ×1', 'replay starts playing at ×1: ' + inicio);

  // Pause, ×2 and ×4 while paused, then play at ×4: the scene gets 0, 0, 0, 4.
  ok(await pulsaDialogo('Pause'), 'Pause button exists');
  ok((await status()) === 'PAUSED · ×1', 'pause is shown on screen');
  ok(await pulsaDialogo('×2'), '×2 button exists');
  ok(await pulsaDialogo('×4'), '×4 button exists');
  ok((await status()) === 'PAUSED · ×4', 'speed change keeps the pause');
  ok(await pulsaDialogo('Play'), 'Play button exists');
  ok((await status()) === 'PLAYING · ×4', 'play resumes at the speed set before');
  // Then ×2 while playing, pause and play again at ×2: the scene gets 2, 0, 2.
  ok(await pulsaDialogo('×2'), '×2 button exists (playing)');
  ok(await pulsaDialogo('Pause'), 'Pause again');
  ok(await pulsaDialogo('Play'), 'Play again');
  ok((await status()) === 'PLAYING · ×2', 'play resumes at ×2');
  const tasas = await ev('window.rates');
  medidas.tasas = tasas;
  ok(JSON.stringify(tasas) === JSON.stringify([0, 0, 0, 4, 2, 0, 2]), 'scene rates follow the controls: ' + JSON.stringify(tasas));
  const presionado = await ev(`[...document.querySelector('#visitor-play dialog').querySelectorAll('button')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent)`);
  ok(JSON.stringify(presionado) === JSON.stringify(['×2']), 'the current speed is shown as pressed: ' + JSON.stringify(presionado));

  // The record does not change with the controls: it is the same object snapshotted when it was handed over.
  ok(await ev('JSON.stringify(window.measuredBattle) === window.snapBattle'), 'the battle record is unchanged by the controls');
  ok(await ev('!!window.measuredBattle && window.measuredBattle.frames.length > 0'), 'the battle has frames to replay');

  // The visit goes on after the battle.
  await pulsaDialogo('Return to the map');
  ok(await hasta('!document.querySelector("#visitor-play dialog[open]")', 5000), 'dialog closes, the visit goes on');
  ok(await hasta('!!document.getElementById("visitor-end")', 5000), 'the visit panel is still there after the battle');
  ok(await ev('!!document.getElementById("surface") && document.querySelectorAll("#surface").length === 1'), 'one persistent map');

  console.log(JSON.stringify({ piece: 'EU-3', medidas, fallos }));
}

main().catch((e) => { fallos.push(String(e)); console.log(JSON.stringify({ piece: 'EU-3', medidas, fallos })); })
  .finally(() => { try { ws?.close(); } catch {} ch?.close(); srv?.close(); process.exitCode = fallos.length ? 1 : 0; });
