// Ojo de palabras: pinta en Chrome headless (solo 127.0.0.1) las palabras `bust` y `crab` de la lengua de
// burbuja y las secciones de codex y bout (fixture atlas/ojo/fixtures/palabras.html). Saca un PNG
// y su sha256 por lienzo, recarga la pagina y compara: el dibujo debe ser DETERMINISTA.
// Uso: node atlas/ojo/ojo_palabras.mjs --out DIR [--fixture RUTA]   (RUTA relativa a la raiz del repo)
// Salida: UNA linea JSON {ok, recarga_igual, n, hash, causas}. rc=0 si ok && recarga_igual && n>=1 ·
// rc=1 si algun hash difiere tras recargar · rc=2 NO_DATA (Chrome, pagina o uso), causa en una linea.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from '../chrome_launch.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURE = 'atlas/ojo/fixtures/palabras.html';
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
};
const PNG_PREFIJO = 'data:image/png;base64,';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const enUnaLinea = (s, n = 600) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// Causa de NO_DATA: la pagina o Chrome no permiten medir. Sale con rc=2.
class NoData extends Error {}

// Plazo a una espera sin dejar temporizadores vivos.
function conTiempo(promesa, ms, causa) {
  let t;
  const corte = new Promise((_, rej) => { t = setTimeout(() => rej(new NoData(causa)), ms); });
  return Promise.race([promesa, corte]).finally(() => clearTimeout(t));
}

// Cierres pendientes (CDP, Chrome, servidor). Corren al terminar y ante SIGTERM/SIGINT: si el proceso
// muere por senal el finally no corre, y Chrome queda huerfano (visto con ojo_descenso). Decision mia (sin firma).
const cierres = new Set();
async function cierraTodo() {
  for (const f of [...cierres].reverse()) {
    if (!cierres.delete(f)) continue;
    await Promise.resolve().then(f).catch(() => {});
  }
}
for (const [senal, rc] of [['SIGTERM', 143], ['SIGINT', 130]]) {
  process.once(senal, () => { cierraTodo().finally(() => process.exit(rc)); });
}

// Lee los argumentos. Cualquier error de uso es NO_DATA (rc=2).
function leeArgs(argv) {
  const o = { out: null, fixture: FIXTURE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '--fixture') {
      if (argv[i + 1] === undefined) throw new NoData(`NO_DATA: uso incorrecto: falta valor para ${a}`);
      o[a.slice(2)] = argv[++i];
    } else throw new NoData(`NO_DATA: uso incorrecto: argumento "${enUnaLinea(a, 80)}"`);
  }
  if (!o.out) throw new NoData('NO_DATA: uso incorrecto: falta --out DIR');
  const abs = path.resolve(RAIZ, o.fixture);
  if (!abs.startsWith(RAIZ + path.sep)) throw new NoData(`NO_DATA: uso incorrecto: fixture fuera de la raiz: ${enUnaLinea(o.fixture, 80)}`);
  return { out: path.resolve(o.out), ruta: path.relative(RAIZ, abs).split(path.sep).join('/') };
}

