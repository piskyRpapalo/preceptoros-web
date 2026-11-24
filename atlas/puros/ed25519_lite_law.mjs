// ed25519_lite (public/game/ed25519_lite.js): the fallback must be Ed25519 byte for byte, or the APP's crab is refused.
//   node --test atlas/puros/ed25519_lite_law.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto, generateKeyPairSync, sign as nodeSign, verify as nodeVerify, createPublicKey, createPrivateKey } from 'node:crypto';
const E = createRequire(import.meta.url)('../../public/game/ed25519_lite.js'), S = webcrypto.subtle;
const hex = (u) => Buffer.from(u).toString('hex'), un = (h) => new Uint8Array(Buffer.from(h, 'hex'));

test('RFC 8032 §7.1 vectors 1–3: same public key and same signature', async () => {
  const V = [
    ['9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a', '', 'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b'],
    ['4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb', '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c', '72', '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00'],
    ['c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7', 'fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025', 'af82', '6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a']];
  for (const [sk, pk, msg, sig] of V) {
    const k = await E.keypair(S, un(sk));
    assert.equal(hex(k.publicKey), pk); assert.equal(hex(await k.sign(un(msg))), sig);
    assert.equal(await E.verify(S, un(pk), un(sig), un(msg)), true);
  }
});
test('node:crypto verifies the lite signature, and the lite verifies node:crypto', async () => {
  const k = await E.keypair(S), msg = new TextEncoder().encode('{"esquema":"atlas.paso/1","dir":"east","seq":1}');
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(k.publicKey)]);
  assert.equal(nodeVerify(null, msg, createPublicKey({ key: spki, format: 'der', type: 'spki' }), Buffer.from(await k.sign(msg))), true);
  const { publicKey, privateKey } = generateKeyPairSync('ed25519'), raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(12);
  assert.equal(await E.verify(S, new Uint8Array(raw), new Uint8Array(nodeSign(null, msg, privateKey)), msg), true);
});
test('a forged signature, a wrong message or a short key is refused', async () => {
  const k = await E.keypair(S), msg = new TextEncoder().encode('step'), sig = await k.sign(msg), bad = sig.slice(); bad[5] ^= 1;
  assert.equal(await E.verify(S, k.publicKey, bad, msg), false);
  assert.equal(await E.verify(S, k.publicKey, sig, new TextEncoder().encode('stop')), false);
  assert.equal(await E.verify(S, k.publicKey.slice(1), sig, msg), false);
});
// db.js verificaWeb (2026-11-24): on a WebCrypto without Ed25519 (Android WebView 113 in the APP) the army ledger
// verifies the visit's lite signatures with the same bytes — or the beacon copper and every summon fail.
test('the army ledger verifies with the lite only when WebCrypto has no Ed25519', async () => {
  const { readFileSync } = await import('node:fs'), vm = await import('node:vm');
  const src = readFileSync(new URL('../../public/game/db.js', import.meta.url), 'utf8');
  const noEd = { importKey: () => Promise.reject(Object.assign(new Error('Algorithm: Unrecognized name'), { name: 'NotSupportedError' })), digest: S.digest.bind(S) };
  const load = (subtle) => { const root = { crypto: { subtle }, AtlasEd25519: E, TextEncoder, AtlasValores: createRequire(import.meta.url)('../../public/game/values.js') }; vm.runInNewContext(src, Object.assign(root, { globalThis: root }), { filename: 'db.js' }); return root.AtlasArmy; };
  const k = await E.keypair(S), text = '{"esquema":"atlas.invocacion/2","tc":"tc1"}', sig = hex(await k.sign(new TextEncoder().encode(text)));
  const A = load(noEd);
  assert.equal(await A.verificaWeb(text, sig, hex(k.publicKey)), true);
  assert.equal(await A.verificaWeb(text.replace('tc1', 'tc2'), sig, hex(k.publicKey)), false);
  const other = Object.assign(new Error('bad key'), { name: 'DataError' });
  await assert.rejects(load({ importKey: () => Promise.reject(other) }).verificaWeb(text, sig, hex(k.publicKey)), /bad key/); // only NotSupportedError falls back
});
