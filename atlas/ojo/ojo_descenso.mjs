// Ojo del descenso: comprueba que una pagina dibujada por scroll es DETERMINISTA.
// Mismo scroll -> mismo fotograma (sha256 de los bytes PNG del viewport), tras recargar
// (Pase 2, de arriba abajo) y viniendo desde abajo (Pase 3, de abajo arriba).

// Salida: UNA linea JSON. rc=0 ok · rc=1 no determinista · rc=2 NO_DATA (Chrome, pagina o uso).
// Chrome por launchChrome (atlas/chrome_launch.mjs); CDP por WebSocket global de Node 22; sin dependencias.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { launchChrome } from '../chrome_launch.mjs';

const VISTA = { width: 412, height: 915 };
const PUERTO = 9600 + (process.pid % 300);
const DOBLE_RAF = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))';
// Quien hace scroll: el panel marcado [data-scroller] (A11Y, texto en panel propio) o, si no hay, el documento.
const SC = '(document.querySelector("[data-scroller]") || document.scrollingElement)';
const GEO = `(() => { const s = ${SC}, v = window.visualViewport; return { max: Math.max(0, s.scrollHeight - s.clientHeight), w: v ? v.width : window.innerWidth, h: v ? v.height : window.innerHeight }; })()`;
const EXPONE = '({ atlas: typeof window.AtlasDescenso !== "undefined", frame: !!window.AtlasDescenso && typeof window.AtlasDescenso.frame === "function" })';
const FRAME = `(() => { try { return JSON.stringify(window.AtlasDescenso.frame(${SC}.scrollTop)); } catch (e) { return "ERROR: " + e.message; } })()`;

const pasoScroll = (t) => `${SC}.scrollTo({ top: ${t}, left: 0, behavior: 'instant' }), ${DOBLE_RAF}`;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const enUnaLinea = (s, n = 600) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// Causa de NO_DATA: la pagina o Chrome no permiten medir. Sale con rc=2.
class NoData extends Error {}

// Pone plazo a una espera sin dejar temporizadores vivos.
function conTiempo(promesa, ms, causa) {
  let t;
  const corte = new Promise((_, rej) => { t = setTimeout(() => rej(new NoData(causa)), ms); });
  return Promise.race([promesa, corte]).finally(() => clearTimeout(t));
}

// Lee y valida los argumentos. Cualquier error de uso es NO_DATA (rc=2).
function leeArgs(argv) {
  const o = { url: null, t: null, n: 6, reduced: false, out: null };
  const valor = (i, flag) => {
    if (argv[i] === undefined) throw new NoData(`NO_DATA: uso incorrecto: falta valor para ${flag}`);
    return argv[i];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--reduced') o.reduced = true;
    else if (a === '--t') o.t = valor(++i, a).split(',').map(Number);
    else if (a === '--n') o.n = Number(valor(++i, a));
    else if (a === '--out') o.out = valor(++i, a);
    else if (a === '--sel') o.sel = valor(++i, a);
    else if (!a.startsWith('--') && o.url === null) o.url = a;
    else throw new NoData(`NO_DATA: uso incorrecto: argumento "${enUnaLinea(a, 80)}"`);
  }
  let u;
  try { u = new URL(o.url ?? ''); } catch { throw new NoData('NO_DATA: uso incorrecto: falta <url> absoluta'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new NoData(`NO_DATA: uso incorrecto: protocolo ${u.protocol} no admitido`);
  if (o.t && !o.t.every((x) => Number.isInteger(x) && x >= 0)) throw new NoData('NO_DATA: uso incorrecto: --t pide enteros >= 0 separados por comas');
  if (!Number.isInteger(o.n) || o.n < 2) throw new NoData('NO_DATA: uso incorrecto: --n pide un entero >= 2');
  return o;
}

// Posiciones t: las de --t, o --n repartidas de 0 al fondo (ambos incluidos).
// Decision mia (sin firma): ordenar y deduplicar, para que "de arriba abajo" sea literal.
function posiciones(max, a) {
  const crudas = a.t ?? Array.from({ length: a.n }, (_, i) => Math.round((i * max) / (a.n - 1)));
  return [...new Set(crudas)].sort((x, y) => x - y);
}

// Conexion CDP minima: comandos con id, esperas de eventos y estado HTTP del documento principal.
function abreCdp(wsUrl) {
  return new Promise((ok, mal) => {
    const ws = new WebSocket(wsUrl);
    const pend = new Map();
    const esperas = [];
    const doc = { status: null };
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
      for (const e of esperas.filter((x) => x.metodo === d.method)) {
        esperas.splice(esperas.indexOf(e), 1);
        e.ok(d.params);
      }
    });
    ws.addEventListener('open', () => ok({
      doc,
      cmd: (metodo, params = {}) => new Promise((res, rej) => {
        const id = ++seq;
        pend.set(id, { ok: res, mal: rej, metodo });
        ws.send(JSON.stringify({ id, method: metodo, params }));
      }),
      espera: (metodo) => new Promise((res) => esperas.push({ metodo, ok: res })),
      cerrar: () => ws.close(),
    }));
    ws.addEventListener('error', () => mal(new NoData('NO_DATA: WebSocket CDP no abre')));
    ws.addEventListener('close', () => {
      for (const p of pend.values()) p.mal(new NoData('NO_DATA: conexion CDP cerrada'));
      pend.clear();
    });
  });
}

