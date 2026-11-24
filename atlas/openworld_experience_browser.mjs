// OpenWorld UX physical renderer gate (Chrome CDP; no external network).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const MIME = {'.js':'text/javascript','.html':'text/html','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
  '.webmanifest':'application/manifest+json'};
const failures = [], receipt = {};
const check = (yes, why) => { if (!yes) failures.push(why); };
const wait = ms => new Promise(r => setTimeout(r, ms));
function serve() {
  const server = createServer((req,res) => {
    try {
      let uri=decodeURIComponent(new URL(req.url,'http://local').pathname);
      if(uri.endsWith('/')) uri+='index.html';
      const file=resolve(PUBLIC,'.'+uri);
      if(!file.startsWith(resolve(PUBLIC))) {res.writeHead(403);res.end();return;}
      const body=readFileSync(file);
      res.writeHead(200, {'content-type':MIME[extname(file)]||'text/plain','cache-control':'no-store'});
      res.end(body);
    } catch(_) {res.writeHead(404);res.end();}
  });
  return new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server)));
}
let server, chrome, socket, sequence=0;
const pending=new Map();
function command(method,params={}) {
  return new Promise(r=>{const id=++sequence;pending.set(id,r);socket.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression) {
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.result && r.result.exceptionDetails) return {error:r.result.exceptionDetails.text};
  return r.result && r.result.result ? r.result.result.value : null;
}
// The function is stringified, then run IN CHROME, not in this Node process.
async function probe() {
  const q=x=>document.querySelector(x);
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
  const c=q('#ow-controls'),d=q('#ow-directions'),stage=q('#stage'),brief=q('#ow-brief');
  if(!c||!d||!stage||!brief) return{error:'new UI did not load'};
  c.click();
  const on=!d.hidden, box=rect(d), st=rect(stage), buttons=[...d.querySelectorAll('button')];
  const small=buttons.filter(b=>b.getBoundingClientRect().width<44||b.getBoundingClientRect().height<44).length;
  const view=window.AtlasOpenworldView&&window.AtlasOpenworldView();
  const before=view&&view.controls&&view.controls.walker&&view.controls.walker();
  let moved=null;
  for(const dir of buttons) {
    dir.click();
    const after=view&&view.controls&&view.controls.walker&&view.controls.walker();
    if(before&&after&&(before.q!==after.q||before.r!==after.r)) {
      moved={dir:dir.dataset.dir,q:after.q,r:after.r};break;
    }
  }
  const coord=q('#ow-coords').textContent, message=brief.textContent;
  d.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  const gone=d.hidden;
  const play=q('#gp-play'); if(play&&!play.hidden)play.click();
  for(let i=0;i<45 && play && !play.hidden;i++) {
    await new Promise(r=>setTimeout(r,100));
  }
  const talk=q('#preceptor-talk'), line=talk&&talk.querySelector('.pt-line');
  // One message on the map (Sovereign, 2026-11-23): while the first adventure's card speaks, the result is written
  // inside it (#fa-news) instead of a second box; either place counts, as long as it is seen inside the scene.
  const fa=q('#fa'), fan=q('#fa-news'), inCard=!!fa&&!fa.hidden&&!!fan&&fan.textContent.includes('Visit started');
  const talkBox=inCard?rect(fa):talk?rect(talk):null;
  const talkStyle=talk&&getComputedStyle(talk);
  const pop=inCard || (!!talk && !!line && line.textContent.includes('Visit started') &&
    talkStyle.visibility!=='hidden' && talkStyle.display!=='none');
  return{on,box,st,small,count:buttons.length,moved,coord,message,gone,
    pop,talkBox,talkText:line&&line.textContent.slice(0,125),
    scroll:document.documentElement.scrollWidth,width:innerWidth};
}
try {
  server=await serve();
  const port=9300+process.pid%90;
  chrome=launchChrome(port);
  let pages=null;
  for(let i=0;i<60&&!pages&&!chrome.failure();i++) {
    await wait(250);
    try{pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();}catch(_){}
  }
  if(!pages)throw Error('Chrome unavailable: '+chrome.diagnostic());
  socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve);socket.addEventListener('error',reject);});
  socket.addEventListener('message',msg=>{
    const a=JSON.parse(msg.data);
    if(a.id&&pending.has(a.id)){pending.get(a.id)(a);pending.delete(a.id);}
    if(a.method==='Runtime.exceptionThrown')failures.push('browser exception: '+String(a.params.exceptionDetails?.text).slice(0,160));
  });
  await command('Runtime.enable');await command('Page.enable');
  for(const [w,h] of [[360,740],[420,642]]) {
    await command('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
    await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/openworld/?colony=alone'});
    await wait(3000);
    const v=await evaluate('('+probe.toString()+')()');
    receipt[w]=v;
    check(v&&!v.error,w+': '+(v?.error||'browser eval failed'));
    if(!v||v.error)continue;
    check(v.on&&v.gone,w+': controls cannot open and close with Escape');
    check(v.count===6&&v.small===0,w+': six controls are not all at least 44px');
    check(v.box.x>=v.st.x-1&&v.box.right<=v.st.right+1,w+': controls overflow horizontally');
    check(v.box.y>=v.st.y-1&&v.box.bottom<=v.st.bottom+1,w+': controls overflow vertically');
    check(v.moved&&v.message.includes('Moved')&&v.coord.includes('Hex'),
      w+': no verified movement with position feedback');
    check(v.pop,w+': play did not show a verified resource state in the preceptor popup');
    check(!v.talkBox || (v.talkBox.x>=v.st.x-1 && v.talkBox.right<=v.st.right+1 &&
      v.talkBox.y>=v.st.y-1 && v.talkBox.bottom<=v.st.bottom+1),w+': bubble leaves the scene');
    check(v.scroll<=v.width,w+': horizontal page overflow');
  }
}catch(e){failures.push(String(e&&e.stack||e));}
finally{
  try{socket&&socket.close();}catch(_){}
  try{chrome&&chrome.close();}catch(_){}
  try{server&&server.close();}catch(_){}
}
console.log(JSON.stringify({piece:'openworld-experience-browser',status:failures.length?'ROJO':'VERDE',receipt,failures}));
process.exitCode=failures.length?1:0;
