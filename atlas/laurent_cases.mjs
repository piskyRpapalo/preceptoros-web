import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { contour, coefficients, evaluate } from './laurent.mjs';
const gacha = createRequire(import.meta.url)('../public/game/gacha.js');
const tau = 2 * Math.PI;
const arms = [gacha.HUEVO, [[0,3,-4,9.5],[-4,7,2,12.375],[4,-1,6,-3],[-4,-3,2,4]],
  [[64,1,1,0]], [[2,1,0,0],[3,0,1,16]], [], ...Object.keys(gacha.TCS).map(tc => gacha.tirada('deadbeef'.repeat(8), tc).armonicos)];
const dist = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
test('both signed Laurent coefficients reproduce the independent game oracle', () => {
  for (const arm of arms) for (let j=-16; j<60; ++j) {
    const t=j*Math.sqrt(2)/16;
    assert.ok(dist(evaluate(coefficients(arm),t),gacha.punto(arm,t))<1e-10);
  }
});
test('six constructions close; fractional phase, aliasing, rotation and unequal scales', () => {
  for (const arm of arms) for (const method of ['direct','table','recurrence','uniform','adaptive','hermite']) {
    const scale=2, epsilon=0.5;
    const {points,angles,curves} = contour(arm,{method,scale,epsilon,segments:256});
    assert.deepEqual(points[0],points.at(-1)); assert.equal(angles.at(-1),tau);
    for (let i=0;i<points.length-1;++i) {
      assert.ok(angles[i+1]>angles[i]);
      assert.ok(dist(points[i],gacha.punto(arm,angles[i])) < 1e-9);
      if (['direct','table','recurrence'].includes(method)) continue;
      for (let j=0;j<=12;++j) {
        const u=j/12,v=1-u,a=points[i],b=points[i+1],c=curves[i];
        const p=a.map((x,k)=>c ? v**3*x+3*v*v*u*c[0][k]+3*v*u*u*c[1][k]+u**3*b[k] : v*x+u*b[k]);
        const q=gacha.punto(arm,v*angles[i]+u*angles[i+1]);
        const dx=2*(p[0]-q[0]),dy=.7*(p[1]-q[1]);
        assert.ok(Math.hypot(.8*dx-.6*dy,.6*dx+.8*dy)<=epsilon+1e-9);
      }
    }
  }
});
test('rejects a nonperiodic mode, invalid error and infeasible grids',()=>{
  for (const [arm,opt] of [[[[.5,1,1,0]],{}],[[],{epsilon:0}],[[[1,1,1,0]],{method:'uniform',epsilon:1e-30}]]) {
    assert.throws(()=>contour(arm,opt),RangeError);
  }
});
