// WEB P0 online-game handoff: source-only + pure protocol tests, no public POST, no USB transport.
// Usage: node --test atlas/puros/openworld_online_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const N = require('../../public/game/online_nodes.js');
const C = require('../../public/game/crab_presence_client.js');
const R = require('../../public/game/crab_presence_remote.js');
const S = require('../../public/game/shared_crabs.js');
const html = readFileSync(new URL('../../public/openworld/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../public/game/openworld_online.css', import.meta.url), 'utf8');
const configText = readFileSync(new URL('../../public/game/openworld_online_config.js', import.meta.url), 'utf8');
const node = (id,seal='LIVE') => ({id,q:0,r:0,alive:true,seal});

test('Only verified LIVE nodes appear: 1 LIVE + 2 STALE means exactly 1', () => {
  assert.deepEqual(N.liveNodes([node('primer-ancla'),node('doggee-s110','STALE'),node('onexstation','STALE')]).map(x=>x.id), ['primer-ancla']);
});
test('Expired, forged, malformed or repeated nodes never become selectable', () => {
  assert.deepEqual(N.liveNodes([node('first','STALE'),{...node('second'),alive:false}, {...node('third'),q:NaN},
    {...node('fourth'),seal:'SIMULATED'}, {...node('fifth'),id:'<img>'}]), []);
  assert.equal(N.liveNodes([node('a'),node('a')]).length,1);
  assert.deepEqual(N.liveNodes([]),[]);
  assert.deepEqual(N.liveNodes(null),[]);
});
test('The actual page contains visible, labelled buttons BETWEEN joysticks and real state panels', () => {
  for (const id of ['online-actions','online-share','online-players-toggle','online-nodes-toggle',
    'online-players','online-nodes','online-consent','online-status','online-player-list',
    'online-node-select','online-node-visit','online-nodes-state','online-disconnect']) {
    assert.ok(html.includes('id="'+id+'"'), 'missing '+id);
  }
  assert.match(css, /#online-actions\{position:absolute/);
  assert.match(css, /bottom:4px;left:76px;right:76px/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /aria-live="polite"/);
});
test('Production loader is after HTTPS config and adapter; local port never becomes a public URL parameter', () => {
  const tags=['/game/openworld_online_config.js','/game/crab_presence_remote.js','/game/shared_crabs.js'];
  const p=tags.map(x=>html.indexOf(x));
  assert.ok(p.every(x=>x>0) && p[0]<p[1] && p[1]<p[2]);
  assert.ok(html.indexOf('/game/online_nodes.js') < html.indexOf('/game/openworld_page.js'));
  assert.ok(configText.includes("root.location.origin !== 'https://preceptoros.org'"));
  assert.ok(configText.includes("authority: 'https://api.preceptoros.org'"));
  assert.ok(!configText.includes('location.search'));
});
test('Remote adapter requires an actual WINDOW, separate consent and exact public origin', () => {
  const previousR=globalThis.AtlasCrabPresenceRemote,previousC=globalThis.REMOTE_PRESENCE_CONFIG;
  globalThis.AtlasCrabPresenceRemote=R;
  globalThis.REMOTE_PRESENCE_CONFIG={authority:'https://api.preceptoros.org',origins:['https://preceptoros.org'],ttl_ticks:120,max_visits:16};
  try {
    const mock={location:{origin:'https://preceptoros.org',ancestorOrigins:[]},fetch:async()=>({ok:true,headers:{get:()=>null},text:async()=>'{"ok":true}'}),addEventListener(){}};
    assert.equal(S.remoteConfig(mock,false),null);
    assert.equal(S.remoteConfig(mock.location,true),null, 'Location is not a Window');
    assert.equal(S.remoteConfig({...mock,location:{origin:'https://evil.example'}},true),null);
    assert.equal(S.remoteConfig({...mock,fetch:undefined},true),null);
    const adapter=S.remoteConfig(mock,true);
    assert.ok(adapter && adapter.state().active);
    adapter.end();
    assert.equal(adapter.state().active,false);
  } finally {
    if(previousR===undefined)delete globalThis.AtlasCrabPresenceRemote;else globalThis.AtlasCrabPresenceRemote=previousR;
    if(previousC===undefined)delete globalThis.REMOTE_PRESENCE_CONFIG;else globalThis.REMOTE_PRESENCE_CONFIG=previousC;
  }
});
const acc={info:()=>({publicKey:'a'.repeat(64)}),sign:async()=>('ed25519:'+'b'.repeat(128))};
test('No consent means no open request and no signed packets', async () => {
  let count=0;
  const out=await C.join(acc,async()=>{count++;return{ok:true}},false,[0,0],{requireGenesis:true});
  assert.equal(out.ok,false);assert.equal(out.cause,'consent_required');assert.equal(count,0);
});
test('Remote lacks a 64-character genesis: no signed first move is sent', async () => {
  for (const genesis of [undefined,'genesis','a'.repeat(63),'x'.repeat(64)]) {
    let calls=[];
    const out=await C.join(acc,async(path,body)=>{calls.push(path);return path==='/open'?{ok:true,id:'crab-01234567',genesis}:{ok:true,at:{q:0,r:0}}},true,[0,0],{requireGenesis:true});
    assert.equal(out.ok,false);assert.equal(out.cause,'genesis_missing_or_invalid');assert.deepEqual(calls,['/open']);
  }
});
test('Fresh genesis signs first step; second step chains from accepted digest', async () => {
  const genesis='f'.repeat(64),calls=[];
  const send=async(path,body)=>{
    calls.push({path,body});
    return path==='/open'?{ok:true,id:'crab-01234567',genesis}:path==='/step'?{ok:true,at:{q:1,r:0}}:{esquema:'atlas.presencia/1',crabs:[]};
  };
  const c=await C.join(acc,send,true,[0,0],{requireGenesis:true});
  assert.equal(c.ok,true);
  assert.equal((await c.step('east')).ok,true);
  assert.equal((await c.beat()).ok,true);
  assert.deepEqual(calls.map(x=>x.path),['/open','/step','/step']);
  assert.equal(calls[1].body.record.prev,genesis);
  assert.match(calls[2].body.record.prev,/^[0-9a-f]{64}$/);
  assert.notEqual(calls[2].body.record.prev,genesis);
  assert.equal(calls[2].body.record.seq,2);
});
test('Legacy LOOPBACK fixture still accepts the original literal genesis', async () => {
  const calls=[];
  const c=await C.join(acc,async(path,body)=>{
    calls.push({path,body});return path==='/open'?{ok:true,id:'crab-01234567'}:{ok:true,at:{q:1,r:0}};
  },true,[0,0]);
  assert.equal(c.ok,true);
  await c.step('east');
  assert.equal(calls[1].body.record.prev,'genesis');
});
test('Remote sends are strictly POST with no cookies or redirects', async () => {
  const requests=[];
  const win={location:{origin:'https://preceptoros.org'},addEventListener(){},
    fetch:async(u,init)=>{requests.push({u,init});return {ok:true,headers:{get:()=>null},text:async()=>'{"ok":true}'};}};
  const adapter=R.create({authority:'https://api.preceptoros.org',origins:['https://preceptoros.org'],ttl_ticks:120,max_visits:16},win,true);
  assert.ok(adapter);
  assert.equal((await adapter.send('/open',{key:'a'})).ok,true);
  assert.equal(requests.length,1);assert.equal(requests[0].u,'https://api.preceptoros.org/open');
  assert.equal(requests[0].init.method,'POST');assert.equal(requests[0].init.credentials,'omit');
  assert.equal(requests[0].init.redirect,'error');assert.equal(requests[0].init.cache,'no-store');
  assert.equal((await adapter.send('/admin',{})).ok,false);assert.equal(requests.length,1);
  adapter.end();
  assert.equal((await adapter.send('/open',{})).ok,false);assert.equal(requests.length,1);
});
