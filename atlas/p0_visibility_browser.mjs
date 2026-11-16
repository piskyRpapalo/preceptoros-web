// UX-VISIBILITY-01 (Mesa #39): the joystick must never cover Node 0's chat, Talk, a building card or a dialog. With
// content open every visible control in it is reachable (the topmost element at its centre is itself), the field and
// Send stay in view with a phone keyboard up (viewport 360×400), and Tab goes from the field to Send. 360, 420, 1280; at 360 also with audio-only on and with reduced motion, and the
// field and Send keep an accessible name while the folded sticks leave the tree.
// SABOTAJE=css must be red. Uso: node atlas/p0_visibility_browser.mjs
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
      let cuerpo = readFileSync(f); if (SAB === 'css' && ruta === '/game/ow_calm.css') { cuerpo = Buffer.from(String(cuerpo).split('/* UX-VISIBILITY-01')[0]); } res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const SAB = process.env.SABOTAJE || ''; // css: the content-first rules removed → must be red
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



  const CHECK = `(()=>{ const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
    const top=(e)=>{const r=e.getBoundingClientRect(), x=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)), y=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)); if(r.bottom>innerHeight||r.top<0) return 'out of view'; const t=document.elementFromPoint(x,y); return t&&(t===e||e.contains(t)||root.contains(t))?'ok':(t?(t.id||t.className||t.tagName).toString().slice(0,30):'none');};
    const root=document.querySelector(ARG); if(!root) return JSON.stringify({none:true});
    const ctl=[...root.querySelectorAll('button,input,select,textarea,summary')].filter(vis);
    const box=root.getBoundingClientRect(), clip=(e)=>{let p=e.parentElement; while(p&&p!==root.parentElement){const st=getComputedStyle(p); if(/auto|scroll|hidden/.test(st.overflowY)){const q=p.getBoundingClientRect(), r=e.getBoundingClientRect(); if(r.top<q.top-1||r.bottom>q.bottom+1) return true;} p=p.parentElement;} return false;};
    const inView=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.top>=Math.max(0,box.top)&&r.bottom<=Math.min(innerHeight,box.bottom)&&!clip(e);});
    const bad=inView.map(e=>[e.id||e.textContent.trim().slice(0,18),top(e)]).filter(x=>x[1]!=='ok');
    const joy=['view-joystick','character-joystick'].map(i=>document.getElementById(i)).filter(e=>e&&vis(e)).length;
    return JSON.stringify({n:inView.length,bad,joy}); })()`;
  const run = (sel) => ev(CHECK.replace('ARG', JSON.stringify(sel))).then(JSON.parse);
  for (const [w, h] of [[360, 716], [420, 680], [1280, 800]]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
    ok(await hasta('!!document.getElementById("visitor-start") && !!document.querySelector("#gamepad .gp-mid")', 15000), w + ': page');
    await ev('localStorage.setItem("preceptoros.tour","skipped"); document.getElementById("visitor-start").click()');
    ok(await hasta('!!document.getElementById("visitor-beacon")', 10000), w + ': visit');
    // Node 0 / Talk
    await ev('document.querySelector(".cats [data-cat=Communication]").click()'); await espera(500);
    const m = await ev('(()=>{const m=document.getElementById("chat-destination"); m.value="hexelion"; m.dispatchEvent(new Event("change")); const q=document.getElementById("question"); q.scrollIntoView({block:"nearest"}); q.focus(); return 1})()'); void m;
    await espera(300);
    const talk = await run('#voices'); medidas[w + ' talk'] = talk;
    ok(talk.n > 0 && talk.bad.length === 0, w + ': in Talk a control is covered: ' + JSON.stringify(talk.bad));
    ok(talk.joy === 0, w + ': the sticks still stand while Talk is open');
    const tab = await ev('(async()=>{document.getElementById("question").focus(); return 1})()'); void tab;
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const after = await ev('(()=>{const a=document.activeElement; return a.type==="submit"&&a.closest("#entry")?"send":(a.id||a.textContent||a.tagName).slice(0,24)})()');
    ok(after === 'send', w + ': Tab from the field does not go to Send: ' + after);
    if (w < 600) { // a phone keyboard: the visible height shrinks to 400
      await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: 400, deviceScaleFactor: 1, mobile: true });
      await ev('document.getElementById("question").focus(); window.dispatchEvent(new Event("resize"))'); await espera(400);
      const kb = JSON.parse(await ev(`(()=>{const q=document.getElementById('question'); q.scrollIntoView({block:'nearest'}); const s=document.querySelector('#entry button[type=submit]'), g=document.getElementById('gamepad');
        const at=e=>{const r=e.getBoundingClientRect(); if(r.bottom>innerHeight||r.top<0) return 'out of view'; const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return t===e||e.contains(t)?'ok':(t&&(t.id||t.tagName))};
        return JSON.stringify({q:at(q), send:at(s), pad: g && g.getClientRects().length>0}); })()`)); medidas[w + ' keyboard'] = kb;
      ok(kb.q === 'ok' && kb.send === 'ok' && !kb.pad, w + ': with the keyboard up the field or Send is covered, or the gamepad stays: ' + JSON.stringify(kb));
      await ev('document.getElementById("question").blur()'); await espera(200);
      ok(await ev('!!document.getElementById("gamepad").getClientRects().length'), w + ': the gamepad does not come back when the field is left');
      await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
    }
    await ev('(()=>{const x=document.querySelector("#voices .panel-x, #voices [aria-label^=Close]"); if(x) x.click(); else document.querySelector(".cats [data-cat=Communication]").click(); return 1})()'); await espera(400);
    // a building card
    await ev('AtlasBuildingSheet.open("doctor")'); await espera(500);
    const card = await run('.bs-sheet:not([hidden])'); medidas[w + ' card'] = card;
    ok(card.n > 0 && card.bad.length === 0 && card.joy === 0, w + ': in a building card a control is covered or the sticks stand: ' + JSON.stringify(card));
  }
  // the same promise for a person who listens (audio-only on) and one who asks for less motion, at 360 with the keyboard up;
  // and for a screen reader: the field and Send have a name, the folded sticks leave the accessibility tree
  for (const mode of ['audio', 'still']) {
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: mode === 'still' ? 'reduce' : 'no-preference' }] });
    await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
    ok(await hasta('!!document.getElementById("visitor-start")', 15000), mode + ': page');
    await ev(`localStorage.setItem("preceptoros.tour","skipped"); localStorage.setItem("preceptoros.audio-only", ${JSON.stringify(mode === 'audio' ? 'on' : 'off')}); 1`);
    await cmd('Page.reload'); ok(await hasta('!!document.getElementById("visitor-start")', 15000), mode + ': reload');
    if (mode === 'audio') { ok(await ev('document.documentElement.dataset.audioOnly === "on"'), 'audio: the listening mode did not turn on'); }
    await ev('document.getElementById("visitor-start").click()'); await hasta('!!document.getElementById("visitor-beacon")', 10000);
    await ev('document.querySelector(".cats [data-cat=Communication]").click()'); await espera(500);
    const talk = await run('#voices'); medidas[mode + ' talk'] = talk;
    ok(talk.n > 0 && talk.bad.length === 0 && talk.joy === 0, mode + ': in Talk a control is covered or the sticks stand: ' + JSON.stringify(talk));
    const names = JSON.parse(await ev(`(()=>{const nm=e=>e?((e.getAttribute('aria-label')||'')+' '+(e.labels&&e.labels[0]?e.labels[0].textContent:'')+' '+(e.placeholder||'')+' '+(e.title||'')+' '+(e.tagName==='BUTTON'?e.textContent:'')).trim():'';
      const q=document.getElementById('question'), s=document.querySelector('#entry button[type=submit]');
      const sticks=['view-joystick','character-joystick'].map(i=>document.getElementById(i)).filter(Boolean).map(e=>getComputedStyle(e).display);
      return JSON.stringify({q:nm(q).slice(0,40), send:nm(s).slice(0,20), sticks}); })()`)); medidas[mode + ' names'] = names;
    ok(names.q && names.send, mode + ': the field or Send has no accessible name: ' + JSON.stringify(names));
    ok(names.sticks.every((d) => d === 'none'), mode + ': folded sticks stay in the accessibility tree: ' + JSON.stringify(names.sticks));
    await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: true });
    await ev('document.getElementById("question").focus(); window.dispatchEvent(new Event("resize"))'); await espera(400);
    const kb = JSON.parse(await ev(`(()=>{const q=document.getElementById('question'); q.scrollIntoView({block:'nearest'}); const s=document.querySelector('#entry button[type=submit]'); const at=e=>{const r=e.getBoundingClientRect(); if(r.bottom>innerHeight||r.top<0) return 'out'; const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return t===e||e.contains(t)?'ok':'covered'}; return JSON.stringify({q:at(q),send:at(s),pad:document.getElementById('gamepad').getClientRects().length>0})})()`)); medidas[mode + ' keyboard'] = kb;
    ok(kb.q === 'ok' && kb.send === 'ok' && !kb.pad, mode + ': with the keyboard up the field or Send is covered: ' + JSON.stringify(kb));
    await ev('localStorage.removeItem("preceptoros.audio-only"); 1');
  }
  console.log(JSON.stringify({ piece: 'p0_visibility', sabotage: SAB || null, medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
