// WEB-JOURNEY-SINGLE-MOUNT-01: play the existing tutorial up to a signed summon.
// A second controller must never replace its internal state or steal the next «!».
// Uses real Chromium + native game logic and keys, not mocked game-state transitions.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC=fileURLToPath(new URL('../public/',import.meta.url)), wait=ms=>new Promise(r=>setTimeout(r,ms));
const failures=[], results=[], assert=(condition,message)=>{if(!condition)failures.push(message)};
let server,chrome,ws,seq=0;const pending=new Map();
async function main(){
 server=createServer((req,res)=>{try{let name=new URL(req.url,'http://local').pathname;if(name.endsWith('/'))name+='index.html';let f=resolve(PUBLIC,'.'+name);if(!f.startsWith(PUBLIC))throw Error('traversal');let bytes=readFileSync(f);
   if(process.env.SABOTAJE==='double'&&name==='/game/gamepad.js')bytes=Buffer.from(String(bytes).replace("'way_by_ear', 'ow_calm'].forEach","'way_by_ear', 'ow_calm', 'talk_head', 'first_adventure'].forEach"));
   if(process.env.SABOTAJE==='double'&&name==='/game/first_adventure.js')bytes=Buffer.from(String(bytes).replace("if (root.AtlasFirstAdventure && root.document && root.document.getElementById('fa')) { return; }","if (false) { return; }"));
   res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));chrome=launchChrome(0);let targets=null;
 for(let i=0;i<70&&!targets&&!chrome.failure();i++){await wait(200);try{targets=await(await fetch('http://127.0.0.1:'+await chrome.debugPort()+'/json')).json()}catch{}}
 if(!targets)throw Error(chrome.diagnostic());
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j)});
 ws.addEventListener('message',e=>{let x=JSON.parse(e.data);if(x.id&&pending.has(x.id)){pending.get(x.id)(x);pending.delete(x.id)}});
 const cmd=(method,params={})=>new Promise(r=>{let id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}))});
 const ev=async code=>{let x=await cmd('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});if(x.result?.exceptionDetails)throw Error(x.result.exceptionDetails.text+': '+x.result.exceptionDetails.exception?.description);return x.result?.result?.value};
 const until=async(expression,ms=9000)=>{let n=Math.ceil(ms/150);for(let j=0;j<n;j++){if(await ev(expression))return true;await wait(150)}return false};
 const metrics=()=>ev(`JSON.stringify((()=>{const d=document,c=d.getElementById('fa'),b=d.querySelector('[data-fa-next]'),v=d.getElementById('visitor-play'),p=d.getElementById('visitor-beacon');return {controllerCount:d.querySelectorAll('#fa').length,markerCount:d.querySelectorAll('#fa-bang').length,scriptCount:d.querySelectorAll('script[src*="/game/first_adventure.js"]').length,headScripts:d.querySelectorAll('script[src*="/game/talk_head.js"]').length,step:c?.dataset.step,now:window.AtlasFirstAdventure?.now(),marker:b?.id||b?.dataset.cat||null,beaconVisible:!!p&&!p.hidden&&p.getClientRects().length>0,voicesHidden:d.getElementById('voices')?.hidden,voicesCategory:d.getElementById('voices')?.dataset.activeCategory,summonVisible:!!d.getElementById('visitor-summon-tc1')?.offsetParent,summonDisabled:d.getElementById('visitor-summon-tc1')?.disabled,resources:v?.textContent?.match(/Copper \\d+ · Light \\d+ · Step \\d+ · Troops \\d+/)?.[0]||null,jsErrorCount:0}})())`);
 await cmd('Runtime.enable');await cmd('Page.enable');
 for(const [w,h] of [[360,716],[390,844],[420,640]]){
  await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
  await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await cmd('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/openworld/'});
  assert(await until('!!window.AtlasFirstAdventure&&!!document.getElementById("visitor-start")&&!!document.getElementById("fa")',12000),'visitor entry missing '+w);
  const a=JSON.parse(await metrics());assert(a.controllerCount===1&&a.markerCount===1&&a.scriptCount===1,'initial duplicate '+w+': '+JSON.stringify(a));
  await ev('document.getElementById("visitor-start").click()');
  assert(await until("document.getElementById('fa')?.dataset.step==='meet'",12000),'no meet after Play '+w);
  await wait(500);const meet=JSON.parse(await metrics());
  assert(meet.controllerCount===1&&meet.markerCount===1&&meet.scriptCount===1&&meet.headScripts===1,'gamepad reloaded tutorial/head '+w+': '+JSON.stringify(meet));
  await ev("document.getElementById('fa-ok').click()");
  assert(await until("window.AtlasFirstAdventure.now()==='beacon' && document.getElementById('fa')?.dataset.step==='beacon'",7000),'split controller: model != card after meet '+w);
  const pre=JSON.parse(await metrics());
  assert(pre.marker==='Army','profile not highlighted before opening '+w+': '+JSON.stringify(pre));
  await ev("document.querySelector('.cats [data-cat=Army]').click()");
  assert(await until("document.querySelector('[data-fa-next]')?.id==='visitor-beacon'",7000),'beacon marker missing in Profile '+w);
  const opened=JSON.parse(await metrics());
  await ev("document.getElementById('visitor-beacon').click()");
  assert(await until("window.AtlasFirstAdventure.now()==='summon'",7000),'beacon did not advance to summon '+w);
  const rewarded=JSON.parse(await metrics());
  assert((rewarded.resources||'').includes('Copper 100'),'beacon reward not measured '+w+': '+JSON.stringify(rewarded));
  // The reward may close Profile. In that case the next honest action is reopening it, not a vanished summon.
  if (rewarded.voicesHidden && rewarded.marker==='Army') await ev("document.querySelector('.cats [data-cat=Army]').click()");
  assert(await until("document.querySelector('[data-fa-next]')?.id==='visitor-summon-tc1'",7000),'reef summon not highlighted '+w+': '+JSON.stringify(rewarded));
  // No synthetic reward: first summon signs the real invocation and debits 50 copper.
  await ev("document.getElementById('visitor-summon-tc1').click()");
  assert(await until("document.getElementById('visitor-play')?.textContent?.includes('Copper 50 ·')",7000),'first invocation did not debit copper '+w);
  const summoned=JSON.parse(await metrics());
  // Re-evaluate an intentionally repeated module load: it must never create a second controller.
  await ev(`new Promise((resolve,reject)=>{let s=document.createElement('script');s.src='/game/first_adventure.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})`);
  const repeated=JSON.parse(await metrics());
  assert(repeated.controllerCount===1&&repeated.markerCount===1&&repeated.now===summoned.now,'repeated module replaced journey '+w+': '+JSON.stringify(repeated));
  results.push({viewport:[w,h],entry:a.controllerCount,afterPlay:meet.controllerCount,atBeacon:opened.marker,atSummon:rewarded.marker,copperAfterFirstSummon:summoned.resources,repeatedModuleControllerCount:repeated.controllerCount});
 }
 console.log(JSON.stringify({piece:'journey_single_mount_browser',results,failures}));
}
main().catch(e=>{failures.push(String(e));console.log(JSON.stringify({piece:'journey_single_mount_browser',results,failures}))}).finally(()=>{try{ws?.close()}catch{}chrome?.close();server?.close();process.exitCode=failures.length?1:0});
