import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const colony = require('./colony_state.js');
const sample = () => ({nodes:[{id:'a',q:0,r:0},{id:'b',q:1,r:0}], buildings:[{id:'house',node:'a'}], units:[{id:'walker',node:'a'}]});
test('state is deterministic, detached, and below the byte ceiling', () => {
  const input=sample(), a=colony(input), b=colony(input);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
  assert.ok(Buffer.byteLength(JSON.stringify(a))<1024);
  input.nodes[0].q=4; assert.equal(a.nodes[0].q,0);
});
test('six axial neighbours are distinct', () => {
  const s={nodes:[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].map(([q,r],i)=>({id:String(i),q,r})),buildings:[],units:[]};
  assert.equal(colony(s).nodes.length,6);
});
test('sabotage rejects missing rows, duplicate cells, identifiers and malformed state', () => {
  for (const mutate of [s=>s.buildings[0].node='missing', s=>s.units[0].node='missing', s=>s.nodes[1].q=0, s=>s.buildings.push({id:'other',node:'a'}), s=>s.units[0].id='a', s=>s.nodes[0].q=0.5, s=>s.nodes[0].unknown=true, s=>s.units.push({id:'x'.repeat(1024),node:'a'})]) {
    const s=sample(); mutate(s); assert.throws(()=>colony(s));
  }
});

test('core source stays below 1,024 bytes', () => assert.ok(readFileSync(new URL('./colony_state.js', import.meta.url)).length < 1024));
