// RONDA 2 · chunk 3 (FIRMO 13-oct): cada banda de un edificio toon lleva el hue DE SU VECTOR; sabotaje: hue inventado -> rojo.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.AtlasToon = require('../public/game/crab_render_hd.js');
const B = require(process.env.BTOON || '../public/game/buildings_toon.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
function ctx() {
  const fills = [];
  return { fills, globalAlpha: 1, lineWidth: 1, fillStyle: '', strokeStyle: '', beginPath() {}, arc() {}, fill() { fills.push(this.fillStyle); }, stroke() { fills.push('stroke:' + this.strokeStyle); },
           save() {}, restore() {}, clip() {}, moveTo() {}, lineTo() {}, closePath() {} };
}
const hue = (c) => +String(c).match(/^hsl\((\d+) /)[1];
caso('todas las bandas de un edificio llevan el hue de su vector (boya en 196: mar)', () => {
  const g = ctx(); B.disco(g, 0, 0, 10, { h: 196, s: 60, l: 50 }, 1, 1);
  const todas = g.fills.map((f) => f.replace(/^stroke:/, ''));   // 3 bandas (sombra, base, brillo) + el contorno
  return todas.length === 4 && todas.every((f) => hue(f) === 196) || g.fills;
});
caso('el Cristal (escala de niveles) pinta con el hue de su nivel, no con otro', () => {
  const g = ctx(); B.disco(g, 0, 0, 10, { h: 130, s: 70, l: 55 }, 1, 1);
  return g.fills.filter((f) => /^hsl/.test(f)).every((f) => hue(f) === 130) || g.fills;
});
caso('sin AtlasToon cargado: relleno plano de siempre, sin romper', () => {
  const T = globalThis.AtlasToon; globalThis.AtlasToon = undefined;
  const g = ctx(); let ok = false;
  try { B.disco(g, 0, 0, 10, { h: 40, s: 50, l: 50 }, 1, 1); ok = g.fills.length >= 1; } finally { globalThis.AtlasToon = T; }
  return ok || g.fills;
});
// RONDA 3 · chunk 3: cada silueta infantil (boya, observatorio, cristal, lapidas) tiene SOLO el hue de su vector.
for (const kind of ['boya', 'observatorio', 'cristal', 'lapidas']) {
  caso('forma ' + kind + ': todas las bandas y el contorno llevan el hue del vector (sabotaje: hue inventado -> rojo)', () => {
    const g = ctx(); B.forma(g, kind, 0, 0, 10, { h: 40, s: 60, l: 50 }, 1, 1);
    const todas = g.fills.map((f) => f.replace(/^stroke:/, '')).filter((f) => /^hsl/.test(f));
    return todas.length >= 4 && todas.every((f) => hue(f) === 40) || g.fills;
  });
}
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
