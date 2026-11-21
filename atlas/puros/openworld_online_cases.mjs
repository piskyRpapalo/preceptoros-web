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
  assert.match(css, /bottom:4px;left:50%;right:auto;width:140px;transform:translateX\(-50%\)/);
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

test('Online visitor is independent of LIVE nodes and uses the existing free-walk spawn', () => {
  const shared=readFileSync(new URL('../../public/game/shared_crabs.js', import.meta.url),'utf8');
  const controls=readFileSync(new URL('../../public/game/colony_controls.js', import.meta.url),'utf8');
  assert.match(controls, /start\(visitor\)/);
  assert.match(controls, /else if \(visitor\) \{ walker = \{ node: 'cabin', q: 0, r: 0, visitor: true \}/);
  assert.match(shared, /if \(account && remote && !walker\(\)\)/);
  assert.match(shared, /ow\.controls\.start\(true\)/);
  assert.ok(!shared.includes("if (!colonia) { return null; }"));
  assert.deepEqual(N.liveNodes([]), []);
});
test('Node status, online presence and Acho use one existing verified frame core', () => {
  const shared=readFileSync(new URL('../../public/game/shared_crabs.js', import.meta.url),'utf8');
  const nodes=readFileSync(new URL('../../public/game/online_nodes.js', import.meta.url),'utf8');
  assert.match(shared, /F\.stateFrame\(\{ id: 'online\/visit', sentence: text, waves: \[\] \}\)/);
  assert.match(nodes, /F\.stateFrame\(\{id:'world\/nodes',sentence:sentence,waves:\[\]\}\)/);
  assert.match(nodes, /nodes\.length \? 'LIVE' : 'STATIC'/);
  assert.match(nodes, /state\.dataset\.state = ok \? 'MEDIDO' : 'NO_DATA'/);
});

test('Fresh signed node identifiers use the exact Aduana canonical alphabet, including dots and underscores', () => {
  const live = [
    {id:'primer-ancla',q:0,r:0,alive:true,seal:'LIVE'},
    {id:'nodo.1.alpha',q:1,r:0,alive:true,seal:'LIVE'},
    {id:'nodo.2_beta',q:2,r:0,alive:true,seal:'LIVE'},
    {id:'nodo.3.gamma',q:3,r:0,alive:true,seal:'STALE'},
    {id:'nodo/4',q:4,r:0,alive:true,seal:'LIVE'}
  ];
  assert.deepEqual(new Set(N.liveNodes(live).map(x=>x.id)), new Set(['primer-ancla','nodo.1.alpha','nodo.2_beta']));
});


test('Revoking HTTPS consent while /open is pending never resurrects a shared crab', async () => {
  // A slow authority may accept /open after the visitor withdraws consent.
  // The client must not re-create its local session or start polling afterwards.
  const names = ['AtlasCrabPresenceRemote','REMOTE_PRESENCE_CONFIG','AtlasCrabPresenceClient',
    'AtlasCrabPresenceAcho','AtlasSonifyAcho','AtlasAchoMath','AtlasAchoScore',
    'AtlasCoopBeacon','AtlasOpenworldView'];
  const before = new Map(names.map(n => [n, { present: Object.hasOwn(globalThis, n), value: globalThis[n] }]));
  let reply, opened = 0, ended = 0, intervals = 0;
  class El {
    constructor(id = '') {
      this.id = id; this.hidden = false; this.disabled = false; this.checked = false;
      this.dataset = {}; this.style = {}; this.textContent = ''; this.listeners = {};
      this.children = []; this.attributes = {};
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, payload = {}) { for (const fn of this.listeners[type] || []) fn({ type, ...payload }); }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); return child; }
    get firstChild() { return this.children[0] || null; }
    setAttribute(k, v) { this.attributes[k] = v; }
  }
  try {
    const cfg = { authority: 'https://api.preceptoros.org',
      origins: ['https://preceptoros.org'], ttl_ticks: 120, max_visits: 16 };
    globalThis.REMOTE_PRESENCE_CONFIG = cfg;
    globalThis.AtlasCrabPresenceRemote = { create: () => ({
      send: () => Promise.resolve({ ok: false, cause: 'authority_unreachable' }),
      end: () => { ended++; }
    }) };
    globalThis.AtlasCrabPresenceClient = { join: () => {
      opened++;
      return new Promise(resolve => { reply = resolve; });
    } };
    globalThis.AtlasCrabPresenceAcho = {};
    globalThis.AtlasSonifyAcho = {};
    globalThis.AtlasAchoMath = {};
    globalThis.AtlasAchoScore = {};
    globalThis.AtlasCoopBeacon = {};
    globalThis.AtlasOpenworldView = () => ({ controls: { walker: () => ({q:0,r:0}) }, redraw() {} });
    const els = Object.fromEntries(['visitor-play','surface','online-share','online-status',
      'online-consent','online-disconnect','online-player-list','online-players-toggle',
      'online-players'].map(id => [id, new El(id)]));
    const doc = {
      visibilityState: 'visible', readyState: 'loading',
      getElementById: id => els[id] || null,
      createElement: () => new El(),
      addEventListener() {}, dispatchEvent() {}
    };
    const win = {
      location: { origin: 'https://preceptoros.org', hostname: 'preceptoros.org', search: '' },
      REMOTE_PRESENCE_CONFIG: cfg, fetch: async () => { throw Error('no production network'); },
      addEventListener() {},
      setInterval: () => { intervals++; return intervals; },
      clearInterval: () => {}
    };
    const mounted = S.mount(doc, win);
    assert.ok(mounted);
    els['visitor-play'].emit('visitor:render', { detail: { account: {} } });
    els['online-consent'].checked = true;
    els['online-share'].emit('click');
    await new Promise(resolve => setImmediate(resolve)); // wait for module loading and /open pending
    assert.equal(opened, 1);
    els['online-consent'].checked = false;
    els['online-consent'].emit('change');
    assert.equal(ended, 1, 'revocation must end even a pending connection');
    reply({ ok: true, id: 'crab-12345678', beacon: null });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(mounted.state().id, null, 'late /open must not recreate presence');
    assert.equal(intervals, 0, 'late /open must not start polling or heartbeat');
    assert.equal(els['online-status'].dataset.cause, 'consent_revoked');
  } finally {
    for (const [name, saved] of before) {
      if (saved.present) globalThis[name] = saved.value;
      else delete globalThis[name];
    }
  }
});
