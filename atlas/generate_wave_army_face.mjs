// Synthetic face from the existing seeded wave fixture; no live army is inferred.
import { writeFileSync } from 'node:fs';
import { squad } from './fixtures/wave_army_face.mjs';
const rows = squad();
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wave Army · PreceptorOS</title>
<meta name="description" content="Four synthetic seeded waves on an isometric grid with a textual equivalent.">
<link rel="icon" type="image/svg+xml" href="/assets/mark.svg"><link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#17131F">
<style>
:root{--ink:#1a1a1a;--paper:#f4efe3;--accent:#c2410c}
@media(prefers-color-scheme:dark){:root{--ink:#f4efe3;--paper:#1a1a1a;--accent:#f08a4b}}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.45 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:16px}
button{font:inherit;min-width:44px;min-height:44px;padding:.5em 1em;border:2px solid var(--ink);background:var(--paper);color:var(--ink);cursor:pointer}
button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}button[aria-pressed="true"]{border-color:var(--accent);font-weight:700}
.controls{display:flex;gap:8px;flex-wrap:wrap}svg{width:100%;height:auto;display:block}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid var(--ink);padding:.4em;text-align:left}.muted{font-size:.9rem}
</style></head><body><main>
<h1>Wave Army</h1><p>Four synthetic seeded waves on a 7 by 5 grid. Select a wave to highlight it. These are not an account's army.</p>
<div class="controls" id="controls" aria-label="Choose a synthetic wave"></div><p id="status" role="status" aria-live="polite"></p>
<svg id="map" role="img" aria-labelledby="map-description" viewBox="-196 -70 448 300"></svg>
<p id="map-description">Four wave shapes on a two-to-one grid. The table gives the same wave, tier, cell and shape details in text.</p>
<table aria-label="Synthetic wave details"><thead><tr><th>Wave</th><th>Tier</th><th>Cell (x, y)</th><th>Edges</th><th>Harmonics</th></tr></thead><tbody id="details"></tbody></table>
<footer class="honest-footer"><p class="muted">Synthetic seeded fixture generated from the wave rules. No real army, live node, combat, audio or performance measurement is represented.</p></footer>
</main><script src="/assets/pwa.js"></script><script>
'use strict';
var rows=${JSON.stringify(rows)}, selected=0, W=7, H=5, tile=56;
function iso(x,y){return {x:(x-y)*tile/2,y:(x+y)*tile/4};}
function draw(){
  var marks='';
  for(var x=0;x<W;x++)for(var y=0;y<H;y++){var p=iso(x,y);marks+='<polygon points="'+p.x+','+(p.y-14)+' '+(p.x+28)+','+p.y+' '+p.x+','+(p.y+14)+' '+(p.x-28)+','+p.y+'" fill="none" stroke="var(--ink)" stroke-width="1"/>';}
  rows.map(function(row,i){return {row:row,i:i};}).sort(function(a,b){return (a.row.cell[0]+a.row.cell[1])-(b.row.cell[0]+b.row.cell[1]);}).forEach(function(item){
    var row=item.row,p=iso(row.cell[0],row.cell[1]),path=row.points.map(function(v,i){return (i?'L':'M')+(p.x+v[0])+','+(p.y-9+v[1]);}).join(' ')+' Z';
    marks+='<path d="'+path+'" fill="var(--paper)" stroke="'+(item.i===selected?'var(--accent)':'var(--ink)')+'" stroke-width="'+(item.i===selected?3:2)+'"/>';
    marks+='<circle cx="'+(p.x-5)+'" cy="'+(p.y-12)+'" r="2" fill="var(--ink)"/><circle cx="'+(p.x+5)+'" cy="'+(p.y-12)+'" r="2" fill="var(--ink)"/><path d="M '+(p.x-4)+' '+(p.y-5)+' Q '+p.x+' '+(p.y-2)+' '+(p.x+4)+' '+(p.y-5)+'" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';
  });
  document.getElementById('map').innerHTML=marks;
  document.getElementById('status').textContent=rows[selected].id+' selected. Synthetic fixture.';
  Array.prototype.forEach.call(document.querySelectorAll('#controls button'),function(b,i){b.setAttribute('aria-pressed',String(i===selected));});
}
rows.forEach(function(row,i){var b=document.createElement('button');b.type='button';b.textContent=row.id;b.addEventListener('click',function(){selected=i;draw();});document.getElementById('controls').appendChild(b);});
document.getElementById('details').innerHTML=rows.map(function(row){return '<tr><td>'+row.id+'</td><td>'+row.tier+'</td><td>'+row.cell.join(', ')+'</td><td>'+row.edges+'</td><td>'+row.harmonics+'</td></tr>';}).join('');
draw();
</script></body></html>\n`;
writeFileSync(new URL('../public/face/army.html', import.meta.url), html);
console.log(JSON.stringify({rows: rows.length, maxRowBytes: Math.max(...rows.map(r => Buffer.byteLength(JSON.stringify(r)))), bytes: Buffer.byteLength(html)}));
