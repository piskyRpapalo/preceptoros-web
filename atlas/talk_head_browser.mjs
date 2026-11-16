// The talking head (Mission D, 2026-11-16): an answer already received is revealed phrase by phrase beside the real
// face; the reader gets the whole text once (never letter by letter); Skip and Faster work; reduced motion shows it
// all at once; the voice says exactly the text. SABOTAJE=ojo|voz must be red. Uso: node atlas/talk_head_browser.mjs
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
      let cuerpo = readFileSync(f); if (SAB && ruta === '/game/talk_head.js') { cuerpo = Buffer.from(String(cuerpo).replace(SABS[SAB][0], SABS[SAB][1])); } res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const SAB = process.env.SABOTAJE || '';
const SABS = { // each must turn the test red
  ojo: ["paint(text, 0); box.dataset.state = 'said';", "paint(text.replace(/\\.\\s*$/, '!'), 0); box.dataset.state = 'said';"], // the eye ends on other words than the reader
  voz: ["new win.SpeechSynthesisUtterance(text)", "new win.SpeechSynthesisUtterance(list[0])"] // the voice says less than the text
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



  const TEXT = 'Hello. I am Node 0, the rack\'s AI. Walk to the beacon first; then summon, and we will practise a duel together.';
  const ASK = `(async(reduce)=>{ const w=(ms)=>new Promise(r=>setTimeout(r,ms)), q=document.getElementById('question'), f=document.getElementById('entry'), log=document.getElementById('log');
    window.__said=[]; window.speechSynthesis.cancel=()=>{}; window.speechSynthesis.speak=(u)=>window.__said.push(u.text); document.documentElement.dataset.audioOnly='on';
    window.AtlasAulaChat={plain:(c)=>'NO_DATA · '+c, turn:()=>Promise.resolve({ok:true,text:${JSON.stringify(TEXT)},chain:{tic:1,hash:null,sello:null}})};
    const m=document.getElementById('chat-destination'); m.value='hexelion'; m.dispatchEvent(new Event('change'));
    q.value='Who are you?'; f.dispatchEvent(new Event('submit',{cancelable:true})); await w(150);
    const li=log.lastElementChild, th=li&&li.previousElementSibling, says=th&&th.querySelector('.th-says'), out={};
    out.reader=li&&li.textContent; out.veiled=li&&li.classList.contains('th-veiled'); out.isHead=!!(th&&th.classList.contains('th'));
    out.artHidden=!!(th&&th.querySelector('.th-art[aria-hidden=true]')); out.liveInHead=!!(th&&th.querySelector('[aria-live],[role=status]'));
    out.first=says&&says.dataset.t; out.state=th&&th.dataset.state; out.face=(th&&th.querySelector('img.th-face')||{}).src||'';
    out.buttons=th?[...th.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return [b.textContent,Math.round(r.width),Math.round(r.height)];}):[];
    const seen=new Set(); for(let i=0;i<14&&!reduce;i++){ await w(130); seen.add(says.dataset.t); } out.steps=[...seen];
    const skip=th&&[...th.querySelectorAll('button')].find(b=>b.textContent==='Skip'); if(skip){skip.click();}
    await w(50); out.end=says&&says.dataset.t; out.endState=th&&th.dataset.state; out.endFace=(th&&th.querySelector('img.th-face')||{}).src||''; out.bar=!!(th&&th.querySelector('.th-bar'));
    out.said=window.__said.slice(); out.hscroll=document.documentElement.scrollWidth>innerWidth+1;
    const sr=th&&th.getBoundingClientRect(); out.headW=sr?Math.round(sr.width):0; return JSON.stringify(out); })`;
  for (const [w, h, reduce] of [[360, 716, false], [420, 680, true], [1280, 800, false]]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
    ok(await hasta('!!document.getElementById("visitor-start") && !!window.AtlasTalkHead', 15000), w + ': page or head not loaded');
    await ev('document.getElementById("visitor-start").click()');
    ok(await hasta('!!document.getElementById("visitor-beacon")', 10000), w + ': visit');
    await ev('(()=>{const c=document.querySelector(".cats [data-cat=Communication]"); if(c) c.click(); return 1})()');
    const r = JSON.parse(await ev(ASK + '(' + reduce + ')')); medidas[w] = { steps: (r.steps || []).length, headW: r.headW, buttons: r.buttons };
    const full = 'Node 0 · ' + TEXT;
    ok(r.reader === full && r.veiled && r.isHead && r.artHidden && !r.liveInHead, w + ': the reader does not get the whole answer once, beside an aria-hidden head: ' + JSON.stringify({ reader: r.reader, veiled: r.veiled, head: r.isHead, art: r.artHidden, live: r.liveInHead }));
    if (!reduce) {
      ok(r.state === 'speaking' && TEXT.startsWith(r.first) && r.first.length < TEXT.length, w + ': not revealed progressively from the start: ' + r.first);
      ok(r.steps.length >= 3 && r.steps.every((t) => TEXT.startsWith(t) && (t === '' || /[\s]$|[.;:!?]$/.test(t) || t === TEXT)), w + ': the reveal is not word by word along the real text: ' + JSON.stringify(r.steps));
      ok(r.buttons.length === 2 && r.buttons.every((b) => b[1] >= 44 && b[2] >= 44) && r.buttons.map((b) => b[0]).join() === 'Skip,Faster', w + ': Skip and Faster are not two 44 px buttons: ' + JSON.stringify(r.buttons));
    } else {
      ok(r.first === TEXT && r.state === 'said' && /habla0/.test(r.face), w + ': reduced motion does not show the whole answer at once with a still face: ' + JSON.stringify({ first: r.first, face: r.face }));
    }
    ok(r.end === TEXT && r.endState === 'said' && !r.bar && /habla0/.test(r.endFace), w + ': after Skip the eye does not hold the exact text, closed mouth: ' + JSON.stringify({ end: r.end, face: r.endFace }));
    ok(r.said.length === 1 && r.said[0] === TEXT, w + ': the voice does not say exactly the text, once: ' + JSON.stringify(r.said));
    ok(!r.hscroll && r.headW <= w, w + ': the head pushes the page sideways');
  }
  // the preceptor's news through the same head; OK takes it away and the line is plain again
  const n = JSON.parse(await ev(`(async()=>{ const w=(ms)=>new Promise(r=>setTimeout(r,ms)), V=window.AtlasPreceptorTalk&&window.AtlasPreceptorTalk.view; if(!V) return JSON.stringify({none:true});
    V.news('Your squad wins after 3 rounds.', 'Duel'); await w(60); const box=document.getElementById('preceptor-talk'), line=box.querySelector('.pt-line [aria-live]');
    const o={veiled:line.classList.contains('th-veiled'), text:line.textContent, head:!!box.querySelector('.th')};
    [...box.querySelectorAll('.pt-row button')].find(b=>b.textContent==='OK').click(); await w(30);
    o.after=!box.querySelector('.th') && !line.classList.contains('th-veiled'); return JSON.stringify(o); })()`));
  ok(n.veiled && n.head && n.text === 'Your squad wins after 3 rounds.' && n.after, 'the preceptor\'s news is not spoken by the head, or OK leaves it behind: ' + JSON.stringify(n));
  console.log(JSON.stringify({ piece: 'talk_head', sabotage: SAB || null, medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
