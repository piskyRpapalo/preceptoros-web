import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 try {
  let path=decodeURIComponent(new URL(req.url,'http://local').pathname); if(path.endsWith('/'))path+='index.html';
  const full=resolve(publicRoot,'.'+path); if(!full.startsWith(publicRoot)){res.writeHead(403);res.end();return;}
  let body=readFileSync(full);if(process.argv.includes('--sabotage-size')&&path==='/game/sea.js'){const text=body.toString();assert(text.includes('r = 18 * dpr;'));body=Buffer.from(text.replace('r = 18 * dpr;','r = 18 * dpr * zoom.factor();'));}res.writeHead(200,{'Content-Type':mime[extname(full)]||'text/plain','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cdpPort=10400+(process.pid%300), chrome=launchChrome(cdpPort);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws,seq=0;const pending=new Map(),external=[],errors=[],requests=new Set();
try {
 let pages;
 for(let i=0;i<60&&!pages&&!chrome.failure();i++){try{pages=await(await fetch('http://127.0.0.1:'+cdpPort+'/json')).json();}catch{await pause(150);}}
 assert(pages,chrome.diagnostic());
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j);});
 ws.addEventListener('message',event=>{
  const data=JSON.parse(event.data);
  if(data.id&&pending.has(data.id)){const cb=pending.get(data.id);pending.delete(data.id);cb(data);}
  if(data.method==='Network.requestWillBeSent'){
   const url=data.params.request.url;requests.add(url);
   if(/^https?:/.test(url)&&new URL(url).origin!==origin)external.push(url);
  }
  if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);
 });
 function command(method,params={}){return new Promise((r,j)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);j(new Error('CDP timeout '+method));},20000);pending.set(id,data=>{clearTimeout(timeout);if(data.error)j(new Error(JSON.stringify(data.error)));else r(data.result);});ws.send(JSON.stringify({id,method,params}));});}
 async function evaluate(expression,gesture=false){const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:gesture});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
 async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw new Error('Timed out: '+expression);}
 await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const receipts=[];
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:name==='mobile'});
  await command('Page.navigate',{url:origin+'/en/'});
  await until("document.querySelector('[data-front-action=explore]')");
  await evaluate("document.querySelector('[data-front-action=explore]').click()",true);
  await until("document.querySelector('canvas.atlas-arena-mapa')?.dataset.zoom==='1.00'");
  await evaluate(`window.readings=[];window.figure=AtlasEscena.figura;AtlasEscena.figura=function(g,a,x,y,r,o){if(g.canvas.matches('.atlas-arena-mapa'))readings.push({shape:JSON.stringify(a),r,x,y});return figure.apply(this,arguments);};`);
  const samples=[];
  for(const delta of [10000,-10000]){
   await evaluate(`readings=[];document.querySelector('canvas.atlas-arena-mapa').dispatchEvent(new WheelEvent('wheel',{deltaY:${delta},cancelable:true}));`);
   await until('readings.length>0');
   const sample=await evaluate(`(()=>{const c=document.querySelector('canvas.atlas-arena-mapa');return {factor:Number(c.dataset.zoom),draws:[...new Map(readings.map(r=>[r.shape,{shape:r.shape,r:r.r}])).values()].sort((a,b)=>a.shape.localeCompare(b.shape)),panel:{width:c.clientWidth,height:c.clientHeight}};})()`);
   samples.push(sample);
  }
  assert.equal(samples[0].factor,.6);assert.equal(samples[1].factor,3);
  assert(samples[0].draws.length>0);assert.deepEqual(samples[0].draws,samples[1].draws,'map zoom changed object radius or genome');
  const before=await evaluate("document.querySelector('canvas.atlas-arena-mapa').dataset.zoom");
  await evaluate("document.querySelector('canvas.atlas-arena-mapa').dispatchEvent(new WheelEvent('wheel',{deltaY:9999,ctrlKey:true,cancelable:true}))");
  assert.equal(await evaluate("document.querySelector('canvas.atlas-arena-mapa').dataset.zoom"),before);
  receipts.push({viewport:name,panel:samples[0].panel,factors:samples.map(s=>s.factor),wave_objects:samples[0].draws.length,radii:[...new Set(samples[0].draws.map(d=>d.r))],size_preserved:true});
 }
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0);
 if(process.argv.includes('--require-focus'))assert.fail('[G5C_FOCUS_NO_DATA] No central focused-object rectangle is declared.');
 console.log(JSON.stringify({piece:'G5c',state:'MEDIDO',views:receipts,focus:{state:'NO_DATA',cause:'The inspector exposes semantic piece data; no focused-object bounding rectangle in the central panel is declared. The 25–50% rule cannot be certified.'},external_requests:0}));
}finally{if(ws)ws.close();await chrome.close();await new Promise(r=>server.close(r));}
