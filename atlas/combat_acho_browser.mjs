// combat_acho.js in a real browser (BEAUTY-02 p2): eye, ear and machine agree at every hit of a real practice record;
// reduced motion gives the same end state, the same words and no animation class. Uso: node atlas/combat_acho_browser.mjs
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


  const RUN = (reduce) => `(async()=>{
    for(let i=0;i<40&&!window.AtlasCombatAcho;i++){await new Promise(r=>setTimeout(r,250));}
    const A=AtlasCombatAcho,T=AtlasCombateTicks,K=AtlasCanon,p=AtlasValores.patrullas[0],seed=K.sha('atlas.patrulla/1:'+p.id),def=[],asa=[];
    for(let j=0;j<p.n;j++){def.push({tc:p.tc,semilla:K.sha(seed+':patrulla:'+j)});}
    for(let j=0;j<10;j++){asa.push({tc:'tc2',semilla:K.sha('combat-acho-browser:'+j)});def.push({tc:'tc1',semilla:K.sha('combat-acho-browser:d:'+j)});}
    const combat=T.combate(def,asa,K.sha('combat-acho-browser:seed')),res={seed:K.sha('b'),defenders:def,attackers:asa,combat,hits:combat.registro,practice:true};
    const copy=JSON.stringify(res),d=document.createElement('dialog');document.body.appendChild(d);
    const s=A.strip(document,res,{practice:true,reduce:${reduce},names:['The patrol','Your squad']});d.style.width='324px';d.appendChild(s.el);d.show();await new Promise(r=>setTimeout(r,300));
    const start=[...s.el.querySelectorAll('.ca-side')].map(x=>x.dataset.view+':'+new Set([...x.querySelectorAll('.ca-card')].map(c=>Math.round(c.getBoundingClientRect().top))).size);
    const said=[],bad=[],struck=[],acho=[];document.addEventListener('acho:event',e=>acho.push(e.detail.event.kind));
    const live=s.el.querySelector('.ca-live');new MutationObserver(()=>said.push(live.textContent)).observe(live,{childList:true,characterData:true,subtree:true});
    const check=(k)=>{const st=A.stateAt(A.read(res),k);
      const said=live.textContent.match(/Life: you (\\d+) %, the patrol (\\d+) %/),pm=s.el.dataset.life.split(',').map(Number);
      if(said&&(+said[1]!==Math.floor(pm[1]/10)||+said[2]!==Math.floor(pm[0]/10))&&k===s.el.dataset.hits*1&&live.textContent.startsWith('Round '+st.round+' ')&&A.script(A.read(res),true).some(x=>x.k===k&&!x.end))bad.push('ear '+k+' '+said[0]+' vs '+pm);
      if(s.el.dataset.life!==st.pm.join(','))bad.push('strip life '+k);
      s.el.querySelectorAll('.ca-card').forEach(c=>{const m=c.textContent.match(/· (\\d+) of (\\d+) · (.+)$/);
        if(!m||m[1]!==c.dataset.life||A.WORD[c.dataset.mood]!==m[3]||A.mood(+m[1],+m[2])!==c.dataset.mood)bad.push('card '+k+' '+c.textContent);
        if(c.classList.contains('is-struck'))struck.push(k);});
      s.el.querySelectorAll('.ca-side').forEach(x=>{const n=[...x.querySelectorAll('.ca-card')].filter(c=>+c.dataset.life>0).length;
        if(+x.dataset.standing!==n||x.dataset.view!==A.view(n,s.el.dataset.state!=='fighting')||!x.querySelector('.ca-head').textContent.includes(' '+n+' of '))bad.push('side '+k+' '+x.dataset.standing+'/'+n);});};
    if(!${reduce}){for(let k=1;k<=res.hits.length;k++){s.at(k);await new Promise(r=>setTimeout(r,0));check(k);}}
    s.end();await new Promise(r=>setTimeout(r,50));check(res.hits.length);
    const lines=A.script(A.read(res),true),last=lines[lines.length-1].line,ban=s.el.querySelector('.ca-verdict');
    const out={start,state:s.el.dataset.state,gana:combat.gana,said,bad,struck:struck.length,acho,last,banner:ban.textContent,hidden:ban.hidden,
      untouched:JSON.stringify(res)===copy,quiet:live.classList.contains('ca-quiet'),log:s.el.querySelectorAll('.ca-log li').length,rounds:lines.length,
      tileRows:[...s.el.querySelectorAll('.ca-side')].map(x=>{const t=[...x.querySelectorAll('.ca-card')].map(c=>Math.round(c.getBoundingClientRect().top));return x.dataset.view+':'+new Set(t).size;}),anim:getComputedStyle(ban).animationName};
    d.remove();return JSON.stringify(out);})()`;
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/?colony=alone` });
  ok(await hasta('!!document.getElementById("surface") && !!window.AtlasCombateTicks', 15000), 'map and combat engine loaded');
  const raw = await ev(RUN(false)); if (!raw) { const x = await cmd("Runtime.evaluate", { expression: RUN(false), awaitPromise: true, returnByValue: true }); throw new Error(JSON.stringify(x.result).slice(0, 400)); }
  const a = JSON.parse(raw);
  const want = { asalto: 'won', defensa: 'lost', empate: 'draw' }[a.gana];
  ok(a.state === want, 'machine: data-state ' + a.state + ' follows combat.gana ' + a.gana);
  ok(a.bad.length === 0, 'eye = machine at every hit: ' + a.bad.slice(0, 3).join(' | '));
  ok(a.said[a.said.length - 1] === a.last, 'ear: the last spoken line is the verdict');
  ok(new Set(a.said).size === a.said.length, 'ear: no line said twice: ' + a.said.length);
  ok(a.said.length === a.rounds, 'ear: one line per round plus the verdict (' + a.said.length + '/' + a.rounds + ')');
  ok(!a.hidden && a.banner.slice(2).replace(/rounds /, 'rounds. ') === a.last, 'eye: the stamp says the whole verdict, the same words as the ear: ' + a.banner);
  ok(a.quiet, 'eye: the spoken line is not shown twice once the stamp is up');
  ok(a.untouched, 'the result object is unchanged by the presentation');
  ok(a.struck > 0, 'motion: a struck card shakes when not reduced');
  ok(a.acho.join() === 'battle.' + want, 'machine: one acho:event battle.' + want + ' (' + a.acho.join() + ')');

  ok(!a.said.join(' ').match(/SIGNED/), 'never SIGNED');
  ok(a.start.join() === 'tiles:1,tiles:1', 'ten against ten: each side is one line of small waves at a 360 px phone (dialog 324 px) (' + a.start.join() + ')');
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const b = JSON.parse(await ev(RUN(true)));
  ok(b.state === a.state && b.last === a.last && b.banner === a.banner, 'reduced motion: the same end state, verdict and banner');
  ok(b.struck === 0 && b.anim === 'none', 'reduced motion: no shake, no stamp (' + b.anim + ')');
  ok(b.said.length === 1 && b.said[0] === a.last, 'reduced motion: the verdict is said once');
  ok(b.log === a.log, 'reduced motion: the round log keeps every round (' + b.log + ')');
  medidas.rounds = a.rounds; medidas.spoken = a.said.length; medidas.gana = a.gana;
  console.log(JSON.stringify({ piece: 'combat_acho', medidas, fallos }));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
