import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { launchChrome } from './chrome_launch.mjs';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const shotRoot=process.env.FRONT_DOOR_SHOTS||mkdtempSync(join(tmpdir(),'front-door-shots-'));
mkdirSync(shotRoot,{recursive:true});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 try {
  let path=decodeURIComponent(new URL(req.url,'http://local').pathname); if(path.endsWith('/'))path+='index.html';
  const full=resolve(publicRoot,'.'+path); if(!full.startsWith(publicRoot)){res.writeHead(403);res.end();return;}
  const body=readFileSync(full);res.writeHead(200,{'Content-Type':mime[extname(full)]||'text/plain','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cdpPort=9600+(process.pid%300), chrome=launchChrome(cdpPort);
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
 await command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audioStarts=0;window.__audioCloses=0;const Native=window.AudioContext;if(Native)window.AudioContext=class extends Native{constructor(...a){super(...a);window.__audioStarts++;}close(){window.__audioCloses++;return super.close();}};`});
 const receipts=[];
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:name==='mobile'});
  const hashes=[];
  for(let reload=0;reload<2;reload++){
   await command('Page.navigate',{url:origin+'/en/'});
   await until("document.querySelectorAll('.front-door-action').length===4");
   await evaluate('document.fonts.ready');
   const measured=await evaluate(`(()=>{
    const root=document.querySelector('.front-door'),buttons=[...root.querySelectorAll('.front-door-action')],art=root.querySelector('canvas.front-door-art'),title=root.querySelector('canvas.front-door-title');
    const a=art.getBoundingClientRect(),h=title.getBoundingClientRect();
    return {title:root.querySelector('h1').textContent,actions:buttons.map(b=>({id:b.dataset.frontAction,label:b.getAttribute('aria-label'),tag:b.tagName,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),
    overflow:document.documentElement.scrollWidth>innerWidth,overlap:!(a.right<=h.left||a.left>=h.right||a.bottom<=h.top||a.top>=h.bottom),
    oldIntro:!!document.querySelector('.descent-step,.descent-langs,.descent-intro'),audio:window.__audioStarts,bitmap:art.toDataURL(),frames:AtlasFrontDoor.art().map(f=>({id:f.id,bytes:new TextEncoder().encode(JSON.stringify(f)).length}))};})()`);
   assert.equal(measured.title,'Your own place, by your choice');
   assert.deepEqual(measured.actions.map(a=>a.id),['tutorial','explore','key','questions']);
   assert(measured.actions.every(a=>a.tag==='BUTTON'&&a.w>=44&&a.h>=44&&a.label));
   assert(!measured.overflow,'horizontal overflow at '+name);assert(!measured.overlap,'title covers art at '+name);
   assert(!measured.oldIntro);assert.equal(measured.audio,0);assert(measured.frames.every(f=>f.bytes<1024));
   hashes.push(createHash('sha256').update(measured.bitmap).digest('hex'));
   if(!reload){const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(join(shotRoot,name+'.png'),Buffer.from(shot.data,'base64'));}
  }
  assert.equal(hashes[0],hashes[1],'artwork changes across reloads');
  await evaluate("window.__keyCalls=0;Identity.crear=()=>{window.__keyCalls++;return Promise.resolve();}");
  assert.equal(await evaluate('__keyCalls'),0);
  await evaluate("document.querySelector('[data-front-action=key]').click()",true);
  await until('__keyCalls===1');await until("document.querySelector('[role=status]').textContent.includes('Nothing was published')");
  await command('Page.bringToFront');
  await evaluate("document.querySelector('[data-front-action=questions]').focus()");
  assert.equal(await evaluate("document.activeElement?.getAttribute('data-front-action')"),'questions');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until("document.querySelector('[data-front-action=questions]').getAttribute('aria-expanded')==='true'");
  assert(await evaluate("!!document.querySelector('.front-door-questions input')"));
  await evaluate("document.querySelector('.front-door-sound input').click()",true);
  await until('__audioStarts===1');await until("document.querySelector('[role=status]').textContent.includes('low sonar')");
  await evaluate("document.querySelector('.front-door-sound input').click()",true);await until('__audioCloses===1');
  await evaluate("document.querySelector('[data-front-action=explore]').click()",true);
  await until("!!document.querySelector('#atlas-piso')");
  receipts.push({viewport:name,width,height,bitmap_sha256:hashes[0],reloads:2,actions:'keyboard + local key + questions + opt-in sonar + live game entry'});
 }
 assert.equal(external.length,0,'external requests attempted: '+external.join(','));assert.equal(errors.length,0,errors.join('\n'));
 for(const name of ['front_door.js','front_door_view.js','front_door.css'])assert([...requests].some(url=>url.includes(name)),name+' was not loaded');
 console.log(JSON.stringify({piece:'G3',receipt:'MEDIDO',external_requests:0,views:receipts,screenshots:shotRoot}));
}finally{if(ws)ws.close();await chrome.close();await new Promise(r=>server.close(r));}
