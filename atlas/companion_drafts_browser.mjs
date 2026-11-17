// WEB-MVP-S110-01: real-Chrome regression for local Companion drafts.
// Synthetic fixture only. Never submits, signs, grants, or registers anyone.
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
  await until("document.readyState==='complete' && !!document.getElementById('fa-companion')", true);
  await until("document.getElementById('four-actions').hidden", false);
  const closed = await evalJS("(() => { const b=document.getElementById('fa-companion'); return {label:b.textContent.trim(),expanded:b.getAttribute('aria-expanded'),controls:b.getAttribute('aria-controls')}; })()");
  assert.deepEqual(closed, {label:'Create Companion', expanded:'false', controls:'fa-panel'});
  await evalJS("document.getElementById('fa-companion').click()");
  assert.equal(await evalJS("document.getElementById('fa-panel').hidden"), false);
  assert.equal(await evalJS("document.activeElement.id"), 'fa-name');
  assert.equal(await evalJS("document.getElementById('fa-companion').getAttribute('aria-expanded')"), 'true');
  const labelled = await evalJS("['fa-name','fa-project','fa-what','fa-solves','fa-acc','fa-tests','fa-cost','fa-date','fa-machine'].every(id => !!document.querySelector('label[for='+id+']'))");
  assert.equal(labelled, true, 'every editable field needs an HTML label');
  await evalJS("(() => {document.getElementById('fa-name').value='s110-mvp-a11y';document.getElementById('fa-project').value='Synthetic contributor';document.getElementById('fa-what').value='Local-only sample';document.getElementById('fa-solves').value='Browser accessibility testing';})()");
  watching = true;
  await evalJS("document.getElementById('fa-make').click()");
  await delay(125);
  watching = false;
  const output = await evalJS("(() => {const panel=document.getElementById('fa-panel');const a=[...panel.querySelectorAll('a[download]')];return {status:document.getElementById('fa-say').textContent,filenames:a.map(x=>x.download),protocols:a.map(x=>new URL(x.href).protocol),docs:[...document.querySelectorAll('#fa-out pre')].map(x=>x.textContent)};})()");
  assert.match(output.status, /Prepared on this device: 2 drafts/);
  assert.match(output.status, /Nothing was sent/);
  assert.match(output.status, /Not registered until your pull request is accepted/);
  assert.deepEqual(output.filenames, ['DECLARATION.md', 'STATE.md']);
  assert.deepEqual(output.protocols, ['blob:', 'blob:']);
  assert.match(output.docs[0], /s110-mvp-a11y/);
  assert.match(output.docs[1], /NO_DATA.*not measured yet/);
  assert.equal(writes.length, 0, 'local draft must make zero network writes');

  await evalJS("(() => {document.getElementById('fa-name').value='../../secret';document.getElementById('fa-make').click();})()");
  const invalid = await evalJS("({status:document.getElementById('fa-say').textContent,downloads:document.querySelectorAll('#fa-out a[download]').length})");
  assert.match(invalid.status, /NO_DATA.*Companion name/i);
  assert.equal(invalid.downloads, 0);

  await command('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent', {type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evalJS("document.getElementById('fa-panel').hidden"), true);
  assert.equal(await evalJS("document.getElementById('fa-companion').getAttribute('aria-expanded')"), 'false');
  assert.equal(await evalJS("document.activeElement.id"), 'fa-companion');

  console.log(JSON.stringify({schema:'preceptoros.web.companion-drafts-browser/1',
    state:'PASS',viewport:'360x640',engine:'Chrome',
    accessible_entry:'PASS',local_drafts:2,mutating_requests:writes.length,
    invalid_name:'REJECTED',escape_focus:'PASS',
    account:'NONE',registration:'NOT_PERFORMED'}));
} finally {
  if (ws) ws.close();
  await chrome.close();
  await new Promise(ok => srv.close(ok));
}
