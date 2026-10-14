// Q3 · visible Base access, exact next-roll costs, and measured team cap.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), root = join(fileURLToPath(new URL('..', import.meta.url)));
const V = require(join(root, 'public/game/valores.js'));
const G = require(join(root, 'public/game/gacha.js'));
const A = require(join(root, 'public/game/summon-access.js'));
const m = A.modelo(V, G), fail = [];
if (process.argv.includes('--sabotage')) m.opciones[0].cobre++;
if (!m || m.limiteEquipo !== V.combate.tropas_max || m.limiteEquipo !== 6) fail.push('team cap does not match the measured combat rule');
if (!m || m.opciones.length !== Object.keys(G.TCS).length) fail.push('one visible summon option per measured TC');
for (const [tc, def] of Object.entries(G.TCS)) {
  const x = m.opciones.find(y => y.tc === tc);
  if (!x || x.cobre !== def.coste.cobre || x.luz !== def.coste.luz) fail.push(tc + ' displayed cost differs from the actual roll cost');
}
if (!A.monta || A.destino !== '#casa-estado' || A.simbolo !== '∿') fail.push('summon access is not routed to the top of Base with its own symbol');
console.log(JSON.stringify({ casos: 8, limite_actual: m.limiteEquipo, fallos: fail }, null, 2));
process.exitCode = fail.length ? 1 : 0;
