// Ficha de lenguaje (VT8): la matematica de cada pieza VT1-VT6 sin su piel.
// Modulo ES puro: sin fs, sin Date, sin Math.random, sin fetch, sin localStorage, sin node:crypto.
// Las fichas se comparan por su forma canonica (canonica()), no por hash.
// Las mesuras salen de public/dictionary.json (entry.glyph y entry.semiotica), nunca de aqui.

export const V = 'preceptoros.ficha/1';

// Catalogo congelado de las seis piezas medidas (decision del preceptor, copiado tal cual).
export const PIEZAS = Object.freeze({
  VT1: Object.freeze({ id: 'C24', vara: 'node atlas/ventana_casos.mjs' }),
  VT2: Object.freeze({ id: 'A4', vara: 'node atlas/place_card_casos.mjs' }),
  VT3: Object.freeze({ id: 'A7', vara: 'node atlas/duelo_casos.mjs' }),
  VT4: Object.freeze({ id: 'A6', vara: 'node atlas/taller_casos.mjs' }),
  VT5: Object.freeze({ id: 'C23', vara: 'node atlas/tutorial_casos.mjs' }),
  VT6: Object.freeze({ id: 'C28', vara: 'node atlas/chrome_launch_cases.mjs' }),
});

export const SELLOS = Object.freeze(['MEDIDO', 'LIVE', 'EMULADO', 'SIMULATED', 'STALE', 'NO_DATA']);

// Vocablos de AGENTS.md:11 y sus formas inglesas. Busqueda sin mayusculas, por palabra.
export const PROHIBIDOS = Object.freeze([
  'oraculo', 'notario', 'depin', 'token', 'tokens', 'moneda', 'clearing', 'magia',
  'oracle', 'notary', 'currency', 'magic',
]);
const RE_PROHIBIDOS = new RegExp('\\b(' + PROHIBIDOS.join('|') + ')\\b', 'i');

// Lista cerrada de claves de una ficha, en orden.
export const MATEMATICA = Object.freeze(['v', 'pieza', 'mundo', 'id', 'mesura', 'vara', 'sello', 'causa', 'texto', 'sonido_hz']);

const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// Mesura de una entrada del diccionario: glyph + trazo, movimiento, onda_hz.
function mesuraDe(entry) {
  return {
    glyph: [...entry.glyph],
    trazo: entry.semiotica.trazo,
    movimiento: entry.semiotica.movimiento,
    onda_hz: [...entry.semiotica.onda_hz],
  };
}

function entradaDe(dic, id) {
  return dic.entries.find((e) => e.id_interno === id);
}

// Construye la ficha de una pieza sobre un mundo. Lanza si la pieza o el id no existen.
export function ficha(pieza, dic, { mundo, sello, causa = null } = {}) {
  if (!tiene(PIEZAS, pieza)) throw new Error('ficha: pieza fuera de PIEZAS: ' + pieza);
  const p = PIEZAS[pieza];
  const entry = entradaDe(dic, p.id);
  if (!entry) throw new Error('ficha: el id ' + p.id + ' no esta en el diccionario');
  return {
    v: V,
    pieza,
    mundo,
    id: p.id,
    mesura: mesuraDe(entry),
    vara: p.vara,
    sello,
    causa,
    texto: entry.nombre_juego + ': ' + entry.estandar_humano,
    sonido_hz: entry.semiotica.onda_hz[0],
  };
}

// Descarta la piel: objeto nuevo con solo las claves de MATEMATICA, en ese orden.
export function quitaPiel(obj) {
  const o = {};
  for (const k of MATEMATICA) {
    if (tiene(obj, k)) o[k] = structuredClone(obj[k]);
  }
  return o;
}

// JSON con claves ordenadas recursivamente (determinista).
export function canonica(f) {
  const orden = (x) => {
    if (Array.isArray(x)) return x.map(orden);
    if (x && typeof x === 'object') {
      const o = {};
      for (const k of Object.keys(x).sort()) o[k] = orden(x[k]);
      return o;
    }
    return x;
  };
  return JSON.stringify(orden(f));
}

