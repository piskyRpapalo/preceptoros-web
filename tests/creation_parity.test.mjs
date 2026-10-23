import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const tree=path.resolve(process.env.CREATION_WEB_TREE || '.');
const require=createRequire(import.meta.url);
const Paint=require(path.join(tree,'public/game/bubble_paint.js'));
const Feedback=require(path.join(tree,'public/game/creation_feedback.js'));
const {FakeDocument,host}=await import(pathToFileURL(path.join(tree,'tests/fake_dom.mjs')));
const sabotage=process.env.CREATION_PARITY_SABOTAGE || '';

async function run(channel) {
  const root=host(new FakeDocument()), clips=[];
  const catalog={clips:Object.fromEntries(Feedback.INVENTORY.map(name=>[name,{data:'AA=='}]))};
  const sound=Feedback.create({catalog,play:async(_clip,name)=>{clips.push(name);}});
  const view=Paint.mount(root,{feedback:channel==='keyboard'?null:sound});
  const surface=root.querySelector('[data-surface="paint"]');
  surface.getBoundingClientRect=()=>({left:0,top:0,width:412,height:515});
  if(channel==='keyboard'||channel==='audible') {
    for(let i=0;i<2;i++) surface.listeners.keydown[0]({key:'ArrowRight',preventDefault(){}});
    if(channel==='audible') await sound.drain();
  } else {
    const pointerType=channel==='touch'?'touch':'mouse';
    surface.listeners.pointerdown[0]({clientX:210,clientY:258,pointerType,buttons:1,pointerId:1});
    surface.listeners.pointermove[0]({clientX:214,clientY:258,pointerType,buttons:1,pointerId:1});
    surface.listeners.pointerup[0]({pointerId:1});
    await sound.drain();
  }
  const state=view.paint.state(), described=Feedback.describe(state);
  const svg=surface.querySelector('svg');
  return {frame:view.frame(),state,announcement:described.text,clips,
    aria:svg && svg.getAttribute('aria-label'),buttons:root.querySelectorAll('button').map(button=>({
      name:button.getAttribute('aria-label')||button.textContent,
      width:Number.parseInt(button.style.minWidth,10),height:Number.parseInt(button.style.minHeight,10)
    }))};
}

async function channels() {
  const visual=await run('visual'), keyboard=await run('keyboard'), touch=await run('touch'), audible=await run('audible');
  if(sabotage==='visual') visual.aria='';
  if(sabotage==='keyboard') keyboard.frame.atoms[0].i[0].pts.pop();
  if(sabotage==='touch') touch.state.count++;
  if(sabotage==='audible') audible.clips=[];
  return {visual,keyboard,touch,audible};
}

function expectedClipSequence() {
  return [
    {action:'add',color:'cyan',x:210,y:258,count:1,cause:''},
    {action:'add',color:'cyan',x:214,y:258,count:2,cause:''}
  ].flatMap(state=>Feedback.describe(state).clips);
}

test('visual pointer reaches the same signed frame and accessible description',async()=>{
  const {visual,keyboard}=await channels();
  assert.deepEqual(visual.frame,keyboard.frame);
  assert.equal(visual.aria,visual.announcement);
});

test('keyboard orientation produces the same frame and sound inventory',async()=>{
  const {keyboard,audible}=await channels();
  assert.deepEqual(keyboard.frame,audible.frame);
  assert.deepEqual(audible.clips,expectedClipSequence());
});

test('touch coordinates and controls preserve the shared state',async()=>{
  const {visual,touch}=await channels();
  assert.deepEqual(touch.frame,visual.frame);
  assert.deepEqual(touch.state,visual.state);
  assert.ok(touch.buttons.length>=3);
  for(const button of touch.buttons) {
    assert.ok(button.name && button.name.trim());
    assert.ok(button.width>=44 && button.height>=44);
  }
});

test('audible feedback declares the same coordinates, state and points',async()=>{
  const {visual,audible}=await channels();
  assert.deepEqual(audible.state,visual.state);
  assert.equal(audible.announcement,visual.announcement);
  assert.deepEqual(audible.clips,expectedClipSequence());
});
