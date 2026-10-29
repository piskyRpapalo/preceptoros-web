// Synthetic wave data adapted from the preserved army preview's fixed seeds.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const G = require('../../public/game/gacha.js');
const seeds = [
  'f7b0f1c774f54b6f3efdfd51b2b6a9600380410f45449c38907e61846e4ef729',
  'a23d525508b2c6f0074aecea13737118b2729f9842c17a2d1161b3540a30e0e1',
  '1d60dc3e11deee79b2c8836e7fdee51d9ac2a59767d852d5ee55b251ee0abb8c',
  '9a342ec9292ec93c7a4de5450a402e2a2d74864e2d3aeb9d0747d9cbcf57ed1b'
];
const cells = [[1, 0], [4, 0], [1, 3], [4, 3]];
export function squad() {
  return seeds.map((seed, i) => {
    const wave = G.tirada(seed, 'tc' + (i + 1));
    const points = Array.from({length: 64}, (_, n) => G.punto(wave.armonicos, n * 2 * Math.PI / 64));
    const extent = Math.max(...points.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]));
    return { id: 'Wave ' + (i + 1), cell: cells[i], tier: 'TC ' + (i + 1),
      edges: wave.aristas, harmonics: wave.armonicos.length,
      points: points.map(([x, y]) => [Number((x / extent * 19).toFixed(1)), Number((y / extent * 19).toFixed(1))]) };
  });
}
