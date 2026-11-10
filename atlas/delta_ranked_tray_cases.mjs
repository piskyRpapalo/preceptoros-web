// B6: deterministic cases, all synthetic. No GitHub state is inferred from them.
// Discovered by atlas/every_case.mjs in the existing gate; no new CI runner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const B = require('./puros/delta_ranked_tray.js');
const sha = (n) => n.toString(16).padStart(40, '0');
const issue = (n) => 'https://github.com/example/missions/issues/' + n;
const pr = (n) => 'https://github.com/example/missions/pull/' + n;
const intro = (id, position, contracts, n) =>
  ({ kind: 'introduced', id, position, contracts, source: issue(n) });
const build = (id, n) => ({ kind: 'built', id, sha: sha(n), source: pr(n) });
const fid = (n) => 'gh:example/missions#' + n;

function history() {
  const events = [
    intro(fid(778), '778', ['core/state'], 778),
    intro(fid(779), '779', ['core/state'], 779),
    intro(fid(780), '780', ['app/ui'], 780),
    intro(fid(781), '781', ['core/state'], 781),
    intro(fid(782), '782', ['world/map'], 782),
    build(fid(779), 779), build(fid(780), 780),
    build(fid(781), 781), build(fid(782), 782),
    intro(fid(900), '778.5', ['core/state'], 900),
  ];
  return { schema: B.SCHEMA, catalog_sha: sha(1), events };
}
const row = (audit, id) => audit.open_alarms.find((r) => r.id === id);

test('a retroactive 778.5 detects four already-built later missions', () => {
  const result = B.audit(history());
  assert.equal(result.state, 'CALCULATED');
  assert.equal(result.provenance, 'DECLARED_NOT_VERIFIED');
  const r = row(result, fid(900));
  assert.equal(r.position, '778.5');
  assert.equal(r.D, 4); assert.equal(r.A, 0);
  assert.deepEqual(r.I, { state: 'CALCULATED', count: 2 });
  assert.deepEqual(r.nearby_sample, [fid(779), fid(780), fid(781)]);
});

test('building further ahead raises A without rewriting the historic D', () => {
  const h = history();
  h.events.push(intro(fid(783), '783', ['world/map'], 783), build(fid(783), 783));
  const r = row(B.audit(h), fid(900));
  assert.equal(r.D, 4); assert.equal(r.A, 1);
  assert.equal(r.I.count, 2);
});

test('a mission delivered later stops raising an open alarm', () => {
  const h = history(); h.events.push(build(fid(900), 900));
  assert.equal(row(B.audit(h), fid(900)), undefined);
});

test('exact decimal positions: 778.05 < 778.5 = 778.50', () => {
  const p = B.position;
  assert.equal(B.compare(p('778.05'), p('778.5')), -1);
  assert.equal(B.compare(p('778.5'), p('778.50')), 0);
  assert.equal(B.compare(p('778.75'), p('779')), -1);
  assert.equal(p('778.5e0'), null);
  assert.equal(p('778.1234567890'), null);
  const h = history();
  h.events.push(intro(fid(901), '778.50', [], 901));
  assert.match(B.audit(h).cause, /^position_collision_/);
});

test('no contracts is not the same as contracts measured empty', () => {
  const h = history();
  h.events[3].contracts = null;
  const r = row(B.audit(h), fid(900));
  assert.deepEqual(r.I, {
    state: 'NO_DATA', cause: 'contracts_unmeasured', known_minimum: 1,
  });
  const none = history();
  none.events[9].contracts = [];
  assert.deepEqual(row(B.audit(none), fid(900)).I, { state: 'CALCULATED', count: 0 });
});

test('invalid source, unintroduced build, repeated build and broken SHA fail closed', () => {
  const badSource = history(); badSource.events[0].source = 'file:///secret';
  assert.equal(B.audit(badSource).cause, 'source_invalid_at_0');
  const unknown = history(); unknown.events.push(build(fid(999), 999));
  assert.match(B.audit(unknown).cause, /^build_without_introduction_/);
  const repeated = history(); repeated.events.push(build(fid(779), 779));
  assert.match(B.audit(repeated).cause, /^build_repeated_/);
  const digest = history(); digest.events[5].sha = '123';
  assert.equal(B.audit(digest).cause, 'build_sha_invalid_at_5');
  const duplicate = history(); duplicate.events.push(intro(fid(779), '900', [], 901));
  assert.match(B.audit(duplicate).cause, /^id_reused_/);
});

test('history is mandatory; undeclared position and contracts produce NO_DATA', () => {
  assert.equal(B.audit(null).cause, 'catalog_snapshot_invalid');
  const empty = history(); empty.events = [];
  assert.equal(B.audit(empty).cause, 'history_missing_or_out_of_range');
  const broken = history(); broken.events[9].position = 'not a rank';
  assert.equal(B.audit(broken).cause, 'position_invalid_at_9');
  const wrong = history(); wrong.events[9].contracts = undefined;
  assert.equal(B.audit(wrong).cause, 'contracts_invalid_at_9');
});

test('deterministic, does not mutate evidence, one short reader line per alert', () => {
  const h = history(), before = JSON.stringify(h);
  const first = B.audit(h), second = B.audit(h);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(h), before);
  for (const r of first.open_alarms) {
    assert.ok(Buffer.byteLength(B.line(r), 'utf8') < 1024);
    assert.match(B.line(r), /propose-only$/);
  }
});

test('pure: no system time, network, randomness, filesystem or shell', () => {
  const source = readFileSync(new URL('./puros/delta_ranked_tray.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Date\.now|new Date|Math\.random|fetch\(|XMLHttpRequest|readFileSync|execFile|spawn\(/);
});
