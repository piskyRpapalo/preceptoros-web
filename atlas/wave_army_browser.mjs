// Browser check of the synthetic army face, its controls and the cached page.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [], external = [];
let server, chrome, ws, id = 0;
const pending = new Map();
function check(condition, message) { if (!condition) errors.push(message); }
async function main() {
  server = createServer((req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(root, '.' + path);
      if (!file.startsWith(resolve(root) + '/')) throw new Error('outside root');
      const types = {'.html':'text/html', '.js':'text/javascript', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.css':'text/css', '.json':'application/json'};
      res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'});
      res.end(readFileSync(file));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, port = 9600 + process.pid % 90;
  chrome = launchChrome(port);
  let pages;
  for (let i=0;i<60 && !pages && !chrome.failure();i++) { await wait(250); try { pages=await (await fetch('http://127.0.0.1:'+port+'/json')).json(); } catch {} }
  if (!pages) throw new Error(chrome.diagnostic());
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => {ws.addEventListener('open',resolve);ws.addEventListener('error',reject);});
  ws.addEventListener('message', event => {
    const msg=JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {pending.get(msg.id)(msg);pending.delete(msg.id);}
    if (msg.method === 'Network.requestWillBeSent') {const url=msg.params.request.url;if (/^https?:/.test(url) && new URL(url).origin !== origin) external.push(url);}
    if (msg.method === 'Runtime.exceptionThrown') errors.push('browser exception');
  });
  const cmd=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression => (await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result?.result?.value;
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await cmd('Page.navigate',{url:origin+'/face/army.html'});await wait(1500);
  const values=await evaluate(`(() => {const buttons=[...document.querySelectorAll('#controls button')], rows=[...document.querySelectorAll('#details tr')]; let bad=0;
    buttons.forEach((b,i)=>{b.click();if(b.getAttribute('aria-pressed')!=='true'||!document.querySelector('#status').textContent.startsWith(rows[i]?.cells[0]?.textContent||'!'))bad++;});
    return {buttons:buttons.length,rows:rows.length,bad,minimum:Math.min(...buttons.map(b=>b.getBoundingClientRect().height)),viewport:innerWidth,scroll:document.documentElement.scrollWidth};})()`);
  check(values && values.buttons===4 && values.rows===4 && values.bad===0,'controls or text rows differ');
  check(values && values.minimum>=44,'touch target below 44 CSS px');
  check(values && values.scroll<=values.viewport,'horizontal overflow');
  await evaluate("document.querySelectorAll('#controls button')[1].focus()");
  await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  const keyboard=await evaluate("document.querySelectorAll('#controls button')[1].getAttribute('aria-pressed') === 'true'");
  check(keyboard===true,'keyboard selection failed');
  const touchPoint=await evaluate("(()=>{const r=document.querySelectorAll('#controls button')[2].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()");
  await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint]});
  await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const touch=await evaluate("document.querySelectorAll('#controls button')[2].getAttribute('aria-pressed') === 'true'");
  check(touch===true,'emulated touch selection failed');
  check(external.length===0,'external request');
  const ready=await evaluate(`Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise(r=>setTimeout(()=>r(false),10000))])`);
  check(ready===true,'service worker did not become ready');
  let offline = false;
  if (ready) {
    const cached=await evaluate(`caches.match('/face/army.html').then(r=>!!r)`);
    check(cached===true,'army face absent from cache');
    await cmd('Page.reload'); await wait(1000);
    check(await evaluate('!!navigator.serviceWorker.controller'),'service worker not controlling page');
    await cmd('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await cmd('Page.navigate',{url:origin+'/face/army.html'}); await wait(1000);
    offline=await evaluate("document.querySelector('h1')?.textContent === 'Wave Army' && document.querySelectorAll('#details tr').length === 4");
    check(offline===true,'army face unavailable offline');
  }
  if (process.argv[2]) {const image=await cmd('Page.captureScreenshot',{format:'png'});writeFileSync(process.argv[2],Buffer.from(image.result.data,'base64'));}
  console.log(JSON.stringify({values,keyboard,touch,externalRequests:external.length,workerReady:ready,offline,errors}));
}
main().catch(error=>{errors.push('harness: '+error.message);}).finally(()=>{try{ws?.close();}catch{}chrome?.close();server?.close();process.exitCode=errors.length?1:0;});
