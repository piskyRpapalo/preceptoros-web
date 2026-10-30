// Browser check that the Army deep link stays honest, map-free, accessible and cached.
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
  const values=await evaluate(`(() => {const link=document.querySelector('a[href="/face/basic.html"]'), r=link&&link.getBoundingClientRect();
    return {title:document.querySelector('h1')?.textContent,noData:document.body.innerText.includes('NO_DATA'),link:!!link,minimum:r&&r.height,
      map:!!document.querySelector('svg,canvas'),synthetic:document.body.innerText.includes('Wave 1'),viewport:innerWidth,scroll:document.documentElement.scrollWidth};})()`);
  check(values && values.title==='Army · NO_DATA' && values.noData,'Army status is not honest NO_DATA');
  check(values && values.link && values.minimum>=44,'shared terminal link is missing or too small');
  check(values && !values.map && !values.synthetic,'Army page rendered a second map or synthetic army');
  check(values && values.scroll<=values.viewport,'horizontal overflow');
  await evaluate("document.querySelector('a[href=\"/face/basic.html\"]').focus()");
  const keyboard=await evaluate("document.activeElement?.getAttribute('href') === '/face/basic.html'");
  check(keyboard===true,'shared terminal link is not keyboard focusable');
  const touch=values.minimum>=44;
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
    offline=await evaluate("document.querySelector('h1')?.textContent === 'Army · NO_DATA' && !!document.querySelector('a[href=\"/face/basic.html\"]') && !document.querySelector('svg,canvas')");
    check(offline===true,'Army NO_DATA page unavailable offline');
  }
  if (process.argv[2]) {const image=await cmd('Page.captureScreenshot',{format:'png'});writeFileSync(process.argv[2],Buffer.from(image.result.data,'base64'));}
  console.log(JSON.stringify({values,keyboard,touch,externalRequests:external.length,workerReady:ready,offline,errors}));
}
main().catch(error=>{errors.push('harness: '+error.message);}).finally(()=>{try{ws?.close();}catch{}chrome?.close();server?.close();process.exitCode=errors.length?1:0;});
