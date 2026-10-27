// PR-1 (FIRMO 2026-10-12): la ventana como UNA entidad; el sello y la edad salen de lo MEDIDO (ciclos), nunca del reloj.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require(process.env.VENTANA || '../public/assets/terminal_window_frame.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
caso('LIVE si el panel cambio hace <= 120 ciclos; STALE si mas (lo viejo no se pinta como fresco)', () => {
  const a = V.cabecera('pliego-estado', 'Your crab', 100, 220), b = V.cabecera('pliego-estado', 'Your crab', 100, 221);
  return a.sello === 'LIVE' && a.edad === 'Δ 120 cycles since last change seen' && b.sello === 'STALE' || { a, b };
});
caso('sin ciclo medido: NO_DATA con causa, en sello y edad', () => { const c = V.cabecera('pliego-estado', 'x', null, null); return c.sello === 'NO_DATA' && /NO_DATA \(/.test(c.edad) || c; });
caso('panel sin fuente declarada o sin titulo: NO_DATA con causa (jamas undefined)', () => {
  const c = V.cabecera('panel-raro', '', 5, 6), j = JSON.stringify(c);
  return /NO_DATA \(source not declared\)/.test(c.fuente) && /NO_DATA \(untitled/.test(c.titulo) && !/undefined|NaN/.test(j) || c;
});
caso('cada panel conocido del cajon declara su fuente', () => ['pliego-estado', 'pliego-lugares', 'pliego-entrada', 'terminal-cangrejo', 'radio-estado', 'pliego-lapidas', 'pliego-skills', 'pliego-ficha', 'pliego-tutorial'].every((k) => V.FUENTES[k]));
for (const bad of [undefined, null, NaN, Infinity, -1, 1.5, '4', 1000000001]) {
  caso('invalid measured cycle stays NO_DATA: ' + String(bad), () => {
    const a = V.cabecera('pliego-estado', 'State', bad, 10);
    const b = V.cabecera('pliego-estado', 'State', 0, bad);
    return [a, b].every((x) => x.sello === 'NO_DATA' && /NO_DATA \(/.test(x.edad)) || { a, b };
  });
}
caso('a reset cannot turn a future observation into a fresh measurement', () => {
  const c = V.cabecera('pliego-estado', 'State', 20, 10);
  return c.sello === 'NO_DATA' && /NO_DATA \(/.test(c.edad) || c;
});
caso('zero and upper cycle boundary remain measured', () => {
  const a = V.cabecera('pliego-estado', 'State', 0, 0), b = V.cabecera('pliego-estado', 'State', 1000000000, 1000000000);
  return [a, b].every((x) => x.sello === 'LIVE' && x.edad === 'Δ 0 cycles since last change seen') || { a, b };
});
// T_CRT (FIRMO 2026-10-19, Comando #15): el interactivo abre en la superficie entera del tubo; la rueda vive en la esquina contraria.
import { readFileSync as leeT } from 'node:fs';
const SH = leeT(new URL('../public/assets/terminal_menu_shell.js', import.meta.url), 'utf8');
const CSS = leeT(new URL('../public/assets/terminal_menu_shell.css', import.meta.url), 'utf8');
const regla = (sel) => { const i = CSS.indexOf(sel + '{'); return i < 0 ? null : CSS.slice(i + sel.length + 1, CSS.indexOf('}', i)); };
caso('T_CRT: cajon y hojas llevan surface-slot (todo interactivo abre en la superficie del tubo)', () => {
  const ok = SH.includes("cajon.classList.add('surface-slot')") && SH.includes("d.classList.add('surface-slot')");
  return ok || 'falta surface-slot';
});
caso('T_CRT: surface-slot = 100% del interior: menu a la izquierda, borde derecho, barra arriba, chat abajo; sin tope de ancho ni traslado', () => {
  const r = regla('.thegame-terminal.surface-slot,.thegame-hoja.surface-slot');
  const pide = ['left:var(--menu)', 'right:0', 'top:var(--thegame-tope)', 'bottom:var(--pie)', 'width:auto', 'max-width:none', 'max-height:none', 'transform:none'];
  return (r && pide.every((x) => r.split(';').includes(x))) || { r };
});
caso('T_CRT: cada boton del menu abre el cajon o una hoja, nunca un modal suelto', () => {
  const ids = [...SH.matchAll(/entrada\('(\w+)'[^\n]*?setAttribute\('aria-controls', '([\w-]+)'\)/g)].map((m) => [m[1], m[2]]);
  return (ids.length === 5 && ids.every(([, c]) => c === 'thegame-terminal' || c === 'thegame-ondas')) || ids;
});
caso('T_CRT: panel de control abajo a la derecha, rueda >= 44 px, y el chat termina antes de el', () => {
  const c = regla('.crt-controls'), z = regla('.crt-z'), chat = CSS.includes(':root:has(#crt-controls) .radio-chat{right:var(--crt-w)}');
  const ok = c && c.includes('right:0') && c.includes('bottom:0') && z && z.includes('min-width:2.75rem') && z.includes('min-height:2.75rem') && chat;
  return ok || { c, z, chat };
});
caso('T_CRT: la rueda es un range nativo (teclado, raton y tactil) con paradas 1,00/0,50/0,25 y rotulo vivo', () => {
  const ok = SH.includes("wheel.type = 'range'") && SH.includes("wheel.setAttribute('list', 'z-detents')") && SH.includes("out.setAttribute('aria-live', 'polite')") && SH.includes("wheel.setAttribute('aria-valuetext'");
  return ok || 'rueda incompleta';
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
