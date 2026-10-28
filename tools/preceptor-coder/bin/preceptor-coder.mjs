#!/usr/bin/env node
// preceptor-coder · turns bubble-language frames into SVG drawings both the web and the app can render.
// Commands:  draw FRAME.json [--out FILE.svg]   · check FRAME.json   · measure FRAME.json
// The frame must obey the law (under 1,024 bytes, one sentence per atom, a declared sound). Deterministic: no
// Math.random, no clock. Operations the painter does not know are counted and reported, never silently dropped.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const BUBBLE = require(fileURLToPath(new URL('../../../public/game/bubble_language.js', import.meta.url)));
const compila = (BUBBLE.AtlasBubble || BUBBLE).compile;
const LIMITE = 1024;

export function ley(frame) {
  const problemas = [];
  const bytes = Buffer.byteLength(JSON.stringify(frame), 'utf8');
  if (bytes >= LIMITE) { problemas.push(`frame of ${bytes} bytes, limit ${LIMITE}`); }
  (frame.atoms || []).forEach((a, i) => { if (!a || typeof a.r !== 'string' || !a.r.trim()) { problemas.push(`atom ${i} has no sentence (r)`); } });
  if (typeof frame.sound !== 'string' || !frame.sound) { problemas.push('sound not declared'); }
  return problemas;
}

const f2 = (n) => (Math.round(n * 100) / 100).toString();
const color = (c) => (c === null || c === undefined ? 'none' : c);

// svg(frame) → { svg, desconocidas, operaciones }
export function svg(frame) {
  const ops = compila(frame);
  const cuenta = { operaciones: 0 };
  const desconocidas = {};
  function pinta(lista) {
    return lista.map((o) => {
      cuenta.operaciones++;
      if (o.op === 'group') {
        const t = `translate(${f2(o.x || 0)} ${f2(o.y || 0)}) rotate(${f2(o.rot || 0)}) scale(${f2(o.s || 1)})`;
        return `<g transform="${t}">${pinta(o.items || [])}</g>`;
      }
      if (o.op === 'path') { return `<path d="${o.d}" fill="${color(o.fill)}" stroke="${color(o.stroke)}" stroke-width="${f2(o.lw || 0)}"/>`; }
      if (o.op === 'circle') { return `<circle cx="${f2(o.x)}" cy="${f2(o.y)}" r="${f2(o.r)}" fill="${color(o.fill)}" stroke="${color(o.stroke)}" stroke-width="${f2(o.lw || 0)}"/>`; }
      desconocidas[o.op] = (desconocidas[o.op] || 0) + 1;
      return '';
    }).join('');
  }
  const [ancho, alto] = frame.cv || [320, 96];
  const cuerpo = pinta(ops);
  const salida = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${(frame.atoms || []).map((a) => a.r).join('; ').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${cuerpo}</svg>\n`;
  return { svg: salida, desconocidas, operaciones: cuenta.operaciones };
}

function cargaFrame(ruta) { return JSON.parse(readFileSync(ruta, 'utf8')); }

function main(argv) {
  const [orden, ruta, ...resto] = argv;
  if (!orden || !ruta) { console.error('usage: preceptor-coder draw|check|measure FRAME.json [--out FILE.svg]'); return 2; }
  const frame = cargaFrame(ruta);
  const problemas = ley(frame);
  if (orden === 'check') {
    console.log(problemas.length ? 'LAW · ' + problemas.join(' · ') : 'LAW · ok');
    return problemas.length ? 1 : 0;
  }
  if (problemas.length) { console.error('LAW · refused: ' + problemas.join(' · ')); return 1; }
  const r = svg(frame);
  if (orden === 'measure') {
    console.log(JSON.stringify({ bytes_svg: Buffer.byteLength(r.svg, 'utf8'), operaciones: r.operaciones, desconocidas: r.desconocidas }));
    return 0;
  }
  if (orden === 'draw') {
    const i = resto.indexOf('--out');
    if (i >= 0) { writeFileSync(resto[i + 1], r.svg, 'utf8'); } else { process.stdout.write(r.svg); }
    if (Object.keys(r.desconocidas).length) { console.error('unknown ops (not drawn): ' + JSON.stringify(r.desconocidas)); }
    return 0;
  }
  console.error('unknown command: ' + orden);
  return 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
