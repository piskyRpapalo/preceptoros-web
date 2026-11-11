// Public OpenWorld chat draft safety; synthetic local gateway, actual Chromium DOM.
// The gateway is never contacted. SABOTAJE=borrar-borrador must fail.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const BASE=fileURLToPath(new URL('../public/',import.meta.url));
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const SAB=process.env.SABOTAJE||'';
const failed=[];
let srv,ch,ws,next=0;
const tasks=new Map();
function serve(){
 const s=createServer((req,res)=>{
  try{
   let path=decodeURIComponent(new URL(req.url,'http://local').pathname);
   if(path.endsWith('/'))path+='index.html';
   const f=resolve(BASE,'.'+path);
   if(!f.startsWith(resolve(BASE))){res.writeHead(403);res.end();return;}
   let buf=readFileSync(f);
   if(path==='/game/map_chat.js'&&SAB==='borrar-borrador')buf=Buffer.from(String(buf).replace("line('You', text);","line('You', text); input.value = '';"));
   res.writeHead(200,{'Content-Type':TYPES[extname(f)]||'text/plain','Cache-Control':'no-store'});res.end(buf);
  }catch{res.writeHead(404);res.end();}
 });return new Promise(ok=>s.listen(0,'127.0.0.1',()=>ok(s)));
}
const spy = [
 "(()=>{",
 "window.__calls=[];window.__queue=[];window.__held=[];",
 "const real=window.fetch.bind(window);",
 "window.fetch=(url,opts)=>{",
 "const u=String(url&&url.url||url);",
 "if(!u.startsWith('https://api.preceptoros.org/'))return real(url,opts);",
 "window.__calls.push({url:u,method:opts&&opts.method});",
 "const item=window.__queue.shift()||{status:503,body:{causa:'nodo_dormido'}};",
 "if(item==='HOLD')return new Promise(done=>window.__held.push((v)=>done(new Response(JSON.stringify(v.body),{status:v.status,headers:{'content-type':'application/json'}}))));",
 "return Promise.resolve(new Response(JSON.stringify(item.body),{status:item.status,headers:{'content-type':'application/json'}}));",
 "};",
 "})();"
].join('\n');
async function main(){
 srv=await serve();
 const origin='http://127.0.0.1:'+srv.address().port, port=9720+(process.pid%45);
 ch=launchChrome(port);
 let pages=null;
 for(let i=0;i<60&&!pages&&!ch.failure();i++){await sleep(250);try{pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();}catch{}}
 if(!pages)throw Error(ch.diagnostic());
 ws=new WebSocket(pages.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve);ws.addEventListener('error',()=>reject(Error('CDP')));});
 ws.addEventListener('message',m=>{const d=JSON.parse(m.data);if(d.id&&tasks.has(d.id)){tasks.get(d.id)(d);tasks.delete(d.id);}if(d.method==='Runtime.exceptionThrown')failed.push('exception:'+String(d.params.exceptionDetails.text).slice(0,90));});
 const cmd=(method,params={})=>new Promise(ok=>{const id=++next;tasks.set(id,ok);ws.send(JSON.stringify({id,method,params}));});
 const ev=async(expression)=>(await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result?.result?.value ?? null;
 const until=async(expression)=>{for(let i=0;i<50;i++){if(await ev(expression))return true;await sleep(125);}return false;};
 const ok=(condition,message)=>{if(!condition)failed.push(message);};
 await cmd('Runtime.enable');await cmd('Page.enable');
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cmd('Page.addScriptToEvaluateOnNewDocument',{source:spy});
 await cmd('Page.navigate',{url:origin+'/openworld/'});await sleep(1650);
 ok(await ev('window.__calls.length')===0,'request on page load');
 ok(await ev('!!document.getElementById("gp-play") && !!document.getElementById("question") && !!document.getElementById("chat-destination")'),'chat controls missing');
 await ev('document.getElementById("gp-play").click();true');await sleep(350);
 await ev('(()=>{let x=document.getElementById("chat-destination");x.value="hexelion";x.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
 const fill=(value)=>ev('(()=>{document.getElementById("question").value='+JSON.stringify(value)+';return true})()');
 const draft=()=>ev('document.getElementById("question").value');
 const send=()=>ev('(()=>{document.getElementById("entry").requestSubmit();return true})()');
 await fill('Source-backed question');
 await ev('window.__queue.push({status:503,body:{estado:"NO_DATA",causa:"nodo_dormido"}});true');await send();
 ok(await until('window.__calls.length===1'),'failed request not sent');
 await sleep(350);
 ok((await draft())==='Source-backed question','failed gateway erased draft');

 await fill('Second question');
 await ev('window.__queue.push({status:200,body:{estado:"OK",burbuja:{texto:"Synthetic answer",recortada:false},sello:{tic:1}}});true');await send();
 ok(await until('window.__calls.length===2'),'successful request not sent');
 ok(await until('document.getElementById("log").textContent.includes("Synthetic answer")'),'synthetic answer missing');
 ok((await draft())==='','answered question not cleared');

 await fill('Third question');
 await ev('window.__queue.push("HOLD");true');await send();
 ok(await until('window.__held.length===1'),'held request missing');
 await fill('New draft while pending');
 await ev('window.__held.shift()({status:503,body:{estado:"NO_DATA",causa:"nodo_dormido"}});true');
 await sleep(300);
 ok((await draft())==='New draft while pending','new draft overwritten after late rejection');
 ok(await ev('window.__calls.length')===3,'unexpected extra gateway calls');
 // Use a deterministic mock of the local brain. No large model download.
 await ev('window.AtlasWebNodeBrain={model:()=>"Synthetic guide",offline:()=>true,load:async()=>{},reply:async()=>{throw new Error("synthetic_model_unavailable")}};document.getElementById("brain-load").click();true');
 ok(await until('document.getElementById("brain-load").textContent.includes("ready")'),'local synthetic brain unavailable');
 await ev('(()=>{let x=document.getElementById("chat-destination");x.value="local";x.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
 await fill('A local question when the model fails');await send();
 ok(await until('document.getElementById("log").textContent.includes("synthetic_model_unavailable")'),'local refusal not shown');
 ok((await draft())==='A local question when the model fails','local failure erased draft');
 await ev('window.AtlasWebNodeBrain.reply=async()=>({source:"page-controls",model:"Synthetic guide",text:"Grounded page controls",verified:true,sha:"synthetic"});true');
 await fill('One local question with an answer');await send();
 ok(await until('document.getElementById("log").textContent.includes("Grounded page controls")'),'local reply not shown');
 ok((await draft())==='','local success did not clear sent question');
 await ev('window.AtlasWebNodeBrain.reply=()=>new Promise(resolve=>{window.__localPending=resolve});true');
 await fill('A pending local question');await send();
 ok(await until('!!window.__localPending'),'pending local model did not begin');
 await fill('New local draft');
 await ev('window.__localPending({source:"page-controls",model:"Synthetic guide",text:"Delayed page answer",verified:true,sha:"synthetic"});true');
 ok(await until('document.getElementById("log").textContent.includes("Delayed page answer")'),'late local reply not shown');
 ok((await draft())==='New local draft','late local reply erased newer draft');
 ok(await ev('window.__calls.length')===3,'local brain used remote gateway');
 console.log(JSON.stringify({piece:'map-chat-draft',sabotage:SAB||null,receipt:failed.length?'ROJO':'VERDE',cases:6,requests:await ev('window.__calls.length'),failures:failed}));
}
main().catch(e=>{failed.push(String(e&&e.message||e));console.log(JSON.stringify({piece:'map-chat-draft',receipt:'ROJO',failures:failed}));})
.finally(()=>{try{ws&&ws.close();}catch{}ch&&ch.close&&ch.close();srv&&srv.close();process.exitCode=failed.length?1:0;});
