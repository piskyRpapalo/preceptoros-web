import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { launchChrome } from './chrome_launch.mjs';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const fixture=readFileSync(new URL('./egg_reload_fixture.html',import.meta.url));
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 try {
  if(req.url==='/egg-test'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture);return;}
  let path=decodeURIComponent(new URL(req.url,'http://local').pathname); if(path.endsWith('/'))path+='index.html';
  const full=resolve(publicRoot,'.'+path); if(!full.startsWith(publicRoot)){res.writeHead(403);res.end();return;}
  const body=readFileSync(full);res.writeHead(200,{'Content-Type':mime[extname(full)]||'text/plain','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cdpPort=10000+(process.pid%300), chrome=launchChrome(cdpPort);
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
 await command('Page.navigate',{url:origin+'/egg-test'});
 await until('window.ready===true');
 const before=await evaluate('measure()');
 assert.equal(before.eggs,0);assert(before.copper>=100);
 await evaluate("Promise.all([inv.invoca('tc1'),inv.invoca('tc1')])",true);
 const paid=await evaluate('measure()');
 assert.equal(paid.eggs,2);assert.equal(paid.paid,2);assert.equal(paid.copper,before.copper-100);
 assert.deepEqual(paid.seq,[1,2]);assert.equal(paid.cause,'');assert(paid.entryBytes.every(b=>b<1024));
 const savedHash=createHash('sha256').update(JSON.stringify(paid.chain)).digest('hex');
 await command('Page.reload');await until('window.ready===true');
 const restored=await evaluate('measure()');
 assert.equal(restored.eggs,2);assert.equal(restored.copper,paid.copper);assert.equal(restored.cause,'');
 assert.equal(createHash('sha256').update(JSON.stringify(restored.chain)).digest('hex'),savedHash);
 await evaluate("(async()=>{const a=await AtlasArmy.cadenaWeb(pub).lee();a[1].obj.prev='damaged';await AtlasArmy.cadenaWeb(pub).pon(a);})()");
 await command('Page.reload');await until('window.ready===true');
 const corrupt=await evaluate('measure()');assert.equal(corrupt.eggs,0);assert(corrupt.cause.includes('prev'));
 assert.equal(external.length,0);assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({piece:'G5b',receipt:'MEDIDO',storage:'real IndexedDB',signature:'real WebCrypto Ed25519',engine:'real AtlasMotor; isolated fixture UI',paid:paid.paid,restored_eggs:restored.eggs,seq:restored.seq,entry_bytes:paid.entryBytes,chain_sha256:savedHash,tamper:'rejected',external_requests:0}));
}finally{if(ws)ws.close();await chrome.close();await new Promise(r=>server.close(r));}
