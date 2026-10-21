import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME_BIN || 'google-chrome';
const source = pathToFileURL(resolve(root, '../public/assets/worm_transition.js')).href;

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function capture(step) {
  const dir = mkdtempSync(resolve(tmpdir(), 'worm-bitmap-'));
  const html = `<!doctype html><meta charset="utf-8"><body>
<div id="thegame-terminal"></div><button id="menu-pliego-estado">Map</button>
<section><article id="thegame-pliego-estado" class="thegame-hoja" hidden>Fixed transition content</article></section>
<pre id="result"></pre>
<script>
window.AtlasSemantica={SELLOS:{LIVE:210}};
window.AtlasJuego={instantanea:()=>({ciclo:40})};
window.AtlasVentana={pinta:()=>{},ficha:()=>({id:'pliego-estado',sello:'LIVE'})};
window.AtlasRadioChat={dice:()=>{}};
window.matchMedia=()=>({matches:false});
const frames=[],queue=[];
window.requestAnimationFrame=callback=>{queue.push(callback);return queue.length;};
window.setInterval=callback=>{window.__mount=callback;return 1;};
</script><script src="${source}"></script><script>
window.__mount();
document.getElementById('thegame-pliego-estado').hidden=false;
window.setTimeout(async()=>{
  let time=0;
  while(queue.length&&frames.length<32){
    queue.shift()(time);time+=${step};
    const canvas=document.querySelector('canvas');
    if(!canvas)throw new Error('canvas missing');
    const png=canvas.toDataURL('image/png').split(',')[1];
    frames.push(await crypto.subtle.digest('SHA-256',Uint8Array.from(atob(png),c=>c.charCodeAt(0))));
  }
  const hex=frames.map(bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join(''));
  document.getElementById('result').textContent=JSON.stringify(hex);
},0);
</script></body>`;
  try {
    writeFileSync(resolve(dir, 'fixture.html'), html);
    const page = pathToFileURL(resolve(dir, 'fixture.html')).href;
    const result = spawnSync(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
      '--disable-sync', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
      '--force-device-scale-factor=1', '--window-size=320,480', '--virtual-time-budget=10000',
      '--user-data-dir=' + resolve(dir, 'profile'), '--dump-dom', page,
    ], { encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Chrome exit ' + result.status + ': ' + result.stderr.slice(-500));
    const match = result.stdout.match(/<pre id="result">([^<]+)<\/pre>/);
    if (!match) throw new Error('frame digest output missing');
    const frames = JSON.parse(match[1]);
    if (frames.length < 2) throw new Error('insufficient animation frames');
    return { frames: frames.length, sha256: digest(frames.join('\n')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const first = capture(60);
const second = capture(60);
const sabotaged = capture(75);
if (first.frames !== second.frames || first.sha256 !== second.sha256) throw new Error('same transition produced different bitmap sequence hashes');
if (first.sha256 === sabotaged.sha256) throw new Error('timing sabotage was not detected');
console.log(JSON.stringify({ frames_per_run: first.frames, same_schedule_sha256: first.sha256, repeat_sha256: second.sha256,
  sabotage_frames: sabotaged.frames, sabotage_schedule_sha256: sabotaged.sha256, repeat: 'PASS', timing_sabotage: 'RED' }));
