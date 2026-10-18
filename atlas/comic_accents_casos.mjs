// Casos de los acentos firmados del comic (public/game/comic_accents.js).
// Se escriben ANTES que el modulo: rojo primero. Imprime UNA linea JSON
// {ok, casos:[{caso, nombre, ok, medida?}]} y sale con rc=0 solo si todos pasan.
// Comentarios en espanol; API en ingles.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const RUTA_FUENTE = new URL('../public/game/comic_accents.js', import.meta.url);

// Los dos literales firmados (r220) son los unicos colores permitidos en el modulo.
const ESPERADO = Object.freeze({ vermilion: '#E63946', 'comic yellow': '#FFB702' });
const PERMITIDOS = new Set(Object.values(ESPERADO));
const PROHIBIDAS = ['document', 'Date', 'Math.random', 'fetch', 'localStorage'];
// Literal de color: hex de 3 a 8 digitos, o la forma funcional rgb/hsl.
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/g;

// Pureza del fuente: palabras prohibidas y literales de color que no son los firmados.
function purezaDe(fuente) {
  const hallazgos = PROHIBIDAS.filter((p) => fuente.includes(p));
  for (const m of fuente.matchAll(COLOR)) {
    if (!PERMITIDOS.has(m[0])) hallazgos.push(m[0]);
  }
  return hallazgos;
}

function leerFuente() {
  try {
    return readFileSync(RUTA_FUENTE, 'utf8');
  } catch {
    return null;
  }
}

// Carga tolerante: si falta un modulo, su caso falla con la causa y el script sigue.
function cargar(ruta) {
  try {
    return { v: req(ruta) };
  } catch (e) {
    return { error: e.code || e.message };
  }
}

const modulo = cargar('../public/game/comic_accents.js');
const tokens = cargar('../public/game/comic_tokens.js');
const radio = cargar('../public/game/aiact-art50-state-radio.js');
const sinModulo = (m) => ({ ok: false, medida: 'sin modulo: ' + m.error });

// 1. Las dos claves exactas, congelado y los dos bases firmados.
function caso1() {
  if (!modulo.v) return sinModulo(modulo);
  const A = modulo.v.ACCENTS;
  const claves = Object.keys(A).sort();
  const congelado = [A, A.vermilion, A['comic yellow'], A.vermilion.bands, A['comic yellow'].bands]
    .every(Object.isFrozen);
  const ok = JSON.stringify(claves) === JSON.stringify(['comic yellow', 'vermilion'])
    && congelado
    && A.vermilion.bands.base === ESPERADO.vermilion
    && A['comic yellow'].bands.base === ESPERADO['comic yellow'];
  return { ok, medida: `claves=${claves.join(' | ')} base=${A.vermilion.bands.base} ${A['comic yellow'].bands.base}` };
}

// 2. Texto: label igual a la clave y use no vacio.
function caso2() {
  if (!modulo.v) return sinModulo(modulo);
  const A = modulo.v.ACCENTS;
  const partes = Object.keys(A).map((k) => {
    const a = A[k];
    const bien = a.label === k && typeof a.use === 'string' && a.use.trim() !== '';
    return `${k}:${bien ? 'ok' : 'FALLA'}`;
  });
  return { ok: partes.length === 2 && partes.every((p) => p.endsWith(':ok')), medida: partes.join(' ') };
}

// 3. Vara: cada ratio coincide con contrast() recalculado y es >= 3 (texto grande).
function caso3() {
  if (!modulo.v) return sinModulo(modulo);
  if (!tokens.v) return sinModulo(tokens);
  const A = modulo.v.ACCENTS;
  const contrast = modulo.v.contrast;
  const NEUTRAL = tokens.v.NEUTRAL;
  // Calibracion de contrast(): negro contra blanco es 21:1, y el rgb del ocean se parsea.
  const calibracion = [contrast('#000000', '#FFFFFF'), contrast('#FFFFFF', 'rgb(0,0,0)')];
  let ok = calibracion.every((x) => Math.abs(x - 21) < 1e-9);
  const esperadoVara = { vermilion: ['ocean', 'paper'], 'comic yellow': ['ink', 'ocean'] };
  const medidas = [];
  for (const k of Object.keys(esperadoVara)) {
    const vara = A[k].vara;
    ok = ok && JSON.stringify(vara.map((e) => e.against).sort()) === JSON.stringify(esperadoVara[k]);
    for (const e of vara) {
      const recalculado = Math.round(contrast(A[k].bands.base, NEUTRAL[e.against]) * 100) / 100;
      ok = ok && e.ratio === recalculado && e.ratio >= 3;
      medidas.push(`${k}/${e.against}=${e.ratio}`);
    }
  }
  return { ok, medida: `calibracion=${calibracion.map((x) => x.toFixed(2)).join('/')} ${medidas.join(' ')}` };
}

