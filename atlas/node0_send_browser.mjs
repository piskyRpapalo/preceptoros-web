// Node 0's chat sends at once (2026-11-16): an accepted message is in the conversation and out of the box at once; a
// waiting line holds its place; no double send; a failure offers the message back after a newer draft, never over it.
// The gateway is a test double (window.AtlasAulaChat stubbed): nothing leaves this machine. Uso: node atlas/node0_send_browser.mjs
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
  ok(await hasta('!!document.getElementById("visitor-start") && !!document.getElementById("chat-destination")', 15000), 'page loaded');
  await ev('document.getElementById("visitor-start").click()');
  ok(await hasta('!!document.getElementById("visitor-beacon")', 10000), 'visit started');
  const r = JSON.parse(await ev(`(async()=>{
    const w=(ms)=>new Promise(r=>setTimeout(r,ms)), q=document.getElementById('question'), f=document.getElementById('entry'), log=document.getElementById('log'), send=f.querySelector('button[type=submit]');
    // Load the real CIEF serializer, then stub only the gateway transport.
    // The UI must obey the same <=1023-byte envelope contract under test.
    if (!window.AtlasAulaChat) await new Promise((ok,fail)=>{
      const script=document.createElement('script');
      script.src='/game/classroom_chat.js'; script.onload=ok; script.onerror=fail; document.head.append(script);
    });
    let release=null; window.AtlasAulaChat.turn=()=>new Promise(r=>{release=r;});
    const m=document.getElementById('chat-destination'); m.value='hexelion'; m.dispatchEvent(new Event('change'));
    const out={};
    q.value='Where do I start?'; f.dispatchEvent(new Event('submit',{cancelable:true})); await w(50);
    out.you=[...log.children].some(li=>/^You · Where do I start\\?$/.test(li.textContent)); out.box=q.value; out.pending=(log.querySelector('[data-state=pending]')||{}).textContent||null; out.disabled=send.disabled;
    q.value='a newer draft'; f.dispatchEvent(new Event('submit',{cancelable:true})); await w(50);
    out.youCount=[...log.children].filter(li=>/^You · /.test(li.textContent)).length; out.draftKept=q.value;
    release({ok:false,cause:'aula_rechaza',chain:{tic:0,hash:null,sello:null}}); await w(80);
    out.pendingAfter=!!log.querySelector('[data-state=pending]'); out.fail=[...log.children].map(li=>li.textContent).filter(t=>/NO_DATA.*aula_rechaza/.test(t)); out.enabled=!send.disabled;
    const back=log.querySelector('li.back button'); out.back=back?back.textContent:null; if(back){back.click();} out.restored=q.value;
    q.value='Second question'; window.AtlasAulaChat.turn=()=>Promise.resolve({ok:true,text:'Walk to the first node.',chain:{tic:1,hash:null,sello:null}});
    f.dispatchEvent(new Event('submit',{cancelable:true})); await w(80);
    out.answer=[...log.children].map(li=>li.textContent).filter(t=>/Walk to the first node/.test(t)); out.boxAfter=q.value; out.pendingEnd=!!log.querySelector('[data-state=pending]');
    out.speaker=(log.lastElementChild||{}).dataset ? log.lastElementChild.dataset.speaker : null;
    return JSON.stringify(out);})()`));
  ok(r.you && r.box === '', 'accepted: the message is in the conversation and the box is empty at once (' + JSON.stringify(r.box) + ')');
  ok(/^Node 0 · waiting for the answer/.test(r.pending || ''), 'a waiting line holds the place: ' + r.pending);
  ok(r.disabled, 'the send button rests while waiting');
  ok(r.youCount === 1 && r.draftKept === 'a newer draft', 'no double send; a newer draft typed while waiting stays in the box');
  ok(!r.pendingAfter && r.fail.length === 1 && r.enabled, 'a failure: the waiting line goes, the cause is said once, the button is back');
  ok(r.back === 'Put my message back in the box' && r.restored === 'a newer draft Where do I start?', 'the message comes back after the newer draft, never over it: ' + r.restored);
  ok(r.answer.length === 1 && /^Node 0 · /.test(r.answer[0]) && r.boxAfter === '' && !r.pendingEnd, 'success: Node 0 answers, the box stays empty: ' + r.answer[0]);
  medidas.flow = r;
  console.log(JSON.stringify({ piece: 'node0_send', fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
