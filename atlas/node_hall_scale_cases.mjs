// Node 0 visual invariant: camera orbit or tilt never rescales the same town hall.
// Based on the real node_beacon.draw() path and HexProjection, not a screenshot guess.
// Run: node --test atlas/node_hall_scale_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const B = req('../public/game/node_beacon.js');
const P = req('../public/game/hex_projection.js');
const SQUASH = Math.sqrt(3) / 4;
function makeView(angle, tilt, zoom) {
  const a = angle * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  return { world: { cells: { at: {'0,0':[0,0,1,'sand']} } }, P,
    G: { cx: 195, cy: 420, k: zoom, tilt },
    turn: (x,y) => { const u = y / SQUASH; return {x:x*cs-u*sn, y:(x*sn+u*cs)*SQUASH*tilt} },
    height: c => c[2], HSTEP: 7,
    H: { T: { FRONT_DOOR: { 'PROPUESTA.base':'#ffee77' }, NEUTRAL: {ink:'#1d1b26',paper:'#fffaf0'} },
      css: x => String(x), rgbOf: x=>x, shade: x=>x } };
}
function fakeCanvas() {
 const g={save(){},restore(){},beginPath(){},moveTo(){},arc(){},closePath(){},fill(){},stroke(){},
   fillText(){},measureText(t){return {width:t.length*7}}};
 return g;
}
function pitch(angle,tilt,zoom) {
 // This geometry fixture intentionally represents a SYNTHETIC LIVE node. A STALE node is never drawn by the real projection.
 const P0=globalThis.AtlasTownPlan, data={colonia:{nodes:[{id:'primer-ancla',q:0,r:0,alive:true,seal:'LIVE',since:'2026-11-17'}]}};
 let observed=null;
 globalThis.AtlasTownPlan={hall(_g,x,y,step,sq){ observed={x,y,step,sq};return {x0:x-step,x1:x+step,y0:y-step*3,y1:y+step}}};
 try{
  B.use(data); B.draw(fakeCanvas(), makeView(angle,tilt,zoom), {width:390,clientWidth:390,height:844});
  assert.ok(observed, 'Node 0 was not drawn');
  return observed;
 } finally { if(P0===undefined)delete globalThis.AtlasTownPlan;else globalThis.AtlasTownPlan=P0; }
}
test('node hall size is invariant under 360-degree orbit at fixed zoom (not distance after turn)',()=>{
 const base=pitch(0,1,1).step, steps=[0,30,60,90,120,180,270,359].map(a=>pitch(a,1,1).step);
 assert.ok(steps.every(n=>Math.abs(n-base)<1e-9), 'changing camera angle resized node 0: '+JSON.stringify(steps));
});
test('tilt changes floor squash but never the physical size of Node 0',()=>{
 const baseline=pitch(0,1,1).step, samples=[0.6,0.8,1,1.3,1.8].flatMap(tilt=>[0,60,120,270].map(angle=>pitch(angle,tilt,1)));
 assert.ok(samples.every(s=>Math.abs(s.step-baseline)<1e-9),'camera tilt resized town hall: '+JSON.stringify(samples.map(s=>s.step)));
 assert.ok(samples.some(s=>s.sq!==samples[0].sq), 'perspective itself must still be allowed to tilt');
});
test('zoom, and only zoom, scales the hall consistently across angles',()=>{
 for(const zoom of [0.6,1,1.7,3]){
  const steps=[0,60,180,300].map(a=>pitch(a,1,zoom).step);
  assert.ok(steps.every(s=>Math.abs(s-steps[0])<1e-9),'angle resized hall at zoom '+zoom+': '+steps);
 }
 const one=pitch(0,1,1).step, two=pitch(0,1,1.7).step;
 assert.ok(Math.abs(two/one-1.7)<1e-9,'zoom must scale 1.7x');
});

test('historical STALE Node 0 never draws a town hall, even when alive is true', () => {
 const before=globalThis.AtlasTownPlan; let drawn=0;
 globalThis.AtlasTownPlan={hall(){drawn++;return {x0:0,x1:0,y0:0,y1:0};}};
 try {
  B.use({colonia:{nodes:[{id:'primer-ancla',q:0,r:0,alive:true,seal:'STALE',since:'2026-11-17'}]}});
  B.draw(fakeCanvas(), makeView(0,1,1), {width:390,clientWidth:390,height:844});
  assert.equal(drawn,0, 'STALE must remain historical; never draw Node 0 as LIVE');
 } finally { if(before===undefined)delete globalThis.AtlasTownPlan;else globalThis.AtlasTownPlan=before; }
});
