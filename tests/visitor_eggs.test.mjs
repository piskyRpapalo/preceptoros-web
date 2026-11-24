import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
test('visitor invokes and adopts without persistent identity in Chromium', async()=>{
 // a red run must say WHY: execFile's error keeps the child's stdout (its «fallos»), which a bare throw hid (CI, 24NOV)
 const {stdout}=await promisify(execFile)(process.execPath,['atlas/visitor_eggs_browser.mjs'],{cwd:new URL('..',import.meta.url),timeout:60000}).catch((e)=>{assert.fail('visitor_eggs_browser exit '+e.code+': '+String(e.stdout||'').trim().slice(-1500)+' '+String(e.stderr||'').trim().slice(-500));});
 const r=JSON.parse(stdout.trim());assert.deepEqual(r.fallos,[]);assert.equal(r.medidas.openssl,true);
});
