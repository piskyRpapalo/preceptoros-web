import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const C=require('../public/game/first_house_chapter.js');
const P=require('../public/game/visitor_house_profile.js');
const SEED='a'.repeat(64), PLACE='b:visitor-house:3,-2';
const battle={place:PLACE,practice:false,combat:{gana:'asalto'}};
const gates={verifyBattle:async()=>true,verifyConquest:async()=>true,verifyBuild:async()=>true,
  confirmApproach:async()=>true,confirmRetake:async()=>true,
  readGarrison:async()=>({count:5,life:950})};
const claim=async(s)=> (await C.advance(s,{kind:'claim',place:PLACE,origin:'visitor-build'},gates)).state;
const profile=async(s)=> (await C.advance(s,{kind:'profile_saved',place:PLACE,card:P.normalize({title:'My house'}).card})).state;
const approach=async(s)=> (await C.advance(s,{kind:'npc_approach',place:PLACE},gates)).state;
const retake=async(s)=> (await C.advance(s,{kind:'npc_retake',place:PLACE},gates)).state;

test('first visit starts on map with zero node dependence',()=>{
  assert.equal(C.phase(C.fresh(SEED)),'first-house');
  assert.equal(C.schema,'preceptoros.first-house/1');
  assert.throws(()=>C.fresh('abc'),/NO_DATA/);
});
test('no verified house build or verified replay means no conquest',async()=>{
  const s=C.fresh(SEED);
  assert.equal((await C.advance(s,{kind:'claim',place:PLACE,origin:'visitor-build'},{})).cause,'capture_not_verified');
  assert.equal((await C.advance(s,{kind:'claim',place:PLACE,origin:'visitor-build'}, {verifyBuild:async()=>false})).ok,false);
  assert.equal((await C.advance(s,{kind:'claim',place:PLACE,battle}, {verifyBattle:async()=>true})).ok,false);
  assert.equal((await C.advance(s,{kind:'claim',place:PLACE,battle:{...battle,practice:true}}, gates)).ok,false);
  assert.equal((await C.advance(s,{kind:'claim',place:PLACE,battle:{...battle,combat:{gana:'defensa'}}}, gates)).ok,false);
  assert.equal((await C.advance(s,{kind:'claim',place:'b:doctor:3,-2',origin:'visitor-build'},gates)).ok,false);
});
test('house profile cannot be authored without the house or with malformed link',async()=>{
  const s=C.fresh(SEED), s2=await claim(s);
  assert.equal(C.phase(s2),'personalize');
  assert.equal((await C.advance(s,{kind:'profile_saved',place:PLACE,card:P.normalize({title:'Mine'}).card})).ok,false);
  assert.equal((await C.advance(s2,{kind:'profile_saved',place:PLACE,card:{esquema:P.schema,title:'H',links:[]}})).ok,false);
  const s3=await profile(s2);assert.equal(C.phase(s3),'learn-defense');
});
test('ghost approaching does not by itself change ownership',async()=>{
  let s=await profile(await claim(C.fresh(SEED)));
  assert.equal((await C.advance(s,{kind:'npc_approach',place:PLACE},{})).cause,'npc_route_not_confirmed');
  s=await approach(s);assert.equal(s.held,true);assert.equal(s.npcSeen,true);
  assert.equal(C.phase(s),'protect-or-lose');
  assert.equal((await C.advance(s,{kind:'npc_retake',place:PLACE},{})).cause,'npc_retake_not_confirmed');
});
test('NPC may retake only after an observed, undefended, authorized event',async()=>{
  const s=await retake(await approach(await profile(await claim(C.fresh(SEED)))));
  assert.equal(s.retaken,true);assert.equal(s.held,false);assert.equal(C.phase(s),'recapture');
  const again=await C.advance(s,{kind:'recapture',place:PLACE,battle},gates);
  assert.equal(again.ok,true);assert.equal(again.state.held,true);
  assert.equal(again.state.recaptured,true);assert.equal(C.phase(again.state),'defend');
});
test('garrison only from measured ledger and cannot be faked for a loss',async()=>{
  let s=await profile(await claim(C.fresh(SEED)));
  assert.equal((await C.advance(s,{kind:'garrison',place:PLACE,count:5},{})).ok,false);
  assert.equal((await C.advance(s,{kind:'garrison',place:PLACE,count:0},gates)).ok,false);
  assert.equal((await C.advance(s,{kind:'garrison',place:PLACE,count:11},gates)).ok,false);
  assert.equal((await C.advance(s,{kind:'garrison',place:PLACE,count:5}, {readGarrison:async()=>({count:5,life:0})})).ok,false);
  s=(await C.advance(s,{kind:'garrison',place:PLACE,count:5},gates)).state;
  assert.equal(s.garrison,5);assert.equal(C.phase(s),'hospital');
  s=await approach(s);
  assert.equal((await C.advance(s,{kind:'npc_retake',place:PLACE},gates)).ok,false);
});
test('a formerly protected house can fall only after the real ledger reports a broken garrison',async()=>{
  let s=await profile(await claim(C.fresh(SEED)));
  s=(await C.advance(s,{kind:'garrison',place:PLACE,count:5},gates)).state;
  s=await approach(s);
  assert.equal((await C.advance(s,{kind:'garrison_broken',place:PLACE},{})).ok,false);
  assert.equal((await C.advance(s,{kind:'garrison_broken',place:PLACE},gates)).cause,'garrison_still_alive');
  s=(await C.advance(s,{kind:'garrison_broken',place:PLACE},{readGarrison:async()=>({count:0,life:0})})).state;
  assert.equal(s.garrison,0);
  s=(await C.advance(s,{kind:'npc_retake',place:PLACE},gates)).state;
  assert.equal(s.held,false); assert.equal(C.phase(s),'recapture');
});
test('hospital and healing fail closed until verified real operators exist',async()=>{
  let s=await profile(await claim(C.fresh(SEED)));
  s=(await C.advance(s,{kind:'garrison',place:PLACE,count:5},gates)).state;
  assert.equal((await C.advance(s,{kind:'hospital_built',place:'b:doctor:4,-2'},{})).cause,'healing_building_not_verified');
  assert.equal((await C.advance(s,{kind:'healed',place:'b:doctor:4,-2'},{})).cause,'healing_rule_not_implemented');
  s=(await C.advance(s,{kind:'hospital_built',place:'b:doctor:4,-2'}, {confirmHospital:async()=>true})).state;
  assert.equal(C.phase(s),'healing');
  s=(await C.advance(s,{kind:'healed',place:'b:doctor:4,-2'}, {confirmHealing:async()=>true})).state;
  assert.equal(C.phase(s),'explore');
});
test('tutorial can be skipped/resumed without losing ownership or inventing resources',async()=>{
  let s=await profile(await claim(C.fresh(SEED))), n=s.step;
  s=(await C.advance(s,{kind:'skip'},{})).state;
  assert.equal(C.phase(s),'skipped');assert.equal(s.held,true);
  s=(await C.advance(s,{kind:'resume'},{})).state;
  assert.equal(C.phase(s),'learn-defense');assert.equal(s.step,n+2);
  assert.equal(s.garrison,0);assert.equal(s.healed,false);
});
test('new visit cannot inherit house claim, progress or identity',async()=>{
  const old=await claim(C.fresh(SEED));const fresh=C.fresh('b'.repeat(64));
  assert.equal(old.held,true);assert.equal(fresh.held,false);
  assert.equal(fresh.place,null);assert.equal(C.phase(fresh),'first-house');
});
