// Gate runner of the global map (ODD isometric-colony, NODO-MAPA). One command: the pure cases in node, then the
// bitmap gate in headless Chrome, once clean (n=2 byte-identical) and twice sabotaged. Each sabotage must go red:
//   jitter  · a line width moved with no state change → the hash detector must report n2 = false
//   clave   · a visible node without its lexicon key   → the page must refuse it as orphan_visual_node
// Usage: node atlas/global_map_gate.mjs   (env CHROME=/path/to/chrome to choose the browser)
import { spawnSync, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
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
// Async on purpose: the static server above lives in this process and must keep answering the browser.
function volcado(url) {
  return new Promise((res) => {
    execFile(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--virtual-time-budget=6000',
      '--dump-dom', url], { encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => res(stdout || ''));
  });
}
async function recibo(modo) {
  const url = base + '/atlas/global_map_visual.html' + (modo === 'none' ? '' : '?sabotaje=' + modo);
  const out = await volcado(url);
  const m = /<pre id="recibo"[^>]*>([\s\S]*?)<\/pre>/.exec(out);
  assert.ok(m, modo + ': no receipt from the browser (is ' + CHROME + ' installed?)');
  const texto = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (texto.startsWith('ERROR')) { return { error: texto.trim() }; }
  return JSON.parse(texto);
}

let pasos = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pasos++; console.log('ok · ' + msg); };

try {
  // 1 · pure cases (node): liveness, orphan refusal, frame size, palette from t, n=2, detector, grep.
  const casos = spawnSync(process.execPath, [join(RAIZ, 'atlas/global_map_casos.mjs')], { encoding: 'utf8' });
  assert.equal(casos.status, 0, 'pure cases failed:\n' + casos.stdout + casos.stderr);
  ok(true, casos.stdout.trim());

  // 2 · bitmap, clean: n=2 identical pixels in every scene, no errors.
  const limpio = await recibo('none');
  ok(!limpio.error && limpio.n2 === true, 'clean run: two runs, same pixels (n=2)');
  ok(limpio.scenes.length === 8 && limpio.scenes.every((e) => e.igual), 'all 8 scenes identical across the two runs');
  ok(Array.isArray(limpio.errores) && limpio.errores.length === 0, 'clean run: no refused node');

  // 3 · sabotage jitter: the detector must go red (n2 false, every scene reported).
  const jitter = await recibo('jitter');
  ok(!jitter.error && jitter.n2 === false, 'sabotage jitter goes red: a bitmap changed without a state change');

  // 4 · sabotage clave: a visible node without its lexicon key is refused as orphan_visual_node.
  const clave = await recibo('clave');
  ok(clave.error && /orphan_visual_node/.test(clave.error), 'sabotage clave goes red: ' + (clave.error || 'no error'));

  await writeFile(join(RAIZ, 'atlas/global_map_recibos.json'),
    JSON.stringify({ gate: 'mapa-global', pasos_casos: 'see stdout', limpio, jitter, clave }, null, 1) + '\n');
  console.log('mapa global gate: ' + pasos + ' checks ok · receipts in atlas/global_map_recibos.json');
} finally {
  servidor.close();
}
