// F0 · el inventario vivo de funciones como gate (odd/tasks/mapa-25d-aldea.md): ninguna función de /openworld/ se
// pierde al trocear el mapa. Cada fila de atlas/f0_funciones.json exige su script cargado, su global exportado y una
// guarda de navegador que la ejerce y que CORRE en CI. Uso: node --test atlas/f0_funciones_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const T = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const F0 = JSON.parse(T('atlas/f0_funciones.json'));
const pagina = T(F0.pagina), gate = T('.github/workflows/gate.yml');

test('cada script de una función sigue cargado en la página', () => {
  for (const f of F0.funciones) for (const s of f.scripts) assert.ok(pagina.includes('src="' + s + '"'), f.id + ': ' + s + ' ya no se carga');
});

test('cada global sigue exportado por uno de sus scripts', () => {
  for (const f of F0.funciones) {
    const fuente = f.scripts.map((s) => T('public' + s)).join('\n');
    for (const g of f.globals) assert.match(fuente, new RegExp('\\.' + g + '\\s*='), f.id + ': nadie exporta ' + g);
  }
});

test('cada función tiene una guarda de navegador que la ejerce y corre en CI', () => {
  for (const f of F0.funciones) {
    assert.ok(f.guards.length > 0, f.id + ' sin guarda');
    for (const g of f.guards) {
      assert.ok(existsSync(new URL('../' + g.file, import.meta.url)), f.id + ': falta ' + g.file);
      assert.ok(T(g.file).includes(g.text), f.id + ': ' + g.file + ' ya no comprueba «' + g.text + '»');
      assert.ok(gate.includes('node ' + g.file), f.id + ': ' + g.file + ' no corre en CI');
    }
  }
});

test('el inventario cubre todo script de la página (lo nuevo entra con ficha o con causa)', () => {
  const fichados = new Set(F0.funciones.flatMap((f) => f.scripts).concat(F0.soporte || []));
  const sueltos = [...pagina.matchAll(/src="(\/[^"]+)"/g)].map((m) => m[1]).filter((s) => !fichados.has(s));
  assert.deepEqual(sueltos, [], 'scripts sin ficha F0');
});

test('mapa único: cada guarda ejerce la función dentro de /openworld/, no en una página aparte', () => {
  for (const f of F0.funciones) for (const g of f.guards) assert.ok(T(g.file).includes("'/openworld/'") || T(g.file).includes('/openworld/'), f.id + ': ' + g.file + ' no abre /openworld/');
});
