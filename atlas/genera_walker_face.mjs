// Cara · walker. Genera public/face/walker.html desde el FIXTURE real del caminante (atlas/fixtures/t4_caminante.mjs).
// Solo calcula con el fixture; el navegador dibuja. Sin URLs externas, sin azar, sin reloj.
// Uso: node atlas/genera_walker_face.mjs   (escribe public/face/walker.html)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const T4 = await import('./fixtures/t4_caminante.mjs');

const VIVOS = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'PROPUESTA' }, Claude: { estado: 'HITL' } };
const TICKS = 300;
const hist = T4.simula(VIVOS, TICKS);

// Posiciones compactas: por tick, "x,y" de cada carril separados por espacio.
const pasos = hist.map((f) => f.map((c) => c.x + ',' + c.y).join(' ')).join('|');
const estados = T4.CARRILES.map((c) => ({ carril: c, estado: VIVOS[c].estado }));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Walker · PreceptorOS</title>
<meta name="description" content="Three preceptor bodies walk a 7 by 5 grid, one step per press. Generated from the walker fixture. No external requests.">
<link rel="icon" type="image/svg+xml" href="/assets/mark.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#17131F">
<style>
:root { --tinta:#1a1a1a; --papel:#f4efe3; --acento:#c2410c; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --tinta:#f4efe3; --papel:#1a1a1a; --acento:#f08a4b; } }
body { margin:0; background:var(--papel); color:var(--tinta); font:16px/1.45 system-ui, sans-serif; }
main { max-width:760px; margin:0 auto; padding:16px; }
button { font:inherit; padding:.5em 1em; border:2px solid var(--tinta); background:var(--papel); color:var(--tinta); min-height:44px; }
button:focus-visible { outline:3px solid var(--acento); outline-offset:2px; }
svg { width:100%; height:auto; display:block; }
table { border-collapse:collapse; width:100%; }
th, td { border-bottom:1px solid var(--tinta); padding:.3em .4em; text-align:left; }
.muted { opacity:.85; font-size:.9rem; }
</style>
</head>
<body>
<main>
<h1>Walker</h1>
<p class="muted">Three bodies on a 7 by 5 grid. Each press moves one step. Positions come from the walker fixture; nothing moves on its own.</p>
<p><button type="button" id="paso">Next step</button> <span id="estado" aria-live="polite"></span></p>
<svg id="rejilla" role="img" aria-labelledby="desc"></svg>
<p id="desc" class="muted">Mesa (M), Luna (L) and Claude (C). Claude is in HITL state and marked with a question mark. Text alternative: the table below gives every body's cell at the current step.</p>
<table aria-label="Cell of each body at the current step">
<thead><tr><th>Body</th><th>State</th><th>Cell (x, y)</th></tr></thead>
<tbody id="tabla"></tbody>
</table>
<footer class="honest-footer"><p class="muted">Positions come from the walker fixture (t4_caminante.mjs, 300 ticks). Nothing is measured in the browser. No external requests. Built by atlas/genera_walker_face.mjs.</p></footer>
</main>
<script src="/assets/pwa.js"></script>
<script>
var PASOS = ${JSON.stringify(pasos)}.split('|').map(function (f) {
  return f.split(' ').map(function (p) { var q = p.split(','); return { x: +q[0], y: +q[1] }; });
});
var CARRILES = ${JSON.stringify(estados)};
var W = ${T4.GRID.W}, H = ${T4.GRID.H}, TAM = 56;
var t = 0;
function iso(x, y) { return { sx: (x - y) * TAM / 2, sy: (x + y) * TAM / 4 }; }
function rombo(x, y) {
  var p = iso(x, y), h = TAM / 4, w = TAM / 2;
  return '<polygon points="' + [[p.sx, p.sy - h], [p.sx + w, p.sy], [p.sx, p.sy + h], [p.sx - w, p.sy]].map(function (a) { return a.join(','); }).join(' ') + '" fill="none" stroke="var(--tinta)" stroke-width="1"/>';
}
function dibuja() {
  var f = PASOS[t], s = '';
  for (var x = 0; x < W; x++) for (var y = 0; y < H; y++) s += rombo(x, y);
  var sorted = f.map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) { return (a.c.x + a.c.y) - (b.c.x + b.c.y); });
  sorted.forEach(function (o) {
    var p = iso(o.c.x, o.c.y), letra = CARRILES[o.i].carril[0];
    var trazo = CARRILES[o.i].estado === 'HITL' ? 'stroke-dasharray="4 3"' : '';
    s += '<circle cx="' + p.sx + '" cy="' + (p.sy - 6) + '" r="9" fill="var(--papel)" stroke="var(--tinta)" stroke-width="2" ' + trazo + '/>';
    s += '<text x="' + p.sx + '" y="' + (p.sy - 3) + '" text-anchor="middle" font-size="9" font-weight="700" fill="var(--tinta)">' + letra + '</text>';
  });
  var minX = -(H * TAM / 2) - TAM, maxX = (W * TAM / 2) + TAM, maxY = ((W + H) * TAM / 4) + TAM;
  var svg = document.getElementById('rejilla');
  svg.setAttribute('viewBox', minX + ' ' + -TAM + ' ' + (maxX - minX) + ' ' + (maxY + TAM));
  svg.innerHTML = s;
  document.getElementById('estado').textContent = 'Step ' + t + ' of ' + (PASOS.length - 1);
  document.getElementById('tabla').innerHTML = f.map(function (c, i) {
    return '<tr><td>' + CARRILES[i].carril + '</td><td>' + CARRILES[i].estado + '</td><td>' + c.x + ', ' + c.y + '</td></tr>';
  }).join('');
}
document.getElementById('paso').addEventListener('click', function () { t = (t + 1) % PASOS.length; dibuja(); });
dibuja();
</script>
</main>
</body>
</html>
`;
writeFileSync(join(RAIZ, 'public', 'face', 'walker.html'), html);
console.log(JSON.stringify({ escrito: 'public/face/walker.html', bytes: html.length, pasos: TICKS }));
