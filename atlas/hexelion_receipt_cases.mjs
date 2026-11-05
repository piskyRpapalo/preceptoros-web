import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const A = require('../public/game/classroom_chat.js');
const digest = v => createHash('sha256').update(A.canonical(v)).digest('hex');
const live = {trailer:{payload_sha256:'450aec07b5fb38cafdb6ddf5ffc165ac1ff5eb6b3b42f344881dc1b92b9b166b',recibido:'2026-11-03T23:41:44.222Z',recibo_sha256:'aeb7c43cefcbe18f8d55dd471831a9c6d5b51ac9f31c0006834c0132748f7937'},veredicto:{FIRMA:'NO',cause:'oracle JSON invalid',state:'NO_DATA'}};
function receipt(v) {
 const trailer={recibido:'2026-11-03T23:41:44.222Z',payload_sha256:digest(v)};
 trailer.recibo_sha256=digest(trailer);return {veredicto:v,trailer};
}
const proposal=()=>receipt({state:'PROPOSED',FUENTE:'packet',ACCIÓN:'none',EVIDENCIA:'Measured source packet',COSTE:'One read',FIRMA:'NO'});
if(process.env.SABOTAJE==='receipt-hash') A.verifyReceipt=async()=>({ok:true});

test('matches the actual Python D7 receipt from D1 without a network request',async()=>{
 assert.equal(digest(live.veredicto),live.trailer.payload_sha256);
 assert.equal((await A.verifyReceipt(live)).ok,true);
 assert.match(A.receiptSummary(await A.verifyReceipt(live)),/NO_DATA/);
});
test('D7 canonical ASCII agrees for accented and supplementary characters',()=>{
 assert.equal(A.canonical({z:'é',a:'🌊'}),' {"a":"\\ud83c\\udf0a","z":"\\u00e9"}'.trim());
});
test('valid proposal remains advisory; tampering and signature claims are refused',async()=>{
 assert.equal((await A.verifyReceipt(proposal())).ok,true);
 for(const mutate of [r=>r.veredicto.COSTE='changed',r=>r.veredicto.FIRMA='SI',r=>r.trailer.recibo_sha256='0'.repeat(64),r=>r.veredicto.extra='untyped']) {
  const r=proposal();mutate(r);assert.equal((await A.verifyReceipt(r)).ok,false);
 }
});
test('absent, large, private-address and malformed packets are whole-receipt NO_DATA',async()=>{
 assert.equal((await A.verifyReceipt(undefined)).cause,'receipt_unavailable');
 assert.equal((await A.verifyReceipt({})).ok,false);
 const r=proposal();r.veredicto.EVIDENCIA='x'.repeat(1024);assert.equal((await A.verifyReceipt(receipt(r.veredicto))).ok,false);
 r.veredicto.EVIDENCIA='fd'+'7a::'+'1234';assert.equal((await A.verifyReceipt(receipt(r.veredicto))).ok,false);
});
test('one existing Send, unchanged door: no local or additional request',async()=>{
 let calls=0;
 const fetcher=async()=>{calls++;return {status:200,json:async()=>({estado:'OK',burbuja:{texto:'An advisory reply'},sello:{tic:1},recibo:proposal()})};};
 const r=await A.turn(fetcher,'visit','question',{tic:0},'/openworld/#seat');
 assert.equal(calls,1);assert.equal(r.ok,true);assert.equal(r.receiptState.ok,true);
});
test('legacy door responses still work, receipt absence is explicit',async()=>{
 const r=await A.turn(async()=>({status:200,json:async()=>({estado:'OK',burbuja:{texto:'Legacy'},sello:{tic:1}})}),'visit','question',{tic:0});
 assert.equal(r.ok,true);assert.equal(r.receiptState.cause,'receipt_unavailable');
});
test('renderer uses text nodes and folded details, never action or signing controls',async()=>{
 function el(tag) { return {tag,children:[],style:{},textContent:'',appendChild(child){this.children.push(child);}}; }
 const doc={createElement:el};const log=el('ol');const p=proposal();p.veredicto.EVIDENCIA='<img src=x onerror=alert(1)>';
 A.renderReceipt(doc,log,await A.verifyReceipt(receipt(p.veredicto)));
 const details=log.children[0].children.find(e=>e.tag==='details');
 assert.ok(details);assert.equal(details.open,undefined);
 assert.match(details.children[1].textContent,/<img/);
 assert.equal(log.children[0].children.some(e=>e.tag==='button'),false);
});
