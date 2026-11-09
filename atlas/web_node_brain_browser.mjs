// The web node brain in a real browser (2026-11-01): /openworld/ loads the same-origin model only after consent, verifies
// every byte, answers a tutorial question on the CPU, and asks nothing outside this origin. Prints the timings measured.
// Uso: node atlas/web_node_brain_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const ONE = readFileSync(new URL('./fixtures/one_live_node.json', import.meta.url));   // one live node: the first node alive is the tutorial's place (the tutorial cabin is retired)
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = ruta === '/openworld/state.json' ? ONE : readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
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
  await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2500);
  // Before the click: nothing of the model is asked for, and the brain module is not even loaded.
  ok(modelos.length === 0 && (await ev('typeof window.AtlasWebNodeBrain')) === 'undefined', 'the brain loaded before the click');
  // The local brain is a Models panel action; expose that visible panel before measuring or consenting.
  await ev("document.querySelector('.cats [data-cat=Welcome]').click(); document.getElementById('entry-tools').click()");
  const r = JSON.parse(await ev(`(async () => { const t0 = performance.now(), note = document.getElementById('chat-note'), heard = [];
    document.addEventListener('brain:answer', (e) => heard.push(e.detail));
    const b = document.getElementById('brain-load'); const tall = b.getBoundingClientRect().height; b.click();
    for (let i = 0; i < 600 && !/ready on this device/.test(note.textContent); i++) await new Promise((r) => setTimeout(r, 100));
    const t1 = performance.now(), ready = note.textContent;
    document.querySelector('.cats [data-cat=Communication]').click();
    const q = document.getElementById('question'); q.value = 'How do I move my character?';
    document.getElementById('entry').requestSubmit();
    for (let i = 0; i < 900 && !heard.length; i++) await new Promise((r) => setTimeout(r, 100));
    const t2 = performance.now(), log = [...document.querySelectorAll('#log li')].map((li) => li.textContent);
    const a = heard[0] || {}, h = a.text ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a.text))), (x) => x.toString(16).padStart(2, '0')).join('') : '';
    return JSON.stringify({ load_ms: Math.round(t1 - t0), reply_ms: Math.round(t2 - t1), tall, ready, text: a.text || null, source: a.source || null, sha_ok: h === a.sha, verified: a.verified === true,
      logged: log.some((l) => l.startsWith('OpenWorld guide · page controls · Tap a hex to walk')) }); })()`));
  ok(r.tall >= 44, 'the download button is below 44 px: ' + r.tall);
  ok(/ready on this device/.test(r.ready), 'the brain did not get ready: ' + r.ready);
  ok(r.verified && r.sha_ok && r.logged, 'no verified answer reached the chat log and brain:answer: ' + JSON.stringify(r));
  ok(r.source === 'page-controls', 'movement answer was not grounded in the page controls: ' + JSON.stringify(r));
  ok(r.text === 'Tap a hex to walk, or open Welcome and choose a node place; press Enter on a focused place to go in. The view joystick pans the map; its arrow keys work only while it has focus.', 'the guide did not give the real controls: ' + r.text);
  ok(!/Map panel/i.test(r.text), 'the guide names a panel that does not exist in the final controls: ' + r.text);
  ok(modelos.length === 6, 'expected manifest + 5 chunks + nothing else from /models/: ' + modelos.length);
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  const speaker = JSON.parse(await ev(`(async () => { const w=(ms)=>new Promise(r=>setTimeout(r,ms)), map=document.querySelector('.cats [data-cat=Welcome]'); map.click();
    for(let i=0;i<50;i++){const b=document.querySelector('#map-node-list [data-node=home]');if(b){b.click();break;}await w(100);}
    for(let i=0;i<50&&!/Hexagonal building/.test(document.getElementById('chat-h').textContent);i++)await w(100);
    const inside=document.getElementById('chat-h').textContent, leave=document.getElementById('leave-building'); if(leave)leave.click();
    return JSON.stringify({inside, after:document.getElementById('chat-h').textContent}); })()`));
  ok(speaker.inside === 'Hexagonal building · b-home' && speaker.after === 'SmolLM2-135M-Instruct-Q4_K_M', 'leaving a building did not restore the loaded model as speaker: ' + JSON.stringify(speaker));
  console.log(JSON.stringify({ piece: 'web-node-brain', medidas: r, speaker, peticiones_modelo: modelos.length, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e.message || e)); console.log(JSON.stringify({ fallos })); }).finally(() => { try { ws && ws.close(); } catch {} try { ch && ch.close && ch.close(); } catch {} try { srv && srv.close(); } catch {} process.exit(fallos.length ? 1 : 0); });
