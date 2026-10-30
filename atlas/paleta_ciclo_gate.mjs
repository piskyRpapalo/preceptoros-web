// Gate runner of the day and night palette (ODD isometric-colony, IC5). One command: the pure cases in node, then the bitmap
// gate in headless Chrome: clean (n=2 byte-identical, reduced motion at noon), then two sabotages that
// must go red (jitter: a line moved with no state change; reloj: a sky that reads the wall clock).
// Usage: node atlas/paleta_ciclo_gate.mjs   (env CHROME=/path/to/chrome to choose the browser)
import { spawnSync, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME || 'google-chrome';
const TIPO = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

const servidor = createServer(async (q, r) => {
  try {
    const p = join(RAIZ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    const cuerpo = await readFile(p);
    r.writeHead(200, { 'content-type': TIPO[extname(p)] || 'application/octet-stream' });
    r.end(cuerpo);
  } catch { r.writeHead(404); r.end(); }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + servidor.address().port;

// The check page writes its receipt into <pre id="recibo">; the browser dumps the DOM after its scripts ran.
function volcado(url) {
  return new Promise((res) => {
    execFile(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--virtual-time-budget=6000',
      '--dump-dom', url], { encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => res(stdout || ''));
  });
}
async function recibo(modo) {
  const url = base + '/atlas/paleta_ciclo_visual.html' + (modo === 'none' ? '' : '?sabotaje=' + modo);
  const out = await volcado(url);
  const m = /<pre id="recibo"[^>]*>([\s\S]*?)<\/pre>/.exec(out);
  assert.ok(m, modo + ': no receipt from the browser (is ' + CHROME + ' installed?)');
  const texto = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  if (texto.startsWith('ERROR')) { return { error: texto.trim() }; }
  return JSON.parse(texto);
}

let pasos = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pasos++; console.log('ok · ' + msg); };

try {
  // 1 · pure cases (node): the measured ends, the period, the match with the global map, reduced motion, sabotages.
  const casos = spawnSync(process.execPath, [join(RAIZ, 'atlas/puros/paleta_ciclo_casos.mjs')], { encoding: 'utf8' });
  assert.equal(casos.status, 0, 'pure cases failed:\n' + casos.stdout + casos.stderr);
  ok(true, 'pure cases: ' + (casos.stdout.match(/# pass \d+/) || ['pass ?'])[0]);

  // 2 · bitmap, clean: n=2 identical pixels in every scene, the reduced scene at noon, no error.
  const limpio = await recibo('none');
  ok(!limpio.error, 'clean run: no error in the browser ' + (limpio.error || ''));
  ok(limpio.n2 === true, 'clean run: two runs, same pixels (n=2)');
  ok(limpio.scenes.length === 7 && limpio.scenes.every((e) => e.igual), 'all 7 scenes identical across the two runs');
  ok(limpio.cielo[limpio.cielo.length - 1] === '0:#f4ebd0', 'reduced motion: the sky is the noon sky whatever the tick');

  // 3 · sabotage jitter: the detector must go red.
  const jitter = await recibo('jitter');
  ok(!jitter.error && jitter.n2 === false, 'sabotage jitter goes red: a bitmap changed without a state change');

  // 4 · sabotage reloj: a sky that reads the wall clock must move between the runs and go red.
  const reloj = await recibo('reloj');
  ok(!reloj.error && reloj.n2 === false, 'sabotage reloj goes red: a palette reading the wall clock is caught');


  console.log('\n' + pasos + ' passes · IC5 gate green');
} catch (e) {
  console.error('RED · ' + e.message);
  process.exitCode = 1;
} finally {
  servidor.close();
}
