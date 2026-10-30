import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
test('visitor invokes and adopts without persistent identity in Chromium', async()=>{
 const {stdout}=await promisify(execFile)(process.execPath,['atlas/visitor_eggs_browser.mjs'],{cwd:new URL('..',import.meta.url),timeout:60000});
 const r=JSON.parse(stdout.trim());assert.deepEqual(r.fallos,[]);assert.equal(r.medidas.openssl,true);
});
