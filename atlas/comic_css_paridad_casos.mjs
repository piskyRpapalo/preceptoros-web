import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const K = require('../public/game/comic_tokens.js');
let css = readFileSync(new URL('../public/game/home.css', import.meta.url), 'utf8');
if (process.argv.includes('--sabotage-drift')) { css = css.replace('--comic-ink:#1E1826', '--comic-ink:#141419'); }
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e.message); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : r }); };
const v = k => (css.match(new RegExp('--comic-' + k + ':(#[0-9A-Fa-f]{6})')) || [])[1];
caso('ink espejo de AtlasComicTokens.NEUTRAL.ink', () => (v('ink') || '').toLowerCase() === K.NEUTRAL.ink.toLowerCase() || 'ink=' + v('ink'));
caso('paper espejo de AtlasComicTokens.NEUTRAL.paper', () => (v('paper') || '').toLowerCase() === K.NEUTRAL.paper.toLowerCase() || 'paper=' + v('paper'));
caso('foco del mando usa el cian del canon', () => /mapa-mando:focus-visible\{outline:3px solid #00D2FF/i.test(css) || 'foco');
caso('el mando no usa violeta', () => !/mapa-mando[^}]*violet/i.test(css) || 'violeta');
caso('reduced-motion declarado para el mando', () => /prefers-reduced-motion:reduce\)\{#thegame \.mapa-mando\{transition:none/.test(css) || 'reduced-motion');
console.log(JSON.stringify(casos, null, 1));
process.exit(casos.every(c => c.ok) ? 0 : 1);
