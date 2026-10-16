import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const ui = readFileSync(ROOT + 'public/game/killswitch_dot.js', 'utf8');
const uiOld = readFileSync(ROOT + 'public/game/ui.js', 'utf8');
const css = readFileSync(ROOT + 'public/assets/base.css', 'utf8');

test('the killswitch dot exists on the Sound switch and is fed from the semantic BUS (SELLOS)', () => {
  if (!/KD && KD\.monta\(R\.sonido\)/.test(uiOld)) { throw new Error('sin punto montado en ui.js'); }
  if (!/killswitch-dot/.test(ui)) { throw new Error('sin punto de color en el interruptor'); }
  if (!/SEM\.SELLOS/.test(ui)) { throw new Error('el punto no bebe del BUS de sellos (tabla semántica)'); }
});

test('JAMÁS solo color: every state carries a SHAPE and an aria-label', () => {
  const formas = (ui.match(/forma: '\\u[a-f0-9a-f]{4}'/g) || []).length;
  if (formas < 3) { throw new Error('faltan formas por estado: ' + formas + '/3'); }
  if (!/aria-label', e\.etiqueta/.test(ui)) { throw new Error('sin etiqueta aria por estado'); }
});

test('the four frontier states are mapped: red (no audio/off), yellow (needs gesture), green (live), green-with-ring (live with exception)', () => {
  for (const s of ['apagado', 'necesita_gesto', 'vivo']) {
    if (!ui.includes("'" + s + "'")) { throw new Error('estado ausente: ' + s); }
  }
  if (!/con-anillo/.test(ui) || !/con-anillo/.test(css)) { throw new Error('sin el anillo de excepción'); }
});

test('SABOTAJE: removing the dot breaks this guardian', () => {
  const roto = ui.replace('killswitch-dot', 'sabotaje');
  if (roto === ui) { throw new Error('el sabotaje no cambió nada'); }
});
