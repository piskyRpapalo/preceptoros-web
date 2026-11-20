import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
const require = createRequire(import.meta.url);
const P = require('../public/game/building_suggestion_bridge.js');
const D = require('../public/assets/day_d_building.js');
const good = {name:'Cove Hospital', purpose:'A safe place to heal waves.'};
const receipt = 'f'.repeat(64);
async function goodDelivery(req) { return {
  schema: P.receiptSchema, state:'STORED_PENDING_REVIEW',
  content_sha256:req.sha256, receipt
}; }
const yes = async () => true;
const base = {consent:true,makeDraft:D.makeDraft,subtle:webcrypto.subtle,deliver:goodDelivery,verifyReceipt:yes};
test('reuses actual Day D draft validator; cannot bypass if absent or bad', () => {
  assert.equal(P.prepare(good).cause, 'building_draft_validator_unavailable');
  assert.equal(P.prepare({name:'',purpose:'hi'},D.makeDraft).ok, false);
  assert.equal(P.prepare({name:'a'.repeat(61),purpose:'fine'},D.makeDraft).ok, false);
  assert.equal(P.prepare({name:'hi',purpose:'sk-'+'k'.repeat(22)},D.makeDraft).cause,'credentials_not_allowed');
});
test('proposal schema contains NO 24h public chat retention, account, node or privileged data', () => {
  const x = P.prepare({name:' Health  <svg/> ',purpose:'**Built on the map**\nhttps://github.com'},D.makeDraft);
  assert.equal(x.ok,true); const j=JSON.parse(x.content);
  assert.equal(x.state,'LOCAL_DRAFT'); assert.equal(j.status,'PROPOSE_ONLY');
  assert.equal(j.authority,'none'); assert.equal(j.name,'Health  <svg/>');
  assert.equal(j.origin,'ephemeral-web'); assert.equal(j.kind,'building-proposal');
  assert.equal(JSON.stringify(j).includes('clave_publica'),false);
  assert.equal(JSON.stringify(j).includes('24h'),false);
  assert.equal(JSON.stringify(j).includes('chat'),false);
  assert.ok(new TextEncoder().encode(x.content).length<1024);
});
test('enforces 1023-byte maximum on actual UTF-8, not just char count', () => {
  const x = P.prepare({name:'🥀'.repeat(30),purpose:'🥀'.repeat(200)},D.makeDraft);
  assert.equal(x.ok,false); assert.equal(x.cause,'proposal_exceeds_1023_utf8_bytes');
});
test('no send without explicit consent',async()=>{
  let sent=0;
  const r=await P.submit(good,{...base,consent:false,deliver:async()=>{sent++;return goodDelivery({sha256:'x'})}});
  assert.equal(r.cause,'explicit_proposal_submission_consent_required'); assert.equal(sent,0);
});
test('rejects absent owner inbox; never falls back to open chat or network',async()=>{
  let sent=0;
  const r=await P.submit(good,{consent:true,makeDraft:D.makeDraft,send:()=>{sent++},net:()=>{},subtle:webcrypto.subtle});
  assert.equal(r.cause,'owner_proposal_inbox_not_connected'); assert.equal(sent,0);
});
test('accepts explicitly verified owner inbox receipt but never claims owner was notified',async()=>{
  let sent=0; const r=await P.submit(good,{...base,deliver:async(req)=>{sent++;assert.equal(req.schema,P.version);assert.match(req.sha256,/^[0-9a-f]{64}$/);return goodDelivery(req)}});
  assert.equal(sent,1); assert.equal(r.ok,true); assert.equal(r.state,'STORED_PENDING_REVIEW');
  assert.equal(r.receipt,receipt); assert.equal(r.owner_approved,false); assert.equal(r.published,false);
  assert.match(r.owner_notification,/NO_DATA/);
});
test('rejects wrong receipt digest, schema, shape and verification failure',async()=>{
  for(const override of [{content_sha256:'0'.repeat(64)},{schema:'preceptoros.ingesta/1'},{state:'QUARANTINED'},{receipt:'bad'}]){
    const r=await P.submit(good,{...base,deliver:async(req)=>({...await goodDelivery(req),...override})});
    assert.equal(r.cause,'owner_inbox_receipt_not_verified');
  }
  const r=await P.submit(good,{...base,verifyReceipt:async()=>false});
  assert.equal(r.cause,'owner_inbox_receipt_not_verified');
});
test('transport errors do not leak secrets',async()=>{
  const r=await P.submit(good,{...base,deliver:async()=>{throw Error('SECRET-DO-NOT-EMIT')}});
  assert.equal(r.cause,'owner_inbox_delivery_unconfirmed'); assert.equal(JSON.stringify(r).includes('SECRET'),false);
});
test('does not deliver rejected proposals',async()=>{
  let sent=0;
  const r=await P.submit({name:'sk-'+'a'.repeat(30),purpose:'hello'}, {...base,deliver:async()=>{sent++;return null}});
  assert.equal(r.ok,false);assert.equal(sent,0);
});
