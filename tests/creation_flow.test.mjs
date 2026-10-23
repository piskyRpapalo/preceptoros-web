import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign } from 'node:crypto';

const require = createRequire(import.meta.url);
const P = require('../public/game/creation_package.js');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/creation/valid.json', import.meta.url)));

test('signed drawing and WAV reopen in a fresh verifier', async () => {
  const key = generateKeyPairSync('ed25519');
  const raw = P.decode(fixture.files['frame.json']);
  const audio = P.decode(fixture.files['declaration.wav']);
  const prepared = await P.prepare({author:'Browser author', description:'A first ribbon.',
    voice_profile:'a'.repeat(64), frame:JSON.parse(Buffer.from(raw).toString('utf8')), audio});
  const pub = key.publicKey.export({format:'der', type:'spki'}).subarray(-32).toString('hex');
  const signature = sign(null, Buffer.from(prepared.manifest), key.privateKey).toString('hex');
  const packed = await P.finish(prepared, pub, signature);
  const opened = await P.verify(JSON.stringify(packed));
  assert.equal(opened.manifest.author, 'Browser author');
  assert.deepEqual(opened.audio, audio);
  const broken = structuredClone(packed);
  broken.files['frame.json'] = P.encode(Uint8Array.from(raw, (value, index) => index === raw.length - 2 ? value ^ 1 : value));
  await assert.rejects(P.verify(JSON.stringify(broken)), /hash|signature/);
});

test('the creation page loads its local identity and verifier before the flow', () => {
  const html = readFileSync(new URL('../public/creation.html', import.meta.url), 'utf8');
  const ordered = ['assets/auth.js', 'game/creation_package.js', 'game/creation_feedback.js',
    'game/bubble_paint.js', 'game/creation_flow.js'].map(path => html.indexOf(path));
  assert(ordered.every(index => index >= 0));
  assert.deepEqual(ordered, ordered.slice().sort((a,b) => a-b));
  for (const id of ['voice-catalog-file','voice-declaration-file','voice-audio-file',
    'sign-creation','download-creation','creation-file','reader-description']) assert(html.includes('id="' + id + '"'));
  const flow = readFileSync(new URL('../public/game/creation_flow.js', import.meta.url), 'utf8');
  assert.match(flow, /Identity\.firmarTexto\(prepared\.manifest\)/);
  assert.match(flow, /Package\.verify\(/);
  assert.match(flow, /127\.0\.0\.1.*localhost.*::1/);
});

test('sabotage switch proves that one changed package byte is rejected', async () => {
  const broken = structuredClone(fixture);
  const frame = P.decode(broken.files['frame.json']); frame[frame.length - 2] ^= 1;
  broken.files['frame.json'] = P.encode(frame);
  if (process.env.CREATION_FLOW_SABOTAGE === '1') await P.verify(JSON.stringify(broken));
  else await assert.rejects(P.verify(JSON.stringify(broken)));
});
