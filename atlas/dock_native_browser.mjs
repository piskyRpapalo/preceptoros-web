// DOCK-NATIVE-01 · same five controls, one contextual primary, 44px and Acho in phone/APP frame.
// This test uses Chromium's CDP via the project's existing chrome_launch, no new npm deps.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC=fileURLToPath(new URL('../public/',import.meta.url)), wait=ms=>new Promise(r=>setTimeout(r,ms)), failures=[], data=[];
const ok=(b,m)=>{if(!b)failures.push(m)};
let srv,ch,ws,n=0;const pend=new Map();
async function main(){
 srv=createServer((req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';const f=resolve(PUBLIC,'.'+p);if(!f.startsWith(PUBLIC))throw Error('path');let bytes=readFileSync(f);if(process.env.SABOTAJE==='forced-outline'&&p==='/game/ow_calm.css')bytes=Buffer.from(String(bytes).replace('outline:3px solid Highlight','outline:0 solid Highlight'));res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json'}[extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));ch=launchChrome(0);let list=null;
 for(let i=0;i<70&&!list&&!ch.failure();i++){await wait(200);try{list=await(await fetch('http://127.0.0.1:'+await ch.debugPort()+'/json')).json()}catch{}}
 if(!list)throw Error(ch.diagnostic());ws=new WebSocket(list.find(e=>e.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j)});
 ws.addEventListener('message',e=>{const v=JSON.parse(e.data);if(v.id&&pend.has(v.id)){pend.get(v.id)(v);pend.delete(v.id)}});
 const cmd=(method,params={})=>new Promise(r=>{const id=++n;pend.set(id,r);ws.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails)throw Error(r.result.exceptionDetails.text);return r.result?.result?.value};
 await cmd('Runtime.enable');await cmd('Page.enable');
 const measure=()=>ev(`JSON.stringify((()=>{
  const p=document.getElementById('gamepad'), c=getComputedStyle(p), maskEl=document.getElementById('gp-play');
  const visible=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return !e.hidden&&r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
  const buttons=[...p.querySelectorAll('.gp-mid button')].filter(visible);
  const forced=matchMedia('(forced-colors:active)').matches;
  const v=document.createElement('i');v.style.color='var(--affe58a)';document.body.appendChild(v);const yellow=getComputedStyle(v).color;v.remove();
  return {phase:document.documentElement.dataset.owPhase,primary:buttons.filter(b=>{
   const s=getComputedStyle(b);return forced ? parseFloat(s.outlineWidth)>=3 && s.outlineStyle!=='none' : parseFloat(s.borderTopWidth)>=3 && s.backgroundColor===yellow;
  }).map(b=>b.id||b.dataset.cat), buttons:buttons.map(b=>({id:b.id||b.dataset.cat,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,aria:b.getAttribute('aria-label')})),
   mask:getComputedStyle(maskEl,'::before').maskImage,ledge:c.boxShadow,outline:c.borderTopWidth,
   hscroll:document.documentElement.scrollWidth>innerWidth+1,forced};
 })())`);
 for(const [w,h] of [[360,716],[390,844],[420,640]]){
  await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
  await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await cmd('Page.navigate',{url:'http://127.0.0.1:'+srv.address().port+'/openworld/?colony=alone'});
  // The DOM can exist before its <link> stylesheet has finished loading.
  // Wait for the measured final primary and Acho mask, not an arbitrary sleep:
  // a missing CSS asset stays RED after the bounded 90 × 150 ms gate.
  let ready=false;
  for(let j=0;j<90&&!ready;j++){
    ready=await ev("(()=>{const p=document.getElementById('gp-play');return !!document.getElementById('gamepad')&&!!document.querySelector('#gamepad #gp-letters')&&!!document.querySelector('#gamepad .cats [data-cat=Communication]')&&!!p&&String(getComputedStyle(p,'::before').maskImage).includes('url(')&&parseFloat(getComputedStyle(p).borderTopWidth)>=3})()");
    if(!ready)await wait(150);
  }
  ok(ready,'gamepad CSS and Acho mask not ready at '+w);if(!ready)continue;
  // Adversarial RED: a second yellow, thick-border primary must be caught by the same R1 assertion.
  if (process.env.SABOTAJE==='double-primary') await ev("(()=>{const s=document.createElement('style');s.textContent='#gamepad .cats [data-cat=Welcome]{background-color:var(--affe58a)!important;border-width:3px!important}';document.head.appendChild(s)})()");
  const arrival=JSON.parse(await measure());
  ok(arrival.primary.join()==='gp-play','arrival not Play alone: '+JSON.stringify(arrival.primary));
  ok(arrival.outline==='3px'&&!!arrival.ledge&&!arrival.hscroll,'shell, ledge or scroll failed: '+w);
  ok(/url\(/.test(arrival.mask||''),'Acho mask missing: '+w);
  ok(arrival.buttons.every(b=>b.w>=44&&b.h>=44&&b.aria),'J1 button below 44px or missing aria: '+JSON.stringify(arrival.buttons));
  await ev("document.getElementById('visitor-start').click()");
  for(let j=0;j<70&&await ev("document.documentElement.dataset.owPhase!=='visit'");j++)await wait(100);
  await ev("document.querySelectorAll('#gamepad .gp-mid [data-fa-next]').forEach(b=>b.removeAttribute('data-fa-next'))");
  const fallback=JSON.parse(await measure());
  ok(fallback.primary.join()==='Communication','fallback not Talk: '+JSON.stringify(fallback.primary));
  await ev("document.getElementById('gp-town').setAttribute('data-fa-next','')");
  const next=JSON.parse(await measure());
  ok(next.primary.join()==='gp-town','a real marked next must be sole primary: '+JSON.stringify(next.primary));
  await ev("document.getElementById('log').insertAdjacentHTML('beforeend','<li class=\"turn them pending\" data-state=\"pending\">waiting</li>')");
  const pending=JSON.parse(await measure());
  ok(pending.primary.join()==='Communication','pending reply did not win over next: '+JSON.stringify(pending.primary));
  data.push({viewport:[w,h],arrival:arrival.primary,fallback:fallback.primary,next:next.primary,pending:pending.primary,buttons:arrival.buttons.length});
 }
 // Forced color: one contextual primary uses a 3px Highlight outline; yellow is unavailable.
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'forced-colors',value:'active'}]});
 await cmd('Page.navigate',{url:'http://127.0.0.1:'+srv.address().port+'/openworld/?colony=alone'});
 let forcedReady=false;
 for(let j=0;j<90&&!forcedReady;j++){
   forcedReady=await ev("(()=>{const p=document.getElementById('gp-play');return !!p&&String(getComputedStyle(p,'::before').maskImage).includes('url(')&&parseFloat(getComputedStyle(p).outlineWidth)>=3})()");
   if(!forcedReady)await wait(150);
 }
 ok(forcedReady,'forced-colors CSS or Acho mask never became ready');
 const forced=JSON.parse(await measure());
 ok(forced.forced&&forced.primary.join()==='gp-play','forced-color primary lost: '+JSON.stringify(forced));
 console.log(JSON.stringify({piece:'dock_native_browser',data,forced:{primary:forced.primary,outline:forced.outline},failures}));
}
main().catch(e=>{failures.push(String(e));console.log(JSON.stringify({failures}))}).finally(()=>{try{ws?.close()}catch{}ch?.close();srv?.close();process.exitCode=failures.length?1:0});
