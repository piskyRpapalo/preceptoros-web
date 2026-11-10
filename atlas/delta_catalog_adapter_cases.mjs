import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const A=require('./puros/delta_catalog_adapter.js');
const sha=n=>n.toString(16).padStart(40,'0');
const doc=[
'## 8 · Earlier section', '- A0 · Ignore.',
'## 9 · The mission map', '### A · Tasks', '- A1 · First.',
'- A2 · Second.', '- B6 · Third.',
'## 10 · Later section', '- B7 · Ignore.'
].join('\n');
function input(body=doc) {
  const commit=sha(111);
  return {schema:A.SCHEMA,document:{repository:A.REPO,path:A.FILE,commit_sha:commit,
    url:'https://github.com/'+A.REPO+'/blob/'+commit+'/'+A.FILE,
    body,sha256:crypto.createHash('sha256').update(body).digest('hex')}};
}
const id=n=>'gh:sample/missions#'+n;
const introduced=(code,n,position,contracts=[])=>({kind:'introduced',mission_code:code,
  id:id(n),position,contracts,source:'https://github.com/sample/missions/issues/'+n,
  observed_commit_sha:sha(n)});
const built=(code,n,pr)=>({kind:'built',mission_code:code,id:id(n),
  source:'https://github.com/sample/missions/pull/'+pr,
  observed_commit_sha:sha(pr),sha:sha(pr)});
test('extract only section 9 and reject collisions',()=>{
  assert.deepEqual(A.catalogCodes(doc),{state:'PARSED',codes:['A1','A2','B6'],mission_count:3});
  assert.equal(A.catalogCodes('missing').cause,'mission_section_missing');
  assert.equal(A.catalogCodes('## 9 · abc\n- A1 · one\n- A1 · two').cause,'mission_code_repeated');
});
test('do not invent history or report zero distance when missing',()=>{
  const x=A.normalize(input());
  assert.equal(x.state,'NO_DATA');assert.equal(x.cause,'historical_events_missing');
  assert.equal(x.mission_count,3);
});
test('incomplete receipts return NO_DATA with cause and missing codes',()=>{
  const x=input();x.events=[introduced('A1',1,'778.5')];
  const result=A.normalize(x);
  assert.equal(result.cause,'mission_history_incomplete');
  assert.equal(result.missing_count,2);
  assert.deepEqual(result.missing_sample,['A2','B6']);
});
test('explicit late insertion gives distance 2 but no GitHub provenance claim',()=>{
  const x=input();x.events=[introduced('A2',2,'779'),introduced('B6',6,'780'),
    built('A2',2,22),built('B6',6,66),introduced('A1',1,'778.5')];
  const result=A.normalize(x);
  assert.equal(result.state,'PREPARED');
  assert.equal(result.provenance,'DECLARED_NOT_VERIFIED');
  const row=result.distance.open_alarms.find(x=>x.id===id(1));
  assert.equal(row.D,2); assert.equal(row.A,0);
});
test('tampered bytes and unpinned links fail closed',()=>{
  const x=input();x.document.body+=' corrupt';
  assert.equal(A.normalize(x).cause,'catalog_digest_mismatch');
  const y=input();y.document.url='https://example.com';
  assert.equal(A.normalize(y).cause,'catalog_url_not_pinned');
});
test('id mismatch, false code and missing commit reject evidence',()=>{
  const x=input();x.events=[introduced('A2',2,'779'),built('A2',3,33)];
  assert.equal(A.normalize(x).cause,'build_without_intro_at_1');
  x.events[0].mission_code='X99';
  assert.equal(A.normalize(x).cause,'mission_code_unknown_at_0');
  x.events[0].mission_code='A2'; x.events[0].observed_commit_sha='none';
  assert.equal(A.normalize(x).cause,'observation_sha_missing_at_0');
});
test('real repository document yields an inventory, not inferred events',()=>{
  const path=new URL('../docs/canon-map-details-20261107.md',import.meta.url);
  if(!fs.existsSync(path))return; // isolated test outside repo
  const real=fs.readFileSync(path,'utf8'), c=A.catalogCodes(real);
  assert.equal(c.state,'PARSED');
  assert.ok(c.mission_count>=70);
  assert.ok(c.codes.includes('B6'));
  assert.ok(c.codes.includes('I10'));
  assert.equal(A.normalize(input(real)).cause,'historical_events_missing');
});
