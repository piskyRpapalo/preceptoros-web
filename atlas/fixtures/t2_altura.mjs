// T2 · fixture de la altura logaritmica (tarjeta NORTE7-T2-ALTURA-LOG). FIXTURE, no produccion.
// Ley (dictado web#387): h(mana) = h0 * (1 + k * ln(1 + mana)); crecer es altura, no anchura [2].
// Mana es el dato entero 0-100 de global_map.js:41. Sin dato (NO_DATA) = altura de suelo declarada h0.
// h0 y k NO son cifras pedidas al Soberano: se derivan aqui, por medicion, de constantes ya registradas.
import { readFileSync } from 'node:fs';

const REG = JSON.parse(readFileSync(new URL('./constantes.json', import.meta.url), 'utf8')).constantes;
const valor = (nombre) => REG.find((c) => c.nombre === nombre).valor;

export const MANA_MIN = 0, MANA_MAX = 100;
export const RATIO_OBJETIVO = 2.5;                 // punto medio de la ventana [2,3] de la regla [1]

// h0: la altura minima legible en pantalla al zoom minimo publicado. Es el analogo vertical del suelo de 16 px.
// h0 * ZOOM_MIN >= ETIQUETA_MIN_PX  =>  h0 = ceil(ETIQUETA_MIN_PX / ZOOM_MIN).
export function derivaH0(etiquetaMinPx = valor('ETIQUETA_MIN_PX'), zoomMin = valor('ZOOM_MIN')) {
  return Math.ceil(etiquetaMinPx / zoomMin);
}

// k: de la regla [1], h(100) = RATIO_OBJETIVO * h0  =>  k = (RATIO_OBJETIVO - 1) / ln(1 + MANA_MAX).
export function derivaK(ratio = RATIO_OBJETIVO, manaMax = MANA_MAX) {
  return Math.round(((ratio - 1) / Math.log(1 + manaMax)) * 1000) / 1000;
}

export const H0 = derivaH0();
export const K = derivaK();

// Altura en px de referencia para un dato de mana. Devuelve solo altura: el ancho no depende del mana [2].
// Dato invalido o ausente -> altura de suelo h0 con causa NO_DATA (nunca un valor inventado).
export function altura(mana) {
  if (mana === null || mana === undefined) { return { h: H0, estado: 'NO_DATA', causa: 'sin dato de mana' }; }
  if (!Number.isInteger(mana) || mana < MANA_MIN || mana > MANA_MAX) {
    return { h: H0, estado: 'NO_DATA', causa: `mana fuera de 0-${MANA_MAX} enteros: ${mana}` };
  }
  return { h: H0 * (1 + K * Math.log(1 + mana)), estado: 'MEDIDO', causa: null };
}
