// Canon D4 «Make the honest gacha»: how exact are the published odds? Run: node --test atlas/puros/gacha_exact_odds_cases.mjs
// Two measurements, both without a clock or random numbers:
//   1. Exact arithmetic. The engine draws `uint32 % 1000`. 2^32 is not a multiple of 1000, so the first 296 values
//      are one part in 2^32 more likely. The cases compute, with integers, the true chance of every row of every
//      table and hold the published per-mille to it. Assumption stated, not proved: the uint32 stream is uniform.
//   2. A fixed sample. 250,000 hatches per class from seeds sha256("gacha-exact-odds/<class>/<i>"), compared with
//      the published table by chi-square. Same seeds, same counts, same fingerprint on every run.
// Test-only: no value, cost or odds changes. Pity is not measured here: it has no signed parameter (NO_DATA).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const G = require('../../public/game/gacha.js');
const CLASSES = Object.keys(G.TCS);
const SPACE = 2n ** 32n, MOD = 1000n, N = 250000;
const hatch = G['tirada'], table = G['oddsAristas'], edgesOf = (troop) => troop['aristas'];
const seed = (tc, i) => createHash('sha256').update('gacha-exact-odds/' + tc + '/' + i).digest('hex');

// How many uint32 values u have lo <= u % 1000 < hi. Exact, in integers.
function hits(lo, hi) {
  let n = 0n;
  for (let q = BigInt(lo); q < BigInt(hi); q++) { n += (SPACE - 1n - q) / MOD + 1n; }
  return n;
}
// Upper critical value of chi-square at p = 0.001 (Wilson–Hilferty); within 1% of the tables for df >= 3.
function critical(df) { const k = 2 / (9 * df); return df * Math.pow(1 - k + 3.0902 * Math.sqrt(k), 3); }
function chiSquare(counts, permille, n) {
  return permille.reduce((sum, p, i) => { const e = n * p / 1000; return sum + (counts[i] - e) * (counts[i] - e) / e; }, 0);
}
const sampled = new Map();
function sample(tc) {
  if (!sampled.has(tc)) {
    const rows = table(tc), index = new Map(rows.map((r, i) => [r[0], i])), counts = rows.map(() => 0);
    for (let i = 0; i < N; i++) { counts[index.get(edgesOf(hatch(seed(tc, i), tc)))]++; }
    sampled.set(tc, counts);
  }
  return sampled.get(tc);
}

test('every published table adds up to 1,000 per mille with no empty row', () => {
  for (const tc of CLASSES) {
    const rows = table(tc);
    assert.equal(rows.reduce((s, r) => s + r[1], 0), 1000, tc);
    assert.ok(rows.every((r) => Number.isInteger(r[1]) && r[1] > 0), tc);
  }
});

test('exact: the true chance of each row differs from its published per-mille by less than 296 / 2^32', () => {
  assert.equal(SPACE % MOD, 296n);
  let worst = 0n;                                    // in units of 1 / (1000 * 2^32)
  for (const tc of CLASSES) {
    let lo = 0, total = 0n;
    for (const [, permille] of table(tc)) {
      const n = hits(lo, lo + permille); total += n;
      const gap = n * MOD - BigInt(permille) * SPACE;
      const abs = gap < 0n ? -gap : gap;
      if (abs > worst) { worst = abs; }
      assert.ok(abs < 296n * MOD, tc + ' row at ' + lo);
      lo += permille;
    }
    assert.equal(total, SPACE, tc);                  // every uint32 lands in exactly one row
  }
  // Measured worst row over the four classes: 199,800 / (1000 * 2^32) = 4.65e-8, about one hatch in 21 million.
  assert.equal(worst, 199800n);
});

test('exact: the bias is real and has a direction (the first rows gain, the last rows lose)', () => {
  for (const tc of CLASSES) {
    const rows = table(tc), first = rows[0][1], last = rows[rows.length - 1][1];
    assert.ok(hits(0, first) * MOD > BigInt(first) * SPACE, tc + ' first row');
    assert.ok(hits(1000 - last, 1000) * MOD < BigInt(last) * SPACE, tc + ' last row');
  }
});

test('sample: 250,000 hatches per class follow the published table (chi-square under the p = 0.001 line)', () => {
  for (const tc of CLASSES) {
    const rows = table(tc), counts = sample(tc), x2 = chiSquare(counts, rows.map((r) => r[1]), N);
    assert.equal(counts.reduce((a, b) => a + b, 0), N, tc);
    assert.ok(x2 < critical(rows.length - 1), tc + ' chi-square ' + x2.toFixed(2) + ' >= ' + critical(rows.length - 1).toFixed(2));
  }
});

test('sample: the rarity a visitor reads matches the edges rolled, for all 1,000,000 hatches', () => {
  for (const tc of CLASSES) {
    const rows = table(tc), counts = sample(tc), byRarity = G.RAREZAS.map(() => 0);
    rows.forEach((r, i) => { byRarity[G.RAREZAS.indexOf(G.rarezaDe(r[0]))] += counts[i]; });
    const x2 = chiSquare(byRarity, G.odds(tc), N);
    assert.ok(x2 < critical(G.RAREZAS.length - 1), tc + ' rarity chi-square ' + x2.toFixed(2));
  }
});

test('sabotage: a table with 10 per mille moved between two rows is caught by the same sample', () => {
  for (const tc of CLASSES) {
    const rows = table(tc), bent = rows.map((r) => r[1]);
    bent[0] -= 10; bent[1] += 10;
    assert.ok(chiSquare(sample(tc), bent, N) > critical(rows.length - 1), tc);
  }
});

test('two runs of the same seeds give the same counts, and the fingerprint is the recorded one', () => {
  const print = () => {
    sampled.clear();
    return createHash('sha256').update(JSON.stringify(CLASSES.map((tc) => [tc, sample(tc)]))).digest('hex');
  };
  const a = print(), b = print();
  assert.equal(a, b);
  assert.equal(a, '201289633fc81dd9f9a6a76c68fe23cab288cfaa8dd77c6d4b9157a8dd71004d');
});
