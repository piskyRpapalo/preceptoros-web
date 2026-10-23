import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const require=createRequire(import.meta.url);
const D=require('../public/game/front_door.js');
const E=require('../public/game/bubble_editor.js');
const P=require('../public/game/bubble_paint.js');
const K=require('../public/game/comic_tokens.js');
const accents=require('../public/game/comic_accents.js');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('G3 preserves the approved title and four actions in the same measured composition',()=>{
 assert.equal(D.COPY.title,'Your own place, by your choice');
 assert.deepEqual(D.ACTIONS.map(x=>x.id),['tutorial','explore','key','questions']);
 assert(D.art().some(f=>/crab/.test(f.atoms[0].r)));
 assert(D.art().some(f=>/egg/.test(f.atoms[0].r)));
});
test('every narrative line and every button is a deterministic, readable Bubble frame below the channel ceiling',()=>{
 const frames=[...D.art(),...D.heading(),...D.ACTIONS.flatMap(action=>D.button(action.id))];
 for(const f of frames){assert(f.atoms[0].r);assert(Buffer.byteLength(E.serialize(f))<1024);assert(E.compile(f).length>0);}
 assert.equal(hash(frames),hash([...D.art(),...D.heading(),...D.ACTIONS.flatMap(action=>D.button(action.id))]));
});
test('the composition uses the real Editor and Paint APIs and retains Claude crab geometry',()=>{
 let editorCalls=0,paintCalls=0;
 const wrapped=Object.assign({},E,{create(...args){editorCalls++;return E.create(...args);}});
 const painter=Object.assign({},P,{create(...args){paintCalls++;return P.create(...args);}});
 const source=readFileSync(new URL('../public/game/front_door.js',import.meta.url),'utf8');
 const module={exports:{}};
 runInNewContext(source,{module,require:name=>name==='./bubble_editor.js'?wrapped:name==='./bubble_paint.js'?painter:require('../public/game/'+name.slice(2))});
 module.exports.art();assert(editorCalls>0);assert(paintCalls>0);
 const original=require('../public/game/bubble_bestiary.js').WORDS.crab({x:156,y:336,rr:72,eye:'open'});
 assert.equal(D.art().filter(f=>f.id.startsWith('crab-')).length,original.length);
});
test('the scoped palette meets AA text contrast and does not mutate the existing house vocabulary',()=>{
 assert.equal(K.NEUTRAL.ink,'#1E1826');assert(K.FRONT_DOOR);
 for(const name of ['paper','LIVE.base','PROPUESTA.base','FIRMADO.base','cyan','NO_DATA.base']) assert(accents.contrast(K.FRONT_DOOR[name],K.FRONT_DOOR.ink)>=4.5,name);
 const compiled=E.compile(D.heading()[0]);
 const painted=D.project(D.heading()[0]);
 assert.notEqual(JSON.stringify(compiled),JSON.stringify(painted));
 assert.equal(hash(E.compile(D.heading()[0])),hash(compiled));
});
test('frame and vocabulary sabotage are rejected whole',()=>{
 const f=D.art()[0]; f.atoms[0].r='x'.repeat(1024);assert.throws(()=>E.serialize(f),/1024/);
 const other=D.art()[0];other.atoms[0].i[0].s='missing band';assert.throws(()=>D.project(other),/unknown band/);
});
test('sonar is deterministic local synthesis data from the same frame',()=>{
 const a=D.sonar(D.art()[0]), b=D.sonar(D.art()[0]);assert.equal(hash(a),hash(b));assert(a.voices.length>0);
 assert(a.voices.filter(v=>v.hz).every(v=>v.hz<=440));
});
