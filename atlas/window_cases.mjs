// Corte D (2026-10-28), decision D2: this case tested the /play/ game, retired with its page — ACHO's bubble-era world.
// Retirement guard: retired files stay absent, out of the precache; JSON receipt. Native name (batch 2), renamed with its workflow in the same PR.
// Preceptor contract: study/05-contracts.md (reference is not signature). PS: propose-only + seal: corte-D retirement guard (piece: corte-D-retirada).
import { existsSync, readFileSync } from 'node:fs';

const RETIRADOS = ['public/assets/terminal_window_frame.js'];
const sw = readFileSync('public/sw-listas.js', 'utf8');
const vivos = RETIRADOS.filter(p => existsSync(p)).map(p => 'vive ' + p);
const precache = RETIRADOS.filter(p => sw.includes("'/" + p.replace(/^public\//, '') + "'")).map(p => 'precacheado ' + p);
const fallos = [...vivos, ...precache];
console.log(JSON.stringify({ piece: 'corte-D-retirada', receipt: 'RETIRADO', retirados: RETIRADOS.length, fallos }));
process.exit(fallos.length ? 1 : 0);