// 4. Sonido: cada sound resuelve con AtlasRadio.nota(g, o) a un numero finito, y words no vacio.
function caso4() {
  if (!modulo.v) return sinModulo(modulo);
  if (!radio.v || typeof radio.v.nota !== 'function') {
    return { ok: false, medida: 'sin AtlasRadio.nota: ' + (radio.error || 'falta nota()') };
  }
  const A = modulo.v.ACCENTS;
  const esperado = {
    vermilion: { g: 1, o: 0, words: 'one soft low bell' },
    'comic yellow': { g: 3, o: 1, words: 'one warm bell' },
  };
  let ok = true;
  const medidas = [];
  for (const k of Object.keys(esperado)) {
    const s = A[k].sound;
    const e = esperado[k];
    const hz = radio.v.nota(s.g, s.o);
    ok = ok && s.g === e.g && s.o === e.o && s.words === e.words
      && typeof hz === 'number' && Number.isFinite(hz) && s.words.trim() !== '';
    medidas.push(`${k} g${s.g} o${s.o}=${hz}Hz`);
  }
  return { ok, medida: medidas.join('; ') };
}

// 5. param_gate reconoce las bandas de los dos acentos, apuntan a sus literales, sin colision.
async function caso5() {
  const pg = await import('../atlas/param_gate.mjs');
  const { porNombre, porLiteral } = pg.bandNames(); // lanza si hay colision de literal
  const bandas = ['brillo', 'base', 'sombra', 'contorno'];
  const faltan = [];
  for (const k of Object.keys(ESPERADO)) {
    for (const b of bandas) {
      if (!porNombre.has(`${k}.${b}`)) faltan.push(`${k}.${b}`);
    }
  }
  const apuntan = porNombre.get('vermilion.base') === ESPERADO.vermilion
    && porNombre.get('comic yellow.base') === ESPERADO['comic yellow']
    && porLiteral.get('#e63946') === 'vermilion.base'
    && porLiteral.get('#ffb702') === 'comic yellow.base';
  const sinColision = porLiteral.size === porNombre.size;
  return {
    ok: faltan.length === 0 && apuntan && sinColision,
    medida: `faltan=[${faltan.join(',')}] apuntan=${apuntan} sinColision=${sinColision}`,
  };
}

// 6. Pureza del fuente: sin palabras prohibidas ni literales de color ajenos.
function caso6() {
  const fuente = leerFuente();
  if (fuente === null) return { ok: false, medida: 'sin fuente: public/game/comic_accents.js no existe' };
  const h = purezaDe(fuente);
  return { ok: h.length === 0, medida: h.length ? 'violaciones: ' + h.join(' ') : 'sin violaciones' };
}

// 7. Sabotaje: una copia en memoria con un tercer literal debe fallar la pureza (caza el caso 6).
function caso7() {
  const fuente = leerFuente();
  if (fuente === null) return { ok: false, medida: 'sin fuente que sabotear' };
  const sabotaje = fuente + "\nconst SABOTAJE = '#123456';\n";
  const cazado = purezaDe(sabotaje).includes('#123456');
  return { ok: cazado, medida: cazado ? 'cazado: #123456' : 'NO cazado' };
}

const pruebas = [
  [1, 'claves exactas y bases firmadas', caso1],
  [2, 'label y use no vacios', caso2],
  [3, 'vara WCAG recalculada y >= 3', caso3],
  [4, 'sonido resuelve a Hz con AtlasRadio.nota', caso4],
  [5, 'param_gate reconoce las bandas sin colision', caso5],
  [6, 'pureza del fuente', caso6],
  [7, 'sabotaje: el caso 6 caza un tercer literal', caso7],
];

const casos = [];
for (const [caso, nombre, fn] of pruebas) {
  let r;
  try {
    r = await fn();
  } catch (e) {
    r = { ok: false, medida: 'excepcion: ' + (e.code || e.message) };
  }
  casos.push({ caso, nombre, ok: r.ok === true, medida: r.medida });
}
const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
