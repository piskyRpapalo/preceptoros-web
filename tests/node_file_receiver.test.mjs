import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url),R=require('../public/game/node_reception_contract.js');
const K=require('../public/game/canon.js'),Preview=require('../public/game/node_preview.js');
const source=readFileSync(new URL('../public/game/node_file_receiver.js',import.meta.url),'utf8');
const copy=x=>JSON.parse(JSON.stringify(x)),enc=new TextEncoder();
function credential(){
  const c={esquema:'preceptoros.cedula-nodo/1',nodo:'nodo.7.receiver',admin:'ab'.repeat(32),dispositivos:[],plan_sha256:'cd'.repeat(32),firma_ssh:'-----BEGIN SSH SIGNATURE-----\nAAAA\n-----END SSH SIGNATURE-----\n'};
  c.sha256=K.huella(c);return c;
}
function packet(c){return {esquema:'preceptoros/cedula-nodo/1',pares:[c],firma:null};}
function bytes(text){return enc.encode(text);}
function deepText(node){return (node.textContent||'')+(node.children||[]).map(deepText).join('');}
function file(text){const raw=bytes(text);return {size:raw.length,arrayBuffer:async()=>raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),name:'hidden-name.json'};}
function element(tag){return {tag,children:[],listeners:{},attrs:{},style:{},textContent:'',disabled:false,hidden:false,files:[],parentNode:null,firstChild:null,
  appendChild(n){n.parentNode=this;this.children.push(n);this.firstChild=this.children[0]||null;return n;},setAttribute(k,v){this.attrs[k]=String(v);},addEventListener(k,f){(this.listeners[k]||(this.listeners[k]=[])).push(f);},
  click(){this.clicked=true;if(this.disabled)return;for(const f of this.listeners.click||[])f({isTrusted:true,target:this});},dispatch(k,e={}){for(const f of this.listeners[k]||[])f(Object.assign({target:this},e));}};}
function harness(options={}){
  let reads=0,sends=0,network=0,complete;
  const doc={documentElement:{lang:'en'},createElement:element,createTextNode:text=>({textContent:text,children:[]})};
  class Reader{readAsArrayBuffer(f){reads++;f.arrayBuffer().then(buffer=>{this.result=buffer;if(this.onload)this.onload();},()=>this.onerror&&this.onerror());}}
  const bindings={inspect:options.inspect||(()=>new Promise(resolve=>{complete=resolve;})),isVerified:()=>false,message:(c)=>c};
  const preview={text:(k)=>k,build:(c,r)=>({rows:[{label:'node',value:c.nodo}],status:r.code||r.verdict,dispatch:'dispatch_pending'}),render:(host,m)=>{host.textContent='';m.rows.forEach(x=>{const n=doc.createElement('p');n.textContent=x.label+': '+x.value;host.appendChild(n);});const s=doc.createElement('p');s.textContent=m.status;host.appendChild(s);}};
  const context={AtlasNodeReception:R,AtlasNodeBindings:bindings,AtlasNodePreview:preview,document:doc,FileReader:Reader,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Promise,JSON,Object,Number,Error,console,
    fetch:()=>{network++;return Promise.reject(new Error('network'))},Enviar:{paquete:()=>{sends++;return Promise.resolve({status:202});}}};
  runInNewContext(source,context);
  return {api:context.AtlasNodeFileReceiver,doc,reads:()=>reads,sends:()=>sends,network:()=>network,complete:fn=>{complete=fn;},
    mount(){const parent=doc.createElement('div');const ui=context.AtlasNodeFileReceiver.mount(parent);return {parent,ui};}};
}

test('accepts only the two exact schemas and wraps a loose credential without changing it',()=>{
  const c=credential(),before=JSON.stringify(c),a=require('../public/game/node_file_receiver.js').parse(bytes(JSON.stringify(c)),bytes(JSON.stringify(c)).length);
  assert.equal(a.ok,true);assert.equal(a.kind,'credential');assert.equal(a.packet.esquema,'preceptoros/cedula-nodo/1');assert.equal(a.packet.firma,null);assert.equal(JSON.stringify(c),before);
  const p=packet(c),raw=JSON.stringify(p),b=require('../public/game/node_file_receiver.js').parse(bytes(raw),bytes(raw).length);
  assert.equal(b.ok,true);assert.equal(b.kind,'packet');assert.deepEqual(b.packet,p);
});

