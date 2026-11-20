// node atlas/laurent_browser.mjs /path/to/receipt-prefix [minimum-seconds]
// For an already-authorized Chrome CDP socket use CDP_PORT=<local port>.
// Only the newly created background test target is touched and closed.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { installScene } from './laurent_browser_scene.mjs';

const prefix = process.argv[2];
assert(prefix, 'Pass an output path prefix for the JSON receipt and PNG');
const seconds = Number(process.argv[3] ?? 0);
assert(Number.isFinite(seconds) && seconds >= 0);
mkdirSync(dirname(prefix), { recursive: true });
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const digest = data => createHash('sha256').update(data).digest('hex');
const wave = read('public/game/wave_render.js'), library = read('atlas/laurent.mjs');
function once(source, old, replacement) {
  assert.equal(source.split(old).length, 2, 'Unexpected renderer at hook ' + old);
  return source.replace(old, replacement);
}
// Isolate sampling by keeping the original transformations, colors, halo and variable-width
// algorithm. For Hermite, render each cubic with the original segment's chord-based width.
function instrument(source) {
  let s = once(source, 'P = puntos(A, n)', 'P = window.laurentPoints(A, n, k)');
  s = once(s, "g[j ? 'lineTo' : 'moveTo'](px(P[j]), py(P[j]));", `if (j && P.curves?.length) {
    const c = P.curves[j-1]; g.bezierCurveTo(px(c[0]),py(c[0]),px(c[1]),py(c[1]),px(P[j]),py(P[j]));
  } else { g[j ? 'lineTo' : 'moveTo'](px(P[j]), py(P[j])); }`);
  return once(s, 'g.lineTo(px(P[s]), py(P[s]));', `if (P.curves?.length) {
    const c = P.curves[s-1]; g.bezierCurveTo(px(c[0]),py(c[0]),px(c[1]),py(c[1]),px(P[s]),py(P[s]));
  } else { g.lineTo(px(P[s]), py(P[s])); }`);
}
async function connect(url) {
  const ws = new WebSocket(url), pending = new Map();
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = evt => {
    const msg = JSON.parse(evt.data), p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); }
  };
  let id = 0;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const seq = ++id;
      const timer = setTimeout(() => { pending.delete(seq); reject(Error('CDP timeout ' + method)); }, 45000);
      pending.set(seq, {resolve, reject, timer}); ws.send(JSON.stringify({id:seq, method, params}));
    });
  }
  return {send, close: () => ws.close()};
}
const chrome = process.env.CDP_PORT ? null : launchChrome(0);
let browser, page, target;
try {
  const base = 'http://127.0.0.1:' + (chrome ? await chrome.debugPort() : Number(process.env.CDP_PORT));
  const version = await (await fetch(base + '/json/version')).json();
  browser = await connect(version.webSocketDebuggerUrl);
  ({targetId: target} = await browser.send('Target.createTarget', {url:'about:blank', background:true}));
  // Some Android Chrome versions expose only the page endpoints on an ADB forward.
  const pages = await (await fetch(base + '/json/list')).json();
  const entry = pages.find(p => p.id === target);
  assert(entry, 'Private target not listed');
  page = await connect(entry.webSocketDebuggerUrl);
  async function evaluate(expression) {
    const r = await page.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  await page.send('Page.enable');
  for (const path of ['public/game/values.js','public/game/gacha.js']) await evaluate(read(path));
  await evaluate(wave);
  await evaluate('window.originalWave = window.AtlasOnda; void 0');
  const modified = instrument(wave);
  await evaluate(modified);
  const uri = 'data:text/javascript;base64,' + Buffer.from(library).toString('base64');
  await evaluate(`(async () => { const {contour} = await import(${JSON.stringify(uri)});
    window.expScene = (${installScene})(contour, window.originalWave, window.AtlasOnda);
  })()`);
  const environment = await evaluate('({userAgent:navigator.userAgent,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],visibility:document.visibilityState})');
  // Android may suspend compositor screenshots from a background tab. Read the
  // seven actual Canvas bitmaps in that case; never bring a visitor's tab to front.
  const captureKind = /Android/.test(environment.userAgent) ? 'canvas contact sheet' : 'page screenshot';
  const image = captureKind === 'page screenshot'
    ? (await page.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:true})).data
    : await evaluate(`(() => {
      const sheet = document.createElement('canvas');
      sheet.width=768; sheet.height=430;
      const ctx=sheet.getContext('2d');
      ctx.fillStyle='#14202a'; ctx.fillRect(0,0,768,430); ctx.fillStyle='#fff'; ctx.font='16px sans-serif';
      document.querySelectorAll('figure').forEach((f,i) => {
        const x=i%4*192, y=Math.floor(i/4)*215;
        ctx.drawImage(f.querySelector('canvas'),x,y); ctx.fillText(f.textContent,x+8,y+202);
      });
      return sheet.toDataURL('image/png').split(',')[1];
    })()`);
  writeFileSync(prefix + '.png', Buffer.from(image, 'base64'));
  const ax = await page.send('Accessibility.getFullAXTree');
  const accessible = ax.nodes.filter(n => n.role?.value === 'image').map(n => n.name?.value);
  let i = 0;
  const start = performance.now();
  do {
    // Yield to the event loop between groups of rotated method orders.
    await evaluate(`for (let r=${i}; r<${i + 7}; r++) expScene.sample(r);`);
    i += 7;
  } while (i < 49 || performance.now() - start < seconds * 1000);
  const elapsedSeconds = (performance.now() - start) / 1000;
  const results = await evaluate('expScene.summarize()');
  const fixture = await evaluate('({arms:expScene.arms,style:expScene.style,radius:expScene.radius,scale:expScene.scale,size:expScene.size})');
  const heap = {};
  for (const method of Object.keys(results).filter(m => m !== 'original')) {
    await evaluate('window.heldContours = null');
    await page.send('HeapProfiler.collectGarbage');
    const before = await page.send('Runtime.getHeapUsage');
    await evaluate(`expScene.retain(${JSON.stringify(method)})`);
    await page.send('HeapProfiler.collectGarbage');
    const after = await page.send('Runtime.getHeapUsage');
    heap[method] = {copies:32, jsDeltaBytes:after.usedSize - before.usedSize,
      backingDeltaBytes:after.backingStorageSize - before.backingStorageSize};
  }
  const receipt = {head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    bytesSha256:Object.fromEntries(['public/game/values.js','public/game/gacha.js','public/game/wave_render.js',
      'atlas/laurent.mjs','atlas/laurent_browser.mjs','atlas/laurent_browser_scene.mjs'].map(path => [path,digest(read(path))])),
    rendererWithSamplingHookSha256:digest(modified), captureKind, captureSha256:digest(Buffer.from(image,'base64')),
    chrome:version.Browser, environment, fixture, elapsedSeconds, accessible, results, heap,
    scope:'192x192 Canvas backing pixels, quality 2 with halo, no trail. Frame submission plus full CPU readback; timing is per-frame mean of four, excluding first seven batches. Heap delta retains 32 independent contours after GC. AX labels describe this lab scene only.'};
  writeFileSync(prefix + '.json', JSON.stringify(receipt,null,2)+'\n');
  assert(results.original.union > 1000, 'Blank reference');
  assert.equal(accessible.length, 7, 'Missing public experiment image labels');
  for (const key of ['uniform','adaptive','hermite']) assert(results[key].maxErrorCanvasPx <= 0.5, 'Geometric budget exceeded: '+key);
  for (const key of ['direct','table','recurrence']) assert(results[key].changed === 0, key+' raster differs from original on golden scene');
  console.log(JSON.stringify({prefix,chrome:version.Browser,elapsedSeconds,framesPerMethod:results.original.nBatches*4}));
} finally {
  page?.close();
  if (target) await browser.send('Target.closeTarget',{targetId:target});
  browser?.close();
  if (chrome) await chrome.close();
}
