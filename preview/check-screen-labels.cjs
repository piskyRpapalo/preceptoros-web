'use strict';
const assert = require('node:assert/strict');
const {clamp, place, hit} = require('./screen-label-core.js');
assert.equal(clamp(-1), 0.6); assert.equal(clamp(8), 3); assert.throws(()=>clamp(NaN));
for (let i=6;i<=30;i++) {
  const z=i/10, p=place(2,3,z,{x:100,y:90});
  assert.ok(Math.abs(p.x-(100+z*168)) < 1e-10); assert.ok(Math.abs(p.y-(90+z*36)) < 1e-10);
  const box={left:p.x-22,right:p.x+22,top:p.y-22,bottom:p.y+22};
  assert.equal(hit(box,p.x,p.y),true); assert.equal(hit(box,box.right,p.y),false);
}
console.log('PASS: zoom clamp, projection and screen-space hit boxes');
