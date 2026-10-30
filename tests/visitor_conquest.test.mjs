import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
test('verified victory, existing r200 clearing and session reset in Chromium',async()=>{
 const {stdout}=await promisify(execFile)(process.execPath,['atlas/visitor_conquest_browser.mjs'],{cwd:new URL('..',import.meta.url),timeout:60000});
 assert.deepEqual(JSON.parse(stdout.trim()).fallos,[]);
});