// Espera a que Chrome publique su pestana en /json (como sin_undefined.mjs). Sin ella: NO_DATA con causa.
async function paginaCdp(chrome) {
  for (let i = 0; i < 80 && !chrome.failure(); i++) {
    await espera(250);
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
      const pag = lista.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pag) return pag.webSocketDebuggerUrl;
    } catch { /* Chrome aun no escucha */ }
  }
  throw new NoData(enUnaLinea(chrome.diagnostic()));
}

// Ejecuta una expresion en la pagina y devuelve su valor; una excepcion de la pagina es NO_DATA.
async function evalua(c, expresion) {
  const r = await c.cmd('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    const e = r.exceptionDetails;
    throw new NoData(`NO_DATA: excepcion en la pagina: ${enUnaLinea(e.exception?.description || e.text, 200)}`);
  }
  return r.result?.value;
}

// Navega o recarga; espera el evento load y dos rAF. Documento >= 400 o sin respuesta es NO_DATA.
async function cargaYDobleRaf(c, lanza, que) {
  c.doc.status = null;
  const carga = c.espera('Page.loadEventFired');
  const r = await lanza();
  if (r?.errorText) throw new NoData(`NO_DATA: ${que}: ${enUnaLinea(r.errorText, 200)}`);
  await conTiempo(carga, 20000, `NO_DATA: ${que}: sin evento load en 20 s`);

  await evalua(c, `(document.fonts && document.fonts.ready) ? document.fonts.ready.then(() => 1) : 1`);

  await evalua(c, `new Promise((r) => { let n = 0; const f = () => { const A = window.AtlasDescenso; const fr = A && A.frame ? A.frame(0) : null;
    if ((fr && !fr.cause) || ++n > 300) { r(1); } else { requestAnimationFrame(f); } }; f(); })`);
  await evalua(c, DOBLE_RAF);
  if (c.doc.status === null || c.doc.status >= 400) {
    throw new NoData(`NO_DATA: ${que}: documento HTTP ${c.doc.status ?? 'sin respuesta'}`);
  }
}

// Sin fotogramas declarados, la causa del NO_DATA dice si falta AtlasDescenso o solo su frame().
function sinFrame(expone) {
  return expone.atlas ? 'NO_DATA: page exposes no AtlasDescenso.frame' : 'NO_DATA: page exposes no AtlasDescenso';
}

