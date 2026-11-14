import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const source = readFileSync(new URL('../public/game/visitor_account.js', import.meta.url), 'utf8');
function api() { const c = vm.createContext({ crypto: webcrypto, TextEncoder, Uint8Array }); vm.runInContext(source, c); return c.AtlasVisitorAccount; }
test('consent, isolated keys, closed scope and ended authority', async () => {
 const A = api(); await assert.rejects(A.create(false));
 const a = await A.create(true), b = await A.create(true), i = a.info();
 assert.notEqual(i.publicKey, b.info().publicKey);
 const r = { esquema:'atlas.invocacion/2', tc:'tc1', seq:1, prev:'genesis', clave_publica:i.publicKey };
 const sig = await a.sign(r,true);
 const key = await webcrypto.subtle.importKey('raw',Buffer.from(i.publicKey,'hex'),'Ed25519',false,['verify']);
 assert.equal(await webcrypto.subtle.verify('Ed25519',key,Buffer.from(sig.slice(8),'hex'),new TextEncoder().encode(JSON.stringify(r))),true);
 await assert.rejects(a.sign({...r, extra:1},true)); await assert.rejects(a.sign(r,false));
 assert.equal(a.transition().state,'NO_DATA'); a.end(); await assert.rejects(a.sign(r,true)); assert.throws(()=>a.info());
});
test('Chromium visit signature verifies independently through OpenSSL', async () => {
 const { promisify } = await import('node:util');
 const { execFile } = await import('node:child_process');
 const run = promisify(execFile);
 // The browser check exits 1 and prints its failures on stdout. execFile hides that text behind «Command failed»,
 // so the failures are read from the error and put in the assertion message.
 let stdout = '';
 try { ({ stdout } = await run(process.execPath, ['atlas/visitor_account_browser.mjs'], { cwd: new URL('..',import.meta.url), timeout:60000 })); }
 catch (error) { throw new Error('browser check failed: ' + ((error.stdout || '').trim() || error.message)); }
 assert.equal(JSON.parse(stdout.trim()).medidas.openssl,true);
});
test('a step is signed only in its closed shape: one of six directions, on the chain, with the visit key', async () => {
 const A = api(), a = await A.create(true), i = a.info();
 const r = { esquema:'atlas.paso/1', dir:'north-west', seq:1, prev:'genesis', clave_publica:i.publicKey };
 const sig = await a.sign(r,true);
 const key = await webcrypto.subtle.importKey('raw',Buffer.from(i.publicKey,'hex'),'Ed25519',false,['verify']);
 assert.equal(await webcrypto.subtle.verify('Ed25519',key,Buffer.from(sig.slice(8),'hex'),new TextEncoder().encode(JSON.stringify(r))),true);
 await assert.rejects(a.sign({...r, dir:'up'},true)); await assert.rejects(a.sign({...r, q:3},true));
 await assert.rejects(a.sign({...r, seq:0},true)); await assert.rejects(a.sign({...r, prev:'x'},true));
 await assert.rejects(a.sign({...r, clave_publica:'0'.repeat(64)},true)); await assert.rejects(a.sign(r,false));
 const beat = { esquema:'atlas.presente/1', seq:2, prev:'a'.repeat(64), clave_publica:i.publicKey };
 assert.match(await a.sign(beat,true), /^ed25519:[0-9a-f]{128}$/);
 await assert.rejects(a.sign({...beat, dir:'east'},true)); await assert.rejects(a.sign({...beat, seq:0},true));
});
