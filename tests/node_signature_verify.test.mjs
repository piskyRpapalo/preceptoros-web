import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { createPrivateKey, createPublicKey, createHash, sign, webcrypto } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const R = require('../public/game/node_reception_contract.js');
const modulePath = new URL('../public/game/node_signature_verify.js', import.meta.url);
const utf8 = s => Buffer.from(s, 'utf8');
const digest = b => createHash('sha256').update(b).digest('hex');
const field = b => { b = Buffer.from(b); const n = Buffer.alloc(4); n.writeUInt32BE(b.length); return Buffer.concat([n,b]); };
const canonical = x => JSON.stringify(K.ordena(x));
const copy = x => JSON.parse(JSON.stringify(x));
const seal = c => { delete c.sha256; c.sha256 = K.huella(c); return c; };

// Synthetic keys, never a human identity or a production trust root.
function key(byte) {
  const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'), Buffer.alloc(32,byte)]), format:'der', type:'pkcs8' });
  const raw = createPublicKey(privateKey).export({format:'der',type:'spki'}).subarray(-32);
  const blob = Buffer.concat([field(utf8('ssh-ed25519')),field(raw)]);
  return {privateKey,raw,blob,publicLine:'ssh-ed25519 '+blob.toString('base64')};
}
const root = key(17), stranger = key(29);
function signature(message, namespace, signer=root, hash='sha512', reserved=Buffer.alloc(0)) {
  const h = createHash(hash).update(message).digest();
  const signed = Buffer.concat([utf8('SSHSIG'),field(utf8(namespace)),field(reserved),field(utf8(hash)),field(h)]);
  const sig = Buffer.concat([field(utf8('ssh-ed25519')),field(sign(null,signed,signer.privateKey))]);
  const version=Buffer.from([0,0,0,1]);
  const blob=Buffer.concat([utf8('SSHSIG'),version,field(signer.blob),field(utf8(namespace)),field(reserved),field(utf8(hash)),field(sig)]);
  return '-----BEGIN SSH SIGNATURE-----\n'+blob.toString('base64').match(/.{1,70}/g).join('\n')+'\n-----END SSH SIGNATURE-----\n';
}
function fixture(signer=root) {
  const c={esquema:'preceptoros.cedula-nodo/1',nodo:'nodo.1.example',admin:'a1'.repeat(32),dispositivos:[],plan_sha256:'c3'.repeat(32)};
  c.firma_ssh=signature(utf8(R.signedBody(c)),'preceptoros-cedula',signer); seal(c);
  const m={esquema:'preceptoros.trust-manifest/1',clave_publica:signer.publicLine,namespace:'preceptoros-cedula',fecha:'2026-10-16'};
  m.firma_ssh=signature(utf8(canonical(m)),'preceptoros-trust-manifest',signer);
  return {c,m,anchor:{key_sha256:digest(signer.blob),manifest_sha256:digest(utf8(canonical(m)))}};
}
function load(anchor, crypto=webcrypto) {
  const context={AtlasCanon:K,AtlasNodeReception:R,AtlasNodeTrustAnchor:anchor,TextEncoder,TextDecoder,Uint8Array,DataView,atob,btoa,crypto};
  for(const name of ['fetch','document','localStorage','sessionStorage','Date','WebSocket']) Object.defineProperty(context,name,{get(){throw Error('unexpected effect: '+name);}});
  runInNewContext(readFileSync(new URL('../public/game/node_signature_messages.js',import.meta.url),'utf8'),context);
  runInNewContext(readFileSync(modulePath,'utf8'),context);
  return context.AtlasNodeSignatureVerify;
}
const plain = x => JSON.parse(JSON.stringify(x));
const outcome = async (f, anchor=f.anchor) => plain(await load(anchor).verify(f.c,f.m));

