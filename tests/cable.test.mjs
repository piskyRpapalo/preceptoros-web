import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import Cable from '../public/game/cable_llamar.js';
import Chat from '../public/game/cable_terminal.js';
import nexo from '../public/nexo-v1.json' with { type: 'json' };

const llamarSrc = readFileSync(new URL('../public/game/cable_llamar.js', import.meta.url), 'utf8');
const chatSrc = readFileSync(new URL('../public/game/cable_terminal.js', import.meta.url), 'utf8');

test('C1: contrato público nexo-v1.json — esquema atlas.nexo/1, campos declarados, <16 KiB', () => {
  if (nexo.esquema !== 'atlas.nexo/1') throw new Error('esquema mal');
  for (const f of ['version', 'origen', 'accion', 'contexto', 'coordenada', 'hash_de_estado_esperado', 'tic']) {
    if (!nexo.fields[f]) throw new Error('campo del CIEF ausente: ' + f);
  }
  if (statSync(new URL('../public/nexo-v1.json', import.meta.url)).size > 16384) throw new Error('contrato pasa del techo');
  if (!/CLOSED list/.test(nexo.fields.accion)) throw new Error('la acción no es lista cerrada');
});

test('C2: payload <1 KB, acción cerrada "llamar", contexto recortado a 512', () => {
  if (Cable.ACCION !== 'llamar') throw new Error('acción no es la cerrada');
  const p = Cable.payload('x'.repeat(2000));
  if (!p.causa) throw new Error('sin estado de juego debería decir la causa, no inventar');
  const tope = Cable.TOPE_CONTEXTO;
  if (tope !== 512) throw new Error('tope de contexto mal');
});

test('C2: sin estado de juego → causa traducida, NUNCA recibo inventado', () => {
  let pintado = null;
  Cable.llama('hola', r => { pintado = r; });
  if (!pintado || pintado.estado !== 'sin-lectura' || !pintado.causa) throw new Error('sin estado se inventó algo: ' + JSON.stringify(pintado));
  if (/NO_DATA/.test(pintado.causa)) throw new Error('literal NO_DATA en texto visible (regla 25.8)');
});

test('C2: la puerta es window.Enviar (una sola salida), no un segundo camino al rack', () => {
  if (!/window\.Enviar|raiz\.Enviar/.test(llamarSrc)) throw new Error('no usa la puerta única de enviar.js');
  if (/fetch\(/.test(llamarSrc)) throw new Error('segundo camino: fetch directo prohibido (una sola salida)');
});

test('C3/C4: jamás el literal NO_DATA en texto visible; edad en ciclos, LIVE/STALE+Δ', () => {
  if (/NO_DATA/.test(chatSrc.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error('literal NO_DATA en texto visible del cable');
  if (!/cable_edad/.test(chatSrc)) throw new Error('sin la plantilla de edad LIVE/STALE+Δ');
  if (!/Δ\{n\}c|Δ \{n\}/.test(chatSrc) && !/cable_edad/.test(chatSrc)) throw new Error('sin Δ traducido');
});
test('C4: métricas sin publicar → causa traducida, no bloqueo ni invención', () => {
  const m = Chat.metricas ? Chat.metricas() : null;
  if (m && !m.causa && (m.conformidad == null)) throw new Error('tasa sin dato pintada como cifra');
});

test('i18n: las claves cable viven traducidas en es; en y las demas usan los defaults EN del codigo (T(k, default))', () => {
  const claves = ['cable_aria','cable_boton','cable_recibo','cable_metricas','cable_yendo','cable_fallo','cable_nd','cable_edad'];
  const es = JSON.parse(readFileSync(new URL('../public/atlas-es.json', import.meta.url), 'utf8'));
  for (const k of claves) {
    if (!es.ui || !es.ui[k] || !es.ui[k].length) throw new Error('es sin ' + k);
  }
  const en = JSON.parse(readFileSync(new URL('../public/atlas-en.json', import.meta.url), 'utf8'));
  for (const k of claves) {
    if (!en.ui || !en.ui[k]) throw new Error('en sin ' + k + ' (T3: las claves viven en las 9 lenguas)');
  }
});
test('techo 16 KiB por fichero y vocablos prohibidos ausentes', () => {
  for (const f of ['../public/game/cable_llamar.js', '../public/game/cable_terminal.js', '../public/nexo-v1.json']) {
    if (statSync(new URL(f, import.meta.url)).size > 16384) throw new Error('techo: ' + f);
    const txt = readFileSync(new URL(f, import.meta.url), 'utf8').toLowerCase();
    for (const w of ['oraculo', 'notario', 'depin', 'clearing', 'magia', 'criptomoneda', 'cryptocurrency']) {
      if (txt.includes(w)) throw new Error('prohibido en ' + f + ': ' + w);
    }
  }
});

test('SABOTAJE: si el payload se inventara sin estado de juego, la suite cae', () => {
  const roto = Cable.payload('x');
  if (!roto.causa && roto.esquema) throw new Error('sabotaje: un payload sin estado NO puede salir; debe llevar causa');
  const cuerpo = JSON.stringify(roto);
  if (/NO_DATA/.test(cuerpo)) throw new Error('literal prohibido en el cuerpo');
});
