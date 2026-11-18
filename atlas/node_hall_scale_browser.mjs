// Camera orbit regression: Node 0's hall must not resize when the user rotates the map.
// Uses the page's real Canvas2D painter, HexProjection, camera and NodeBeacon (SYNTHETIC LIVE geometry fixture only; no public heartbeat).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC=fileURLToPath(new URL('../public/',import.meta.url));
const WAIT=ms=>new Promise(ok=>setTimeout(ok,ms));
const fail=[], results=[], ok=(b,m)=>{if(!b)fail.push(m)};
let srv,ch,ws,n=0;const pend=new Map();
async function main(){
 srv=createServer((req,res)=>{try{let name=new URL(req.url,'http://local').pathname;if(name.endsWith('/'))name+='index.html';const f=resolve(PUBLIC,'.'+name);if(!f.startsWith(PUBLIC))throw Error('path');const data=readFileSync(f);res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json'}[extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));ch=launchChrome(0);let list=null;for(let i=0;i<60&&!list&&!ch.failure();i++){await WAIT(250);try{list=await(await fetch('http://127.0.0.1:'+await ch.debugPort()+'/json')).json()}catch{}}
 if(!list)throw Error(ch.diagnostic());ws=new WebSocket(list.find(e=>e.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j)});
 ws.addEventListener('message',e=>{let d=JSON.parse(e.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}});
 const cmd=(method,params={})=>new Promise(r=>{const i=++n;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
 const ev=async code=>{const v=await cmd('Runtime.evaluate',{expression:code,awaitPromise:true,returnByValue:true});if(v.result?.exceptionDetails)throw Error(v.result.exceptionDetails.text);return v.result?.result?.value};
 await cmd('Runtime.enable');await cmd('Page.enable');await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cmd('Page.navigate',{url:'http://127.0.0.1:'+srv.address().port+'/openworld/?colony=alone'});
 let ready=false;for(let t=0;t<70&&!ready;t++){ready=await ev('!!(window.AtlasNodeBeacon&&window.AtlasTownPlan&&window.AtlasMapPainter?.view()&&document.getElementById("surface")?.mapZoom)');if(!ready)await WAIT(200)}
 ok(ready,'OpenWorld painter/camera/node beacon not mounted');
 if(ready){
  const r=JSON.parse(await ev(`JSON.stringify((()=>{
   const sf=document.getElementById('surface'), B=AtlasNodeBeacon,TP=AtlasTownPlan,Z=sf.mapZoom;
   B.use({colonia:{nodes:[{id:'primer-ancla',q:0,r:0,alive:true,seal:'LIVE',since:'2026-11-17'}]}});
   const original=TP.hall, result=[], angles=[0,30,60,90,120,180,270,359,0]; let captured=null;
   TP.hall=function(g,x,y,step,sq,H,live){captured={step,sq,boxX:step*1.6};return original.apply(this,arguments)};
   try{Z.reset();let current=0;for(const a of angles){
     Z.rotate(a-current);current=a;
     const V=AtlasMapPainter.view(),c=document.createElement('canvas');c.width=sf.width;c.height=sf.height;
     captured=null; B.draw(c.getContext('2d'),V,sf);
     result.push({angle:a,zoom:sf.dataset.zoom,tilt:V.G.tilt,k:V.G.k,step:captured?.step??null});
   }}finally{TP.hall=original;Z.reset()}
   return result;
  })())`));
  results.push(...r);
  ok(r.every(x=>Number.isFinite(x.step)&&x.step>8),'Node 0 not drawn: '+JSON.stringify(r));
  ok(r.every(x=>Math.abs(x.step-r[0].step)<=1e-6),'rotating camera resized Node 0: '+JSON.stringify(r));
  const heading=await ev('document.querySelector("#welcome-title")?.textContent||document.title');
  ok(typeof heading==='string'&&heading.length>0,'Welcome disappeared');
 }
 console.log(JSON.stringify({piece:'node_hall_scale_browser',viewport:[390,844],results,fail}));
}
main().catch(e=>{fail.push(String(e));console.log(JSON.stringify({fail}))}).finally(()=>{try{ws?.close()}catch{}ch?.close();srv?.close();process.exitCode=fail.length?1:0});
