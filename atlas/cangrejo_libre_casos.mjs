// B (FIRMO 2026-10-12): el cangrejo manejable ENCIMA del paseo J1; skills solo de lo que hace; la niebla no se pisa.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require(process.env.LIBRE || '../public/game/crab_free_move.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const abierto = { niebla: () => 0 }, cerrado = { niebla: (x) => (x > 100 ? 1 : 0) };
caso('sin eventos, las skills son NO_DATA con causa (nunca nivel 0)', () => L.skills().every((k) => k.nivel === null && k.causa) || L.skills());
caso('avanzar es un deslizamiento: como mucho VEL por paso, y llega exacto', () => {
  const a = L.avanza({ x: 0, y: 0 }, { x: 30, y: 40 }, 7), b = L.avanza({ x: 0, y: 0 }, { x: 3, y: 4 }, 7);
  return Math.abs(Math.hypot(a[0], a[1]) - 7) < 1e-9 && !a[2] && b[0] === 3 && b[1] === 4 && b[2] || [a, b];
});
caso('tocar mar vacio: el cangrejo nada hasta alli y la llegada es un evento SWIM (nivel 1)', () => {
  L.va({ x: 0, y: 0 }, 70, 0);
  for (let i = 0; i < 30; i++) { L.paso({ x: 0, y: 0 }, [], abierto); }
  const d = L.desplazamiento(), s = L.skills().find((k) => k.id === 'swim');
  return d.x === 70 && d.y === 0 && s.nivel === 1 && s.eventos === 1 || { d, s };
});
caso('la niebla NO se pisa: se para en el borde de lo medido', () => {
  L.va({ x: 0, y: 0 }, 300, 0);
  for (let i = 0; i < 60; i++) { L.paso({ x: 0, y: 0 }, [], cerrado); }
  const d = L.desplazamiento();
  return d.x <= 100 && d.x >= 93 || d;
});
caso('W/A/S/D empujan PASO unidades desde donde va', () => { const a = L.empuja('s'); return a.y === L.desplazamiento().y + L.PASO || a; });
caso('REACH: tocar una pieza a su alcance es un evento; fuera de alcance, no', () => {
  const b = { x: 0, y: 0 }, d = L.desplazamiento(), cerca = L.alcanza(d.x + 10, d.y, 'buoy', b), lejos = L.alcanza(d.x + L.ALCANCE + 50, d.y, 'far', b);
  const r = L.skills().find((k) => k.id === 'reach');
  return (cerca === true || cerca === 'tutorial') && lejos === false && r.eventos === 1 && r.nivel === 1 || { cerca, lejos, r };
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
