// N4 · the first frame carries its own sha256, and the app (PreceptorOS cerebro_frame.py) computes the same hex.
// If this vector changes, test_cerebro_frame.py in the app must change in the same pair of PRs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const B = require('../../public/game/brain_frame.js');
const K = require('../../public/game/canon.js');
const raw = readFileSync(new URL('../../public/brains.json', import.meta.url));
const catalog = JSON.parse(raw);

const HUELLAS = {
  'brain-charla-multi': 'cce2b5961c8f5eb7672e79ad9efecc394e662376e39122aecf314dff0c25469f',
  'brain-charla-web': '9a1b0edf4d2f9d4f35164ac87ea3d9ad0703a957118a6d5447832cdf7cfb7d31',
  'brain-mini': 'a68342de8ca6d670fe1ce494708713b4c61bc6387dd9dddf459bcdc1d3d92aa4',
  'brain-mistral-base': 'bd4d78eda6266c8b13b00c4779baf2b588a995cfe16e420aea02a015a53500b6',
  'brain-qwen-coder': '0958e33e080519aa9f5889b9d38ddb460b81c8e3d979e6b4420078aaa6296f51',
  'brain-superviviente': 'd6b50b1b8d0921c9f038aac7a1ec73a65dee8ba9746a29a6202ad374d32119cd',
  'brain-v7': 'bb5ef043d2d07c1142490664a275b0f8f2b0c3b6e69b764817ae5b4de5a7304d'
};

test('the seven frames carry the pinned sha256 shared with the app', () => {
  const out = B.project(catalog);
  assert.equal(out.ok, true);
  assert.deepEqual(Object.fromEntries(out.frames.map((f) => [f.id, f.sha256])), HUELLAS);
});

test('each sha256 is the canon hash of the frame without its own sha256 field', () => {
  for (const f of B.project(catalog).frames) {
    const rest = Object.assign({}, f); delete rest.sha256;
    assert.equal(K.huella(rest), f.sha256);
    assert.match(f.sha256, K.HEX64);
  }
});

test('residency is NO_DATA with the named cause CAUSA_RESIDENTE, in ASCII', () => {
  for (const f of B.project(catalog).frames) {
    assert.equal(f.residencia, 'NO_DATA');
    assert.equal(f.causa.CAUSA_RESIDENTE, B.CAUSA_RESIDENTE);
    assert.match(f.atoms[0].r, /residency NO_DATA \(CAUSA_RESIDENTE\)/);
    assert.match(B.CAUSA_RESIDENTE, /^[\x20-\x7e]+$/);
  }
});

test('with the hash every frame is still a syllable: under 1,024 bytes in JSON and in canon', () => {
  for (const f of B.project(catalog).frames) {
    assert.ok(Buffer.byteLength(JSON.stringify(f), 'utf8') < 1024, f.id);
    assert.ok(K.canon(f).length < 1024, f.id);
  }
});

test('the catalogue that feeds the vector is pinned by sha256', () => {
  assert.equal(require('node:crypto').createHash('sha256').update(raw).digest('hex'),
    'd0e7e2376bfa5f63e570bd94aedac6a0158d9a3735f2d8af73166f4218705abd');
});
