// Barrido de la basura medida por roadmap/odd/AUDITORIA-WEB-20261101.md (2026-11-01): cada hallazgo, un caso.
// Uso: node --test atlas/barrido_web_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const P = (f) => readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');

const pruebas = readdirSync(new URL('../public/face/', import.meta.url)).filter((f) => f.endsWith('.html') && P('face/' + f).includes('<title>Test ·'));

test('1 · las terminales de prueba no salen en la cara pública: ni en el sitemap ni en el índice del buscador', () => {
  assert.ok(pruebas.length >= 3, 'walker, atlantis y zombie siguen siendo páginas de prueba');
  const mapa = P('sitemap.xml');
  for (const f of pruebas) {
    assert.ok(!mapa.includes('/face/' + f), f + ' no se anuncia');
    assert.match(P('face/' + f), /<meta name="robots" content="noindex">/, f + ' pide no ser indexada');
  }
});

test('2 · la release citada lleva su sello y su causa, y quien la pinta lo muestra', () => {
  const r = JSON.parse(P('release.json'));
  assert.equal(r.sello, 'STALE');
  assert.ok(r.sello_causa && r.sello_causa.includes(r.medido.slice(0, 10)), 'la causa cita la fecha medida');
  assert.ok(P('get-the-app/index.html').includes('seal STALE'), '/get-the-app/ muestra el sello');
  assert.match(P('assets/intro.js'), /tarjeta\.sello \? ' · seal ' \+ tarjeta\.sello/, 'la portada muestra el sello');
});

test('3 · los stubs de la colonia dicen por qué están vacíos', () => {
  const o = P('openworld/index.html');
  assert.ok(!/>Army · NO_DATA</.test(o), 'Army no es un NO_DATA pelado');
  assert.ok(!o.includes('<li>The chat is not live yet.</li>'), 'el chat no es un stub pelado');
  assert.match(o, /The chat is not live yet: NO_DATA until/);
});
