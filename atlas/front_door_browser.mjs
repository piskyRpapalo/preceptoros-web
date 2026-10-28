// Corte D (2026-10-28), decision D2: esta suite de navegador probaba el juego de /play/, retirado con su pagina.
// Guarda de retirada: los ficheros del juego no existen y no estan en el precache. Mantiene su nombre para que el
// workflow no cambie, e imprime un recibo JSON con el mismo formato que el resto de suites.
import { existsSync, readFileSync } from 'node:fs';

const RETIRADOS = ['public/game/front_door.js', 'public/assets/front_door_view.js'];
const sw = readFileSync('public/sw-listas.js', 'utf8');
const vivos = RETIRADOS.filter(p => existsSync(p)).map(p => 'vive ' + p);
const precache = RETIRADOS.filter(p => sw.includes("'/" + p.replace(/^public\//, '') + "'")).map(p => 'precacheado ' + p);
const fallos = [...vivos, ...precache];
console.log(JSON.stringify({ piece: 'corte-D-retirada', receipt: 'RETIRADO', retirados: RETIRADOS.length, fallos }));
process.exit(fallos.length ? 1 : 0);
