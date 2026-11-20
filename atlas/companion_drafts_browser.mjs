// WEB-Day-D: real-Chrome regression for the CURRENT docs-only Companion route.
// The retired four-actions modal is not an active public feature. No automatic
// registration, owner authority, model provisioning or local-network discovery.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const types = { '.html':'text/html', '.js':'text/javascript',
  '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml',
  '.json':'application/json', '.webmanifest':'application/manifest+json' };
const srv = createServer((req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + path);
    const prefix = root.endsWith(sep) ? root : root + sep;
    if (!file.startsWith(prefix)) { res.writeHead(403); res.end(); return; }
    const buf = readFileSync(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-store' });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + srv.address().port;
const chrome = launchChrome(0);
const delay = (ms) => new Promise(ok => setTimeout(ok, ms));
let ws = null, serial = 0, watching = false;
const pending = new Map(), writes = [];

function command(method, params={}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error('NO_DATA(cdp_unconnected)'));
  }
  const id = ++serial;
  const promise = new Promise((resolveCommand, rejectCommand) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      rejectCommand(new Error('NO_DATA(cdp_timeout_' + method + ')'));
    }, 7000);
    pending.set(id, message => {
      clearTimeout(timer);
      message.error ? rejectCommand(new Error(message.error.message)) : resolveCommand(message.result);
    });
  });
  ws.send(JSON.stringify({id, method, params}));
  return promise;
}
async function evalJS(expression) {
  const response = await command('Runtime.evaluate',
    {expression, returnByValue:true, awaitPromise:true});
  if (response.exceptionDetails) {
    throw new Error('browser_exception:' + response.exceptionDetails.text);
  }
  return response.result?.value;
}
async function until(expression, value, deadline=7000) {
  const stop = Date.now() + deadline;
  while (Date.now() < stop) {
    if (await evalJS(expression) === value) return;
    await delay(130);
  }
  throw new Error('NO_DATA(mobile_browser_expected_state_missing)');
}

// Negative checker still rejects an invented LIVE claim or a private destination.
function violations(home, guide) {
  const out = [];
  if (home.href !== '/get-the-app/#companion-path') out.push('companion route must be docs-only');
  if (!/Create Companion · docs-only/.test(home.label)) out.push('companion label misrepresents admission');
  if (!home.box || home.box.h < 44 || home.box.w < 44) out.push('companion action below 44px');
  if (home.retired) out.push('retired companion modal reintroduced');
  if (!guide.docsOnly || guide.claimsLive || !guide.noData) out.push('false live admission or missing NO_DATA');
  if (!guide.template || !guide.instructions) out.push('official docs and template missing');
  return out;
}
try {
  const port = await chrome.debugPort();
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const page = targets.find(p => p.type === 'page');
  assert.ok(page, 'Chrome must expose its test page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok, {once:true});
    ws.addEventListener('error', fail, {once:true});
  });
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data);
    }
    if (watching && data.method === 'Network.requestWillBeSent') {
      const request = data.params?.request;
      if (request?.method && request.method !== 'GET') {
        writes.push({method:request.method, type:data.params?.type});
      }
    }
  });
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Emulation.setDeviceMetricsOverride',
    {width:360,height:640,deviceScaleFactor:1,mobile:true});
  await command('Page.navigate', {url:base + '/'});
  await until("document.readyState==='complete' && !!document.getElementById('dayd-companion')", true);
  const home = await evalJS("(() => {const a=document.getElementById('dayd-companion'),r=a.getBoundingClientRect();return {href:a.getAttribute('href'),label:a.textContent.trim(),box:{w:r.width,h:r.height},retired:!!document.getElementById('fa-companion')||!!document.getElementById('four-actions')};})()");
  assert.equal(await evalJS("(() => {document.getElementById('dayd-companion').focus();return document.activeElement.id;})()"),'dayd-companion','keyboard focus must reach companion route');
  watching=true;
  await evalJS("document.getElementById('dayd-companion').click()");
  await until("location.pathname==='/get-the-app/' && location.hash==='#companion-path'", true);
  const guide = await evalJS("(() => {const p=document.getElementById('companion-path'),t=document.body.innerText;return {docsOnly:!!p&&/docs-only human-reviewed PR/.test(p.textContent),claimsLive:/\\bCompanion is LIVE\\b|\\bregistered automatically\\b/i.test(t),noData:t.includes('NO_DATA(world_publication_not_verified)'),template:!!p?.querySelector('a[href*=\"companions/template\"]'),instructions:!!p?.querySelector('a[href*=\"CONTRIBUTING.md\"]'),width:document.documentElement.scrollWidth,viewport:innerWidth,buildingDraft:document.getElementById('dayd-building-status')?.textContent||''};})()");
  watching=false;
  assert.deepEqual(violations(home,guide),[],'current Companion must be an honest docs-only entry');
  assert.ok(guide.width<=guide.viewport,'mobile Companion page has horizontal scroll');
  assert.match(guide.buildingDraft,/DRAFT_ONLY/, 'local building is distinct from a registered Companion');
  assert.equal(writes.length,0,'opening a docs-only path must perform zero POST/PUT/PATCH writes');
  // Sabotage checks must fail against invented remote grants, dead paths and tiny controls.
  assert.ok(violations({...home,href:'http://127.0.0.1:8742/app'},guide).some(x=>/route/.test(x)));
  assert.ok(violations(home,{...guide,claimsLive:true}).some(x=>/false live/.test(x)));
  assert.ok(violations({...home,box:{w:20,h:20}},guide).some(x=>/44px/.test(x)));
  console.log(JSON.stringify({schema:'preceptoros.web.companion-docs-browser/1',
    state:'PASS',viewport:'360x640',engine:'Chrome',path:home.href,
    accessible_entry:'PASS',docsOnly:guide.docsOnly,neededLinks:2,
    mutating_requests:writes.length,negative_sabotages:3,
    registration:'NOT_PERFORMED',nodeLive:'NO_DATA'}));
} finally {
  if (ws) ws.close();
  await chrome.close();
  await new Promise(ok => srv.close(ok));
}
