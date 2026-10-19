/* Casos deterministas del manager; Web Audio y Radio son dobles locales, sin navegador ni salida audible. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const base = new URL('../public/game/audio_feedback_manager.js', import.meta.url);
const fuente = readFileSync(base, 'utf8');
const entrada = JSON.parse(readFileSync(new URL('../data/audio_feedback_manager.input.schema.json', import.meta.url)));
const salidaSchema = JSON.parse(readFileSync(new URL('../data/audio_feedback_manager.schema.json', import.meta.url)));
const fallos = [];
function caso(nombre, fn) {
  try { fn(); fallos.push({ caso: nombre, ok: true }); }
  catch (e) { fallos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}
function cargar({ audio = true, radio = true, estado = 'running' } = {}) {
  const llamadas = [];
  const raiz = {};
  raiz.AtlasSintesis = {
    activa: () => audio,
    contexto: () => audio ? { state: estado } : null,
    suena: (r) => { llamadas.push(['suena', r.portadora, r.moduladora, r.indice, r.dur, !!r.vibrato]); return r; },
  };
  raiz.AtlasRadio = radio ? { tocaNota: (grado, octava) => {
    llamadas.push([grado, octava]);
    return { portadora: 440 };
  } } : null;
  vm.runInNewContext(fuente, raiz, { filename: 'audio_feedback_manager.js' });
  return { api: raiz.AudioFeedbackManager, llamadas };
}
function json(x) { return JSON.parse(JSON.stringify(x)); }

caso('los dos contratos son objetos cerrados y declaran todos los campos', () => {
  assert.equal(entrada.additionalProperties, false);
  assert.deepEqual(entrada.required, ['habilidad', 'eventos']);
  assert.equal(salidaSchema.$defs.salida.additionalProperties, false);
  assert.deepEqual(salidaSchema.$defs.salida.required, ['estado', 'frecuencia_hz', 'causa']);
});
caso('no suena antes del opt-in y la entrada válida devuelve INACTIVO', () => {
  const { api, llamadas } = cargar();
  assert.equal(api.procesar({ habilidad: 'swim', eventos: 1 }).estado, 'INACTIVO');
  assert.equal(llamadas.length, 0);
});
caso('rechaza claves extra, forma incorrecta, enum y límites', () => {
  const { api } = cargar(); api.habilitar();
  const invalido = [null, [], { habilidad: 'swim', eventos: 1, extra: true },
    { habilidad: 'sing', eventos: 1 }, { habilidad: 'swim', eventos: 0 },
    { habilidad: 'reach', eventos: 401 }, { habilidad: 'reach', eventos: 1.5 }];
  for (const x of invalido) assert.equal(api.procesar(x).estado, 'RECHAZADO', JSON.stringify(x));
});
caso('habilitación válida usa Radio y la pentatónica ya existente', () => {
  const { api, llamadas } = cargar();
  assert.equal(api.habilitar().estado, 'HABILITADO');
  const r = json(api.procesar({ habilidad: 'reach', eventos: 25 }));
  assert.deepEqual(llamadas, [[7, 1]]);
  assert.deepEqual(r, { estado: 'SONADO', frecuencia_hz: 440, causa: null });
});
caso('si faltan audio, Radio o AudioContext activo, responde NO_DATA con causa', () => {
  const sinAudio = cargar({ audio: false }).api;
  assert.equal(sinAudio.habilitar().estado, 'NO_DATA');
  const sinRadio = cargar({ radio: false }); sinRadio.api.habilitar();
  assert.equal(sinRadio.api.procesar({ habilidad: 'swim', eventos: 2 }).estado, 'NO_DATA');
  const suspendido = cargar({ estado: 'suspended' }); suspendido.api.habilitar();
  const r = suspendido.api.procesar({ habilidad: 'swim', eventos: 2 });
  assert.equal(r.estado, 'NO_DATA'); assert.ok(r.causa);
});
caso('deshabilitar devuelve el estado cerrado y silencia llamadas futuras', () => {
  const { api, llamadas } = cargar(); api.habilitar(); api.deshabilitar();
  assert.deepEqual(json(api.deshabilitar()), { estado: 'DESHABILITADO', frecuencia_hz: null, causa: null });
  assert.equal(api.procesar({ habilidad: 'swim', eventos: 1 }).estado, 'INACTIVO');
  assert.equal(llamadas.length, 0);
});

// T_CRT §8.3 (FIRMO 2026-10-19, Comando #15): la gramatica acustica del orquestador. 3 verbos x 4 estados,
// un motivo determinista por par y su texto gemelo para el lector de pantalla.
const verbo = salidaSchema.$defs.verbo;
const pares = () => { const { api } = cargar(); return api.VERBS.flatMap((v) => api.STATES.map((s) => api.verb(v, s, s === 'NO_DATA' ? 'no sensor' : null))); };
caso('§8.3: 3 verbos x 4 estados = 12 motivos distintos', () => {
  const r = pares();
  assert.equal(r.length, 12);
  assert.equal(new Set(r.map((x) => JSON.stringify(x.motivo))).size, 12);
});
caso('§8.3: mismo estado, mismo sonido, siempre (determinista entre cargas)', () => {
  assert.deepEqual(json(pares()), json(pares()));
});
caso('§8.3: paridad 1:1 sonido <-> texto (cada motivo tiene su texto y cada texto su motivo)', () => {
  const r = pares(), m = new Map();
  for (const x of r) { const k = x.texto.replace(/ \(.*\)$/, ''); assert.ok(!m.has(k), 'texto repetido ' + k); m.set(k, JSON.stringify(x.motivo)); }
  assert.equal(new Set(m.values()).size, m.size);
});
caso('§8.3: cada salida respeta el contrato $defs.verbo (claves cerradas, enums, causas)', () => {
  for (const x of pares()) {
    assert.deepEqual(Object.keys(x).sort(), [...verbo.required].sort());
    assert.ok(verbo.properties.verbo.enum.includes(x.verbo) && verbo.properties.estado.enum.includes(x.estado) && verbo.properties.sonido.enum.includes(x.sonido));
    assert.deepEqual(Object.keys(x.motivo).sort(), [...verbo.properties.motivo.required].sort());
    if (x.estado === 'NO_DATA') assert.ok(typeof x.causa === 'string' && x.causa.length);
    assert.equal(x.sonido === 'SONADO', x.sonido_causa === null);
  }
});
caso('§8.3: NO_DATA sin causa del llamador declara la suya; verbo o estado desconocido no suena (null)', () => {
  const { api } = cargar();
  assert.match(api.verb('state', 'NO_DATA').causa, /cause not declared/);
  assert.equal(api.verb('borrar', 'MEASURED'), null);
  assert.equal(api.verb('deploy', 'LIVE'), null);
});
caso('§8.3: sin opt-in no suena (INACTIVO con causa); con opt-in suena una vez; contexto suspendido = NO_DATA con causa', () => {
  const a = cargar(); const r0 = a.api.verb('deploy', 'PROPOSED');
  assert.equal(r0.sonido, 'INACTIVO'); assert.ok(r0.sonido_causa); assert.equal(a.llamadas.length, 0);
  a.api.habilitar(); const r1 = a.api.verb('deploy', 'PROPOSED');
  assert.equal(r1.sonido, 'SONADO'); assert.equal(a.llamadas.length, 1); assert.equal(a.llamadas[0][5], true);
  const b = cargar({ estado: 'suspended' }); b.api.habilitar(); const r2 = b.api.verb('rag', 'STALE');
  assert.equal(r2.sonido, 'NO_DATA'); assert.match(r2.sonido_causa, /not running/); assert.equal(b.llamadas.length, 0);
});

console.log(JSON.stringify(fallos, null, 2));
process.exitCode = fallos.every((x) => x.ok) ? 0 : 1;
