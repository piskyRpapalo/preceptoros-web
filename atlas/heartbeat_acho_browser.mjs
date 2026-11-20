// Run with Node and Chrome. An optional output directory receives screenshots.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const nodeId = 'fixture-observer', eventId = 'node/' + nodeId;
const missing = 'fixture heartbeat feed unavailable';
function snapshot(seal) {
  const row = {id: nodeId, q: 1, r: 0, since: '2026-11-20', seal, alive: seal === 'LIVE'};
  return {esquema: 'preceptoros.openworld-estado/2', colonia: {nodes: seal === 'NO_DATA' ? [] : [row], buildings: [], units: []},
    cobertura: seal === 'NO_DATA' ? {estado: 'NO_DATA', causa: missing} : {estado: 'MEDIDO', fuente: 'node_heartbeats', valor: 1}};
}
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
let reads = 0;
const server = createServer(async (req,res) => {
  const {pathname} = new URL(req.url,'http://localhost');
  res.setHeader('Cache-Control','no-store');
  if (pathname === '/api/world-state') {
    reads++;
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify(snapshot('LIVE')));
    return;
  }
  const file = resolve(root,'.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  try {
    if (!file.startsWith(resolve(root) + sep)) throw Error('invalid path');
    const body = await readFile(file);
    res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const chrome = launchChrome(0);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  const port = await chrome.debugPort();
  const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let serial = 0;
  const pending = new Map();
  ws.onmessage = ({data}) => {
    const message = JSON.parse(data), entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(Error(message.error.message));
    else entry.resolve(message.result);
  };
  const command = (method,params = {}) => new Promise((resolve,reject) => {
    const id = ++serial;
    pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params}));
  });
  async function evaluate(expression) {
    const result = await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function until(expression,diagnosis) {
    for (let n = 0; n < 100; n++) {
      if (await evaluate(expression)) return;
      await wait(50);
    }
    const details = await evaluate("({beacon:!!window.AtlasNodeBeacon,score:!!window.AtlasAchoScore,doors:document.getElementById('node-doors')?.textContent,state:document.getElementById('state')?.textContent,events:window.nodeEvents?.length})");
    throw Error(diagnosis + ' ' + JSON.stringify({reads,...details}));
  }
  await command('Network.enable');
  await command('Network.setBypassServiceWorker',{bypass:true});
  await command('Page.addScriptToEvaluateOnNewDocument',{source:
    "window.nodeEvents = []; document.addEventListener('acho:event', e => {if (e.detail.id === 'node/fixture-observer') nodeEvents.push(e.detail);});"});
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'dark'}]});
  await command('Page.navigate',{url:'http://127.0.0.1:' + server.address().port + '/openworld/?colony=alone'});
  await until('window.AtlasNodeBeacon && window.nodeEvents?.length','normal page did not dispatch its fetched heartbeat');
  assert.ok(reads > 0);
  const records = [];
  // Read the production UI and the latest dispatched frame from separate observers.
  function browserObservation() {
    const d = nodeEvents.at(-1);
    const row = document.querySelector('#node-heartbeats [data-event-id="' + d.id + '"]');
    const sound = d.radio && AtlasRadioFrame.sound(d.radio,2);
    return {id:d.id,frame:d.frame,event:d.envelope,score:d.score,radio:d.radio,row:row && {text:row.textContent,...row.dataset},
      door:!!document.getElementById('node-door-fixture-observer'),
      sound:sound && {id:sound.id,seal:sound.seal,samples:sound.samples.length,cause:sound.cause},count:nodeEvents.length};
  }
  async function observe(seal,source) {
    const o = await evaluate('(' + browserObservation.toString() + ')()');
    assert.equal(o.frame.status,seal);
    assert.ok(o.row,'publisher transition is missing from the rendered heartbeat list');
    assert.equal(o.door,seal === 'LIVE');
    for (const id of [o.id,o.row.eventId,o.frame.id,o.radio.eventId,o.sound.id,o.event.id,o.score.id]) assert.equal(id,eventId);
    for (const s of [o.row.seal,o.radio.seal,o.sound.seal]) assert.equal(s,seal);
    for (const cause of [o.radio.cause,o.row.cause]) assert.equal(cause,o.frame.cause);
    assert.equal(o.radio.text,o.row.text);
    assert.equal(o.frame.change[0],o.radio.text);
    assert.equal(o.event.source,source);
    assert.equal(Number(o.row.seq),o.event.seq);
    assert.equal(o.event.status,{LIVE:'accepted',STALE:'stale',NO_DATA:'refused'}[seal]);
    assert.equal(o.score.status,o.event.status);
    assert.equal(o.sound.samples > 0,seal !== 'NO_DATA');
    if (seal === 'NO_DATA') {
      assert.equal(o.frame.cause,missing);
      assert.equal(o.sound.cause,missing);
    }
    const {nodes} = await command('Accessibility.getFullAXTree');
    assert.ok(nodes.some(n => !n.ignored && n.name?.value === o.radio.text),'heartbeat sentence missing from Chrome AX');
    if (process.argv[2]) {
      const shot = await command('Page.captureScreenshot',{format:'png'});
      await writeFile(resolve(process.argv[2],records.length + '-' + seal + '.png'),Buffer.from(shot.data,'base64'));
    }
    records.push({seal,source,seq:o.event.seq,events:o.count,cause:o.frame.cause,samples:o.sound.samples,ax:true});
  }
  await observe('LIVE','local');
  let count = await evaluate('nodeEvents.length');
  for (const seal of ['STALE','LIVE','NO_DATA']) {
    const use = 'AtlasNodeBeacon.use(' + JSON.stringify(snapshot(seal)) + ')';
    await evaluate(use);
    await observe(seal,'fixture');
    assert.equal(await evaluate('nodeEvents.length'),++count,'one event per transition');
    for (const repeats of [15,30,60]) {
      await evaluate('for(let i=0; i<' + repeats + '; i++) ' + use);
      assert.equal(await evaluate('nodeEvents.length'),count,'repeated input must be quiet');
    }
  }
  const priorReads = reads;
  await evaluate('Date.now = ((original) => () => original() + 180000)(Date.now); AtlasOpenworldView().redraw()');
  await until('nodeEvents.at(-1)?.frame?.status === "LIVE"','publisher did not restore the live heartbeat after a clock jump');
  assert.ok(reads > priorReads,'restored data must come from a new request');
  await observe('LIVE','local');
  console.log(JSON.stringify({browser:(await command('Browser.getVersion')).product,reads,records}));
} finally {
  ws?.close(); await chrome.close(); server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