test('rejects the machine cache shape with a specific recovery cause',()=>{
  const raw=JSON.stringify({cedula:credential(),lectura:{autenticidad:'SIGNED'}}),r=require('../public/game/node_file_receiver.js').parse(bytes(raw),bytes(raw).length);
  assert.equal(r.ok,false);assert.equal(r.code,'machine_cache');
});

test('does not search recursively for a supported schema',()=>{
  const raw=JSON.stringify({outer:{cedula:credential()}}),r=require('../public/game/node_file_receiver.js').parse(bytes(raw),bytes(raw).length);
  assert.equal(r.ok,false);assert.equal(r.code,'schema');
});

test('rejects exactly MAX_BYTES and larger files before reading',()=>{
  const api=require('../public/game/node_file_receiver.js');
  assert.equal(api.measureSize({size:R.MAX_BYTES}).code,'size');assert.equal(api.measureSize({size:R.MAX_BYTES+1}).code,'size');
  const h=harness(),{ui}=h.mount();ui.input.files=[file('x'.repeat(R.MAX_BYTES))];ui.input.dispatch('change',{isTrusted:true});ui.review.click();
  assert.equal(h.reads(),0);assert.equal(h.network(),0);
});

test('counts actual UTF-8 bytes rather than JavaScript characters',()=>{
  const raw='{"x":"é"}',data=bytes(raw),api=require('../public/game/node_file_receiver.js');
  assert.equal(data.length,enc.encode(raw).length);assert.equal(data.length,raw.length+1);
  const r=api.parse(data,data.length);assert.equal(r.ok,false);assert.equal(r.code,'schema');
});

test('fixed corpus measures early size rejection and one shared read with unchanged verdicts',()=>{
  const api=require('../public/game/node_file_receiver.js'),valid=JSON.stringify(credential()),corpus=[valid,'{','{"x":"é"}','x'.repeat(R.MAX_BYTES)];
  let beforeReads=0,beforeBytes=0,afterReads=0,afterBytes=0;
  for(const raw of corpus){const data=bytes(raw),fileSize=data.length;beforeReads++;beforeBytes+=fileSize;const old=parseForMeasure(data,fileSize);if(old.ok){beforeReads++;beforeBytes+=fileSize;}
    const size=api.measureSize({size:fileSize});let current;if(!size.ok)current={ok:false,code:size.code};else{afterReads++;afterBytes+=fileSize;current=api.parse(data,fileSize);}
    assert.deepEqual(current,old);
  }
  assert.equal(beforeReads-afterReads,2);assert.equal(beforeBytes-afterBytes,bytes(valid).length+R.MAX_BYTES);
});
function parseForMeasure(data,size){return require('../public/game/node_file_receiver.js').parse(data,size);}

test('rejects truncated buffers, invalid UTF-8 and malformed JSON',()=>{
  const api=require('../public/game/node_file_receiver.js'),raw=JSON.stringify(credential()),full=bytes(raw);
  assert.equal(api.parse(full.slice(0,-1),full.length).code,'truncated');
  assert.equal(api.parse(Uint8Array.from([0xc3,0x28]),2).code,'encoding');
  const bad=bytes('{');assert.equal(api.parse(bad,bad.length).code,'json');
});

test('a changed signed body with a recalculated outer fingerprint reaches the verifier',async()=>{
  const c=credential();c.admin='ef'.repeat(32);delete c.sha256;c.sha256=K.huella(c);
  assert.equal(R.credential(c).valid,true);
  let inspected;const h=harness({inspect:async list=>{inspected=list[0];return {verdict:'rejected',code:'verification_rejected',checks:[{verification:{verdict:'rejected',code:'signature'}}]};}});
  const {ui}=h.mount();ui.input.files=[file(JSON.stringify(c))];ui.input.dispatch('change',{isTrusted:true});ui.review.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(inspected.admin,'ef'.repeat(32));assert.equal(deepText(ui.preview).includes('verification_rejected'),true);assert.equal(h.sends(),0);assert.equal(h.network(),0);
});

test('a claimed SIGNED label with a false armature remains pending without a trust root',async()=>{
  const c=credential();c.autenticidad='SIGNED';delete c.sha256;c.sha256=K.huella(c);
  const B=require('../public/game/node_bindings.js'),receipt=await B.inspect([c]);
  assert.equal(receipt.verdict,'pending');assert.equal(receipt.bindings.length,0);assert.equal(B.isVerified(receipt),false);
  const model=Preview.build(c,receipt,'pending','en');assert.equal(model.verdict,'pending');assert.match(model.status,/pending/i);
});

