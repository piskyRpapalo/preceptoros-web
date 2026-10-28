/* Casos deterministas del manager; Web Audio y Radio son dobles locales, sin navegador ni salida audible. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);


const entrada = JSON.parse(readFileSync(new URL('../data/audio_feedback_manager.input.schema.json', import.meta.url)));
const salidaSchema = JSON.parse(readFileSync(new URL('../data/audio_feedback_manager.schema.json', import.meta.url)));
const fallos = [];
function caso(nombre, fn) {
  try { fn(); fallos.push({ caso: nombre, ok: true }); }
  catch (e) { fallos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}

function json(x) { return JSON.parse(JSON.stringify(x)); }

caso('los dos contratos son objetos cerrados y declaran todos los campos', () => {
  assert.equal(entrada.additionalProperties, false);
  assert.deepEqual(entrada.required, ['habilidad', 'eventos']);
  assert.equal(salidaSchema.$defs.salida.additionalProperties, false);
  assert.deepEqual(salidaSchema.$defs.salida.required, ['estado', 'frecuencia_hz', 'causa']);
});






// T_CRT §8.3 (FIRMO 2026-10-19, Comando #15): la gramatica acustica del orquestador. 3 verbos x 4 estados,
// un motivo determinista por par y su texto gemelo para el lector de pantalla.
const verbo = salidaSchema.$defs.verbo;








console.log(JSON.stringify(fallos, null, 2));
process.exitCode = fallos.every((x) => x.ok) ? 0 : 1;
