// Corte D (2026-10-28), decision D2 y decreto del Desk: este caso probaba el juego retirado (theGame / /play/).
// Guarda de retirada: los ficheros del juego no existen y no estan en el precache. Mantiene su nombre (los workflows
// no cambian) e imprime un recibo JSON.
import { existsSync, readFileSync } from 'node:fs';

const RETIRADOS = ['public/assets/atlas-carta.js'];
const sw = readFileSync('public/sw-listas.js', 'utf8');
const vivos = RETIRADOS.filter(p => existsSync(p)).map(p => 'vive ' + p);
const precache = RETIRADOS.filter(p => sw.includes("'/" + p.replace(/^public\//, '') + "'")).map(p => 'precacheado ' + p);
const fallos = [...vivos, ...precache];
console.log(JSON.stringify({ piece: 'corte-D-retirada', receipt: 'RETIRADO', retirados: RETIRADOS.length, fallos }));
process.exit(fallos.length ? 1 : 0);