test('mounting and selecting perform no read or outbound call; only a trusted first click opens input',()=>{
  const h=harness(),{ui}=h.mount();assert.equal(h.reads(),0);assert.equal(h.network(),0);
  ui.select.click();assert.equal(ui.input.clicked,true);assert.equal(h.reads(),0);
  ui.select.dispatch('click',{isTrusted:false});assert.equal(h.reads(),0);assert.equal(h.network(),0);
  ui.input.files=[file(JSON.stringify(credential()))];ui.input.dispatch('change',{isTrusted:true});ui.review.dispatch('click',{isTrusted:false});
  assert.equal(h.reads(),0);assert.equal(h.sends(),0);assert.equal(h.network(),0);
});

test('selection only stores the file; a trusted second click reads once and shows a preview',async()=>{
  const h=harness({inspect:async()=>({verdict:'pending',code:'trust_missing',checks:[{verification:{verdict:'pending',code:'trust_missing'}}]})}),{ui}=h.mount();
  const f=file(JSON.stringify(credential()));ui.input.files=[f];ui.input.dispatch('change',{isTrusted:true});
  assert.equal(h.reads(),0);assert.equal(ui.review.disabled,false);ui.review.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(h.reads(),1);assert.equal(deepText(ui.preview).includes('nodo.7.receiver'),true);assert.equal(ui.send.disabled,true);assert.equal(h.sends(),0);assert.equal(h.network(),0);
});

test('cancelled selection preserves the selected file without reading or changing game state',()=>{
  const h=harness(),{ui}=h.mount(),f=file(JSON.stringify(credential()));ui.input.files=[f];ui.input.dispatch('change',{isTrusted:true});
  const before=ui.status.textContent;ui.input.dispatch('cancel',{isTrusted:true});
  assert.equal(ui.status.textContent,before);assert.equal(h.reads(),0);assert.equal(h.network(),0);
});

test('changing the file while signature verification waits discards the older result',async()=>{
  let resolveInspect;const h=harness({inspect:()=>new Promise(resolve=>{resolveInspect=resolve;})}),{ui}=h.mount();
  ui.input.files=[file(JSON.stringify(credential()))];ui.input.dispatch('change',{isTrusted:true});ui.review.click();
  await new Promise(resolve=>setImmediate(resolve));ui.input.files=[file(JSON.stringify(credential()))];ui.input.dispatch('change',{isTrusted:true});
  resolveInspect({verdict:'verified',code:'verified',checks:[{verification:{verdict:'verified',code:'verified'}}]});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(ui.preview.textContent,'');assert.equal(ui.send.disabled,true);assert.equal(h.sends(),0);assert.equal(h.network(),0);
});

test('dispatch remains pending for every consent, identity, worker and 202 sabotage',async()=>{
  const h=harness(),cases=['gesture','checkbox','signature_missing','signature_rejected','other_account','other_fingerprint','other_destination','worker_error','accepted_202'];
  for(const scenario of cases){const r=await h.api.dispatch({scenario,verified:true});assert.equal(r.verdict,'pending');assert.equal(r.code,'transport_pending');}
  assert.equal(h.sends(),0);assert.equal(h.network(),0);
});

test('preview rendering uses text nodes for hostile values and never interprets markup',()=>{
  const c=credential();c.nodo='<img src=x>';const receipt={verdict:'pending',code:'trust_missing',checks:[{verification:{verdict:'pending',code:'trust_missing'}}]};
  const model=Preview.build(c,receipt,'unavailable','en'),doc={createElement:element},host=element('div');Preview.render(host,model,doc);
  assert.equal(host.children.some(x=>x.innerHTML!==undefined),false);assert.ok(host.children.flatMap(x=>x.children||[]).some(x=>x.textContent.includes('<img src=x>')));
});

test('all new interface causes have complete translations in nine languages and modules stay below 16 KiB',()=>{
  const names=['node_file_receiver.js','node_preview.js'];
  for(const n of names)assert.ok(readFileSync(new URL('../public/game/'+n,import.meta.url)).length<16384);
  const langs=Object.keys(Preview.MESSAGES);assert.deepEqual(langs.sort(),['ar','de','el','en','es','fr','it','pt','ru']);
  for(const lang of langs)for(const key of Object.keys(Preview.MESSAGES.en))assert.ok(Preview.text(key,lang));
});
