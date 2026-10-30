import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
test('W1 served rules preserve source except browser namespace',()=>{
 const source=readFileSync(new URL('../atlas/puros/wave_duel.js',import.meta.url),'utf8');
 const served=readFileSync(new URL('../public/game/wave_rules.js',import.meta.url),'utf8');
 assert.equal(served,source.replace('root.AtlasWaveDuel = API','root.AtlasWaveRules = API'));
});
test('visitor practice replay, SHA-256 rejection and existing scene in Chromium',async()=>{
 const {stdout}=await promisify(execFile)(process.execPath,['atlas/visitor_battle_browser.mjs'],{cwd:new URL('..',import.meta.url),timeout:60000});
 assert.deepEqual(JSON.parse(stdout.trim()).fallos,[]);
});
