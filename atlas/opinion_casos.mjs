// preceptoros.org · theGame · casos del VERIFICADOR de opiniones firmadas. Los corre test_atlas.
import { generateKeyPairSync, sign } from 'node:crypto';
import { verificaOpinion } from './verifica_opinion.mjs';

const casos = [];
function caso(nombre, f) {
  let ok = false, detalle = '';
  try { const r = f(); ok = r === true; if (!ok) { detalle = JSON.stringify(r); } } catch (e) { detalle = e.message; }
  casos.push({ caso: nombre, ok, detalle });
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
const op = () => ({ esquema: 'atlas.opinion/1', contenido_v: '2026-09-27.1', sobre: 'veredicto', ciclo: 120,
  estado_sha256: 'a'.repeat(64), mostrado: 'Structural tie', eleccion: 'de_acuerdo', nota: 'the pilot was right' });
function sobre(o, clave = privateKey) {
  return { esquema: 'atlas.opinion.firmada/1', opinion: o,
    firma: 'ed25519:' + sign(null, Buffer.from(JSON.stringify(o)), clave).toString('hex'),
    algoritmo: 'Ed25519', pseudonimo: 'caso', clave_publica: pub };
}
caso('una opinion de verdad entra', () => { const r = verificaOpinion(sobre(op())); return r.ok || r; });
caso('cambiar la respuesta despues de firmar -> firma', () => {
  const s = sobre(op()); s.opinion.eleccion = 'en_desacuerdo';
  const r = verificaOpinion(s); return r.motivo === 'firma: no verifica' || r;
});
caso('firmada con OTRA clave -> firma', () => {
  const r = verificaOpinion(sobre(op(), generateKeyPairSync('ed25519').privateKey)); return r.motivo === 'firma: no verifica' || r;
});
caso('nota con correo, bien firmada -> se rechaza igual', () => {
  const o = op(); o.nota = 'write me at x@y'; const r = verificaOpinion(sobre(o));
  return r.motivo === 'nota: ruta, correo, enlace o IP' || r;
});
caso('campo de mas -> forma', () => { const s = sobre(op()); s.extra = 1; const r = verificaOpinion(s); return r.motivo === 'forma: sobre' || r; });
caso('respuesta fuera del enum -> forma', () => { const o = op(); o.eleccion = 'quiza'; const r = verificaOpinion(sobre(o)); return r.motivo === 'forma: eleccion' || r; });
caso('la huella del estado se declara NO_DATA, no se da por buena', () => { const r = verificaOpinion(sobre(op())); return /^NO_DATA/.test(r.estado) || r; });
process.stdout.write(JSON.stringify(casos));
