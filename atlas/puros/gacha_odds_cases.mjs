// Gacha odds contract (D4, "the ten thousand draws"). Offline, synthetic.
//
//     node --test atlas/puros/gacha_odds_cases.mjs   (from the repo root)
//
// Declared odds come from public/game/values.js (aristas, rareza_aristas).
// Measured odds come from the public API of public/game/gacha.js only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const G = require(join(RAIZ, 'public/game/gacha.js'));
const V = require(join(RAIZ, 'public/game/values.js'));

const N = 10000;
const CLASES = Object.keys(V.aristas);
const RAREZAS = ['normal', 'magico', 'raro', 'unico'];

// Seed: sha256 of a label, as 64 lowercase hex characters (the format gacha.js accepts).
const semilla = (i, pre = 'd4-') => createHash('sha256').update(pre + i).digest('hex');

// Declared weights per mille, derived from the thresholds rareza_aristas.
// Arista count n: normal if n <= normal, magico if n <= magico, raro if n <= raro, else unico.
function pesos(tc) {
  const w = { normal: 0, magico: 0, raro: 0, unico: 0 }, u = V.rareza_aristas;
  for (const [n, peso] of V.aristas[tc]) {
    const r = n <= u.normal ? 'normal' : n <= u.magico ? 'magico' : n <= u.raro ? 'raro' : 'unico';
    w[r] += peso;
  }
  return w;
}

// Strip comments, so that a word in a comment cannot fail or hide a call.
function sinComentarios(fuente) {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
}

test('declared odds per class sum to 1 and equal the odds shown', (t) => {
  const filas = [];
  for (const tc of CLASES) {
    const w = pesos(tc), suma = RAREZAS.reduce((a, r) => a + w[r], 0);
    assert.equal(suma, 1000, `${tc}: weights sum to ${suma}, not 1000`);
    assert.deepEqual(G.odds(tc), RAREZAS.map((r) => w[r]), `${tc}: odds() differs from the declared weights`);
    filas.push(`${tc}  ` + RAREZAS.map((r) => `${r} ${(w[r] / 10).toFixed(1)}%`).join('  '));
  }
  t.diagnostic('declared odds (sum 100%):\n' + filas.join('\n'));
});

for (const tc of CLASES) {
  test(`${tc}: 10 000 draws stay within 4 binomial standard deviations`, (t) => {
    const w = pesos(tc), cuenta = Object.fromEntries(RAREZAS.map((r) => [r, 0]));
    for (let i = 0; i < N; i++) { cuenta[G.tirada(semilla(i), tc).rareza] += 1; }
    t.diagnostic(`${tc} measured: ${JSON.stringify(cuenta)}`);
    for (const r of RAREZAS) {
      const p = w[r] / 1000, esperado = N * p, sd = Math.sqrt(N * p * (1 - p));
      if (p === 0) { assert.equal(cuenta[r], 0, `${tc} ${r}: expected 0 draws`); continue; }
      assert.ok(Math.abs(cuenta[r] - esperado) <= 4 * sd,
        `${tc} ${r}: measured ${cuenta[r]}, expected ${esperado.toFixed(1)}, limit 4 sd = ${(4 * sd).toFixed(1)}`);
    }
  });
}

test('same seed gives the same draw (200 seeds, 4 classes)', () => {
  for (let i = 0; i < 200; i++) {
    const s = semilla(i, 'rep-'), tc = CLASES[i % CLASES.length];
    assert.deepEqual(G.tirada(s, tc), G.tirada(s, tc), `seed ${i} ${tc}`);
  }
});

test('same seed gives the same raw number sequence (200 seeds)', () => {
  for (let i = 0; i < 200; i++) {
    const s = semilla(i, 'seq-'), a = G.generador(s), b = G.generador(s);
    const secA = Array.from({ length: 50 }, () => a.mil()), secB = Array.from({ length: 50 }, () => b.mil());
    assert.deepEqual(secA, secB, `seed ${i}`);
  }
});

test('different seeds do not all give the same draw', (t) => {
  const vistas = new Set();
  for (let i = 0; i < 200; i++) {
    const { semilla: _s, ...resto } = G.tirada(semilla(i, 'rep-'), 'tc1');
    vistas.add(JSON.stringify(resto));
  }
  t.diagnostic(`distinct draws (seed field removed): ${vistas.size} of 200`);
  assert.ok(vistas.size > 1, 'all 200 seeds gave one draw');
});

test('gacha.js does not call Math.random', () => {
  const fuente = sinComentarios(readFileSync(join(RAIZ, 'public/game/gacha.js'), 'utf8'));
  assert.doesNotMatch(fuente, /Math\.random/);
});
