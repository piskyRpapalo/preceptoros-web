import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const chrome = process.env.CHROME_BIN || 'google-chrome';
const source = pathToFileURL(resolve(root, '../public/assets/worm_transition.js')).href;
const bubbleSource = pathToFileURL(resolve(root, '../public/game/bubble_language.js')).href;

function capture(progress) {
  const dir = mkdtempSync(resolve(tmpdir(), 'worm-bitmap-'));
  const html = `<!doctype html><meta charset="utf-8"><body>
<div id="thegame-terminal"></div><button id="menu-origin">Origin</button><button id="menu-destination">Destination</button>
<section id="thegame-origin" class="thegame-hoja" hidden style="height:120px;overflow:auto"><div style="height:360px">Origin content</div></section>
<section id="thegame-destination" class="thegame-hoja" hidden style="height:120px;overflow:auto"><div style="height:360px">Fixed transition content</div></section>
<script>
window.AtlasSemantica={SELLOS:{LIVE:210}};window.AtlasJuego={instantanea:()=>({ciclo:40})};
window.AtlasVentana={pinta:()=>{},ficha:()=>({id:'destination',sello:'LIVE'})};window.AtlasRadioChat={dice:()=>{}};
window.matchMedia=()=>({matches:false});window.setInterval=callback=>{window.__mount=callback;return 1};window.addEventListener('error',event=>{window.__error=event.message});
</script><script src="${bubbleSource}"></script><script src="${source}"></script><script>
window.__mount();const origin=document.getElementById('thegame-origin');origin.hidden=false;
setTimeout(()=>{origin.hidden=true;const panel=document.getElementById('thegame-destination');panel.hidden=false;panel.scrollTop=${Math.round(progress * 240)};
setTimeout(()=>{if(window.__error)throw new Error(window.__error);const canvas=document.querySelector('canvas');if(!canvas)throw new Error('canvas missing');document.body.dataset.bitmap=canvas.toDataURL('image/png').split(',')[1];document.body.dataset.metrics=JSON.stringify({top:panel.scrollTop,height:panel.scrollHeight,client:panel.clientHeight,ficha:AtlasWorm.ficha()})},0)},0);
</script></body>`;
  try {
    writeFileSync(resolve(dir, 'fixture.html'), html);
    const result = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
      '--disable-sync', '--disable-extensions', '--disable-crash-reporter', '--no-first-run', '--no-default-browser-check',
      '--force-device-scale-factor=1', '--window-size=320,480', '--virtual-time-budget=1000',
      '--user-data-dir=' + resolve(dir, 'profile'), '--dump-dom', pathToFileURL(resolve(dir, 'fixture.html')).href],
    { encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Chrome exit ' + result.status + ': ' + result.stderr.slice(-500));
    const match = result.stdout.match(/data-bitmap="([^"]+)"/);
    if (!match) throw new Error('bitmap output missing');
    return { sha256: createHash('sha256').update(Buffer.from(match[1], 'base64')).digest('hex'), metrics: result.stdout.match(/data-metrics="([^"]+)"/)?.[1] };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const first = capture(0.5), second = capture(0.5), sabotaged = capture(0.75);
if (first.sha256 !== second.sha256) throw new Error('same scroll progress produced different bitmap hashes');
if (first.sha256 === sabotaged.sha256) throw new Error('scroll progress sabotage was not detected: ' + JSON.stringify([first.metrics, sabotaged.metrics]));
console.log(JSON.stringify({ repeat: 'PASS', same_p_sha256: first.sha256, sabotage_p_sha256: sabotaged.sha256, changed_at_sabotage: first.sha256 !== sabotaged.sha256 }));
