// preceptoros.org · theGame · IDENTIDADES DE PRUEBA para los casos del multijugador.
//
// Claves Ed25519 DETERMINISTAS (la semilla sale del nombre), firma y verificacion con `node:crypto`.
// Son para las pruebas y nada mas: nunca firman nada de una persona. En la pestana la firma la pone
// `Identity.firmarTexto(sobres.mensaje(s))` y la verificacion, WebCrypto (`AtlasArmy.verificaWeb`).
import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

const PKCS8_ED25519 = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

export function identidad(nombre) {
  const semilla = createHash('sha256').update('prueba:' + nombre).digest();
  const priv = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, semilla]), format: 'der', type: 'pkcs8' });
  const pub = createPublicKey(priv).export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
  return {
    nombre, pub, pseudonimo: 'Test-' + pub.slice(0, 4).toUpperCase(),
    firma: (texto) => sign(null, Buffer.from(texto), priv).toString('hex')
  };
}

export function verificador(texto, firmaHex, claveHex) {
  const k = createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(claveHex, 'hex')]), format: 'der', type: 'spki' });
  return verify(null, Buffer.from(texto), k, Buffer.from(firmaHex, 'hex'));
}

// Una cadena de sobres de una identidad en una sesion: cada llamada es el siguiente `seq`.
export function cadena(S, id, sesion, contenido_v = '2026-09-27.1') {
  let seq = 0, prev = 'genesis';
  return (tipo, cuerpo) => {
    seq += 1;
    const s = { esquema: 'atlas.sobre/1', tipo, sesion, de: id.pub, pseudonimo: id.pseudonimo, seq, prev, contenido_v, cuerpo };
    s.firma = 'ed25519:' + id.firma(S.mensaje(s));
    prev = S.huella(s);
    return s;
  };
}

// Un `r` de commit-reveal de prueba, determinista (en la pestana sale de crypto.getRandomValues).
export function azar(etiqueta) {
  return createHash('sha256').update('azar:' + etiqueta).digest('hex');
}
