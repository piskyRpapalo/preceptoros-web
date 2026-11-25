import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const ROOT=fileURLToPath(new URL('../public/',import.meta.url));
const SAB=process.env.SABOTAJE||'',errors=[],results=[],outside=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(p,msg)=>{if(!p)errors.push(msg)};
let srv,ch,ws,id=0;const pend=new Map();
try{
 srv=createServer((req,res)=>{
  try{
   let path=decodeURIComponent(new URL(req.url,'http://local').pathname);
   if(path.endsWith('/'))path+='index.html';
   const file=resolve(ROOT,'.'+path);if(!file.startsWith(resolve(ROOT))){res.writeHead(403);res.end();return;}
   let body=readFileSync(file);
   if(path==='/get-the-app/index.html'&&SAB==='fake-msi')body=Buffer.from(String(body).replace('id="os-windows" href="#windows"','id="os-windows" href="https://example.test/fake.msi"'));
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'content-type':types[extname(file)]||'text/plain','cache-control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end();}
 });await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+srv.address().port,cdpPort=9620+(process.pid%70);
 ch=launchChrome(cdpPort);let pages;
 for(let i=0;i<80&&!pages&&!ch.failure();i++){await wait(125);try{pages=await(await fetch('http://127.0.0.1:'+cdpPort+'/json')).json();}catch{}}
 if(!pages)throw Error(ch.diagnostic());
 ws=new WebSocket(pages.find(x=>x.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
 ws.addEventListener('message',m=>{
  const x=JSON.parse(m.data);
  if(x.id&&pend.has(x.id)){pend.get(x.id)(x);pend.delete(x.id)}
  if(x.method==='Runtime.exceptionThrown')errors.push('JavaScript exception');
  if(x.method==='Network.requestWillBeSent'){let u=x.params.request.url;if(u.startsWith('http')&&!u.startsWith(origin))outside.push(u)}
 });
 const cd=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
 const ev=async source=>{const r=await cd('Runtime.evaluate',{expression:source,awaitPromise:true,returnByValue:true});return r.result?.result?.value};
 await cd('Runtime.enable');await cd('Page.enable');await cd('Network.enable');
 for(const width of [390,420,1280]){
  await cd('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
  await cd('Page.navigate',{url:origin+'/get-the-app/'});
  let ready=false;for(let n=0;n<120&&!ready;n++){await wait(80);ready=!!await ev('document.readyState==="complete" && !!document.getElementById("os-windows")')}
  ok(ready,width+' page not loaded');if(!ready)continue;
  const source='JSON.stringify((()=>{let ids=["os-android","os-ubuntu","os-windows"];return {nav:document.querySelector("nav.os-chooser")?.getAttribute("aria-label"),links:ids.map(id=>{let a=document.getElementById(id),r=a?.getBoundingClientRect();return{id,href:a?.getAttribute("href"),w:r?.width,h:r?.height,label:a?.textContent.trim(),desc:a?.getAttribute("aria-describedby")}}),legacy:[...document.querySelectorAll("a[href]")].filter(a=>a.getAttribute("href").includes("PreceptorOS-android-1.0.1.apk")).length,download:document.getElementById("native-android-download")?.getAttribute("href"),txt:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth}})())';
  const got=JSON.parse(await ev(source));
  ok(got.nav==='App for which system?',width+' missing accessible OS nav');
  got.links.forEach((a,i)=>{ok(a.href===['#door-native','#steps','#windows'][i],width+' bad system route '+a.id);ok(a.w>=44&&a.h>=44,width+' touch target '+a.id);ok(a.label.length>=30&&a.desc,width+' missing state '+a.id)});
  ok(got.legacy===0,width+' legacy TWA still a download link');
  ok(got.txt.includes('NO_DATA(windows_install_E2E_unverified)')&&got.txt.includes('NO_DATA(app_1_1_release_unverified)'),width+' missing honest NO_DATA');
  ok(/android-mvp-v22-20261125\/PreceptorOS-android-0\.3\.1-v22\.apk$/.test(got.download),width+' wrong native release');
  ok(!got.overflow,width+' horizontal overflow');
  await ev('document.getElementById("os-ubuntu").focus()');
  ok(await ev('document.activeElement?.id==="os-ubuntu"'),width+' keyboard focus');
  await cd('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await cd('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait(150);
  ok(await ev('location.hash==="#steps"'),width+' Enter failed');
  results.push({width,heights:got.links.map(a=>Math.round(a.h)),native:got.download,legacy:got.legacy});
 }
 ok(outside.length===0,'unexpected third-party network on page load');
 console.log(JSON.stringify({piece:'distribution-3os-browser',sabotage:SAB||null,receipt:errors.length?'ROJO':'VERDE',results,unexpected_external:outside.length,errors}));
}catch(e){errors.push(String(e));console.log(JSON.stringify({piece:'distribution-3os-browser',receipt:'ROJO',errors}))}
finally{try{ws?.close()}catch{}try{await ch?.close()}catch{}try{srv?.close()}catch{}}
if(errors.length)process.exitCode=1;
