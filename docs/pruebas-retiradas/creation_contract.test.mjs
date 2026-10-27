import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign } from 'node:crypto';
const P=createRequire(import.meta.url)('../public/game/creation_package.js');
const read=n=>readFileSync(new URL('./fixtures/creation/'+n,import.meta.url),'utf8');
const valid=read('valid.json'), original=JSON.parse(valid);
const pair=generateKeyPairSync('ed25519');
const publicKey=pair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('hex');
async function signed(change) {
 const p=structuredClone(original); change(p);
 p.public_key=publicKey; p.signature=sign(null,Buffer.from(p.manifest),pair.privateKey).toString('hex');
 return P.verify(JSON.stringify(p));
}
test('shared signed fixture, exact manifest bytes and independent reopening',async()=>{
 const result=await P.verify(valid); assert.equal(result.manifest.author,'Fixture author');
 assert.equal(result.id,await P.sha256(original.manifest));
 assert.notEqual(result.id,await P.sha256(JSON.stringify(result.manifest)));
 assert.deepEqual((await P.verify(JSON.stringify(result.package))).frame,result.frame);
});
for(const name of ['frame','audio','manifest','signature']) test('reject altered '+name,async()=>{
 await assert.rejects(P.verify(read('altered-'+name+'.json')));
});
test('fresh real Ed25519 signature interoperates with package creator',async()=>{
 const result=await P.verify(valid), prepared=await P.prepare({author:'New author',description:'Independent signature.',
  voice_profile:result.manifest.voice_profile,frame:result.frame,audio:result.audio});
 const signature=sign(null,Buffer.from(prepared.manifest),pair.privateKey).toString('hex');
 const packed=await P.finish(prepared,publicKey,signature);
 assert.equal((await P.verify(JSON.stringify(packed))).manifest.author,'New author');
});
test('reject file routes, unexpected fields and malformed encodings',async()=>{
 for(const mutate of [p=>p.files['../frame.json']=p.files['frame.json'],p=>p.extra=true,
  p=>p.public_key='ff',p=>p.files['frame.json']+='\n',p=>p.signature='F'.repeat(128)]){
  const p=structuredClone(original); mutate(p); await assert.rejects(P.verify(JSON.stringify(p)));
 }
});
test('signed content still must satisfy closed ribbon and WAV schemas',async()=>{
 for(const name of ['frame.json','declaration.wav']) await assert.rejects(signed(p=>{
  const b=P.decode(p.files[name]); b[0]=0; p.files[name]=P.encode(b);
  // Unchanged file digest must fail even though this manifest receives a valid signature.
 }));
 const result=await P.verify(valid); const malformed=structuredClone(result.frame); malformed.atoms[0].i[0].pts[0]=[-1,0];
 assert.throws(()=>P.frame(JSON.stringify(malformed)),/ribbon/);
 const wav=P.bytes(result.audio); wav[20]=3; assert.throws(()=>P.wav(wav),/WAV/);
});
test('frame and complete package boundary fixtures reject whole input',async()=>{
 const limits=JSON.parse(read('limits.json'));
 assert.throws(()=>P.frame(' '.repeat(limits.frame_bytes)),/frame byte limit/);
 const exact=' '.repeat(P.MAX-valid.length)+valid;
 await P.verify(exact);
 await assert.rejects(P.verify(' '+exact),/package byte limit/);
 assert.equal(P.bytes(' '+exact).length,limits.package_bytes);
});
test('signature cannot survive JSON reconstruction',async()=>{
 const p=structuredClone(original);p.manifest=JSON.stringify(JSON.parse(p.manifest));
 await assert.rejects(P.verify(JSON.stringify(p)),/signature/);
});
test('sabotage switch makes the judge red on damaged input',async()=>{
 if(process.env.CREATION_SABOTAGE==='1') await P.verify(read('altered-frame.json'));
 else await assert.rejects(P.verify(read('altered-frame.json')));
});
