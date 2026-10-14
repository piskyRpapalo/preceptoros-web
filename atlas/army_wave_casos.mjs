// Q1 · one tap opens a readable wave sheet from the existing Army object.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), root = join(fileURLToPath(new URL('..', import.meta.url)));
const V = require(join(root, 'public/game/valores.js'));
const G = require(join(root, 'public/game/gacha.js'));
const W = require(join(root, 'public/game/army-wave-panel.js'));
const sha = s => createHash('sha256').update(s).digest('hex');
const wave = G.tirada(sha('Q1 measured wave'), 'tc1');
const detail = Object.fromEntries(G.STATS.map(k => [k, {
  nivel: k === 'velocidad' ? 2 : 0, max: V.taller.lija.stats.includes(k) ? V.taller.lija.max : 0,
  coste: 4 * (k === 'velocidad' ? 3 : 1), disponible: V.taller.lija.stats.includes(k),
  permitida: V.taller.lija.stats.includes(k), paso: V.taller.lija.paso,
  causa: V.taller.lija.stats.includes(k) ? null : 'this stat is not eligible under the signed Workshop rule'
}]));
const model = W.modelo(wave, detail, V, G);
if (process.argv.includes('--sabotage-source')) model.stats.find(x => x.id === 'vida').fuente = 'sabotaged';
const fail = [];
if (model.stats.length !== G.STATS.length) fail.push('all seven measured stats appear');
for (const k of G.STATS) {
  const row = model.stats.find(x => x.id === k), sem = V.semantica[k];
  if (!row || !sem || row.formula !== sem[0] || row.fuente !== sem[1] || row.clase !== sem[2] || row.lector !== sem[3]) fail.push(k + ' does not show its live semantic dictionary row');
  if (row && (row.base !== wave.stats[k] || row.nivel !== detail[k].nivel || row.max !== detail[k].max)) fail.push(k + ' value or level is not from the wave/receipt');
}
if (model.matematicas.aristas !== wave.aristas || model.matematicas.armonicos !== wave.armonicos.length) fail.push('mathematical description differs from signed wave');
if (JSON.stringify(model.odds.map(x => x.promil)) !== JSON.stringify(G.odds(wave.tc))) fail.push('displayed odds differ from the actual roll table');
if (model.odds.reduce((n, x) => n + x.promil, 0) !== 1000) fail.push('odds do not sum to 1000');
if (!model.origen || model.origen.base !== wave.base || model.origen.rareza !== wave.rareza) fail.push('lore fields are not read from the wave');
if (model.stats.find(x => x.id === 'velocidad').valor !== wave.stats.velocidad + 2 * V.taller.lija.paso) fail.push('effective sanding level is not applied');
if (model.stats.find(x => x.id === 'aura').disponible || !model.stats.find(x => x.id === 'aura').causa) fail.push('unsupported action is not declared with its cause');
if (W.modelo(null, {}, V, G).causa == null) fail.push('missing wave has no NO_DATA cause');
console.log(JSON.stringify({ casos: 12, fallos: fail }, null, 2));
process.exitCode = fail.length ? 1 : 0;
