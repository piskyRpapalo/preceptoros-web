// atlas/bubble_letters_casos.mjs · las letras de la casa (V7, FIRMO 2026-10-18: «sí, en lote aparte»).
// Uso: node atlas/bubble_letters_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
// Blanca con contorno dorado: relleno `paper`, contorno `comic yellow.base`, sombra dura `cyan`.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkFrame } from './param_gate.mjs';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const MOD = ruta('../public/game/bubble_letters.js');
const TECHO = 16384;
const casos = [];
const caso = (n, nombre, prueba) => {
  let r;
  try { r = prueba(); } catch (e) { r = { ok: false, medida: 'error: ' + e.message }; }
  casos.push({ caso: n, nombre, ok: r.ok === true, medida: r.medida });
};
const J = (x) => JSON.stringify(x);

let L = null, A = null, causa = null;
if (existsSync(MOD)) {
  try {
    for (const m of ['tabla_semantica', 'comic_tokens', 'comic_accents', 'gacha']) {
      const g = req(ruta('../public/game/' + m + '.js'));
      if (m === 'tabla_semantica') globalThis.AtlasSemantica = g;
      if (m === 'comic_tokens') globalThis.AtlasComicTokens = g;
      if (m === 'comic_accents') globalThis.AtlasComicAccents = g;
      if (m === 'gacha') globalThis.AtlasGacha = g;
    }
    A = req(ruta('../public/game/bubble_language.js'));
    globalThis.AtlasBubble = A;
    L = req(MOD);
  } catch (e) { causa = 'no carga: ' + e.message; }
} else { causa = 'public/game/bubble_letters.js no existe todavia'; }
const falta = () => ({ ok: false, medida: 'NO_DATA: ' + causa });

const fuente = existsSync(MOD) ? readFileSync(MOD, 'utf8') : '';

caso(1, 'el modulo existe, cabe en el techo, sin comentarios ni impurezas', () => {
  if (!fuente) return falta();
  const impuro = ['document', 'Date', 'Math.random', 'fetch', 'localStorage', '/*', '//'].filter((p) => fuente.includes(p))
    .concat(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(fuente) ? ['literal de color'] : []);
  return { ok: statSync(MOD).size <= TECHO && impuro.length === 0, medida: { bytes: statSync(MOD).size, impuro } };
});

const JUEGO = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÑabcdefghijklmnopqrstuvwxyzñ0123456789.,!?-·:'];
caso(2, 'la familia: A-Z, Ñ, a-z, ñ, 0-9 y . , ! ? - · :', () => {
  if (!L) return falta();
  const faltan = JUEGO.filter((c) => !L.GLYPHS[c]);
  return { ok: faltan.length === 0, medida: { glifos: Object.keys(L.GLYPHS).length, faltan } };
});

caso(3, 'cada glifo decodifica en la rejilla (x 0-8, y -2..15) con trazos de 2 puntos o mas', () => {
  if (!L) return falta();
  const malos = JUEGO.filter((c) => !L.decode(L.GLYPHS[c]).every((t) => t.pts.length >= 2
    && t.pts.every(([x, y]) => x >= 0 && x <= 8 && y >= -2 && y <= 15)));
  return { ok: malos.length === 0, medida: malos };
});

const P = { tx: 'preceptoros', x: 206, y: 100, sz: 40 };
caso(4, 'letters: solo ribbons, en tres pasadas (sombra cyan, contorno dorado, relleno blanco), contorno mas ancho', () => {
  if (!L) return falta();
  const out = L.WORDS.letters(P);
  const bandas = [...new Set(out.map((o) => o.s))];
  const solo = out.every((o) => o.o === 'ribbon' && o.f === null && Array.isArray(o.pts));
  const n = out.length / 3, pasa = [out.slice(0, n), out.slice(n, 2 * n), out.slice(2 * n)];
  const orden = pasa[0].every((o) => o.s === 'cyan') && pasa[1].every((o) => o.s === 'comic yellow.base') && pasa[2].every((o) => o.s === 'paper');
  return { ok: solo && orden && Number.isInteger(n) && pasa[1][0].lw > pasa[2][0].lw, medida: { items: out.length, bandas } };
});

caso(5, 'determinismo: dos llamadas, el mismo JSON; no muta sus parametros', () => {
  if (!L) return falta();
  const p = J(P);
  return { ok: J(L.WORDS.letters(P)) === J(L.WORDS.letters(P)) && J(P) === p };
});

caso(6, 'composicion: centrada en (x, y) sin giro; con rot -90 la caja se vuelve vertical', () => {
  if (!L) return falta();
  const caja = (out) => {
    const pts = out.slice(out.length / 3).flatMap((o) => o.pts);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const a = caja(L.WORDS.letters({ tx: 'HOLA', x: 200, y: 100, sz: 40 }));
  const b = caja(L.WORDS.letters({ tx: 'HOLA', x: 200, y: 100, sz: 40, rot: -90 }));
  const cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2;
  const ok = Math.abs(cx - 200) < 1 && Math.abs(cy - 100) < 1 && (a.x1 - a.x0) > (a.y1 - a.y0) && (b.y1 - b.y0) > (b.x1 - b.x0);
  return { ok, medida: { a, b } };
});

caso(7, 'lo que no esta en la familia no rompe: missing() lo nombra y la palabra lo salta', () => {
  if (!L) return falta();
  const m = L.missing('ÁRBOL é');
  const out = L.WORDS.letters({ tx: 'É', x: 0, y: 0 });
  return { ok: J(m) === J(['Á', 'é']) && out.length === 0, medida: m };
});

caso(8, 'en la lengua: un fotograma con letters compila sin notas y pasa checkFrame', () => {
  if (!L || !A) return falta();
  const f = { v: 'preceptoros.bubble/1', id: 'LETRAS', t: 0, bands: ['FIRMADO.base', 'cyan', 'ink', 'ocean', 'paper'], change: ['the house letters'],
    sound: 'NO_DATA', soundCause: 'static-first: not served', motion: 'NO_DATA',
    atoms: [{ k: 'logo', r: 'the word preceptoros in the house letters', i: [{ o: 'letters', tx: 'preceptoros', x: 96, y: 268, rot: -90, sz: 44 }] }] };
  const g = checkFrame(f), out = A.compile(f);
  return { ok: g.ok && Array.isArray(out) && out.length > 0 && !(out.notes && out.notes.length), medida: { bytes: g.bytes, grupos: out.length } };
});

caso(9, 'sabotaje: un color crudo en f hace lanzar a compile', () => {
  if (!L || !A) return falta();
  const f = { v: 'preceptoros.bubble/1', id: 'S', t: 0, bands: ['paper'], change: ['x'], sound: 'NO_DATA', soundCause: 'x', motion: 'NO_DATA',
    atoms: [{ k: 'x', r: 'x', i: [{ o: 'letters', tx: 'A', x: 0, y: 0, f: '#123456' }] }] };
  try { A.compile(f); return { ok: false, medida: 'no lanzo' }; } catch (e) { return { ok: /unknown band/.test(e.message), medida: e.message }; }
});

caso(10, 'los puntos se pintan: ningun trazo de longitud cero (i, j, ., ·, :, !, ?)', () => {
  if (!L) return falta();
  const nulos = [...'ij.·:!?'].filter((c) => L.decode(L.GLYPHS[c]).some((t) => t.pts.every((q) => q[0] === t.pts[0][0] && q[1] === t.pts[0][1])));
  return { ok: nulos.length === 0, medida: nulos };
});

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
