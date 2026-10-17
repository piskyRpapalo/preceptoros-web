import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { createPrivateKey, createPublicKey, createHash, sign, webcrypto } from 'node:crypto';

const require=createRequire(import.meta.url), K=require('../public/game/canon.js');
const R=require('../public/game/node_reception_contract.js'),N=require('../public/game/nodos.js');
const C=require('../public/game/nodos-cedulas.js'),Q=require('../public/game/cuenta.js');
const P=require('../public/game/nodos-pesos.js'),F=require('../public/game/fog_of_war.js');
const cp=x=>JSON.parse(JSON.stringify(x)),canon=x=>JSON.stringify(K.ordena(x));
const sha=x=>createHash('sha256').update(x).digest('hex'),utf8=x=>Buffer.from(x);
const field=b=>{b=Buffer.from(b);const n=Buffer.alloc(4);n.writeUInt32BE(b.length);return Buffer.concat([n,b]);};
const seal=c=>{delete c.sha256;c.sha256=K.huella(c);return c;};

// Synthetic fixture only; never a production or human key.
const sk=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.alloc(32,37)]),format:'der',type:'pkcs8'});
const raw=createPublicKey(sk).export({format:'der',type:'spki'}).subarray(-32);
const blob=Buffer.concat([field(utf8('ssh-ed25519')),field(raw)]);
function armor(body,namespace){
  const digest=createHash('sha512').update(body).digest();
  const data=Buffer.concat([utf8('SSHSIG'),field(utf8(namespace)),field(Buffer.alloc(0)),field(utf8('sha512')),field(digest)]);
  const sig=Buffer.concat([field(utf8('ssh-ed25519')),field(sign(null,data,sk))]);
  const wire=Buffer.concat([utf8('SSHSIG'),Buffer.from([0,0,0,1]),field(blob),field(utf8(namespace)),field(Buffer.alloc(0)),field(utf8('sha512')),field(sig)]);
  return '-----BEGIN SSH SIGNATURE-----\n'+wire.toString('base64').match(/.{1,70}/g).join('\n')+'\n-----END SSH SIGNATURE-----\n';
}
function credential(node='nodo.0.hexelion',admin='ab'.repeat(32)){
  const c={esquema:'preceptoros.cedula-nodo/1',nodo:node,admin,dispositivos:[],plan_sha256:'cd'.repeat(32)};
  c.firma_ssh=armor(utf8(R.signedBody(c)),'preceptoros-cedula');return seal(c);
}
function fixture(){
  const m={esquema:'preceptoros.trust-manifest/1',clave_publica:'ssh-ed25519 '+blob.toString('base64'),namespace:'preceptoros-cedula',fecha:'2026-10-16'};
  m.firma_ssh=armor(utf8(canon(m)),'preceptoros-trust-manifest');
  return {m,anchor:{key_sha256:sha(blob),manifest_sha256:sha(utf8(canon(m)))}};
}
function load(f=fixture(),anchor=f.anchor){
  const ctx={AtlasCanon:K,AtlasNodeReception:R,AtlasNodos:N,AtlasCuenta:Q,AtlasNiebla:F,AtlasNodeTrustAnchor:anchor,
    TextEncoder,TextDecoder,Uint8Array,DataView,atob,btoa,crypto:webcrypto};
  for(const name of ['fetch','document','localStorage','sessionStorage','Date','WebSocket'])Object.defineProperty(ctx,name,{get(){throw Error('unexpected effect: '+name);}});
  const run=name=>runInNewContext(readFileSync(new URL('../public/game/'+name,import.meta.url),'utf8'),ctx);
  run('node_signature_messages.js');run('node_signature_verify.js');
  const verifier=ctx.AtlasNodeSignatureVerify;let calls=0;
  ctx.AtlasNodeSignatureVerify={verify:(...a)=>{calls++;return verifier.verify(...a);}};
  run('node_bindings_messages.js');run('node_bindings.js');run('node_projection.js');
  return {B:ctx.AtlasNodeBindings,D:ctx.AtlasNodeProjection,ctx,run,verifier,calls:()=>calls,f};
}
const inspect=async(list)=>{const h=load();return {h,r:await h.B.inspect(list,h.f.m)};};

