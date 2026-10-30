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
 const { stdout } = await run(process.execPath, ['atlas/visitor_account_browser.mjs'], { cwd: new URL('..',import.meta.url), timeout:60000 });
 assert.equal(JSON.parse(stdout.trim()).medidas.openssl,true);
});
