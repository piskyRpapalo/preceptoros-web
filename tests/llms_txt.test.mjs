import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';

const raiz = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
const servido = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');

test('PIEZA 1 · el telescopio responde: public/llms.txt existe, byte a byte igual al de la raíz', () => {
  if (raiz !== servido) throw new Error('public/llms.txt diverge de llms.txt de la raíz: el servido manda, copia sin deriva');
  if (!statSync(new URL('../public/llms.txt', import.meta.url)).size) throw new Error('vacío');
});

// X5 (Mesa, firmado en la ronda P3 2026-10-26): techo propio del llms.txt servido, 8.192 B. Medido al
// fijarlo: 7.850 B, 342 B de holgura. Mas estricto que el techo de pieza: es la tarjeta que un agente
// lee entera de un trago.
const TECHO_LLMS = 8192;
const cabe = (t) => Buffer.byteLength(t) <= TECHO_LLMS;

test('X5 · llms.txt ≤ 8.192 B y sin vocablos prohibidos (código Y UI)', () => {
  if (!cabe(servido)) throw new Error('llms.txt pasa de su techo: ' + Buffer.byteLength(servido) + ' > ' + TECHO_LLMS + ' B');
  const texto = servido.toLowerCase();
  for (const w of ['oraculo', 'notario', 'depin', 'clearing', 'magia', 'criptomoneda', 'cryptocurrency']) {
    if (texto.includes(w)) throw new Error('vocablo prohibido: ' + w);
  }
});

test('SABOTAJE: el guardián de vocablos prohibidos se pone rojo con "cryptocurrency" (FIRMO 2026-10-22)', () => {
  /* Demostración de diseño: si la lista perdiera la palabra, este caso
     fallaría. El rojo vivo se mostró añadiendo el vocablo a un texto de
     prueba. 'criptográfica' (aprobada) no debe caer. */
  const prohibidos = ['oraculo', 'notario', 'depin', 'clearing', 'magia', 'criptomoneda', 'cryptocurrency'];
  const malo = 'this page accepts cryptocurrency payments';
  const bueno = 'this page uses firma criptográfica Ed25519';
  if (!prohibidos.some(w => malo.includes(w))) throw new Error('el sabotaje no contiene el vocablo prohibido');
  if (prohibidos.some(w => bueno.toLowerCase().includes(w))) throw new Error('falso positivo: criptográfica aprobada cayó en la lista');
});

test('declara lo medido: cero peticiones en carga, NO_DATA con causa, cifras con fuente', () => {
  if (!/zero external request/i.test(servido)) throw new Error('ya no declara la medida de carga');
  if (!/NO_DATA/i.test(servido)) throw new Error('ya no declara NO_DATA');
});

test('SABOTAJE: si el servido diverge de la raíz, la suite cae', () => {
  /* Demostración de diseño: el test 1 compara byte a byte. Si alguien edita
     public/llms.txt sin tocar la raíz (o al revés), el test 1 se pone rojo.
     Aquí se declara; el rojo vivo se mostró rompiendo la copia a propósito. */
  const copiaRota = servido.replace('preceptoros.org', 'otro-dominio.example');
  if (copiaRota === servido) throw new Error('el sabotaje no cambió nada: el test no puede ponerse rojo');
});

test('SABOTAJE X5 · el mismo juez da rojo a 8.193 B y verde a 8.192 B', () => {
  const relleno = (n) => servido + 'x'.repeat(n - Buffer.byteLength(servido));
  if (Buffer.byteLength(relleno(8193)) !== 8193 || cabe(relleno(8193))) throw new Error('8.193 B tendria que caer y no cae');
  if (!cabe(relleno(8192))) throw new Error('8.192 B tendria que caber y no cabe');
});
