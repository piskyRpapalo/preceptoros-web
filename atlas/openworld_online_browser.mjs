// Real Chromium layout witness for the EXISTING map at 360 and 420 CSS px.
// Two independent rounds are run by the caller. This is a local synthetic feed, NOT public multiplayer.
// Usage: node atlas/openworld_online_browser.mjs
import { createServer } from 'node:http';
import { readFileSync,writeFileSync } from 'node:fs';
import { resolve,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC=fileURLToPath(new URL('../public/',import.meta.url));
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
function serve(){
  const srv=createServer((req,res)=>{
    try{
      let name=decodeURIComponent(new URL(req.url,'http://local').pathname);
      if(name.endsWith('/'))name+='index.html';
      const f=resolve(PUBLIC,'.'+name);
      if(!f.startsWith(resolve(PUBLIC))){res.writeHead(403);res.end();return;}
      const bytes=readFileSync(f);
      res.writeHead(200,{'Content-Type':types[extname(f)]||'text/plain','Cache-Control':'no-store'});
      res.end(bytes);
    }catch{res.writeHead(404);res.end();}
  });
  return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const results=[],errors=[],issues=[],captureDir=process.env.CAPTURA || '';
let srv=null,ch=null,ws=null,id=0;
const pend=new Map();
async function main(){
  srv=await serve();ch=launchChrome(0);
  const p=await ch.debugPort();
  const targets=await(await fetch('http://127.0.0.1:'+p+'/json')).json();
  ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res);ws.addEventListener('error',()=>rej(Error('CDP')));});
  ws.addEventListener('message',e=>{
    const x=JSON.parse(e.data);
    if(x.id&&pend.has(x.id)){pend.get(x.id)(x);pend.delete(x.id);}
    if(x.method==='Runtime.exceptionThrown')errors.push(String(x.params.exceptionDetails.text).slice(0,110));
  });
  const cmd=(method,params={})=>new Promise(res=>{const n=++id;pend.set(n,res);ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>(await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result?.result?.value;
  await cmd('Page.enable');await cmd('Runtime.enable');
  for(const width of [360,420]){
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:true});
    await cmd('Page.navigate',{url:'http://127.0.0.1:'+srv.address().port+'/openworld/?colony=alone'});
    let ready=false;
    for(let t=0;t<50;t++){if(await ev('!!(window.AtlasOnlineNodes&&document.getElementById("online-actions"))')){ready=true;break;}await wait(200);}
    const expression="(() => {const ids=['online-share','online-players-toggle','online-nodes-toggle'];const row=ids.map(id=>{const e=document.getElementById(id),r=e&&e.getBoundingClientRect();return {id,text:e?.textContent,exists:!!e,width:r?.width,height:r?.height}});document.getElementById('online-nodes-toggle')?.click();const principalBuildings=[{id:'casa-tank-3',node:'tank-3',q:3,r:0,estado:'OFFLINE'}],principalBuildingsCoverage={estado:'MEDIDO',valor:1,fuente:'node_buildings'};document.dispatchEvent(new CustomEvent('world:nodes',{detail:{ok:true,nodes:[],buildings:[],principalBuildings,principalBuildingsCoverage}}));const panel=document.getElementById('online-nodes'),state=document.getElementById('online-nodes-state'),sel=document.getElementById('online-node-select'),bstate=document.getElementById('online-buildings-state'),bl=document.querySelector('#online-buildings-list button');let buildingEvent=null;document.addEventListener('acho:event',e=>{if(e.detail?.event?.kind==='building.state')buildingEvent=e.detail});bl?.click();const measured={toggle:document.getElementById('online-nodes-toggle').textContent,buildings:bstate.textContent,button:bl?.textContent,aria:bl?.getAttribute('aria-label'),buttonHeight:bl?.getBoundingClientRect().height,world:JSON.parse(state.dataset.world),event:buildingEvent};document.dispatchEvent(new CustomEvent('world:nodes',{detail:{ok:true,nodes:[],buildings:[]}}));const legacy=bstate.textContent;const sticks=[document.querySelector('.view-joy.left'),document.querySelector('.view-joy.right')].map(x=>x?.getBoundingClientRect());const buttons=document.getElementById('online-actions').getBoundingClientRect();const ctl=window.AtlasOpenworldView&&AtlasOpenworldView().controls;ctl?.start(true);const w=ctl?.walker();return {row,panel:!panel.hidden,state:state.dataset.state,hasAcho:state.dataset.acho?.includes('preceptoros.acho/1'),options:sel.options.length,disabled:document.getElementById('online-node-visit').disabled,walker:w?[w.q,w.r]:null,boundary:[sticks[0]?.right,buttons.left,buttons.right,sticks[1]?.left],aria:[...document.querySelectorAll('#online-actions button')].map(x=>x.getAttribute('aria-controls')),measured,legacy};})()";
    const v=await ev(expression),q=v?.boundary;
    const passes={ready,
      threeButtons:v?.row?.length===3&&v.row.every(x=>x.exists)&&v.row.filter(x=>x.id!=='online-share').every(x=>x.height>=44&&x.width>=44), // Share lives in Settings since 2026-11-23 (ow_topbar.js); the button stays in the DOM and keeps its panel
      noOverlap:Array.isArray(q)&&q.length===4&&q[1]>=q[0]&&q[2]<=q[3],
      zeroNode:v?.panel===true&&v.state==='MEDIDO'&&v.hasAcho&&v.options===1&&v.disabled===true,
      persistentOfflineBuilding:v?.measured?.toggle==='Nodes (0)'&&v.measured.buildings.startsWith('1 persistent principal building')&&v.measured.button==='casa-tank-3 · tank-3 · OFFLINE'&&v.measured.buttonHeight>=44&&v.measured.aria.includes('status OFFLINE')&&v.measured.world.principalBuildings[0].estado==='OFFLINE'&&v.measured.event?.frame?.status==='OFFLINE'&&v.measured.event?.frame?.owner==='tank-3'&&v.measured.event?.frame?.sound.startsWith('NO_DATA:'),
      legacyNoData:v?.legacy?.startsWith('NO_DATA:'),
      nodeFreeWalker:v?.walker?.join(',')==='0,0',
      labeled:v?.aria?.every(x=>x==='online-players'||x==='online-nodes')===false // share points to online-players, players and nodes own panels
    };
    passes.labeled=v?.aria?.join(',')==='online-players,online-players,online-nodes';
    if(captureDir){
      const pic=await cmd('Page.captureScreenshot',{format:'png'});
      if(pic.result?.data)writeFileSync(captureDir+'/openworld-online-'+width+'.png',Buffer.from(pic.result.data,'base64'));
    }
    const ok=Object.values(passes).every(Boolean);
    results.push({width,ok,passes,boundary:q,buttons:v.row});
    if(!ok)issues.push('viewport_'+width);
  }
}
try{await main();}catch(e){issues.push(String(e));}
finally{ws?.close();if(ch)await ch.close();if(srv)await new Promise(r=>srv.close(r));}
if(errors.length)issues.push('runtime_exceptions');
console.log(JSON.stringify({piece:'WEB-P0-online-visual',kind:'LOCAL_SYNTHETIC_NOT_PUBLIC_E2E',receipt:issues.length?'ROJO':'VERDE',results,errors:errors.slice(0,5),issues}));
process.exitCode=issues.length?1:0;
