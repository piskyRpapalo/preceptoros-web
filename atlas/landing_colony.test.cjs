const {test} = require('node:test');
const assert = require('node:assert/strict');
const {runInNewContext} = require('node:vm');
const {FRAMES,NODE,cast,sample} = require('./landing_colony.cjs');
const {drawFrame} = require('./render_landing_reel.cjs');

function inspectMovement(actors) {
  const rests=actors.map(()=>[]), speeds=actors.map(()=>[]), tracks=actors.map(()=>[]);
  for(let frame=0;frame<FRAMES;frame++) {
    const poses=sample(frame,actors), next=sample(frame+1,actors);
    poses.forEach((p,i)=>{
      const distance=Math.hypot(next[i].x-p.x,next[i].y-p.y);
      assert.ok(distance<12,'jump between adjacent frames, including the seam');
      rests[i].push(Number(p.rest)); speeds[i].push(distance.toFixed(2));
      tracks[i].push([p.x.toFixed(1),p.y.toFixed(1)]);
    });
  }
  for(const mask of rests) assert.ok(mask.includes(0) && mask.includes(1));
  for(const sequence of [rests,speeds,tracks])
    assert.equal(new Set(sequence.map(s=>JSON.stringify(s))).size,actors.length,'synchronized residents');
}

test('individual routes, stops and speeds; exact 192-frame periodicity',()=>{
  assert.equal(new Set(cast.map(a=>a.seed)).size,9);
  inspectMovement(cast);
  assert.deepEqual(sample(0),sample(FRAMES));
  assert.deepEqual(sample(62),sample(FRAMES+62));
});

test('sabotage: residents with unique IDs but cloned motion are detected',()=>{
  assert.throws(()=>inspectMovement(cast.map(a=>({...cast[0],seed:a.seed}))),/synchronized residents/);
});

test('the production compositor invokes five crab painters, four NPCs and the unlit town hall',()=>{
  const counts={crab:0,ghost:0,hall:0}, noop=()=>{};
  const gradient={addColorStop:noop};
  const ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||noop});
  const canvas={getContext:()=>ctx,toDataURL:()=>','};
  const scene={
    document:{querySelector:()=>canvas},AtlasMapPainter:{color:{mix:noop,rgbOf:noop,css:noop}},
    AtlasComicTokens:{FRONT_DOOR:{}}, AtlasTownPlan:{hall:(g,x,y,step,sq,H,live)=>{
      assert.deepEqual([x,y,live],[NODE.x,NODE.y,false]);counts.hall++;
    }},
    AtlasCrabBody:{pose:()=>({}),draw:()=>counts.crab++},
    AtlasMapFog:{npc:()=>counts.ghost++},poses:sample(62),node:NODE
  };
  // Neither an invented wave nor a replacement painter exists in this environment.
  runInNewContext('('+drawFrame.toString()+')({poses,node})',scene);
  assert.deepEqual(counts,{crab:5,ghost:4,hall:1});
  assert.doesNotMatch(drawFrame.toString(),/fillRect\((?!0,0,960,540)|AtlasOnda|armonicos/);
});
