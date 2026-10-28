import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../public/assets/descent_view.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/assets/descent.css',import.meta.url),'utf8');
const escena=readFileSync(new URL('../public/assets/codex_scene.js',import.meta.url),'utf8');
const regla=(sel)=>css.match(new RegExp('(^|\\n)'+sel.replace(/\./g,'\\.')+'\\s*\\{[^}]*\\}'))?.[0]??'';
const epilogue=js.slice(js.indexOf('function epilogue()'),js.indexOf('var LANGS'));
test('story ends with an honest AI Safe epilogue and explicit separate tutorial',()=>{
 assert.match(js,/AI Safe/);
 assert.match(js,/guided tutorial/);
 assert.match(js,/TheGame\.tutorial/);
 const css=readFileSync(new URL('../public/assets/descent.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/min-height:\s*70dvh/);
});
test('epilogue states the goal and the rules without certification claims',()=>{
 assert.ok(js.includes('Your own place, by your choice'));
 assert.ok(js.includes('Build a sovereign structure in an AI Safe environment: your device holds its state, AI proposes, and you review what changes.'));
 assert.ok(js.includes('The guided tutorial helps you prepare your first beacon. You can keep playing locally. Visiting a node or deploying a structure always needs your explicit choice.'));
 assert.doesNotMatch(epilogue,/certif|complian|guarantee|approved/i);
});
test('tutorial button calls TheGame.tutorial only on click, only if it exists, and never disables itself',()=>{
 assert.match(js,/window\.TheGame && typeof window\.TheGame\.tutorial === 'function'\) \{ window\.TheGame\.tutorial\(\);/);
 assert.match(js,/The guided tutorial is not loaded yet\./);
 const llamada=epilogue.indexOf('window.TheGame.tutorial()');
 assert.ok(llamada>epilogue.indexOf("addEventListener('click'"));
 assert.doesNotMatch(epilogue,/disabled/);
});
test('epilogue sits in the last chapter before the exit doors and is not a chapter',()=>{
 assert.match(js,/if \(i === ids\.length - 1\) \{ caja\.appendChild\(epilogue\(\)\); caja\.appendChild\(puertas\(despertar, hayCuenta\)\); \}/);
 assert.doesNotMatch(epilogue,/data-frame|descent-step/);
 assert.match(js,/d\.appendChild\(questions\(\)\)/);
});
test('DOM-safe: no HTML injection or eval, and the epilogue makes no network or signing call',()=>{
 assert.doesNotMatch(js,/innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function/);
 assert.doesNotMatch(epilogue,/fetch|XMLHttpRequest|WebSocket|sendBeacon|Identity|sign/);
});
test('sound: the view closes only its own AudioContext on cleanup',()=>{
 assert.match(js,/st\.audio\.close\(\)/);
 assert.match(js,/st\.audio = null/);
});
test('chapters have no gap and no card framing; prose is capped at a readable width',()=>{
 assert.doesNotMatch(regla('.descent-step'),/min-height/);
 assert.doesNotMatch(regla('.descent-box'),/box-shadow|border:|background/);
 assert.match(regla('.descent-box'),/max-width:\s*36rem/);
});
test('touch targets stay at 44 px or more',()=>{
 for (const sel of ['.descent-tutorial','.descent-sound-toggle','.descent-tele summary']) {
  assert.match(regla(sel),/min-height:\s*(4[4-9]|[5-9]\d)px/,sel);
 }
});
test('no horizontal overflow on narrow screens and house tokens only for the epilogue',()=>{
 assert.match(regla('.descent-pane'),/overflow-x:\s*hidden/);
 assert.match(regla('.descent-box'),/overflow-wrap:\s*anywhere/);
 assert.match(regla('.descent-tutorial'),/var\(--d-/);
});
test('the statue of the Preceptor stays in the scene data, untouched by the view',()=>{
 assert.ok(escena.includes('This is the Preceptor, a statue of stone.'));
});
