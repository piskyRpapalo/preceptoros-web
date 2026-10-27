import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const F=require('../public/game/creation_feedback.js');
const P=require('../public/game/bubble_paint.js');

test('keyboard and pointer share integer coordinates and feedback',()=>{
  const keyboard=P.create(), touch=P.create();
  keyboard.addPoint(210,258); keyboard.addPoint(214,258);
  touch.addPoint(209.8,258.2); touch.addPoint(214.1,257.8);
  assert.deepEqual(keyboard.frame(),touch.frame());
  assert.deepEqual(keyboard.state(),touch.state());
  assert.deepEqual(F.describe(keyboard.state()),F.describe(touch.state()));
  assert.deepEqual(F.describe(keyboard.state()).clips,
    ['add','cyan','x','digit_2','digit_1','digit_4','y','digit_2','digit_5','digit_8','points','digit_2']);
});
test('undo, redo, border and repeat describe the preserved state',()=>{
  const p=P.create(); p.addPoint(210,258);p.addPoint(214,258);const frame=p.frame();
  p.undo();assert.equal(p.state().action,'undo');assert.equal(p.state().count,1);
  p.redo();assert.deepEqual(p.frame(),frame);assert.equal(p.state().action,'redo');
  p.addPoint(999,515);assert.deepEqual([p.state().x,p.state().y],[412,515]);
  assert.equal(p.state().action,'border');assert.match(F.describe(p.state()).text,/border/i);
  p.repeat();assert.equal(p.state().action,'repeat');assert.equal(p.state().count,3);
});
test('limit rejection persists and keeps last valid frame',()=>{
  const p=P.create();let result;
  for(let i=0;i<300;i++) {const before=JSON.stringify(p.tryFrame());result=p.addPoint(i,200);
    if(result.ok===false){assert.equal(JSON.stringify(p.tryFrame()),before);break;}}
  assert.equal(result.ok,false);assert.equal(p.state().action,'reject');
  assert.equal(p.state().cause,'limit');assert.match(F.describe(p.state()).text,/1024/);
  assert.equal(F.describe(p.state()).clips.at(-1),'limit');
});
test('unknown rejection cause keeps exact text and uses the declared reject cue',()=>{
  const state={action:'reject',color:'cyan',x:206,y:258,count:0,cause:'outside drawing viewport'};
  const described=F.describe(state);
  assert.match(described.text,/outside drawing viewport/);
  assert.equal(described.clips.includes('reject'),true);
  assert.equal(described.clips.includes('outside drawing viewport'),false);
  assert.equal(described.clips.includes('unavailable'),false);
});
test('queue never overlaps and declares missing or suspended audio',async()=>{
  let active=0,max=0;const played=[],errors=[];
  const catalog={clips:Object.fromEntries(F.INVENTORY.map(name=>[name,{data:'AA=='}]))};
  const q=F.create({catalog,play:async(clip,name)=>{active++;max=Math.max(max,active);played.push(name);await Promise.resolve();active--;},onError:e=>errors.push(e)});
  await Promise.all([q.playClip('ready'),q.playClip('signing'),q.playClip('signed')]);
  assert.equal(max,1);assert.deepEqual(played,['ready','signing','signed']);assert.deepEqual(errors,[]);
  await assert.rejects(F.create().playClip('ready'),/voice catalog unavailable/);
  const suspended=F.create({catalog,play:()=>Promise.reject(new Error('audio suspended')),onError:e=>errors.push(e)});
  await assert.rejects(suspended.playClip('ready'),/audio suspended/);assert.equal(errors.length,1);
});

test('mounted keyboard and touch produce equal visual, accessible and sound state',async()=>{
  const {FakeDocument,host}=await import('./fake_dom.mjs');
  function mount(){const root=host(new FakeDocument()),states=[];
    const view=P.mount(root,{feedback:{announce:async s=>states.push(F.describe(s))}});
    const surface=root.querySelector('[data-surface]');surface.getBoundingClientRect=()=>({left:0,top:0,width:412,height:515});
    return {root,view,surface,states};}
  const a=mount(),b=mount();
  const key=()=>a.surface.listeners.keydown[0]({key:'ArrowRight',preventDefault(){}});
  key();key();
  b.surface.listeners.pointerdown[0]({clientX:210,clientY:258,pointerType:'touch'});
  b.surface.listeners.pointermove[0]({clientX:214,clientY:258,pointerType:'touch'});
  b.surface.listeners.pointerup[0]({});
  assert.deepEqual(a.view.frame(),b.view.frame());assert.deepEqual(a.states,b.states);
  assert.equal(a.root.querySelector('[data-status]').textContent,F.describe(a.view.paint.state()).text);
  assert.equal(a.surface.querySelector('svg').getAttribute('aria-label'),F.describe(a.view.paint.state()).text);
  for(const button of a.root.querySelectorAll('button')) {assert.equal(button.style.minHeight,'44px');assert.equal(button.style.minWidth,'44px');}
  for(let i=0;i<150;i++)key();
  assert.equal(a.view.paint.state().action,'reject');
  assert.match(a.root.querySelector('[data-status]').textContent,/1024/);
  a.view.refresh();assert.match(a.root.querySelector('[data-status]').textContent,/1024/);
  const repeat=a.root.querySelector('[data-feedback]');a.root.listeners.click[0]({target:repeat});
  assert.equal(a.states.at(-1).clips[0],'repeat');assert.equal(a.states.at(-1).clips.at(-1),'limit');
});

test('catalog verifies exact inventory, PCM WAV, hashes and profile',async()=>{
  const {createHash}=await import('node:crypto');
  const hash=x=>createHash('sha256').update(x).digest('hex');
  const audio=Buffer.alloc(46);audio.write('RIFF');audio.writeUInt32LE(38,4);audio.write('WAVEfmt ',8);
  audio.writeUInt32LE(16,16);audio.writeUInt16LE(1,20);audio.writeUInt16LE(1,22);
  audio.writeUInt32LE(8000,24);audio.writeUInt32LE(16000,28);audio.writeUInt16LE(2,32);audio.writeUInt16LE(16,34);
  audio.write('data',36);audio.writeUInt32LE(2,40);
  const profile='{"model_sha256":"'+ '0'.repeat(64)+'"}';
  const catalog={schema:'preceptoros.creation-voice/1',profile,profile_id:hash(profile),
    clips:Object.fromEntries(F.INVENTORY.map(name=>[name,{text:name,size:audio.length,sha256:hash(audio),data:audio.toString('base64')}]))};
  const raw=JSON.stringify(catalog);await F.loadCatalog(raw);
  const invalid=structuredClone(catalog);delete invalid.clips.limit;
  await assert.rejects(F.loadCatalog(JSON.stringify(invalid)),/fields/);
  invalid.clips=structuredClone(catalog.clips);invalid.clips.add.sha256='0'.repeat(64);
  await assert.rejects(F.loadCatalog(JSON.stringify(invalid)),/hash/);
  invalid.clips=structuredClone(catalog.clips);invalid.profile+=' ';
  await assert.rejects(F.loadCatalog(JSON.stringify(invalid)),/profile/);
  await assert.rejects(F.loadCatalog(' '.repeat(25*1024*1024+1)),/limit/);
});
