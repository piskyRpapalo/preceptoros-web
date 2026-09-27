// preceptoros.org · theGame · el ARNES del piloto: la linea base, medida.
//
//     node atlas/arnes_piloto.mjs            # escribe public/atlas-record.json
//     node atlas/arnes_piloto.mjs --stdout   # lo imprime y no toca nada
//
// Juega ATLAS sin navegador, con el motor y la instantanea de verdad, un ciclo
// cada vez y el piloto mirando despues de cada ciclo: el mismo bucle que la
// pestana. Mide la regla fija (`piloto_base`) y, al lado, no hacer nada
// (`sin_piloto`), para que la regla tenga contra que compararse tambien.
//
// DETERMINISTA: sin reloj ni azar. La misma ley da el mismo fichero, y por eso
// `atlas/test_atlas.py` lo vuelve a medir y exige que coincida. Sin fecha
// dentro a proposito: una fecha haria distinto cada fichero sin que cambiara
// nada medido.
//
// ESTE ES EL RECORD DE LA CASA (sugerencia firmada por el Soberano,
// 2026-09-27). Un LoRA del juego solo entra si le gana aqui, con la misma ley
// y el mismo horizonte.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(RAIZ, 'public/assets/atlas-motor.js'));
const P = require(join(RAIZ, 'public/assets/atlas-piloto.js'));
const Pa = require(join(RAIZ, 'public/assets/atlas-partida.js'));

export const HORIZONTE = 20000;
const DIA = 'sin-dia';

function aplica(e, a) {
  if (a.accion === 'bajar_a') { return M.bajarA(e, a.banda, DIA); }
  const f = { recoger: M.recoger, reparar: M.reparar, aplazar: M.aplazar }[a.accion];
  return f ? f(e, DIA) : e;
}

export function juega(ley, conPiloto, horizonte = HORIZONTE) {
  let e = M.inicial(ley);
  const acciones = { esperar: 0, recoger: 0, reparar: 0, aplazar: 0, bajar_a: 0 };
  const hasta = {};
  let fallos = 0, invalidas = 0, integridadMin = e.integridad;
  for (let t = 0; t < horizonte; t++) {
    e = M.ciclo(e, ley);
    if (conPiloto) {
      const a = P.decide(Pa.instantanea(e, M), M);
      if (!P.valida(a)) { invalidas++; } else {
        acciones[a.accion]++;
        if (a.accion !== 'esperar') {
          e = aplica(e, a);
          if (e.eventos.at(-1).resultado === 'fallo') { fallos++; }
        }
      }
    }
    integridadMin = Math.min(integridadMin, e.integridad);
    const f = M.fase(e);
    if (f > 1 && !(f in hasta)) { hasta[f] = e.t; }
  }
  return {
    fase_final: M.fase(e), nivel_nucleo: M.nivelNucleo(e),
    ciclos_hasta_fase: hasta, integridad_min: integridadMin,
    integridad_final: e.integridad, integridad_max: e.integridad_max,
    acciones: conPiloto ? acciones : null, fallos: conPiloto ? fallos : null,
    invalidas: conPiloto ? invalidas : null
  };
}

export function mide() {
  const mundo = JSON.parse(readFileSync(join(RAIZ, 'public/atlas-mundo.json'), 'utf8'));
  const casa = M.leyes(mundo);
  const variantes = {
    arnes_rojo: M.leyes({ ...mundo, arnes_sw: '0/1' }),
    sin_mundo: M.leyes(null)
  };
  const r = {
    esquema: 'atlas.record/1',
    procedencia: 'medido por atlas/arnes_piloto.mjs; determinista; atlas/test_atlas.py lo recalcula',
    contenido_v: M.CATALOGO.contenido_v,
    politica: 'piloto_base',
    horizonte_ciclos: HORIZONTE,
    ley: casa,
    piloto_base: juega(casa, true),
    sin_piloto: juega(casa, false),
    variantes: {}
  };
  for (const [k, ley] of Object.entries(variantes)) {
    r.variantes[k] = { ley, piloto_base: juega(ley, true), sin_piloto: juega(ley, false) };
  }
  return r;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const texto = JSON.stringify(mide(), null, 1) + '\n';
  if (process.argv.includes('--stdout')) { process.stdout.write(texto); }
  else {
    writeFileSync(join(RAIZ, 'public/atlas-record.json'), texto);
    const r = JSON.parse(texto);
    console.log(`atlas-record.json · piloto_base: fase ${r.piloto_base.fase_final}, ` +
      `nucleo ${r.piloto_base.nivel_nucleo}, integridad min ${r.piloto_base.integridad_min} · ` +
      `sin_piloto: fase ${r.sin_piloto.fase_final}, nucleo ${r.sin_piloto.nivel_nucleo}, ` +
      `integridad min ${r.sin_piloto.integridad_min}`);
  }
}
