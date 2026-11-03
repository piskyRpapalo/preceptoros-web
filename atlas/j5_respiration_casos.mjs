// J5: the renderer's harmonic phase, observed without changing its public API.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const src = readFileSync(new URL('../public/game/wave_render.js', import.meta.url), 'utf8');
const ctx = { Math, AtlasGacha: require('../public/game/gacha.js'), AtlasValores: require('../public/game/valores.js') };
const marker = '  raiz.AtlasOnda = {';
assert.equal(src.split(marker).length, 2);
runInNewContext(src.replace(marker, '  raiz.j5Vivos = vivos;\n' + marker), ctx);
const arm = [[1, 10, 4, 0], [2, 8, 6, 0], [3, 4, 2, 0]];
const vals = (t, respira = true) => JSON.parse(JSON.stringify(ctx.j5Vivos(arm, { t, respira })));
test('golden-angle phase controls harmonic breathing at tick zero', () => {
  const a = vals(0), angle = 2 * Math.PI / (((1 + Math.sqrt(5)) / 2) ** 2);
  assert.ok(Math.abs(a[1][1] / 8 - (1 + 0.05 * Math.sin(angle))) < 1e-12);
  assert.ok(Math.abs(a[2][1] / 4 - (1 + 0.05 * Math.sin(2 * angle))) < 1e-12);
});
test('same tick produces the same harmonics; reduced motion stays unchanged', () => {
  assert.deepEqual(vals(1234), vals(1234));
  assert.deepEqual(vals(0, false), arm);
  assert.deepEqual(vals(1234, false), arm);
  assert.notDeepEqual(vals(0), vals(1234));
});