test('legacy catalog remains accepted but repeated node documents are rejected',()=>{
  assert.equal(N.validaCedulas(C),'');const c=cp(C);c.nodos.push(cp(c.nodos[0]));
  assert.equal(N.validaCedulas(c),'duplicate_node');
});
test('signed evidence binds raw public account to node without publication authority',async()=>{
  const c=credential(),before=canon(c),{h,r}=await inspect([c]);
  assert.equal(r.verdict,'verified');assert.equal(r.bindings[0].account,c.admin);assert.equal(r.bindings[0].node,c.nodo);
  assert.equal(r.authority,false);assert.equal(r.firma,null);assert.equal(r.global,'NO_DATA');assert.equal(r.complete,false);
  assert.equal(r.bindings[0].credential_sha256,c.sha256);assert.equal(canon(c),before);assert.equal(h.B.isVerified(r),true);
});
test('same account cannot claim two nodes even with valid synthetic human-role signatures',async()=>{
  const {r}=await inspect([credential(),credential('nodo.2.example')]);assert.equal(r.code,'duplicate_account');assert.equal(r.bindings.length,0);
});
test('one node cannot have two accounts even with valid synthetic signatures',async()=>{
  const {r}=await inspect([credential(),credential('nodo.0.hexelion','ef'.repeat(32))]);assert.equal(r.code,'duplicate_node');
});
test('repeated exact credential is rejected, never a second registry entry',async()=>{
  const c=credential(),{r}=await inspect([c,cp(c)]);assert.equal(r.code,'duplicate_node');
});
test('changed admin with recalculated outer hash reaches signature verification and fails',async()=>{
  const c=credential();c.admin='ef'.repeat(32);seal(c);assert.equal(R.credential(c).valid,true);
  const {h,r}=await inspect([c]);assert.equal(h.calls(),1);assert.equal(r.verdict,'rejected');assert.equal(r.bindings.length,0);
});
test('legacy declaration is not promoted by the signed branch or a supplied verified field',async()=>{
  assert.equal(N.validaCedulas(C),'');assert.equal((await inspect([C.nodos[0]])).r.code,'legacy_declaration');
  const c=credential();c.verdict='verified';seal(c);assert.equal((await inspect([c])).r.verdict,'rejected');
});
test('production has no real root: pending evidence never enters bindings',async()=>{
  const h=load(fixture(),null),r=await h.B.inspect([credential()],h.f.m);
  assert.equal(r.verdict,'pending');assert.equal(r.bindings.length,0);assert.equal(h.B.isVerified(r),false);
});
test('mixed verified and failed evidence never produces a partial admitted set',async()=>{
  const a=credential(),b=credential('nodo.1.example','ef'.repeat(32));b.nodo='nodo.2.example';seal(b);
  const {r}=await inspect([a,b]);assert.equal(r.verdict,'rejected');assert.equal(r.bindings.length,0);
  assert.equal(r.checks.filter(x=>x.verification.verdict==='verified').length,1);
});
test('mixed pending evidence and an interrupted provider remain pending without partial admission',async()=>{
  const h=load(),original=h.ctx.AtlasNodeSignatureVerify.verify;
  h.ctx.AtlasNodeSignatureVerify.verify=(c,m)=>c.nodo==='nodo.1.example'?Promise.reject(Error('backend stopped')):original(c,m);
  const r=await h.B.inspect([credential(),credential('nodo.1.example','ef'.repeat(32))],h.f.m);
  assert.equal(r.verdict,'pending');assert.equal(r.bindings.length,0);assert.equal(r.checks[1].verification.code,'crypto_error');
});
test('a partial set can never assert global registration or completeness',async()=>{
  const {h,r}=await inspect([credential()]);assert.equal(r.global,'NO_DATA');assert.equal(r.complete,false);
  assert.equal(h.B.isVerified({...cp(r),global:'LIVE',complete:true}),false);
});
test('empty, malformed and sparse cohorts fail closed',async()=>{
  for(const x of [null,{},[],[null],Array(1)])assert.equal((await inspect(x)).r.verdict,'rejected');
});
test('cohort scope and order are deterministic and inputs are captured before awaits',async()=>{
  const a=credential(),b=credential('nodo.1.example','ef'.repeat(32)),h=load();
  const promise=h.B.inspect([a,b],h.f.m);a.admin='ff'.repeat(32);
  const first=await promise,second=await h.B.inspect([b,credential()],h.f.m);
  assert.equal(first.verdict,'verified');assert.equal(first.scope_sha256,second.scope_sha256);
  assert.deepEqual(cp(first.bindings),cp(second.bindings));assert.equal(Object.isFrozen(first.bindings[0].credential),true);
  assert.equal(Object.isFrozen(first),true);assert.equal(Object.isFrozen(first.bindings),true);
  assert.equal(Object.isFrozen(first.checks),true);assert.equal(Object.isFrozen(first.checks[0].verification),true);
});
test('projection keeps original signed bytes separate and invents no hardware or activity',async()=>{
  const c=credential(),before=canon(c),{h,r}=await inspect([c]),nodes=h.D.nodes(r,'es');
  assert.equal(nodes.length,1);assert.equal(h.D.isNodes(nodes),true);assert.equal(nodes[0].credential_sha256,c.sha256);
  assert.equal(canon(c),before);assert.equal('aparato' in r.bindings[0].credential,false);
  for(const m of Object.values(nodes[0].aparato.medidas)){assert.equal(m.estado,'NO_DATA');assert.equal(m.valor,null);assert.ok(m.causa);assert.doesNotMatch(m.causa,/NO_DATA|undefined/);}
  assert.equal(Q.estadoNodo(nodes[0]).activo,'NO_DATA');assert.equal(Q.estadoNodo(nodes[0]).latido,'NO_DATA');
  assert.deepEqual(cp(h.D.traits(r,c.admin,P)),N.rasgosDeNiveles({ram_mib:null,gen_cps:null},P));
});
test('serialized verified claims cannot forge a projection or a render input',async()=>{
  const {h,r}=await inspect([credential()]);assert.equal(h.D.nodes(cp(r)).length,0);
  const nodes=h.D.nodes(r);assert.equal(h.D.select(cp(nodes),C.nodos).length,0);assert.equal(h.D.select(undefined,C.nodos),C.nodos);
  const empty=h.D.nodes(null);assert.equal(h.D.select(empty,C.nodos),empty);assert.equal(empty.length,0);
  assert.equal(h.D.nodes(Object.freeze(cp(r))).length,0);
});
test('mutating the manifest while crypto awaits cannot substitute the captured document',async()=>{
  const h=load(),promise=h.B.inspect([credential(),credential('nodo.1.example','ef'.repeat(32))],h.f.m);
  h.f.m.fecha='2026-10-17';assert.equal((await promise).verdict,'verified');
});
test('a valid node without a signed map position does not acquire coordinates or clear fog',async()=>{
  const {h,r}=await inspect([credential('nodo.3.example')]),nodes=h.D.nodes(r);
  assert.equal(F.sitioNodo(nodes[0].nodo),null);assert.equal(F.despejado({nodos:nodes,lugares:[],sha:K.sha}).length,0);
  assert.equal(nodes[0].position,null);assert.ok(nodes[0].position_cause);assert.doesNotMatch(nodes[0].position_cause,/NO_DATA|undefined/);
  h.ctx.AtlasNodosCedulas=C;h.ctx.AtlasNiebla=F;h.ctx.AtlasGacha={tirada:()=>({armonicos:[]})};h.run('map_nodes_layer.js');
  assert.equal(h.ctx.AtlasMapNodes.casas(nodes).length,0);assert.equal(h.ctx.AtlasMapNodes.casas(cp(nodes)).length,0);
});
test('map and coral consume only their own projections and preserve the legacy default',async()=>{
  const {h,r}=await inspect([credential()]),nodes=h.D.nodes(r);
  h.ctx.AtlasNodosCedulas=C;h.ctx.AtlasGacha={tirada:()=>({armonicos:[]})};h.run('map_nodes_layer.js');
  assert.equal(h.ctx.AtlasMapNodes.casas().length,1);assert.equal(h.ctx.AtlasMapNodes.casas(nodes).length,1);
  assert.equal(h.ctx.AtlasMapNodes.casas(h.D.nodes(null)).length,0);
  h.ctx.AtlasNodosCedulas=null;assert.equal(h.ctx.AtlasMapNodes.casas(nodes).length,1);
  let cards=0;h.ctx.AtlasPlaceCards={ficha:()=>{cards++;}};h.run('reef_corals.js');
  const options={projection:cp(nodes),pon:(x,y,draw,card)=>card()};h.ctx.AtlasCorales.pinta({},()=>[0,0],options);assert.equal(cards,0);
  options.projection=nodes;h.ctx.AtlasCorales.pinta({},()=>[0,0],options);assert.equal(cards,1);
});
test('one verification per credential feeds three consumers with identical evidence',async()=>{
  const h=load(),list=[credential(),credential('nodo.1.example','ef'.repeat(32))];
  const before=[];for(let i=0;i<3;i++)for(const c of list)before.push(await h.verifier.verify(c,h.f.m));
  assert.ok(before.every(x=>x.verdict==='verified'));const r=await h.B.inspect(list,h.f.m);
  h.D.nodes(r);h.D.state(r,list[0].admin);h.D.traits(r,list[0].admin,P);
  assert.equal(h.calls(),list.length);assert.equal(before.length,3*list.length);
  r.checks.forEach((entry,index)=>assert.deepEqual(entry.verification,before[index]));
});
test('projected coral does not inherit unbound benchmark evidence from the legacy node',async()=>{
  const {h,r}=await inspect([credential()]),nodes=h.D.nodes(r),cards=[];
  h.ctx.AtlasNodosCedulas=C;h.ctx.AtlasNiebla=F;
  h.ctx.AtlasHexBench={BENCH:{modelos:[{estado:'MEDIDO',modelo:'synthetic',pp512_tok_s:999}],fuente:{enlace:'synthetic',fecha:'2026-10-16',archivo:'fixture',sha256:'ab'.repeat(32)}},medidos:()=>1};
  h.ctx.AtlasPlaceCards={ficha:(type,value,options)=>{cards.push({value,options});return value;}};h.run('reef_corals.js');
  h.ctx.AtlasCorales.pinta({},()=>[0,0],{projection:nodes,pon:(x,y,draw,card)=>card()});
  assert.equal(cards.length,1);assert.equal(cards[0].value.causas.length,0);assert.equal(cards[0].options.enlace,null);
  assert.equal(h.ctx.AtlasCorales.coral(nodes[0]).nd,true);
});
test('rack consumes own, empty and forged projections and explains missing map position',async()=>{
  const {h,r}=await inspect([credential('nodo.3.example')]),nodes=h.D.nodes(r,'es');
  function element(tag){return {tag,children:[],textContent:'',className:'',get firstChild(){return this.children[0];},appendChild(c){this.children.push(c);return c;},setAttribute(){}};}
  const document={createElement:element},window={AtlasNodosCedulas:C,AtlasCuenta:Q,AtlasNodeProjection:h.D};
  runInNewContext(readFileSync(new URL('../public/game/ui-rack.js',import.meta.url),'utf8'),{window,document});
  const all=e=>[e,...e.children.flatMap(all)],count=e=>all(e).filter(x=>x.className.startsWith('atlas-rack-nodo')).length;
  const a=element('div');window.AtlasRackUI.monta(a,k=>k,nodes);assert.equal(count(a),1);
  assert.ok(all(a).some(x=>x.textContent.includes(nodes[0].position_cause)));
  const b=element('div');window.AtlasRackUI.monta(b,k=>k,cp(nodes));assert.equal(count(b),0);
  const c=element('div');window.AtlasRackUI.monta(c,k=>k,h.D.nodes(null));assert.equal(count(c),0);
  const d=element('div');window.AtlasRackUI.monta(d,k=>k);assert.equal(count(d),C.nodos.length);
});
test('all new causes have nine complete human translations and modules fit the source ceiling',()=>{
  const h=load(),langs=Object.keys(h.B.MESSAGES);assert.deepEqual(langs.sort(),['ar','de','el','en','es','fr','it','pt','ru']);
  for(const lang of langs)for(const code of Object.keys(h.B.MESSAGES.en)){assert.ok(Object.hasOwn(h.B.MESSAGES[lang],code));assert.ok(h.B.message(code,lang));assert.doesNotMatch(h.B.message(code,lang),/NO_DATA|undefined|NaN/);}
  for(const name of ['node_bindings.js','node_bindings_messages.js','node_projection.js']){const p=new URL('../public/game/'+name,import.meta.url);assert.ok(statSync(p).size<=25*1024*1024);}
});
