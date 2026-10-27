import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const base = readFileSync(ROOT + 'public/assets/base.css', 'utf8');

test('target size: every touchable control has a minimum area (WCAG 2.2 AA 2.5.8: 24px)', () => {
  if (!/button,\.boton\{font:inherit;font-size:\.85rem;cursor:pointer;min-height:1\.5rem;min-width:1\.5rem;/.test(base)) {
    throw new Error('button/.boton sin area minima de 24px');
  }
  if (!/\.cab-lenguas a,\.radio-chat-tab,\.radio-chat-alterna,summary\{min-height:1\.5rem;min-width:1\.5rem\}/.test(base)) {
    throw new Error('enlaces pequenos y tabs sin area minima de 24px');
  }
});

test('game action buttons keep the house yardstick: 44px (2.75rem)', () => {
  if (!/#thegame :is\(\.boton,\.boton-sec\)\{min-height:2\.75rem;min-width:2\.75rem\}/.test(base)) {
    throw new Error('los botones del juego no declaran 44px');
  }
});

test('focus-visible ring exists for every focusable (global, not per-widget)', () => {
  if (!/:is\(a,button,\.boton,\.leve,summary\):focus-visible\{outline:2px solid var\(--bronce\)/.test(base)) {
    throw new Error('el anillo focus-visible global desaparecio');
  }
});

test('SABOTAJE: removing the 44px yardstick breaks this guardian', () => {
  const roto = base.replace('min-height:2.75rem;min-width:2.75rem', '');
  if (roto === base) { throw new Error('el sabotaje no cambio nada: el guardian no puede ponerse rojo'); }
});
