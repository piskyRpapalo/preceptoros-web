import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const G=require('../public/game/en301_tutorial.js');
const T=require('../public/game/tutorial_fases.js');
test('every tutorial step declares its next action and mirrored words',()=>{
 const view=G.view(T.inicia(),{});
 assert.ok(view.instruction.length); assert.ok(view.next.length);
 assert.equal(view.stamp,'SIMULATED');
 assert.equal(view.audible_text,view.mirror_text);
 assert.ok(new TextEncoder().encode(JSON.stringify(view.frame)).length<1024);
});
test('a continue click cannot assert a battle result',()=>{
 let st=T.elige(T.inicia(),'niebla').estado;
 st=T.evento(st,'pulso',{}).estado;
 st=T.evento(st,'disipa',{dato:'NO_DATA',causa:'fixture'}).estado;
 assert.equal(G.advance(st,{event:'arena101'},{}).ok,false);
});