// Una pasada: scroll a cada t, dos rAF y captura del viewport. Guarda el sha256 completo (para comparar)
// y sus 16 primeros hex (para mostrar); con AtlasDescenso.frame, el fotograma serializado y su motion.
async function pasada(c, ts, dirOut, conFrame) {
  const r = { completo: {}, hash: {}, serial: {}, motions: [] };
  for (const t of ts) {
    await evalua(c, pasoScroll(t));
    let clip = null;
    if (c.sel) {
      const q = await evalua(c, `(function(){var e=document.querySelector(${JSON.stringify(c.sel)}); if(!e) return null; var r=e.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height];})()`);

      if (!q || !(q[2] > 0 && q[3] > 0)) throw new NoData(`NO_DATA: --sel sin elemento visible: ${enUnaLinea(c.sel, 80)}`);
      clip = { x: q[0], y: q[1], width: q[2], height: q[3], scale: 1 };
    }

    const lienzo = c.sel ? await evalua(c, `(function(){var e=document.querySelector(${JSON.stringify(c.sel)}); return e && e.tagName === 'CANVAS' ? e.toDataURL('image/png').split(',')[1] : null;})()`) : null;
    const { data } = lienzo ? { data: lienzo } : await c.cmd('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
    const png = Buffer.from(data, 'base64');
    const sha = createHash('sha256').update(png).digest('hex');
    r.completo[t] = sha;
    r.hash[t] = sha.slice(0, 16);
    if (conFrame) {
      const s = await evalua(c, FRAME);
      if (typeof s !== 'string' || s.startsWith('ERROR:')) throw new NoData(`NO_DATA: AtlasDescenso.frame(): ${enUnaLinea(s ?? 'sin valor', 200)}`);
      r.serial[t] = s;
      r.motions.push(JSON.parse(s).motion);
    }
    if (dirOut) await writeFile(path.join(dirOut, `t${t}.png`), png);
  }
  return r;
}

// Mide: viewport movil 412x915, pase 1 (arriba abajo), recarga, pase 2 (arriba abajo), pase 3 (abajo arriba).
async function medir(c, a) {
  await c.cmd('Emulation.setDeviceMetricsOverride', { width: VISTA.width, height: VISTA.height, deviceScaleFactor: 1, mobile: true });

  await c.cmd('Emulation.setScrollbarsHidden', { hidden: true });
  await c.cmd('Network.enable');
  await c.cmd('Network.setBypassServiceWorker', { bypass: true });
  if (a.reduced) await c.cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.cmd('Page.enable');
  await cargaYDobleRaf(c, () => c.cmd('Page.navigate', { url: a.url }), 'navegacion');

  const geo = await evalua(c, GEO);
  if (geo.w !== VISTA.width || geo.h !== VISTA.height) {
    throw new NoData(`NO_DATA: viewport medido ${geo.w}x${geo.h}, no 412x915 (falta meta viewport?)`);
  }
  const ts = posiciones(geo.max, a);
  const expone = await evalua(c, EXPONE);
  const conFrame = expone.frame === true;
  if (a.out) await mkdir(a.out, { recursive: true });

  const p1 = await pasada(c, ts, a.out, conFrame);
  await cargaYDobleRaf(c, () => c.cmd('Page.reload', { ignoreCache: true }), 'recarga');
  const p2 = await pasada(c, ts, null, conFrame);
  const p3 = await pasada(c, [...ts].reverse(), null, conFrame);

  const recarga_igual = ts.every((t) => p2.completo[t] === p1.completo[t]);
  const direccion_igual = ts.every((t) => p3.completo[t] === p1.completo[t]);
  // Con --reduced y AtlasDescenso.frame presente, cada fotograma de cada pase debe declarar 'NO_DATA'.
  const estatico = a.reduced && conFrame
    ? [...p1.motions, ...p2.motions, ...p3.motions].every((m) => m === 'NO_DATA')
    : undefined;
  const ok = recarga_igual && direccion_igual && (estatico === undefined || estatico === true);
  const salida = {
    url: a.url, viewport: '412x915', reduced: a.reduced, t: ts, hash: p1.hash,
    recarga_igual, direccion_igual,
    serial: conFrame ? p1.serial : sinFrame(expone),
  };
  if (a.reduced) salida.estatico_declarado = conFrame ? estatico : sinFrame(expone);
  salida.ok = ok;
  return salida;
}

// Orquesta: argumentos, Chrome, CDP y medida. Cierra Chrome siempre, tambien en error.
async function principal() {
  let chrome = null;
  let c = null;
  try {
    const a = leeArgs(process.argv.slice(2));
    chrome = launchChrome(PUERTO);
    c = await abreCdp(await paginaCdp(chrome));
    c.sel = a.sel || null;
    const salida = await conTiempo(medir(c, a), 120000, 'NO_DATA: el ojo supera 120 s');
    return { rc: salida.ok ? 0 : 1, linea: JSON.stringify(salida) };
  } catch (e) {
    const causa = e instanceof NoData ? e.message : `NO_DATA: error inesperado: ${e.message}`;
    return { rc: 2, linea: enUnaLinea(causa) };
  } finally {
    c?.cerrar();
    if (chrome) await chrome.close();
  }
}

const resultado = await principal();
console.log(resultado.linea);
process.exitCode = resultado.rc;
