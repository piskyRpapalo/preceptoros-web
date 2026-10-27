// North N2 (2026-10-26, Mesa ruling A): /aduana/ is OBSERVANT. It loads exactly the node chain test_atlas declares,
// says about the registry only what the contract (REGISTRO) says, loads nothing external and sends nothing while the
// registry is not LIVE. The same judge runs on a sabotaged copy that claims a live registry.
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const leer = (r) => readFileSync(new URL('../' + r, import.meta.url), 'utf8');
const R = require('../public/game/node_reception_contract.js');
const PAGINA = leer('public/aduana/index.html');
const DECLARADAS = (leer('atlas/test_atlas.py').match(/ADUANA_PAGE_DEPENDENCIES = \(([^)]*)\)/) || [, ''])[1].match(/"([^"]+)"/g).map((x) => x.slice(1, -1));

function juez(t, reg) {
  const fallos = [];
  const juego = [...t.matchAll(/<script src="\/game\/([^"]+)"><\/script>/g)].map((m) => m[1]);
  if (JSON.stringify(juego) !== JSON.stringify(DECLARADAS)) { fallos.push('page modules differ from ADUANA_PAGE_DEPENDENCIES: ' + juego.join(',')); }
  const registro = (t.match(/<td id="estado-registro">([^<]*)<\/td>/) || [, null])[1];
  if (registro !== (reg.estado === 'LIVE' ? 'Live' : 'NO_DATA')) { fallos.push('registry state differs from the contract: ' + registro); }
  if (reg.estado !== 'LIVE' && !/<td id="estado-envio">Asleep<\/td>/.test(t)) { fallos.push('sending is not declared asleep'); }
  if (!/This page registers nothing yet/.test(t)) { fallos.push('the page does not say it registers nothing'); }
  if (/<(script|img|iframe)[^>]+src="https?:|<link[^>]+href="https?:[^"]*"[^>]*rel="stylesheet"/.test(t)) { fallos.push('loads something external'); }
  if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(t)) { fallos.push('an IP address in the page'); }
  return fallos;
}

test('N2 · /aduana/ is observant and says only what the contract measures', () => {
  const f = juez(PAGINA, R.REGISTRO);
  if (f.length) { throw new Error(f.join(' | ')); }
  if (R.REGISTRO.estado === 'LIVE') { throw new Error('REGISTRO says LIVE: deploying the registry needs its own measurement and FIRMO'); }
});

test('N2 · the install guide leads to /aduana/', () => {
  if (!leer('public/get-the-app/index.html').includes('<a href="/aduana/">')) { throw new Error('/get-the-app/ does not link /aduana/'); }
});

test('SABOTAGE N2 · a page that claims a live registry, or loads one more module, turns the judge red', () => {
  const vivo = PAGINA.replace('<td id="estado-registro">NO_DATA</td>', '<td id="estado-registro">Live</td>');
  if (!juez(vivo, R.REGISTRO).some((x) => /registry state/.test(x))) { throw new Error('a false "Live" stayed green'); }
  const extra = PAGINA.replace('<script src="/game/canon.js"></script>', '<script src="/game/canon.js"></script><script src="/game/arena.js"></script>');
  if (!juez(extra, R.REGISTRO).some((x) => /page modules/.test(x))) { throw new Error('an extra module stayed green'); }
});
