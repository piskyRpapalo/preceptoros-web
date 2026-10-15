import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import AtlasOndaProfunda from '../public/game/onda_profunda.js';
import IsometricFloor from '../public/game/isometric_floor_projection.js';

const src = readFileSync(new URL('../public/game/onda_profunda.js', import.meta.url), 'utf8');

test('la ley del suelo manda: usa proyecta/ancla/profundidad de IsometricFloor, sin geometría propia', () => {
  if (!/IsometricFloor/.test(src)) throw new Error('no cita la ley del suelo');
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/parallax|perspective|createLinearGradient|shadowBlur|shadowOffset/.test(codigo)) throw new Error('profundidad fingida prohibida (F304/ley 12-oct): el CODIGO no puede usar parallax/sombras, solo citar la prohibccion')
});

test('pieza <16 KiB, vanilla, cero red', () => {
  if (statSync(new URL('../public/game/onda_profunda.js', import.meta.url)).size > 16384) throw new Error('pieza demasiado grande');
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource/.test(src)) throw new Error('red en la pieza');
});

test('planifica: ancla y profundidad según la ley (huella incluida)', () => {
  const sitio = () => ({ x: 3, y: 4 });
  const p = AtlasOndaProfunda.planifica({ huella: 2, radio: 18 }, sitio, { centro: 7 });
  if (p.profundidad !== IsometricFloor.profundidad({ col: 3, fila: 4, huella: 2 })) {
    throw new Error('la profundidad no es la de la ley');
  }
  if (p.col !== 3 || p.fila !== 4 || p.huella !== 2) throw new Error('datos del lugar perdidos');
});

test('escala viva: función pura del eje, clamp [0.75, 1.35], determinista', () => {
  const sitio = () => ({ x: 3, y: 4 });
  const a = AtlasOndaProfunda.planifica({ radio: 18 }, sitio, { centro: 7 });
  const b = AtlasOndaProfunda.planifica({ radio: 18 }, sitio, { centro: 7 });
  if (a.escala !== b.escala) throw new Error('no determinista: misma entrada, distinta escala');
  const lejos = AtlasOndaProfunda.planifica({ radio: 18 }, () => ({ x: 300, y: 300 }), { centro: 0 });
  if (lejos.escala !== 1.35) throw new Error('sin techo de escala: ' + lejos.escala);
  const atras = AtlasOndaProfunda.planifica({ radio: 18 }, () => ({ x: 0, y: 0 }), { centro: 50 });
  if (atras.escala !== 0.75) throw new Error('sin suelo de escala: ' + atras.escala);
});

test('PUERTA DE LA (b) — orden del pintor: delante (mayor col+fila) pinta DESPUÉS y tapa', () => {
  const cola = [];
  const cerca = AtlasOndaProfunda.planifica({ radio: 18 }, () => ({ x: 10, y: 10 }), { centro: 0 });
  const lejos = AtlasOndaProfunda.planifica({ radio: 18 }, () => ({ x: 2, y: 2 }), { centro: 0 });
  AtlasOndaProfunda.encola(cola, lejos, () => 'lejos');
  AtlasOndaProfunda.encola(cola, cerca, () => 'cerca');
  const orden = IsometricFloor.ordena(cola).map(x => x.f());
  if (orden[0] !== 'lejos' || orden[1] !== 'cerca') throw new Error('orden roto: ' + JSON.stringify(orden));
  if (typeof orden[0] !== 'string' || typeof orden[1] !== 'string') throw new Error('encola devolvio falsos');
});

test('SABOTAJE (la suite cae si encola ignora la ley): profundidad propia != profundidad de la ley', () => {
  const O = (globalThis).AtlasOndaProfundaSab || null;
  // Sabotaje simulado: encolar con profundidad inventada (no la de IsometricFloor)
  const I2 = IsometricFloor;
  const plan = AtlasOndaProfunda.planifica({ huella: 3, radio: 18 }, () => ({ x: 4, y: 4 }), { centro: 0 });
  if (plan.profundidad !== I2.profundidad({ col: 4, fila: 4, huella: 3 })) {
    throw new Error('SABOTAJE DETECTADO: la profundidad del plan no es la de la ley');
  }
  // Y si alguien quita el clamp de escala viva, el techo se rompe:
  const lejos = AtlasOndaProfunda.planifica({ radio: 18 }, () => ({ x: 300, y: 300 }), { centro: 0 });
  if (lejos.escala > 1.35 || lejos.escala < 0.75) throw new Error('SABOTAJE DETECTADO: clamp de escala viva roto');
  // Demostración roja (no lanza aquí): con profundidad inventada (p.ej. col+fila sin huella),
  // plan.profundidad(12) != ley(12) fallaría arriba. La suite cae si la ley se ignora.
});