test('synthetic Ed25519 SSHSIG verifies without granting authority or changing input', async()=>{
  const f=fixture(), before=canonical(f), result=await outcome(f);
  assert.deepEqual(result,{verdict:'verified',code:'verified',authority:false,firma:null});
  assert.equal(canonical(f),before);
  assert.equal(R.packet({esquema:'preceptoros/cedula-nodo/1',pares:[f.c],firma:null}).valid,true);
});
test('OpenSSH independently verifies the synthetic credential and manifest fixtures',()=>{
  const f=fixture(), dir=mkdtempSync(join(tmpdir(),'ssh-fixture-'));
  try { for(const [name,message,armor,ns] of [['credential',R.signedBody(f.c),f.c.firma_ssh,'preceptoros-cedula'],['manifest',canonical(Object.fromEntries(Object.entries(f.m).filter(([k])=>k!=='firma_ssh'))),f.m.firma_ssh,'preceptoros-trust-manifest']]) {
    const file=join(dir,name+'.sig');writeFileSync(file,armor);
    const r=spawnSync('ssh-keygen',['-Y','check-novalidate','-n',ns,'-s',file],{input:message,encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
  }} finally {rmSync(dir,{recursive:true,force:true});}
});
test('production anchor is absent; a self-signed manifest cannot establish trust',async()=>{
  const f=fixture(), V=require(modulePath.pathname);
  assert.equal((await V.verify(f.c,f.m)).code,'trust_missing');
  assert.equal((await load(null).verify(f.c,f.m)).verdict,'pending');
});
test('a credential carrying its own trusted key fails closed',async()=>{
  const f=fixture(); f.c.clave_publica=stranger.publicLine;
  f.c.firma_ssh=signature(utf8(R.signedBody(f.c)),'preceptoros-cedula');seal(f.c);
  assert.equal((await outcome(f)).verdict,'rejected');
});
test('attacker signature is rejected against the separately pinned human root',async()=>{
  const f=fixture(), bad=fixture(stranger);f.c=bad.c;
  assert.equal((await outcome(f)).code,'trust_mismatch');
});
test('a replacement self-signed manifest and credential do not replace the anchor',async()=>{
  const f=fixture(), bad=fixture(stranger);
  assert.equal((await outcome(bad,f.anchor)).code,'manifest_mismatch');
});
test('altering a manifest is rejected before its new claim is trusted',async()=>{
  const f=fixture();f.m.fecha='2026-10-17';
  const body=copy(f.m);delete body.firma_ssh;
  f.m.firma_ssh=signature(utf8(canonical(body)),'preceptoros-trust-manifest');
  assert.equal((await outcome(f)).code,'manifest_mismatch');
});
test('even a pinned document must have a valid manifest signature and root key',async()=>{
  const f=fixture(); f.m.firma_ssh=signature(utf8('different'),'preceptoros-trust-manifest');f.anchor.manifest_sha256=digest(utf8(canonical(f.m)));
  assert.equal((await outcome(f)).code,'signature');
  const g=fixture();g.anchor.key_sha256=digest(stranger.blob);
  assert.equal((await outcome(g)).code,'trust_mismatch');
});
test('foreign credential namespace is rejected after valid outer integrity',async()=>{
  const f=fixture();f.c.firma_ssh=signature(utf8(R.signedBody(f.c)),'foreign-domain');seal(f.c);
  assert.equal((await outcome(f)).code,'namespace');
});
test('foreign manifest namespace is rejected despite a matching document pin',async()=>{
  const f=fixture();const body=copy(f.m);delete body.firma_ssh;
  f.m.firma_ssh=signature(utf8(canonical(body)),'preceptoros-cedula');f.anchor.manifest_sha256=digest(utf8(canonical(f.m)));
  assert.equal((await outcome(f)).code,'namespace');
});
test('a changed signed byte with recalculated outer hash reaches and fails crypto',async()=>{
  const f=fixture();f.c.nodo='nodo.1.examplf';seal(f.c);
  assert.equal(R.credential(f.c).valid,true);
  assert.equal((await outcome(f)).code,'signature');
});
test('missing WebCrypto or unsupported Ed25519 is pending, never a fake rejection',async()=>{
  const f=fixture();assert.equal((await load(f.anchor,null).verify(f.c,f.m)).code,'crypto_unavailable');
  let attempts=0;
  const subtle={digest:webcrypto.subtle.digest.bind(webcrypto.subtle),verify:webcrypto.subtle.verify.bind(webcrypto.subtle),importKey:async()=>{attempts++;throw Object.assign(Error('unsupported'),{name:'NotSupportedError'});}};
  assert.equal((await load(f.anchor,{subtle}).verify(f.c,f.m)).verdict,'pending');
  assert.equal(attempts,1);
});
test('unexpected backend failure is pending with its own cause',async()=>{
  const f=fixture(), subtle={digest:async()=>{throw Error('backend stopped');},importKey(){},verify(){}};
  assert.equal((await load(f.anchor,{subtle}).verify(f.c,f.m)).code,'crypto_error');
});
function mutateArmor(armor,change){const b=Buffer.from(armor.split('\n').slice(1,-2).join(''),'base64');return '-----BEGIN SSH SIGNATURE-----\n'+change(b).toString('base64')+'\n-----END SSH SIGNATURE-----\n';}
test('truncated, bad magic, future version and trailing SSHSIG bytes are rejected',async()=>{
  for(const change of [b=>b.subarray(0,9),b=>{b[0]^=1;return b;},b=>{b[9]=2;return b;},b=>Buffer.concat([b,Buffer.from([0])]),b=>{b.writeUInt32BE(0xffffffff,10);return b;}]) {
    const f=fixture();f.c.firma_ssh=mutateArmor(f.c.firma_ssh,change);seal(f.c);assert.equal((await outcome(f)).verdict,'rejected');
  }
});
test('strict armor rejects malformed base64 and embedded prefix/suffix',async()=>{
  for(const change of [s=>'x'+s,s=>s+'x',s=>s.replace('U1NI','!!!!'),s=>s.replace('-----END','x-----END')]) {
    const f=fixture();f.c.firma_ssh=change(f.c.firma_ssh);seal(f.c);assert.equal((await outcome(f)).verdict,'rejected');
  }
});
test('SHA-256 SSHSIG is supported and reserved bytes remain signed',async()=>{
  const f=fixture();f.c.firma_ssh=signature(utf8(R.signedBody(f.c)),'preceptoros-cedula',root,'sha256',Buffer.from([1,2]));seal(f.c);
  assert.equal((await outcome(f)).verdict,'verified');
});
test('manifest schema, fields, namespace and declaration date are strict',async()=>{
  for(const change of [{esquema:'other'},{extra:true},{namespace:'other'},{fecha:'yesterday'},{fecha:'2026-02-29'},{clave_publica:'ssh-rsa bad'}]) {
    const f=fixture();Object.assign(f.m,change);assert.equal((await outcome(f)).verdict,'rejected');
  }
});
test('result and anchor snapshot are immutable; repeated verification is deterministic',async()=>{
  const f=fixture(),V=load(f.anchor),a=await V.verify(f.c,f.m);f.anchor.key_sha256=digest(stranger.blob);
  assert.deepEqual(plain(await V.verify(f.c,f.m)),plain(a));assert.equal(Object.isFrozen(a),true);
  assert.throws(()=>{a.authority=true;},TypeError);
});
test('absence of a manifest remains pending and no incoming label upgrades it',async()=>{
  const f=fixture(),V=load(f.anchor);assert.equal((await V.verify(f.c,null)).code,'trust_missing');
  assert.equal((await V.verify(f.c)).code,'trust_missing');
  assert.equal(R.credential(f.c).autenticidad,'NO_DATA');
});
test('unsupported hash algorithm is rejected rather than silently changed',async()=>{
  const f=fixture();f.c.firma_ssh=signature(utf8(R.signedBody(f.c)),'preceptoros-cedula',root,'sha384');seal(f.c);
  assert.equal((await outcome(f)).code,'algorithm');
});
test('inputs are captured before awaiting the crypto backend',async()=>{
  const f=fixture(),V=load(f.anchor),promise=V.verify(f.c,f.m);
  f.c.nodo='nodo.1.changed';f.m.clave_publica=stranger.publicLine;
  assert.equal((await promise).verdict,'verified');
});
test('all verdict causes have nine complete human translations',()=>{
  const f=fixture(),V=load(f.anchor);
  assert.deepEqual(Object.keys(V.MESSAGES).sort(),['ar','de','el','en','es','fr','it','pt','ru']);
  const codes=Object.keys(V.MESSAGES.en);
  for(const lang of Object.keys(V.MESSAGES)) for(const code of codes){assert.ok(Object.hasOwn(V.MESSAGES[lang],code));assert.ok(V.message(code,lang).length);assert.doesNotMatch(V.message(code,lang),/NO_DATA|undefined|NaN/);}
});
test('loading and verification perform no network, DOM, storage or wall-clock access',async()=>{
  const f=fixture();assert.equal((await load(f.anchor).verify(f.c,f.m)).verdict,'verified');
});
test('new served artifacts stay within source and compressed ceilings',()=>{
  for(const name of ['node_signature_verify.js','node_signature_messages.js','node_trust_anchor.js','node_trust_manifest.js']) {
    const p=new URL('../public/game/'+name,import.meta.url);assert.ok(statSync(p).size<16384);assert.ok(gzipSync(readFileSync(p),{level:9}).length<=7168);
  }
});
