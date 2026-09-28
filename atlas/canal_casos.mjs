// Casos del CANAL en cuarentena (`atlas/cuarentena/canal.js`) y de la PUERTA del laboratorio
// (`atlas/puerta_lab.mjs`), con un transporte de prueba que llama a la MISMA puerta que correra el rack.
// Son los sabotajes que el Soberano pidio ver en rojo (2026-09-28, §7): sin firmar, alterado, campo
// desconocido, sobredimensionado, reto repetido, de otra sesion, otra version, lo que la Aduana no tacho,
// acuse que no verifica, {"ok":true} sin acuse, 404/405, y la interfaz afirmando que algo llego.
// Los ejecuta atlas/test_atlas.py:   node atlas/canal_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador } from './mp_firma.mjs';
import { verificaEnvio, recibe, lista, compruebaRegistro } from './puerta_lab.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const C = require('./cuarentena/canal.js');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const todas = (...xs) => { const i = xs.findIndex((x) => x !== true); return i < 0 ? true : 'fallo: ' + String(xs[i]); };
const rechaza = (r, re) => (r && r.ok === false && re.test(r.motivo)) || 'no rechaza como debe: ' + JSON.stringify(r).slice(0, 160);
const copia = (x) => JSON.parse(JSON.stringify(x));

const ANA = identidad('ana-canal'), REC = identidad('receptor-lab');
const RECEPTOR = { pub: REC.pub, firma: REC.firma };
const RECEPTOR_HASH = K.sha('atlas.clave/1:' + REC.pub).slice(0, 16);
let n = 0;
const nuevoReto = () => K.sha('reto:' + (n++)).slice(0, 32);

/* Un rack de prueba: `reto` y `paquetes` con la puerta de verdad y un registro en memoria. `modo` lo estropea. */
function rack(modo = 'bien', registro = []) {
  const retos = [];
  return {
    registro, retos,
    transporte: (url, cuerpo) => {
      if (url === 'https://api.preceptoros.org/api/v1/reto') { const r = nuevoReto(); retos.push(r); return Promise.resolve({ status: 200, json: { reto: r } }); }
      if (modo === '404' || modo === '405') { return Promise.resolve({ status: Number(modo), json: null }); }
      if (modo === 'ok_sin_acuse') { return Promise.resolve({ status: 200, json: { ok: true } }); }
      if (modo === 'sin_red') { return Promise.reject(new Error('fetch failed')); }
      const x = recibe(copia(cuerpo), { registro, receptor: RECEPTOR, recibidoEl: '2026-09-29T10:00:00Z', retos });
      if (!x.ok) { return Promise.resolve({ status: 422, json: x }); }
      if (modo === 'acuse_falso') { x.acuse.firma = 'ed25519:' + '0'.repeat(128); }
      return Promise.resolve({ status: 201, json: { acuse: x.acuse } });
    }
  };
}
function op(r, extra = {}) {
  return { pub: ANA.pub, pseudonimo: ANA.pseudonimo, contenido_v: '2026-09-27.1', maquina: 'portatil de casa',
           ahora: () => '2026-09-29T09:59:00Z', firma: (t) => Promise.resolve(ANA.firma(t)), gesto: true,
           muestra: () => Promise.resolve(true), transporte: r.transporte, receptorHash: RECEPTOR_HASH,
           verifica: (t, f, k) => Promise.resolve(verificador(t, f, k)), ...extra };
}
// Datos de prueba FICTICIOS y partidos (la higiene del repo no admite direcciones literales): una ruta de
// casa, una IP de documentacion (TEST-NET-1) y un correo inventado, para que la Aduana tenga que tacharlos.
const RUTA = '~/' + 'notas/privado', IP = ['192', '0', '2', '7'].join('.'), CORREO = 'ana' + '@' + 'correo.example';
const cuerpo = { respuesta: 'La guia me ayudo; en ' + RUTA + ' y en ' + IP + ' vi el fallo, escribeme a ' + CORREO,
                 veredicto: 'correcta' };

