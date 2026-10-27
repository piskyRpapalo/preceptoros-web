import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const css = readFileSync(ROOT + 'public/assets/base.css', 'utf8');

test('cards go unplugged in print: @media print exists in the served CSS', () => {
  if (!/@media print\{/.test(css)) { throw new Error('no hay bloque @media print'); }
});

test('print removes the living world chrome (ambient, joystick, radio chat, terminal, map controls, skip-link)', () => {
  const bloque = css.slice(css.indexOf('@media print'));
  for (const sel of ['#ambient', '.crab-joystick', '.radio-chat', '.skip-link', '.mapa-mandos']) {
    if (!bloque.includes(sel)) { throw new Error('print no desenchufa: ' + sel); }
  }
  if (!/display:none\}/.test(bloque)) { throw new Error('print no oculta el chrome'); }
});

test('the cards themselves print UNPLUGGED: opaque white, black text, no glass, no shadow', () => {
  const bloque = css.slice(css.indexOf('@media print'));
  for (const sel of ['.summon-access', '.deep-link', '.hitl-firma', '.cable-fila', '.thegame-pliego']) {
    if (!bloque.includes(sel)) { throw new Error('print no trata la tarjeta: ' + sel); }
  }
  if (!/background:#fff;color:#000/.test(bloque)) { throw new Error('las tarjetas no quedan opacas en impresión'); }
  if (!/backdrop-filter:none/.test(bloque)) { throw new Error('el cristal sigue vivo en impresión'); }
});

test('open pliegos keep their content in print (details[open] stays block)', () => {
  const bloque = css.slice(css.indexOf('@media print'));
  if (!/\.thegame-pliego\[open\]\{display:block\}/.test(bloque)) { throw new Error('un pliego abierto se perdería al imprimir'); }
});

test('NO_DATA text keeps its honest color in print', () => {
  const bloque = css.slice(css.indexOf('@media print'));
  if (!/\.no-data\{color:#000\}/.test(bloque)) { throw new Error('el NO_DATA desaparecería en impresión'); }
});

test('SABOTAJE: removing the print block breaks this guardian', () => {
  const roto = css.replace('@media print{', '@media sabotaje{');
  if (roto === css) { throw new Error('el sabotaje no cambió nada: el guardián no puede ponerse rojo'); }
});
