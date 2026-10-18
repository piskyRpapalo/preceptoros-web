// mar_rift · pintor de tesela estilo rift (decision mia, sin firma): exporta solo {textura, niebla}; colores solo desde AtlasComicTokens.NEUTRAL; lecho desde AtlasMarFondo.lecho (si falta, sustituto marcado en la medida).
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const RUTA = (p) => fileURLToPath(new URL('../public/game/' + p, import.meta.url));
const FUENTE_RIFT = (() => { try { return readFileSync(RUTA('mar_rift.js'), 'utf8'); } catch (e) { return null; } })();
const CASOS = [];
const caso = (n, nombre, f) => {
  let r;
  try { r = f(); } catch (e) { r = { error: String(e).slice(0, 200) }; }
  const ok = r === true || (r && r.ok === true);
  const medida = r === true ? '' : (r && 'medida' in r ? r.medida : r);
  CASOS.push({ caso: n, nombre, ok, medida: ok ? (medida || '') : medida });
};

const DOC = {
  createElement: () => {
    const c = { width: 0, height: 0, datos: null };
    c.getContext = () => ({
      createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (im) => { c.datos = im.data; },
    });
    return c;
  },
};

const LECHO_SUSTITUTO = function (x, y, E) {
  var cx = Math.floor(x / 320), cy = Math.floor(y / 280), px = x / 320 - cx, py = y / 280 - cy;
  var hx = E.hash(cx, cy, 71), hy = E.hash(cx, cy, 97), rx = 0.22 + E.hash(cx, cy, 131) * 0.13;
  var ry = 0.2 + E.hash(cx, cy, 173) * 0.12, dx = (px - 0.25 - hx * 0.5) / rx, dy = (py - 0.25 - hy * 0.5) / ry;
  var d = dx * dx + dy * dy, r = Math.max(0, Math.min(1, (1.18 - d) * 1.35));
  return r * r * (3 - 2 * r);
};

function aRgbTest(s) {
  if (s.indexOf('(') > 0) { return s.match(/\d+/g).slice(0, 3).map(Number); }
  const h = s.replace('#', '');
  return [0, 2, 4].map((k) => parseInt(h.substr(k, 2), 16));
}

function cargar(sustituciones = {}, conLecho = true) {
  const ctx = { document: DOC };
  createContext(ctx);
  const ficheros = ['tabla_semantica.js', 'comic_tokens.js', 'escena.js', 'mar-fondo.js', 'mar_rift.js'];
  for (const f of ficheros) {
    let src = readFileSync(RUTA(f), 'utf8');
    if (sustituciones[f]) {
      const [de, a] = sustituciones[f];
      if (src.split(de).length !== 2) { throw new Error('sustitucion no unica en ' + f); }
      src = src.replace(de, a);
    }
    runInContext(src, ctx, { filename: f });
    if (f === 'mar-fondo.js' && conLecho && typeof ctx.AtlasMarFondo.lecho !== 'function') {
      ctx.AtlasMarFondo.lecho = LECHO_SUSTITUTO;
      ctx.__lechoSustituto = true;
    }
  }
  ctx.__ok_sustituto = !!ctx.__lechoSustituto;
  return ctx;
}

function paletaTest(ctx) {
  const N = ctx.AtlasComicTokens.NEUTRAL;
  return { ocean: aRgbTest(N.ocean), cyan: aRgbTest(N.cyan), ink: aRgbTest(N.ink) };
}

function teselaBytes(ctx, i, j) {
  const E = ctx.AtlasEscena;
  const c = ctx.AtlasMarRift.textura(E, i, j, 60, DOC);
  return c.datos;
}

function pixeles(datos) {
  const out = [];
  for (let k = 0; k < datos.length; k += 4) { out.push([datos[k], datos[k + 1], datos[k + 2], datos[k + 3]]); }
  return out;
}

const TESELAS = [[0, 0], [1, 0], [0, 1], [3, -2], [-2, 5]];

