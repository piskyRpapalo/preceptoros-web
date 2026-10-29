import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const project=createRequire(import.meta.url)('./hex_projection.js');
test('fixed axial projection preserves six distinct neighbours',()=>{
 const points=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].map(([q,r])=>project(q,r));
 assert.equal(new Set(points.map(p=>JSON.stringify(p))).size,6);
 assert.deepEqual(project(0,0),{x:0,y:0});
 assert.deepEqual(project(1,0),{x:48,y:12});
 assert.deepEqual(project(0,1),{x:0,y:24});
});
test('invalid and overflowing coordinates are refused',()=>{
 for(const p of [[0.1,0],[NaN,0],[Number.MAX_SAFE_INTEGER,1],[null,0]]) assert.throws(()=>project(...p));
});