// Servidor estatico propio: solo GET, solo bajo RAIZ (fuera -> 403), sin listados, sin ficheros con punto
// (.git, .env: decision mia, sin firma). Puerto 0: el SO elige.
function sirve() {
  const srv = createServer((req, res) => {
    const fin = (code, msg) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(msg); };
    if (req.method !== 'GET') return fin(405, 'solo GET');
    let ruta;
    try { ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch { return fin(400, 'ruta invalida'); }
    const abs = path.resolve(RAIZ, '.' + ruta);
    if (abs !== RAIZ && !abs.startsWith(RAIZ + path.sep)) return fin(403, 'fuera de la raiz');
    if (ruta.includes('\0') || path.relative(RAIZ, abs).split(path.sep).some((s) => s.startsWith('.'))) return fin(404, 'no existe');
    // Un directorio tambien falla en readFile (EISDIR): sin listados.
    readFile(abs).then((buf) => {
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(abs).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(buf);
    }, () => fin(404, 'no existe'));
  });
  return new Promise((ok, mal) => {
    srv.once('error', mal);
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

// Puerto de depuracion de Chrome: efimero, elegido por el SO (launchChrome no acepta el 0). Decision mia (sin firma).
function puertoLibre() {
  const s = net.createServer();
  return new Promise((ok, mal) => {
    s.once('error', mal);
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
  });
}

// Conexion CDP minima: comandos con id, espera de un evento y estado HTTP del documento principal.
function abreCdp(wsUrl) {
  return new Promise((ok, mal) => {
    const ws = new WebSocket(wsUrl);
    const pend = new Map(), esperas = [], doc = { status: null };
    let seq = 0;
    ws.addEventListener('message', (m) => {
      const d = JSON.parse(m.data);
      if (d.id !== undefined && pend.has(d.id)) {
        const p = pend.get(d.id);
        pend.delete(d.id);
        if (d.error) p.mal(new NoData(`NO_DATA: CDP ${p.metodo}: ${enUnaLinea(d.error.message, 200)}`));
        else p.ok(d.result ?? {});
        return;
      }
      if (d.method === 'Network.responseReceived' && d.params.type === 'Document') doc.status = d.params.response.status;
      for (const e of esperas.filter((x) => x.metodo === d.method)) { esperas.splice(esperas.indexOf(e), 1); e.ok(d.params); }
    });
    ws.addEventListener('open', () => ok({
      doc,
      cmd: (metodo, params = {}) => new Promise((res, rej) => {
        const id = ++seq;
        pend.set(id, { ok: res, mal: rej, metodo });
        ws.send(JSON.stringify({ id, method: metodo, params }));
      }),
      evento: (metodo) => new Promise((res) => esperas.push({ metodo, ok: res })),
      cerrar: () => ws.close(),
    }));
    ws.addEventListener('error', () => mal(new NoData('NO_DATA: WebSocket CDP no abre')));
    ws.addEventListener('close', () => {
      for (const p of pend.values()) p.mal(new NoData('NO_DATA: conexion CDP cerrada'));
      pend.clear();
    });
  });
}

// Espera a que Chrome publique su pestana en /json. Sin ella: NO_DATA con la causa de Chrome.
async function paginaCdp(chrome, puerto) {
  for (let i = 0; i < 80 && !chrome.failure(); i++) {
    await espera(250);
    try {
      const lista = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json();
      const pag = lista.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pag) return pag.webSocketDebuggerUrl;
    } catch { /* Chrome aun no escucha */ }
  }
  throw new NoData(enUnaLinea(chrome.diagnostic()));
}

// Ejecuta una expresion en la pagina; una excepcion de la pagina es NO_DATA.
async function evalua(c, expresion) {
  const r = await c.cmd('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    const e = r.exceptionDetails;
    throw new NoData(`NO_DATA: excepcion en la pagina: ${enUnaLinea(e.exception?.description || e.text, 200)}`);
  }
  return r.result?.value;
}

// Navega o recarga y espera el evento load. Documento >= 400 o sin respuesta es NO_DATA.
async function carga(c, lanza, que) {
  c.doc.status = null;
  const fin = c.evento('Page.loadEventFired');
  const r = await lanza();
  if (r?.errorText) throw new NoData(`NO_DATA: ${que}: ${enUnaLinea(r.errorText, 200)}`);
  await conTiempo(fin, 20000, `NO_DATA: ${que}: sin evento load en 20 s`);
  if (c.doc.status === null || c.doc.status >= 400) {
    throw new NoData(`NO_DATA: ${que}: documento HTTP ${c.doc.status ?? 'sin respuesta'}`);
  }
}

// Lee window.__palabras (hasta 20 s) y, por cada lienzo, su PNG: sha256 completo; con dir, tambien el fichero.
async function lee(c, dir) {
  let P = null;
  for (let i = 0; i < 80 && !P; i++) {
    P = await evalua(c, `(() => { const P = window.__palabras; return P && typeof P === 'object'
      ? { ok: P.ok === true, lienzos: P.lienzos || [], causas: P.causas || [] } : null; })()`);
    if (!P) await espera(250);
  }
  if (!P) throw new NoData('NO_DATA: window.__palabras ausente tras 20 s');
  if (!P.ok) throw new NoData(`NO_DATA: __palabras.ok false: ${enUnaLinea(P.causas.join(' | '), 400)}`);
  if (!P.lienzos.length) throw new NoData(`NO_DATA: sin lienzos pintados: ${enUnaLinea(P.causas.join(' | '), 400)}`);
  const datos = await evalua(c, `(() => { const o = {}; for (const id of ${JSON.stringify(P.lienzos)}) {
    const e = document.getElementById('c-' + id); o[id] = e ? e.toDataURL('image/png') : null; } return o; })()`);
  const completo = {}, hash = {};
  for (const id of P.lienzos) {
    const url = datos[id];
    if (typeof url !== 'string' || !url.startsWith(PNG_PREFIJO)) throw new NoData(`NO_DATA: lienzo c-${id} no es un PNG`);
    const png = Buffer.from(url.slice(PNG_PREFIJO.length), 'base64');
    const sha = createHash('sha256').update(png).digest('hex');
    completo[id] = sha;
    hash[id] = sha.slice(0, 16);
    if (dir) await writeFile(path.join(dir, `${id.replace(/[^\w-]/g, '_')}.png`), png);
  }
  return { completo, hash, causas: P.causas };
}

// Pasada 1 (con PNG), recarga y pasada 2: los mismos hashes en ambas = determinista.
async function medir(c, url, out) {
  await c.cmd('Emulation.setDeviceMetricsOverride', { width: 412, height: 515, deviceScaleFactor: 1, mobile: false });
  await c.cmd('Network.enable');
  await c.cmd('Page.enable');
  await mkdir(out, { recursive: true });
  await carga(c, () => c.cmd('Page.navigate', { url }), 'navegacion');
  const p1 = await lee(c, out);
  await carga(c, () => c.cmd('Page.reload', { ignoreCache: true }), 'recarga');
  const p2 = await lee(c, null);
  const ids = Object.keys(p1.completo);
  const recarga_igual = ids.length === Object.keys(p2.completo).length && ids.every((id) => p2.completo[id] === p1.completo[id]);
  return { ok: recarga_igual && ids.length >= 1, recarga_igual, n: ids.length, hash: p1.hash, causas: p1.causas };
}

// Orquesta: argumentos, servidor, Chrome, CDP y medida. Cierra todo siempre, tambien en error.
async function principal() {
  try {
    const a = leeArgs(process.argv.slice(2));
    const srv = await sirve();
    cierres.add(() => { srv.closeAllConnections(); return new Promise((r) => srv.close(r)); });
    const puerto = await puertoLibre();
    const chrome = launchChrome(puerto);
    cierres.add(() => chrome.close());
    const c = await abreCdp(await paginaCdp(chrome, puerto));
    cierres.add(() => c.cerrar());
    const salida = await conTiempo(medir(c, `http://127.0.0.1:${srv.address().port}/${a.ruta}`, a.out),
      120000, 'NO_DATA: el ojo supera 120 s');
    return { rc: salida.ok ? 0 : 1, linea: JSON.stringify(salida) };
  } catch (e) {
    const causa = e instanceof NoData ? e.message : `NO_DATA: error inesperado: ${e.message}`;
    return { rc: 2, linea: enUnaLinea(causa) };
  } finally {
    await cierraTodo();
  }
}

const resultado = await principal();
console.log(resultado.linea);
process.exitCode = resultado.rc;
