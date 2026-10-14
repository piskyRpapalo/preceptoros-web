// Q2 · exact reveal card data from the signed wave, semantic table, and gacha rules.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), root = join(fileURLToPath(new URL('..', import.meta.url)));
const V = require(join(root, 'public/game/valores.js'));
const G = require(join(root, 'public/game/gacha.js'));
const C = require(join(root, 'public/game/summon-wave-card.js'));
const wave = G.tirada('9'.repeat(64), 'tc1'), model = C.modelo(wave, V, G), fail = [];
if (process.argv.includes('--sabotage')) model.armonicos = '';
if (!model || model.stats.length !== G.STATS.length) fail.push('reveal shows every measured stat');
if (!model || model.tc !== wave.tc || model.aristas !== wave.aristas || model.armonicos !== wave.armonicos.map(h => h.join(',')).join(';')) fail.push('reveal equation differs from the signed harmonic vector');
for (const k of G.STATS) {
  const s = model && model.stats.find(x => x.id === k), sem = V.semantica[k];
  if (!s || s.valor !== wave.stats[k] || !sem || s.formula !== sem[0] || s.fuente !== sem[1] || s.clase !== sem[2] || s.lector !== sem[3]) fail.push(k + ' differs from wave or semantic dictionary');
}
if (!model || model.lore.base !== wave.base || model.lore.prefijo !== wave.prefijo || model.lore.sufijo !== wave.sufijo) fail.push('lore is not sourced from wave');
if (!C.personaliza) fail.push('reveal lacks direct Workshop routing');
console.log(JSON.stringify({ casos: 10, fallos: fail }, null, 2));
process.exitCode = fail.length ? 1 : 0;
