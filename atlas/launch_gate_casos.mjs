// VT6 · compuerta de lanzamiento (LAUNCH_GATE): tres carriles, 1 clic para la PWA, 2 para app y modelos,
// NO_DATA con causa donde falta medida, y cero peticiones externas en carga.
// Se ejecuta con: node atlas/launch_gate_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const G = require('../public/game/launch_gate.js');

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const cierra = (fallos, re) => fallos.some((f) => re.test(f)) || `no detecta (${re}): ${JSON.stringify(fallos)}`;

const medido = { id: 'orquestador', size_gb: 4.7, sha256: 'ab12', maquina: 'soberano', fecha: '2026-10-19' };
const datos = (extra = {}) => ({ os: 'linux', pwa: { instalable: true, peso_b: 72955 }, release: { firmada: {} },
  cerebros: [medido, { id: 'especialista' }], carga: ['/assets/thegame.js', 'https://preceptoros.org/x.js'], ...extra });
const cerebroDe = (v, id) => v.carriles.find((c) => c.id === id);

caso('valido: PWA con 1 clic, app sin firma = NO_DATA, modelo medido con cifra completa, sin peticion externa', () => {
  const v = G.vista(datos());
  const fallos = G.valida(v);
  if (fallos.length) return 'la vista valida tiene fallos: ' + fallos.join(' | ');
  if (v.saltar.primero !== true) return 'Saltar al Mapa no es el primero';
  const pwa = cerebroDe(v, 'pwa'), app = cerebroDe(v, 'app'), mod = cerebroDe(v, 'orquestador'), sin = cerebroDe(v, 'especialista');
  if (pwa.clics !== 1 || !pwa.boton.activo) return 'la PWA no es de 1 clic activo';
  if (app.boton.activo || !/NO_DATA/.test(app.boton.causa)) return 'app sin firma no es NO_DATA';
  if (mod.cifra !== '4.7 GB · soberano · 2026-10-19' || !mod.boton.activo) return 'modelo medido mal: ' + JSON.stringify(mod);
  if (sin.boton.activo || !/NO_DATA/.test(sin.cifra)) return 'modelo sin medir muestra boton o cifra';
  return true;
});

caso('violacion: un carril con mas de 2 clics', () => {
  const v = G.vista(datos()); v.carriles[1].clics = 3;
  return cierra(G.valida(v), /3 clics/);
});

caso('violacion: modelo sin sha256 con boton de descarga activo', () => {
  const v = G.vista(datos()); cerebroDe(v, 'orquestador').sha256 = null;
  return cierra(G.valida(v), /sin sha256 con boton activo/);
});

caso('violacion: cifra sin maquina ni fecha', () => {
  const v = G.vista(datos()); cerebroDe(v, 'orquestador').cifra = '4.7 GB';
  return cierra(G.valida(v), /cifra sin maquina ni fecha/);
});

caso('violacion: el tamano GB esta medido y no se muestra', () => {
  const v = G.vista(datos()); cerebroDe(v, 'orquestador').cifra = 'NO_DATA (size_gb sin medir)';
  return cierra(G.valida(v), /GB esta medido y no se muestra/);
});

caso('violacion: boton de menos de 44 px', () => {
  const v = G.vista(datos()); cerebroDe(v, 'orquestador').boton.tamano = 40;
  return cierra(G.valida(v), /boton de 40 px/);
});

caso('violacion: peticion externa durante la carga', () => {
  const v = G.vista(datos({ carga: ['/assets/thegame.js', 'https://cdn.ejemplo.org/lib.js'] }));
  return cierra(G.valida(v), /peticion externa en carga: https:\/\/cdn\.ejemplo\.org/);
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
