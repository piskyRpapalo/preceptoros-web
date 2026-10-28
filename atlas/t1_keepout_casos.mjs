// T1 · fixture del keep-out: pruebas de la tarjeta NORTE7-T1-KEEPOUT. Uso: node atlas/t1_keepout_casos.mjs
import { readFileSync } from 'node:fs';
const K = await import('./fixtures/t1_keepout.mjs');
const T4 = await import('./fixtures/t4_caminante.mjs');
const REG = JSON.parse(readFileSync(new URL('./fixtures/constantes.json', import.meta.url), 'utf8')).constantes;
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const VIVOS = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'PROPUESTA' }, Claude: { estado: 'HITL' } };
const TODOS = ['atlantis', 'risen'];

caso('ningun carril entra en el radio de un interactivo (500 ticks, nodos vivos)', () => {
  const { historia, inter } = K.simula(VIVOS, 500, TODOS);
  for (const fila of historia) for (const c of fila) {
    for (const it of inter) {
      if (Math.hypot(c.x - it.x, c.y - it.y) < it.radio) return `${c.carril} dentro de ${it.id} en (${c.x},${c.y})`;
    }
  }
  return true;
});

caso('la cabina es origen y tiene radio (cero exenciones)', () => {
  const cab = K.interactivos([]).find((i) => i.id === 'cabin');
  return (cab && cab.x === 3 && cab.y === 2 && cab.radio > 0) || 'cabina sin origen o radio';
});

caso('un nodo sin vida no existe como interactivo: atlantis y risen solo con nodo vivo', () => {
  return K.interactivos([]).length === 1 && K.interactivos(['atlantis']).length === 2 && K.interactivos(TODOS).length === 3
    || 'interactivos mal filtrados';
});

caso('override por instancia gana sobre el radio del tipo', () => {
  return K.radioDe('node', 2.5) === 2.5 || 'el override no aplica';
});

caso('un radio <= 0 o no finito se rechaza', () => {
  for (const malo of [0, -1, NaN, Infinity]) {
    try { K.radioDe('node', malo); return `acepto ${malo}`; } catch (e) { /* esperado */ }
  }
  return true;
});

caso('un tipo sin radio medido se rechaza (NO_DATA, no radio invisible)', () => {
  try { K.radioDe('baliza'); return 'acepto un tipo sin radio'; }
  catch (e) { return e.message.startsWith('NO_DATA') || 'mensaje sin NO_DATA: ' + e.message; }
});

caso('ningun carril cruza el borde del radio (distancia al borde >= 0 en todo tick)', () => {
  const { historia } = K.simula(VIVOS, 500, TODOS);
  for (const fila of historia) for (const c of fila) {
    if (c.distBorde < -1e-9) return `${c.carril} cruza el borde: ${c.distBorde.toFixed(2)}`;
  }
  return true;
});

caso('determinismo: la misma entrada da la misma historia', () => {
  return JSON.stringify(K.simula(VIVOS, 300, TODOS).historia) === JSON.stringify(K.simula(VIVOS, 300, TODOS).historia)
    || 'historias distintas';
});

caso('los carriles no comparten celda y no se mueven mas de una celda por tick', () => {
  const { historia } = K.simula(VIVOS, 400, TODOS);
  for (let t = 0; t < historia.length; t++) {
    const celdas = historia[t].map((c) => c.x + ',' + c.y);
    if (new Set(celdas).size !== celdas.length) return 'solape en tick ' + t;
    if (t > 0) for (let i = 0; i < historia[t].length; i++) {
      const d = Math.abs(historia[t][i].x - historia[t - 1][i].x) + Math.abs(historia[t][i].y - historia[t - 1][i].y);
      if (d > 1) return 'salto en tick ' + t;
    }
  }
  return true;
});

caso('los arranques estan fuera de todo keep-out', () => {
  const { historia, bloq } = K.simula(VIVOS, 1, TODOS);
  return historia[0].every((c) => !bloq.has(c.x + ',' + c.y)) || 'arranque dentro de un radio';
});

caso('cada constante usada tiene procedencia, estado y motivo en el registro', () => {
  for (const c of REG) {
    if (!c.procedencia || !c.estado || !c.motivo) return `${c.nombre} incompleta`;
    if (c.estado === 'NO_DATA' && c.valor !== null) return `${c.nombre} NO_DATA con valor`;
  }
  return true;
});

caso('LEAN y el radio del cuerpo del registro coinciden con los que usa el fixture', () => {
  const lean = REG.find((c) => c.nombre === 'LEAN').valor, rc = REG.find((c) => c.nombre === 'RADIO_CUERPO').valor;
  return (lean === K.LEAN && K.radioDe('cabin') === rc && K.radioDe('node') === rc) || 'registro y fixture no coinciden';
});

caso('el fixture no usa azar del sistema ni reloj', () => {
  const t = readFileSync(new URL('./fixtures/t1_keepout.mjs', import.meta.url), 'utf8');
  return !/Math\.random|Date\.now|performance\.now/.test(t) || 'usa azar o reloj';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
