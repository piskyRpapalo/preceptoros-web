import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const require=createRequire(import.meta.url),Zoom=require('../public/game/map_zoom.js');
function apparatus(){const events={},canvas={dataset:{},addEventListener(k,f){events[k]=f;}};return {events,canvas,zoom:Zoom.crea(canvas)};}
const a=apparatus();assert.equal(a.zoom.factor(),1);
let prevented=0;a.events.wheel({ctrlKey:true,deltaY:100,preventDefault(){prevented++;}});
assert.equal(a.zoom.factor(),1);assert.equal(prevented,0);
for(const [delta,expected] of [[1e6,Zoom.MIN],[-1e6,Zoom.MAX]]){a.events.wheel({deltaY:delta,preventDefault(){prevented++;}});assert.equal(a.zoom.factor(),expected);}
assert.equal(prevented,2);
function pinch(){const a=apparatus();a.events.pointerdown({pointerId:1,clientX:0,clientY:0});a.events.pointerdown({pointerId:2,clientX:100,clientY:0});a.events.pointermove({pointerId:2,clientX:200,clientY:0});assert.equal(a.zoom.factor(),2);a.events.pointercancel({pointerId:2});a.events.pointermove({pointerId:2,clientX:300,clientY:0});assert.equal(a.zoom.factor(),2);return a.canvas.dataset.zoom;}
assert.equal(pinch(),pinch(),'same human gesture must give the same factor');
// Inventory guard: a new factor consumer requires a measured receipt.
const root=new URL('../public/game/',import.meta.url),consumers=[];
for(const name of readdirSync(root).filter(n=>n.endsWith('.js'))){const text=readFileSync(new URL(name,root),'utf8');for(const [i,line] of text.split('\n').entries())if(line.includes('zoom.factor()'))consumers.push({path:name,line:i+1});}
assert.deepEqual(consumers.map(c=>c.path),['sea.js','sea.js']);
if(process.argv.includes('--sabotages')){
 const red=spawnSync(process.execPath,[new URL('./map_zoom_browser.mjs',import.meta.url).pathname,'--sabotage-size'],{encoding:'utf8',timeout:60000});
 assert.equal(red.status,1);assert(red.stderr.includes('map zoom changed object radius or genome'));
 console.log(JSON.stringify({piece:'G5c',red:true,invariant:'object size and genome independent of map zoom'}));
}else console.log(JSON.stringify({piece:'G5c',gesture:'SYNTHETIC',deterministic:true,consumers}));