caso(1, 'existe, <= 16384 B, sin comentarios, sin Math.random/Date/fetch/localStorage, sin literales de color', () => {
  if (FUENTE_RIFT === null) { return { ok: false, medida: 'mar_rift.js NO existe' }; }
  const bytes = Buffer.byteLength(FUENTE_RIFT, 'utf8');
  const malos = [];
  if (bytes > 16384) { malos.push('tamano ' + bytes); }
  if (/\/\/|\/\*/.test(FUENTE_RIFT)) { malos.push('comentario'); }
  if (/Math\.random|\bDate\b|\bfetch\b|localStorage/.test(FUENTE_RIFT)) { malos.push('impuro'); }
  if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(FUENTE_RIFT)) { malos.push('literal color'); }
  if (/\[\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\]/.test(FUENTE_RIFT)) { malos.push('array de color'); }
  return malos.length === 0 ? true : { ok: false, medida: { bytes, malos } };
});

caso(2, 'exporta exactamente {textura, niebla}; niebla = ink en [r,g,b]', () => {
  const ctx = cargar();
  const M = ctx.AtlasMarRift;
  const claves = Object.keys(M).sort();
  const tipo = typeof M.textura;
  const ink = paletaTest(ctx).ink;
  const niebla = M.niebla;
  const ok = claves.join(',') === 'niebla,textura' && tipo === 'function' && Array.isArray(niebla) &&
    niebla.length === 3 && niebla.every((v, k) => v === ink[k]);
  return ok ? true : { ok: false, medida: { claves, tipo, niebla, ink } };
});

caso(3, 'determinismo: misma tesela da los mismos bytes', () => {
  const ctxA = cargar();
  const ctxB = cargar();
  const malos = [];
  for (const [i, j] of [[2, -1], [0, 0], [5, 3]]) {
    const a = Buffer.from(teselaBytes(ctxA, i, j)).toString('hex');
    const b = Buffer.from(teselaBytes(ctxB, i, j)).toString('hex');
    const c = Buffer.from(teselaBytes(ctxA, i, j)).toString('hex');
    if (a !== b || a !== c) { malos.push([i, j]); }
  }
  return malos.length === 0 ? true : { ok: false, medida: { malos } };
});

caso(4, 'paleta cerrada: cada pixel es ocean, cyan o ink', () => {
  const ctx = cargar();
  const pal = paletaTest(ctx);
  const permitidos = [pal.ocean, pal.cyan, pal.ink].map((c) => c.join(','));
  const fuera = [];
  let total = 0;
  for (const [i, j] of TESELAS) {
    for (const p of pixeles(teselaBytes(ctx, i, j))) {
      total++;
      if (p[3] !== 255 || !permitidos.includes(p.slice(0, 3).join(','))) { fuera.push([i, j, p.join(',')]); }
    }
  }
  return fuera.length === 0 ? true : { ok: false, medida: { total, fuera: fuera.slice(0, 5), n: fuera.length } };
});

caso(5, 'sabotaje: cambiar NEUTRAL.cyan cambia los pixeles cyan', () => {
  const tok = readFileSync(RUTA('comic_tokens.js'), 'utf8');
  const ctx = cargar({ 'comic_tokens.js': ["'#00D2FF'", "'#123456'"] });
  const colores = new Set(pixeles(teselaBytes(ctx, 0, 0)).map((p) => p.slice(0, 3).join(',')));
  const nuevo = '18,52,86';
  const viejo = '0,210,255';
  const ok = tok.includes("'#00D2FF'") && colores.has(nuevo) && !colores.has(viejo);
  return ok ? true : { ok: false, medida: { tiene_nuevo: colores.has(nuevo), tiene_viejo: colores.has(viejo), colores: [...colores] } };
});

caso(6, 'trama: proporcion de pixeles cyan entre 2 % y 60 % por tesela', () => {
  const ctx = cargar();
  const cyan = paletaTest(ctx).cyan.join(',');
  const fracciones = [[0, 0], [1, 1], [2, -1]].map(([i, j]) => {
    const px = pixeles(teselaBytes(ctx, i, j));
    return px.filter((p) => p.slice(0, 3).join(',') === cyan).length / px.length;
  });
  const ok = fracciones.every((f) => f >= 0.02 && f <= 0.6);
  return ok ? true : { ok: false, medida: { fracciones } };
});

const ok = CASOS.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: CASOS }));
process.exitCode = ok ? 0 : 1;
