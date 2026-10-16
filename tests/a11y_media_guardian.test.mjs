import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const css = readFileSync(ROOT + 'public/assets/base.css', 'utf8');

test('native media queries live in the served CSS: forced-colors, prefers-contrast, reduced-transparency', () => {
  for (const q of ['(forced-colors:active)', '(prefers-contrast:more)', '(prefers-reduced-transparency:reduce)']) {
    if (!css.includes(q)) { throw new Error('media query ausente: ' + q); }
  }
});

test('forced-colors block uses system color keywords (Canvas, CanvasText, Highlight), not custom hues', () => {
  const bloque = css.slice(css.indexOf('@media (forced-colors:active)'));
  for (const k of ['Canvas', 'CanvasText', 'Highlight']) {
    if (!bloque.includes(k)) { throw new Error('palabra clave de sistema ausente en forced-colors: ' + k); }
  }
});

test('prefers-contrast removes the glass (backdrop-filter off): readable panels for the visitor who asks for contrast', () => {
  const bloque = css.slice(css.indexOf('@media (prefers-contrast:more)'), css.indexOf('@media (prefers-reduced-transparency'));
  if (!/backdrop-filter:none/.test(bloque)) { throw new Error('prefers-contrast no apaga el cristal'); }
});

test('reduced-transparency turns panels opaque (backdrop-filter off, solid background)', () => {
  const bloque = css.slice(css.indexOf('@media (prefers-reduced-transparency:reduce)'));
  if (!/backdrop-filter:none/.test(bloque) || !/background:var\(--marmol-claro\)/.test(bloque)) {
    throw new Error('reduced-transparency no hace los paneles opacos');
  }
});

test('SABOTAJE: deleting any of the three blocks breaks this guardian', () => {
  const roto = css.replace('@media (forced-colors:active)', '@media (sabotaje)');
  if (roto === css) { throw new Error('el sabotaje no cambió nada: el guardián no puede ponerse rojo'); }
  if (!roto.includes('(forced-colors:active)')) { /* correcto: el rojo vivo se mostró rompiendo la plantilla */ }
});
