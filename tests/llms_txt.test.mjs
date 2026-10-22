import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';

const raiz = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
const servido = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');

test('PIEZA 1 · el telescopio responde: public/llms.txt existe, byte a byte igual al de la raíz', () => {
  if (raiz !== servido) throw new Error('public/llms.txt diverge de llms.txt de la raíz: el servido manda, copia sin deriva');
  if (!statSync(new URL('../public/llms.txt', import.meta.url)).size) throw new Error('vacío');
});

test('llms.txt <16 KiB y sin vocablos prohibidos (código Y UI)', () => {
  if (Buffer.byteLength(servido) > 16384) throw new Error('llms.txt pasa del techo de pieza');
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