await caso('bueno: Aduana -> firma -> LLEGA -> acuse que verifica -> el arquitecto lo lista', async () => {
  const r = rack(), o = op(r), s = await C.prepara(o, 'valoracion', cuerpo), x = await C.envia(o, s), l = lista(r.registro);
  return todas(x.estado === 'ENTREGADO' || x.motivo, x.acuse && x.acuse.estado === 'cuarentena' || 'la puerta no deja el envio en cuarentena',
               l.firmas === 1 && l.cadena === 'enlazada' || JSON.stringify(l), s.aduana.ruta === 1 && s.aduana.ip === 1 && s.aduana.correo === 1 || JSON.stringify(s.aduana),
               ![RUTA, IP, CORREO].some((x) => JSON.stringify(s).includes(x)) || 'lo tachado viaja en el sobre');
});
await caso('Aduana: si el informe no se puede ensenar, o la persona cancela, no sale nada (ni el reto)', async () => {
  const r = rack(), sale = [];
  const t = (u, c) => { sale.push(u); return r.transporte(u, c); };
  const a = await C.prepara(op(r, { transporte: t, muestra: () => { throw new Error('sin DOM'); } }), 'valoracion', cuerpo).then(() => 'salio', (e) => e.message);
  const b = await C.prepara(op(r, { transporte: t, muestra: () => Promise.resolve(false) }), 'valoracion', cuerpo).then(() => 'salio', (e) => e.message);
  return todas(/sin informe/.test(a) || a, /cancelado/.test(b) || b, sale.length === 0 || 'salio algo: ' + sale.join());
});
await caso('sin gesto no sale nada', async () => {
  const r = rack(), s = await C.prepara(op(r), 'valoracion', cuerpo), x = await C.envia(op(r, { gesto: false }), s);
  return todas(x.estado === 'FALLIDO' || x.estado, /sin gesto/.test(x.motivo) || x.motivo, r.registro.length === 0 || 'entro sin gesto');
});
await caso('404, 405 y sin red: FALLIDO con su codigo, nunca «enviado», y se ofrece exportar para el PR', async () => {
  const x = await Promise.all(['404', '405', 'sin_red'].map(async (m) => { const r = rack(m), o = op(r); return C.envia(o, await C.prepara(o, 'resena', cuerpo)); }));
  return todas(...x.map((y, i) => (y.estado === 'FALLIDO' && /respondio 40[45]|sin red/.test(y.motivo) && y.exporta.includes('atlas.lab_envio/1')) || JSON.stringify(y).slice(0, 120)));
});
await caso('{"ok":true} sin acuse y acuse que no verifica: FALLIDO', async () => {
  const a = rack('ok_sin_acuse'), b = rack('acuse_falso');
  const x = await C.envia(op(a), await C.prepara(op(a), 'valoracion', cuerpo)), y = await C.envia(op(b), await C.prepara(op(b), 'valoracion', cuerpo));
  return todas(/sin acuse/.test(x.motivo) || x.motivo, /no verifica/.test(y.motivo) || y.motivo);
});
await caso('sin la huella del receptor medida no se puede creer un acuse: FALLIDO (NO_DATA)', async () => {
  const r = rack(), x = await C.envia(op(r, { receptorHash: null }), await C.prepara(op(r), 'valoracion', cuerpo));
  return /NO_DATA/.test(x.motivo) || x.motivo;
});
async function sobre() { const r = rack(); return { r, s: await C.prepara(op(r), 'correccion', cuerpo) }; }
await caso('puerta: sin firmar, alterado tras firmar, campo desconocido, sobredimensionado, otra version', async () => {
  const { s } = await sobre();
  const sinFirma = copia(s); sinFirma.firma = '';
  const alterado = copia(s); alterado.cuerpo.veredicto = 'incorrecta';
  const campo = copia(s); campo.servidor = 'relevo';
  const grande = copia(s); grande.cuerpo.respuesta = 'x'.repeat(17000);
  const version = copia(s); version.contenido_v = '2026-09-01.1';
  return todas(rechaza(verificaEnvio(sinFirma), /sin firmar/), rechaza(verificaEnvio(alterado), /alterado/),
               rechaza(verificaEnvio(campo), /forma/), rechaza(verificaEnvio(grande), /sobredimensionado/),
               rechaza(verificaEnvio(version), /otra version/));
});
await caso('puerta: una ruta, un host, una IP o un correo que la Aduana NO tacho, fuera', async () => {
  const { s } = await sobre();
  const x = copia(s); x.cuerpo.respuesta = 'mira ' + IP + ' y ' + '/etc' + '/rack/clave'; delete x.hash; delete x.firma;
  x.hash = C.huella(x); x.firma = 'ed25519:' + ANA.firma(C.mensaje(x));
  return rechaza(verificaEnvio(x), /la Aduana no tacho: ip, ruta|la Aduana no tacho: ruta, ip/);
});
await caso('puerta: reto repetido (reproducido o de otra sesion) y reto que no emitio, fuera', async () => {
  const { r, s } = await sobre();
  const uno = recibe(copia(s), { registro: r.registro, receptor: RECEPTOR, recibidoEl: '2026-09-29T10:00:00Z', retos: r.retos });
  const dos = recibe(copia(s), { registro: r.registro, receptor: RECEPTOR, recibidoEl: '2026-09-29T10:01:00Z', retos: r.retos });
  const ajeno = await C.prepara(op(rack()), 'correccion', cuerpo);
  return todas(uno.ok || uno.motivo, rechaza(dos, /reto repetido/),
               rechaza(recibe(ajeno, { registro: r.registro, receptor: RECEPTOR, recibidoEl: '2026-09-29T10:02:00Z', retos: r.retos }), /no emitio/));
});
await caso('registro: encadenado; tocar una fila rompe la cadena y la puerta deja de recibir', async () => {
  const r = rack(), o = op(r);
  await C.envia(o, await C.prepara(o, 'valoracion', cuerpo)); await C.envia(o, await C.prepara(o, 'resena', cuerpo));
  const bien = compruebaRegistro(r.registro);
  r.registro[0].envio_hash = 'f'.repeat(64);
  const s = await C.prepara(o, 'valoracion', cuerpo);
  return todas(bien === '' || bien, /registro roto/.test(compruebaRegistro(r.registro)) || 'no ve la fila tocada',
               rechaza(recibe(s, { registro: r.registro, receptor: RECEPTOR, recibidoEl: '2026-09-29T11:00:00Z' }), /registro roto/));
});
await caso('la puerta no publica ni da por bueno: todo acuse sale en cuarentena', async () => {
  const r = rack(), o = op(r), x = await C.envia(o, await C.prepara(o, 'valoracion', cuerpo));
  return (x.acuse && x.acuse.estado === 'cuarentena' && Object.keys(x.acuse).indexOf('publicado') < 0) || JSON.stringify(x);
});

if (process.argv.includes('--muestras')) {
  const r = rack(), o = op(r), s = await C.prepara(o, 'valoracion', cuerpo), x = await C.envia(o, s);
  process.stdout.write(JSON.stringify({ envio: s, acuse: x.acuse }) + '\n');
} else {
  process.stdout.write(JSON.stringify(casos) + '\n');
}
