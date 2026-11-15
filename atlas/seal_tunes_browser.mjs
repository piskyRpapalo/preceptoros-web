// The Seven Seals' tunes in a real browser (2026-11-16): a radio line that sounded shows the notes it played and its
// seal's tune in words — the same words as bb_radio.canto; NO_DATA shows none; a repaint keeps them.
// Uso: node atlas/seal_tunes_browser.mjs
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


  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('!!(window.AtlasRadioChat && window.AtlasBBRadio && window.AtlasRadioFrame && document.getElementById("radio-chat-lista"))', 15000), 'radio loaded');
  const out = JSON.parse(await ev(`(async()=>{
    const C=AtlasRadioChat,B=AtlasBBRadio; C.tono(true);
    const said={PROPUESTA:'A change waits for its signature',FIRMADO:'The Sovereign signed the change',ERROR:'The tower did not answer',SIMULATED:'A drill on a synthetic node',STALE:'The last heartbeat is old',NO_DATA:'NO_DATA: the beacon is not measured'};
    for(const s of Object.keys(said)){C.dice({texto:said[s],fuente:'state',sello:s});}
    C.dice({texto:'One more line, to repaint the list',fuente:'state',sello:'SIMULATED'});
    const rows=[...document.querySelectorAll('#radio-chat-lista .radio-msg')].slice(-7,-1).map(li=>{const t=li.querySelector('.radio-tune');
      return {seal:li.dataset.sello,tune:t?t.textContent.trim():null,want:B.canto(li.dataset.sello),dots:t?t.querySelectorAll('circle').length:0,
        notes:B.huella(li.dataset.sello).length,hidden:t?t.getAttribute('aria-hidden'):null,tag:t?t.dataset.seal:null};});
    return JSON.stringify(rows);})()`));
  out.forEach((r) => {
    if (r.seal === 'NO_DATA') { ok(r.tune === null && r.dots === 0, 'NO_DATA shows no tune: ' + JSON.stringify(r)); return; }
    ok(r.tune === r.want, r.seal + ': the words on screen are its canto (' + r.tune + ')');
    ok(r.dots === Math.min(2, r.notes) && r.dots > 0, r.seal + ': one dot per note that sounded (' + r.dots + ')');
    ok(r.hidden === 'true' && r.tag === r.seal, r.seal + ': aria-hidden (the ear hears the tone) and data-seal for machines');
  });
  ok(out.length === 6, 'six lines read after a repaint (' + out.length + ')');
  medidas.tunes = out.map((r) => r.seal + ': ' + r.tune);
  console.log(JSON.stringify({ piece: 'seal_tunes', medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
