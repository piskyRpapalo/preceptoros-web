import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
globalThis.createImageBitmap = async blob => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { width: new DataView(bytes.buffer, bytes.byteOffset).getUint32(16),
    height: new DataView(bytes.buffer, bytes.byteOffset).getUint32(20), close() {} };
};
const require = createRequire(import.meta.url);
const P = require('../tools/creation_image_package.js');
const source = require('../public/game/creation_package.js');
const valid = JSON.parse(readFileSync(new URL('./fixtures/creation/valid.json', import.meta.url)));
const wav = source.decode(valid.files['declaration.wav']);
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jW2kAAAAASUVORK5CYII=', 'base64'), c => c);
const provenance = { model_sha256: '1'.repeat(64), prompt_sha256: '2'.repeat(64), parameters: { width: 1 }, seed: null };

async function signedPackage() {
  const key = generateKeyPairSync('ed25519');
  const pub = key.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
  const prepared = await P.prepare({ author: 'Luna test', description: 'A test image package', voice_profile: 'a'.repeat(64),
    provenance, image: png, audio: wav });
  const sig = sign(null, Buffer.from(prepared.manifest), key.privateKey).toString('hex');
  return { packed: await P.finish(prepared, pub, sig), key, pub };
}

test('separate image schema signs the exact manifest and reopens the PNG and WAV', async () => {
  const { packed } = await signedPackage();
  const opened = await P.verify(JSON.stringify(packed));
  assert.equal(opened.manifest.schema, P.SCHEMA);
  assert.deepEqual([...opened.image], [...png]);
  assert.deepEqual([...opened.audio], [...wav]);
  assert.deepEqual(opened.dimensions, { width: 1, height: 1 });
  assert.match(opened.id, /^[0-9a-f]{64}$/);
});

test('image, audio, manifest, signature, and unknown package fields reject', async () => {
  const { packed } = await signedPackage();
  const changedImage = structuredClone(packed);
  const image = P.decode(changedImage.files['image.png']); image[image.length - 10] ^= 1;
  changedImage.files['image.png'] = P.encode(image);
  await assert.rejects(P.verify(JSON.stringify(changedImage)), /file hash or size/);
  const changedAudio = structuredClone(packed);
  const audio = P.decode(changedAudio.files['declaration.wav']); audio[audio.length - 2] ^= 1;
  changedAudio.files['declaration.wav'] = P.encode(audio);
  await assert.rejects(P.verify(JSON.stringify(changedAudio)), /file hash or size/);
  const changedManifest = structuredClone(packed); changedManifest.manifest += ' ';
  await assert.rejects(P.verify(JSON.stringify(changedManifest)), /author signature/);
  const changedSignature = structuredClone(packed); changedSignature.signature = '0'.repeat(128);
  await assert.rejects(P.verify(JSON.stringify(changedSignature)), /author signature/);
  const extra = { ...packed, surprise: true };
  await assert.rejects(P.verify(JSON.stringify(extra)), /package fields/);
});

test('raster dimensions, encoded package and decoder availability have explicit bounds', async () => {
  const tooWide = png.slice(); new DataView(tooWide.buffer).setUint32(16, P.WIDTH_MAX + 1);
  assert.throws(() => P.pngHeader(tooWide), /PNG dimensions/);
  const badPng = Uint8Array.from(png); badPng[0] = 0;
  await assert.rejects(P.prepare({ author: 'Luna', description: 'x', voice_profile: 'a'.repeat(64), provenance, image: badPng, audio: wav }), /PNG signature/);
  const decoder = globalThis.createImageBitmap;
  try {
    delete globalThis.createImageBitmap;
    await assert.rejects(P.prepare({ author: 'Luna', description: 'x', voice_profile: 'a'.repeat(64), provenance, image: png, audio: wav }), /PNG decoder unavailable/);
  } finally { globalThis.createImageBitmap = decoder; }
  assert.equal(P.PACKAGE_MAX, 25 * 1024 * 1024);
  assert.equal(P.PIXELS_MAX, 4 * 1024 * 1024);
});
