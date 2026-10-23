import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign, verify, createPublicKey, createHash } from 'node:crypto';
const require=createRequire(import.meta.url),DB=require('../public/game/db.js'),G=require('../public/game/gacha.js');
const source=readFileSync(new URL('../public/game/ui-invoca.js',import.meta.url),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let n=0;n<100;n++){if(check())return;await sleep(2);}throw new Error('fixture did not settle');}
function fixture({store={chain:null,pending:[]},keys=generateKeyPairSync('ed25519'),delay=false,writeFailure=false}={}){
 const pub=keys.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('hex');
 const messages=[],state={paid:0,audio:0},snapshot={ciclo:200,recursos:{cobre:1000,luz:1000}},Z={huevos:[],cadena:null,clave:null,causa:''};
 const A={...DB,semillaWeb:signature=>Promise.resolve(createHash('sha256').update(signature).digest('hex')),
  verificaWeb:(text,sig,key)=>Promise.resolve(verify(null,Buffer.from(text),createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(key,'hex')]),format:'der',type:'spki'}),Buffer.from(sig,'hex'))),
  cadenaWeb:()=>({lee:()=>store.readFailure?Promise.reject(new Error('blocked storage')):Promise.resolve(store.chain?structuredClone(store.chain):null),pon:value=>new Promise((resolve,reject)=>{
   const commit=()=>{if(writeFailure&&store.fail!==false)reject(new Error('storage failed'));else{store.chain=structuredClone(value);resolve(true);}};
   if(delay)store.pending.push(commit);else queueMicrotask(commit);
  })})};
 const buttons=[];const box={querySelector(){return buttons[0]||null;},appendChild(b){buttons.push(b);}};
 const makeButton=()=>({style:{},classList:{add(){}},addEventListener(k,fn){this[k]=fn;},remove(){buttons.splice(buttons.indexOf(this),1);}});
 const root={Identity:{quien:()=> 'fixture',publica:()=>Promise.resolve(pub),firmar:object=>Promise.resolve({firma:'ed25519:'+sign(null,Buffer.from(JSON.stringify(object)),keys.privateKey).toString('hex')})},AtlasJuego:{invoca(cost){state.paid++;snapshot.recursos.cobre-=cost.cobre;snapshot.recursos.luz-=cost.luz;return {resultado:'ok'};}}};root.window=root;
 runInNewContext(source,root);
 const context={A,G,S:{suena(){state.audio++;}},Z,R:{caja:box},T:key=>key,el(){return {};},boton:makeButton,ins:()=>snapshot,cicloMedido:()=>snapshot.ciclo,
  calor:()=>0,pinta(){},dice:value=>messages.push(value),rellena:value=>value};
 const inv=root.AtlasInvoca.crea(context);
 return {inv,Z,state,store,keys,messages,A,pub};
}
test('G5b does not announce a paid egg before the device transaction commits',async()=>{
 const f=fixture({delay:true});const operation=f.inv.invoca('tc1');await until(()=>f.store.pending.length===1);
 assert(!f.messages.includes('inc_hecha'));assert.equal(f.Z.huevos.length,0);assert.equal(f.state.audio,0);
 f.store.pending.shift()();await operation;await until(()=>f.messages.includes('inc_hecha'));
 assert.equal(f.Z.huevos.length,1);assert.equal(f.store.chain[0].obj.seq,1);
});
test('two rapid human requests commit distinct monotonic seq and prev links',async()=>{
 const f=fixture();await Promise.all([f.inv.invoca('tc1'),f.inv.invoca('tc1')]);await sleep(10);
 assert.equal(f.state.paid,2);assert.equal(f.store.chain.length,2);assert.deepEqual(f.store.chain.map(e=>e.obj.seq),[1,2]);
 assert.equal(f.store.chain[1].obj.prev,f.store.chain[0].semilla);assert.equal(DB.compruebaCadena(f.store.chain),'');
});
test('a fresh UI context restores and verifies every committed egg after reload',async()=>{
 const first=fixture();await first.inv.invoca('tc1');await until(()=>first.store.chain?.length===1);
 const reloaded=fixture({store:first.store,keys:first.keys});await reloaded.inv.cadenaLista();
 assert.equal(reloaded.Z.huevos.length,1);assert.equal(reloaded.Z.huevos[0].semilla,first.store.chain[0].semilla);
 assert.equal(await reloaded.A.verificaCadena(first.store.chain,reloaded.pub,reloaded.A.verificaWeb,reloaded.A.semillaWeb),'');
});
test('a failed storage commit never advertises a saved egg',async()=>{
 const f=fixture({writeFailure:true});await f.inv.invoca('tc1');await sleep(10);
 assert(!f.messages.includes('inc_hecha'));assert.equal(f.Z.huevos.length,0);assert.equal(f.state.audio,0);
 assert(f.messages.some(m=>m.includes('NO_DATA')));
});
test('unavailable storage blocks payment with an explicit NO_DATA cause',async()=>{
 const f=fixture();f.store.readFailure=true;await f.inv.invoca('tc1');
 assert.equal(f.state.paid,0);assert.equal(f.Z.huevos.length,0);assert(f.messages.some(m=>m.includes('NO_DATA')));
});
test('retry persists the already paid egg without charging again',async()=>{
 const f=fixture({writeFailure:true});await f.inv.invoca('tc1');assert.equal(f.state.paid,1);
 f.store.fail=false;await f.inv.invoca('tc1');
 assert.equal(f.state.paid,1);assert.equal(f.store.chain.length,1);assert.equal(f.Z.huevos.length,1);assert.equal(f.Z.pending,null);
});
test('chain read errors are observable, while optional quality storage retains its fallback',async()=>{
 const root={AtlasValores:require('../public/game/valores.js'),indexedDB:{open(){throw new Error('blocked storage');}}};
 runInNewContext(readFileSync(new URL('../public/game/db.js',import.meta.url),'utf8'),root);
 await assert.rejects(root.AtlasArmy.cadenaWeb('a'.repeat(64)).lee(),/blocked storage/);
 assert.equal(await root.AtlasArmy.calidadWeb().lee(),null);
});
test('sequence gaps, wrong previous links and altered signatures cannot restore a chain',async()=>{
 const f=fixture();await f.inv.invoca('tc1');await until(()=>f.store.chain?.length===1);
 for(const mutate of [c=>{c[0].obj.seq=2;},c=>{c[0].obj.prev='bad';},c=>{c[0].firma='ed25519:'+'0'.repeat(128);}]){
  const damaged=structuredClone(f.store.chain);mutate(damaged);
  assert(await f.A.verificaCadena(damaged,f.pub,f.A.verificaWeb,f.A.semillaWeb));
 }
});
