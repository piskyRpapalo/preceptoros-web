// Gate runner of the colony page (ODD isometric-colony, IC6). One command: the pure cases in node; then the bitmap gate
// in headless Chrome (two clean runs identical on every scene, reduced motion at noon); then the sabotages that must go
// red (jitter: a pixel moved with no state change; reloj: a sky that reads the wall clock); then the door itself:
// without a colony it must say NO_DATA with its cause, and with ?fixture=sintetica it must draw the colony, labelled.
// Usage: node atlas/colonia_pagina_gate.mjs   (env CHROME=/path/to/chrome to choose the browser)
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

// /atlas/* is served from atlas/, everything else from public/ (the door uses absolute /game/ and /openworld/ paths).
const servidor = createServer(async (q, r) => {
  try {
    const ruta0 = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    const ruta = ruta0.endsWith('/') ? ruta0 + 'index.html' : ruta0;
    const p = ruta.startsWith('/atlas/') ? join(RAIZ, ruta) : join(RAIZ, 'public', ruta);
    const cuerpo = await readFile(p);
    r.writeHead(200, { 'content-type': TIPO[extname(p)] || 'application/octet-stream' });
    r.end(cuerpo);
  } catch { r.writeHead(404); r.end(); }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + servidor.address().port;

function volcado(url) {
  return new Promise((res) => {
    execFile(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--virtual-time-budget=6000',
      '--dump-dom', url], { encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => res(stdout || ''));
  });
}
const decodifica = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function recibo(modo) {
  const out = await volcado(base + '/atlas/colonia_pagina_visual.html' + (modo === 'none' ? '' : '?sabotaje=' + modo));
  const m = /<pre id="recibo"[^>]*>([\s\S]*?)<\/pre>/.exec(out);
  assert.ok(m, modo + ': no receipt from the browser (is ' + CHROME + ' installed?)');
  const texto = decodifica(m[1]);
  return texto.startsWith('ERROR') ? { error: texto.trim() } : JSON.parse(texto);
}
async function puerta(query) {
  const out = await volcado(base + '/openworld/' + query);
  const m = /<p class="state" id="state"[^>]*>([\s\S]*?)<\/p>/.exec(out);
  assert.ok(m, 'door: no state line in the browser dump');
  return decodifica(m[1]);
}

let pasos = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pasos++; console.log('ok · ' + msg); };

try {
  const casos = spawnSync(process.execPath, [join(RAIZ, 'atlas/puros/colonia_pagina_casos.mjs')], { encoding: 'utf8' });
  assert.equal(casos.status, 0, 'pure cases failed:\n' + casos.stdout + casos.stderr);
  ok(true, 'pure cases: ' + (casos.stdout.match(/# pass \d+/) || ['pass ?'])[0]);

  const limpio = await recibo('none');
  ok(!limpio.error, 'clean run: no error in the browser ' + (limpio.error || ''));
  ok(limpio.n2 === true, 'clean run: two runs, same pixels (n=2)');
  ok(limpio.scenes.length === 6 && limpio.scenes.every((e) => e.igual), 'all 6 scenes identical across the two runs');
  ok(limpio.reducido_quieto === true, 'reduced motion: the sky stays at noon');

  const jitter = await recibo('jitter');
  ok(!jitter.error && jitter.n2 === false, 'sabotage jitter goes red: a pixel changed without a state change');

  const reloj = await recibo('reloj');
  ok(!reloj.error && reloj.n2 === false, 'sabotage reloj goes red: a sky reading the wall clock is caught');

  const sinColonia = await puerta('');
  // Newest state (MVP moderno, 2026-10-30): only the tutorial is LIVE; Beelink and Doggee are NO_DATA and hidden.
  ok(/Colony: 1 nodes · 1 buildings · 1 bots with faces/.test(sinColonia) && !/SYNTHETIC/.test(sinColonia), 'door, live state: the tutorial is the only LIVE node (' + sinColonia.slice(-90) + ')');

  const conFixture = await puerta('?fixture=sintetica');
  ok(/Colony: 9 nodes · 6 buildings · 9 bots with faces/.test(conFixture) && /SYNTHETIC fixture, not a live colony/.test(conFixture),
    'door, fixture: the colony is drawn, labelled SYNTHETIC (' + conFixture.slice(0, 80) + ')');

  // HUECO 1: the visitor reads one sentence per bot and per building under the picture.
  const frasesDe = async (query) => { const out = await volcado(base + '/openworld/' + query); const m = /<ul class="state" id="frases"[^>]*>([\s\S]*?)<\/ul>/.exec(out); return m ? (m[1].match(/<li>/g) || []).length : -1; };
  const nFrases = await frasesDe('?fixture=sintetica');
  ok(nFrases === 16, 'door, fixture: one visible sentence per bot, per building and for the walker (' + nFrases + ' of 16)');
  const joyDom = await volcado(base + '/openworld/?fixture=sintetica');
  // W-4/W-5: the six-direction grid and «enter node» are gone; the map is walked by click and by arrow keys.
  const grid = /<button type="button"[^>]*>(east|west|north-east|north-west|south-east|south-west|enter node)</.test(joyDom);
  ok(!grid && /id="joy"/.test(joyDom), 'door: no six-direction grid and no enter node button; the status line stays');

  console.log('\n' + pasos + ' passes · IC6 gate green');
} catch (e) {
  console.error('RED · ' + e.message);
  process.exitCode = 1;
} finally {
  servidor.close();
}