// Longitud UTF-8 de la forma canonica.
export function bytes(f) {
  return new TextEncoder().encode(canonica(f)).length;
}

function cadenas(x, out = []) {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => cadenas(v, out));
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => cadenas(v, out));
  return out;
}

// null si la ficha vale; si no, una causa con prefijo fijo.
export function valida(f, dic) {
  // La vara se juzga aparte: una ficha sin vara declarada es su propia violacion, no una de forma.
  const sobran = Object.keys(f).filter((k) => !MATEMATICA.includes(k));
  const faltan = MATEMATICA.filter((k) => k !== 'vara' && !tiene(f, k));
  if (sobran.length || faltan.length) return 'forma: claves distintas de MATEMATICA';
  if (f.v !== V) return 'forma: v distinto de ' + V;
  if (typeof f.pieza !== 'string' || !tiene(PIEZAS, f.pieza)) return 'forma: pieza fuera de PIEZAS';
  if (f.id !== PIEZAS[f.pieza].id) return 'forma: id distinto del catalogo de ' + f.pieza;
  const entry = entradaDe(dic, f.id);
  if (!entry) return 'forma: id ' + f.id + ' no esta en el diccionario';

  if (typeof f.vara !== 'string' || f.vara === '' || f.vara !== PIEZAS[f.pieza].vara) {
    return 'vara: ausente, vacia o distinta de ' + PIEZAS[f.pieza].vara;
  }
  if (bytes(f) > 1024) return 'techo: ' + bytes(f) + ' B > 1024';
  if (canonica(f.mesura) !== canonica(mesuraDe(entry))) return 'piel: la mesura no coincide con el diccionario';

  if (!SELLOS.includes(f.sello)) return 'sello: fuera de SELLOS';
  if (f.sello === 'NO_DATA') {
    if (typeof f.causa !== 'string' || f.causa.length === 0) return 'sello: NO_DATA sin causa';
  } else if (f.causa !== null) {
    return 'sello: ' + f.sello + ' con causa no null';
  }

  const hit = cadenas(f).map((s) => s.match(RE_PROHIBIDOS)).find(Boolean);
  if (hit) return 'vocablo: contiene "' + hit[0] + '"';

  if (f.texto === '' || f.texto !== entry.nombre_juego + ': ' + entry.estandar_humano) {
    return 'correspondencia: texto vacio o distinto de nombre_juego + estandar_humano';
  }
  if (!f.mesura.onda_hz.includes(f.sonido_hz)) return 'correspondencia: sonido_hz no esta en mesura.onda_hz';
  return null;
}

// Forma canonica del nucleo comparable: sin piel, sin mundo, sello ni causa.
function nucleo(f) {
  const q = quitaPiel(f);
  delete q.mundo;
  delete q.sello;
  delete q.causa;
  return canonica(q);
}

// Compara dos fichas de la misma pieza en mundos distintos.
export function compara(a, b) {
  if (a.pieza !== b.pieza) throw new Error('compara: piezas distintas (' + a.pieza + ' y ' + b.pieza + ')');
  if (a.mundo === b.mundo) throw new Error('compara: mismo mundo ' + a.mundo);
  for (const f of [a, b]) {
    if (f.sello === 'NO_DATA' && (typeof f.causa !== 'string' || f.causa.length === 0)) {
      throw new Error('compara: NO_DATA sin causa del mundo ' + f.mundo);
    }
  }
  const sinDato = [a, b].find((f) => f.sello === 'NO_DATA');
  if (sinDato) {
    // La comparacion no inventa ni copia el dato ajeno: solo devuelve la causa del que falta.
    return {
      pieza: a.pieza,
      mundos: [a.mundo, b.mundo],
      niebla: true,
      veredicto: 'NO_DATA',
      causa: 'mundo ' + sinDato.mundo + ': ' + sinDato.causa,
    };
  }
  const niebla = [a, b].some((f) => f.sello === 'EMULADO' || f.sello === 'SIMULATED');
  const veredicto = nucleo(a) === nucleo(b) ? 'IGUAL' : 'DISTINTA';
  return { pieza: a.pieza, mundos: [a.mundo, b.mundo], niebla, veredicto, causa: null };
}
