// C2 pure access evidence: reported is never a browser proof or a signed permission.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const A = require('./access_evidence.js');
const good = () => ({ keyboard: true, proxy_blocked: false, target_px: 44,
  screenreader_role: 'button', aria_live: true, audio: true,
  contrast_ratio: 4.5, reduced_motion: true });
const frame = (r = good()) => A.make('node.welcome', r, 'atlas/a11y_four_readings_browser.mjs');

test('complete supplied values stay REPORTED, never MEASURED or LIVE', () => {
  const r = frame();
  assert.deepEqual(r.problems, []);
  assert.equal(r.frame.access.status, 'REPORTED');
  assert.match(r.frame.access.authority, /^NO_DATA:/);
  assert.deepEqual(A.validate(r.frame), []);
  assert.ok(new TextEncoder().encode(JSON.stringify(r.frame)).length < 1024);
});
test('unknown physical audio never pretends to be audible', () => {
  const r = good(); r.audio = 'NO_DATA: no physical ear witness';
  assert.equal(frame(r).frame.access.status, 'NO_DATA');
});
test('NO_DATA requires a cause, never bare sentinel or omission', () => {
  for (const v of ['NO_DATA', 'NO_DATA:', undefined, null]) {
    const r = good(); r.audio = v;
    assert.ok(frame(r).problems.length > 0);
  }
});
test('screenreader absence with reason remains NO_DATA', () => {
  const r = good(); r.screenreader_role = 'NO_DATA: no TalkBack run';
  assert.equal(frame(r).frame.access.status, 'NO_DATA');
});
test('keyboard succeeds only if the proxy is measured not blocking', () => {
  const r = good(); r.proxy_blocked = true;
  assert.equal(frame(r).frame.access.status, 'FAIL');
  r.proxy_blocked = 'NO_DATA: overlapping canvas unmeasured';
  assert.equal(frame(r).frame.access.status, 'NO_DATA');
});
test('target proxy at 43 px is a FAIL, not a softened threshold', () => {
  const r = good(); r.target_px = 43;
  assert.equal(frame(r).frame.access.status, 'FAIL');
});
test('contrast 4.49 is a FAIL and NaN is INVALID', () => {
  const r = good(); r.contrast_ratio = 4.49;
  assert.equal(frame(r).frame.access.status, 'FAIL');
  r.contrast_ratio = NaN;
  assert.ok(frame(r).problems.length > 0);
});
test('missing role or aria-live is invalid or FAIL, not a pass', () => {
  const r = good(); r.screenreader_role = '';
  assert.ok(frame(r).problems.length > 0);
  r.screenreader_role = 'button'; r.aria_live = false;
  assert.equal(frame(r).frame.access.status, 'FAIL');
});
test('reduced motion must be measured or unknown with a reason', () => {
  const r = good(); delete r.reduced_motion;
  assert.ok(frame(r).problems.length > 0);
});
test('unexpected fields, unsafe id, and oversized injected claims fail closed', () => {
  const r = good(); r.owner_key = 'no';
  assert.ok(frame(r).problems.length > 0);
  assert.ok(A.make('../home', good()).problems.length > 0);
  const huge = Object.fromEntries(A.ORDER.map(k => [k, 'NO_DATA: ' + 'x'.repeat(90)]));
  const made = A.make('a'.repeat(48), huge, 'x'.repeat(96));
  assert.equal(made.frame, null);
  assert.ok(made.problems.some(x => x.includes('1024')));
  const normal = frame().frame;
  normal.access.source = 'a'.repeat(1200);
  assert.ok(A.validate(normal).includes('access_frame_over_1024'));
});
test('tampering status, visual sentence, machine change, voice or source is detected', () => {
  const r = frame().frame; r.access.status = 'LIVE';
  assert.ok(A.validate(r).includes('access_status_or_id_mismatch'));
  r.access.status = 'REPORTED'; r.sound = 'ok';
  assert.ok(A.validate(r).includes('audio_claim_without_acho_waves'));
  r.sound = 'NO_DATA: no waves declared for this state';
  r.atoms[0].r = 'Access node.welcome: REPORTED · false_verified';
  assert.ok(A.validate(r).includes('visual_machine_sentence_mismatch'));
  r.atoms[0].r = r.change[0]; r.change[0] += ' forged';
  assert.ok(A.validate(r).includes('visual_machine_sentence_mismatch'));
  r.change[0] = r.atoms[0].r; r.access.source = '<script>';
  assert.ok(A.validate(r).includes('source_invalid'));
});
test('no timers, random choices or network side effects; file within source budget', () => {
  const path = new URL('./access_evidence.js', import.meta.url);
  const js = readFileSync(path, 'utf8');
  assert.ok(!["Math.random", "Date.now", "fetch(", "XMLHttpRequest"].some(x => js.includes(x)));
  assert.ok(statSync(path).size <= 16384);
});
