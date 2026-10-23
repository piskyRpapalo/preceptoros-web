import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const pointer = readFileSync(ROOT + 'public/game/map_pointer_input.js', 'utf8');
const mar = readFileSync(ROOT + 'public/game/sea.js', 'utf8');

test('tap-to-move exists: short tap on open sea advances the camera through planeaTap', () => {
  if (!/x\.planeaTap\) \{ x\.planeaTap\(tocado\); \}/.test(pointer)) {
    throw new Error('el toque corto en mar abierto no llama a planeaTap');
  }
});

test('SINGLE DOOR: planeaTap goes through the same planea() as keyboard and lighthouse, no duplicated rule', () => {
  if (!/planeaTap: function \(pto\) \{[\s\S]*C\.planea\(cam, pto\.x, pto\.y, circ, quieto\(\)\)/.test(mar)) {
    throw new Error('planeaTap no usa la puerta planea() de la casa');
  }
  // sin ventaja: planea() es la MISMA función que faro y teclado ya usan (sea.js:57 la usa para faro)
  if (!/if \(d === 'faro'\) \{ C\.planea\(cam, N\.HEX\.x/.test(mar)) {
    throw new Error('el faro dejó de usar planea() — puerta rota');
  }
});

test('no advantage over the gesture: tap only moves the camera where drag already goes (planea/empuja family)', () => {
  // el tap NO da salto, zoom ni selección extra: solo llama planea con el punto tocado
  const llamadas = (mar.match(/planeaTap/g) || []).length;
  if (llamadas > 3) { throw new Error('planeaTap replicado: duplicación de regla'); }
});

test('SABOTAJE: removing the planeaTap hook breaks this guardian', () => {
  const roto = pointer.replace('x.planeaTap(tocado);', '');
  if (roto === pointer) { throw new Error('el sabotaje no cambió nada: el guardián no puede ponerse rojo'); }
});
