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

console.log(JSON.stringify(fallos, null, 2));
process.exitCode = fallos.every((x) => x.ok) ? 0 : 1;
