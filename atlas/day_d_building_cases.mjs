import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('../public/assets/day_d_building.js');
test('one building is a local human draft and never a live node or automatic grant', () => {
  const r = D.makeDraft({ name: 'River Library', purpose: 'Help visitors learn local river ecology.' });
  assert.equal(r.ok, true);
  assert.equal(r.filename, 'BUILDING_PROPOSAL.md');
  assert.match(r.text, /Building count: 1/);
  assert.match(r.text, /Status: DRAFT_ONLY/);
  assert.doesNotMatch(r.text, /Schema: preceptoros\\./);
  assert.match(r.text, /"River Library"/);
  assert.match(r.text, /NO_DATA\(node_admission_not_approved\)/);
  assert.match(r.text, /NO_DATA\(world_publication_not_verified\)/);
  assert.match(r.text, /NO_DATA\(owner_model_not_connected\)/);
  assert.match(r.text, /Feedback stays only on the node owner/);
  assert.doesNotMatch(r.text, /LIVE|approved ownership|signed successfully/);
});
test('same facts render the same machine-readable markdown', () => {
  const x = { name: 'Rivers', purpose: 'Field guides' };
  assert.equal(D.makeDraft(x).text, D.makeDraft(x).text);
});
test('empty or oversized inputs fail closed', () => {
  for (const x of [
    null, {}, {name:'',purpose:'ok'}, {name:'ok',purpose:' '},
    {name:'a'.repeat(D.MAX_NAME+1),purpose:'ok'},
    {name:'ok',purpose:'b'.repeat(D.MAX_PURPOSE+1)}
  ]) assert.deepEqual(D.makeDraft(x),{ok:false,cause:'building_name_and_purpose_required'});
});
test('private credentials are not accepted in a public proposal', () => {
  for (const value of ['-----BEGIN '+'PRIVATE KEY-----', 'ghp_'+'A'.repeat(25),'github_pat_'+'A'.repeat(25),'sk-'+'A'.repeat(25)]) {
    assert.deepEqual(D.makeDraft({name:'Library',purpose:value}),{ok:false,cause:'credentials_not_allowed'});
  }
});
test('untrusted HTML and Markdown remain quoted as data, never rendered as DOM', () => {
  const r=D.makeDraft({name:'<img src=x onerror=alert(1)>',purpose:'[click](javascript:alert(1))'});
  assert.equal(r.ok,true);assert.match(r.text,/Name \(human data\): "<img src=x onerror=alert\(1\)>"/);
  const html=readFileSync(new URL('../public/get-the-app/index.html',import.meta.url),'utf8');
  assert.match(html,/id="dayd-building-make" disabled/);
  assert.match(html,/id="dayd-building-output"[^>]*readonly hidden/);
  assert.match(html,/Feedback stays only on the node owner/);
  assert.match(html,/day_d_building.js/);
  assert.doesNotMatch(html,/action="https?:\/\//);
});
