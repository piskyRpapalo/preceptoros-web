// Juez de la ventana de preguntas (VT7): 1 caso valido + 6 violaciones.
// Idioma de atlas/ficha_casos.mjs. Cada violacion comprueba que lo real pasa antes de sabotear.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../public/game/world_creator.js');
const A = require('../public/game/audio_feedback_manager.js');
const SRC = readFileSync(new URL('../public/game/world_creator.js', import.meta.url), 'utf8');
const RE_NET = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|importScripts|sendBeacon)\b|import\s*\(/;
const KEYS = ['v', 'seal', 'origin', 'cause', 'passage', 'text', 'sound'];
const FRONTERA = 'the frontier keeps paths, addresses and links on this device';

function valida(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return 'no es objeto';
  const ks = Object.keys(ev);
  if (ks.length !== KEYS.length || !KEYS.every((k) => k in ev)) return 'claves: ' + ks.join(',');
  if (ev.v !== C.V) return 'v';
  if (ev.seal !== 'MEDIDO' && ev.seal !== 'NO_DATA') return 'seal: ' + ev.seal;
  if (ev.origin !== 'rag') return 'origin: ' + ev.origin;
  if (ev.seal === 'NO_DATA') {
    if (typeof ev.cause !== 'string' || ev.cause.length === 0) return 'NO_DATA sin causa';
    if (ev.passage !== null) return 'NO_DATA con pasaje';
  } else {
    if (ev.cause !== null) return 'MEDIDO con causa';
    if (!ev.passage || !ev.passage.source || !ev.passage.seal) return 'MEDIDO sin fuente o sello';
  }
  if (C.bytes(ev) >= 1024) return 'techo: ' + C.bytes(ev) + ' B';
  if (C.BANNED.test(JSON.stringify(ev))) return 'vocablo prohibido';
  if (!ev.sound || typeof ev.sound !== 'object') return 'sin sound';
  const want = A.verb('rag', ev.seal === 'MEDIDO' ? 'MEASURED' : 'NO_DATA', ev.cause);
  if (ev.sound.texto !== want.texto) return 'sound.texto no corresponde: ' + ev.sound.texto;
  return null;
}

const casos = [];
const caso = (n, f) => {
  let r;
  try { r = f(); } catch (e) { r = String(e); }
  casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) });
};

caso('valido: el creador de mundos, desde el RAG local y sin red', () => {
  const globales = ['fetch', 'XMLHttpRequest', 'WebSocket'];
  const previos = globales.map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]);
  let red = 0;
  const cierra = () => { red++; throw new Error('network closed'); };
  globales.forEach((k) => { globalThis[k] = cierra; });
  let e, fr, Q = 'Who is the world creator?';
  try {
    e = C.ask(Q, { audio: A });
    fr = C.ask('read /srv/x please', { audio: A });  // guardia:permitir sonda de la frontera: ruta inventada que el chat debe retener
  } finally {
    previos.forEach(([k, d]) => { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k]; });
  }
  if (e.seal !== 'MEDIDO') return 'seal ' + e.seal;
  if (!e.passage || e.passage.id !== 'world-creator') return 'pasaje ' + JSON.stringify(e.passage);
  if (e.text !== C.CORPUS.find((p) => p.id === 'world-creator').text) return 'texto no literal';
  if (valida(e) !== null) return 'valida: ' + valida(e);
  if (red !== 0) return 'llamadas de red: ' + red;
  if (JSON.stringify(e).includes(Q)) return 'el evento contiene la pregunta';
  if (fr.cause !== FRONTERA) return 'frontera: ' + fr.cause;
  return true;
});

caso('violacion: llamada externa', () => {
  if (RE_NET.test(SRC)) return 'el fuente real llama a red: ' + SRC.match(RE_NET)[0];
  if (!RE_NET.test(SRC + "\nfetch('https://x');\n")) return 'el sabotaje no sale rojo';
  return true;
});

caso('violacion: respuesta sin sello de origen', () => {
  const e = C.ask('Who is the world creator?', { audio: A });
  if (valida(e) !== null) return 'lo real no pasa: ' + valida(e);
  const sinSello = { ...e };
  delete sinSello.seal;
  if (valida(sinSello) === null) return 'sin seal pasa';
  if (valida({ ...e, origin: 'model' }) === null) return 'origin model pasa';
  return true;
});

caso('violacion: evento > 1.024 B', () => {
  const big = C.ask('reef', { audio: A, corpus: [{ id: 'big', title: 'reef', text: 'x'.repeat(1100), source: 's', seal: 'DECLARADO' }] });
  if (big.seal !== 'NO_DATA' || !/ceiling/.test(big.cause)) return { seal: big.seal, cause: big.cause };
  const hecho = { v: C.V, seal: 'NO_DATA', origin: 'rag', cause: 'answer refused: over the channel ceiling', passage: null, text: 'x'.repeat(1100), sound: A.verb('rag', 'NO_DATA', 'answer refused: over the channel ceiling') };
  if (valida(hecho) === null) return 'valida no rechazo 1100 B';
  return true;
});

caso('violacion: vocablo prohibido', () => {
  if (!C.CORPUS.every((p) => !C.BANNED.test(JSON.stringify(p)))) return 'un pasaje real casa con BANNED';
  const e = C.ask('crystal', { audio: A, corpus: [{ id: 'm', title: 'crystal', text: 'a magic crystal', source: 's', seal: 'DECLARADO' }] });
  if (e.seal !== 'NO_DATA' || !/banned/.test(e.cause)) return { seal: e.seal, cause: e.cause };
  return true;
});

caso('violacion: sin correspondencia acustica/textual', () => {
  const e = C.ask('Who is the world creator?', { audio: A });
  if (valida(e) !== null) return 'lo real no pasa: ' + valida(e);
  if (valida({ ...e, sound: { ...e.sound, texto: 'Sources: forged' } }) === null) return 'texto de sonido falso pasa';
  const sinSonido = { ...e };
  delete sinSonido.sound;
  if (valida(sinSonido) === null) return 'sin sound pasa';
  return true;
});

caso('violacion: RAG sin causa declarada', () => {
  const e = C.ask('price of coffee in Lisbon', { audio: A });
  if (e.seal !== 'NO_DATA' || typeof e.cause !== 'string' || e.cause.length === 0) return { seal: e.seal, cause: e.cause };
  if (valida(e) !== null) return 'lo real no pasa: ' + valida(e);
  if (valida({ ...e, cause: null }) === null) return 'NO_DATA sin causa pasa';
  if (!C.CORPUS.every((p) => typeof p.source === 'string' && p.source.length > 0 && typeof p.seal === 'string' && p.seal.length > 0)) return 'pasaje sin fuente o sello';
  return true;
});

const todos = casos.every((c) => c.ok);
console.log(JSON.stringify(casos, null, 1));
process.exitCode = todos ? 0 : 1;
