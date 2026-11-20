import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../public/game/building_suggestion_bridge.js');
function validate(i) {
  if (!i || typeof i.name !== 'string' || typeof i.purpose !== 'string' ||
      !i.name.trim() || !i.purpose.trim() || i.name.trim().length > 60 || i.purpose.trim().length > 400) {
    return {ok:false,cause:'building_name_and_purpose_required'};
  }
  if (/sk-[a-z0-9_-]{20,}/i.test(i.name+i.purpose)) { return {ok:false,cause:'credentials_not_allowed'}; }
  return {ok:true};
}
const good = {name:'Cove Hospital',purpose:'A safe place to heal waves.'};
const rootHash='f'.repeat(64);
test('reuses validator; never invents valid if unavailable or rejected',()=>{
  assert.equal(P.prepare(good).cause,'building_draft_validator_unavailable');
  assert.equal(P.prepare({name:'',purpose:'hi'},validate).ok,false);
  assert.equal(P.prepare({name:'a'.repeat(61),purpose:'fine'},validate).ok,false);
  assert.equal(P.prepare({name:'hi',purpose:'sk-'+'k'.repeat(22)},validate).cause,'credentials_not_allowed');
});
test('safe bounded proposal includes no visitor/node identities, no script evaluation',()=>{
  const x=P.prepare({name:' Health  <svg/> ',purpose:'**Built on the map**\nhttps://github.com'},validate);
  assert.equal(x.ok,true);const j=JSON.parse(x.content);
  assert.equal(j.status,'PROPOSE_ONLY');assert.equal(j.authority,'none');
  assert.equal(j.name,'Health  <svg/>');assert.equal(j.origin,'ephemeral-web');
  assert.equal(JSON.stringify(j).includes('clave_publica'),false);
  assert.ok(new TextEncoder().encode(x.content).length<1024);
});
test('rejects overbudget Unicode even when character-length validator permits',()=>{
  const x=P.prepare({name:'x',purpose:'🥀'.repeat(200)},validate);
  assert.equal(x.ok,false);assert.equal(x.cause,'suggestion_exceeds_1023_utf8_bytes');
});
test('zero network without explicit public consent',async()=>{
  let send=0;
  const r=await P.submit(good,{consent:false,makeDraft:validate,send:async()=>{send++;return rootHash;},net:()=>{},subtle:{}});
  assert.equal(r.cause,'explicit_public_submission_consent_required');assert.equal(send,0);
});
test('requires existing transport and crypto',async()=>{
  const r=await P.submit(good,{consent:true,makeDraft:validate});
  assert.equal(r.cause,'ingesta_transport_unavailable');
});
test('submits once to the provided transport, returns quarantine not owner delivery',async()=>{
  let count=0,body='';
  const r=await P.submit(good,{consent:true,makeDraft:validate,net:()=>{},subtle:{},send:async(text)=>{count++;body=text;return rootHash;}});
  assert.equal(count,1);assert.equal(JSON.parse(body).kind,'public-building-suggestion');
  assert.equal(r.ok,true);assert.equal(r.state,'QUARANTINED');assert.equal(r.receipt,rootHash);
  assert.equal(r.admitted,false);assert.match(r.owner_delivery,/NO_DATA/);
});
test('rejects fake receipt and transport failure without leaking exception details',async()=>{
  const opts={consent:true,makeDraft:validate,net:()=>{},subtle:{}};
  assert.equal((await P.submit(good,{...opts,send:async()=> 'ack'})).cause,'ingesta_receipt_invalid');
  assert.equal((await P.submit(good,{...opts,send:async()=> {throw Error('secret_API_KEY_dont_echo')}})).cause,'ingesta_delivery_unconfirmed');
});
test('no sender accidentally called for dangerous input',async()=>{
  let sent=0;const bad={name:'sk-'+'a'.repeat(30),purpose:'hello'};
  const r=await P.submit(bad,{consent:true,makeDraft:validate,net:()=>{},subtle:{},send:async()=>{sent++;return rootHash;}});
  assert.equal(r.ok,false);assert.equal(sent,0);
});
