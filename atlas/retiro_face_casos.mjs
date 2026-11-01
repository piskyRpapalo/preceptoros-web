// H2 · retiro de /face (2026-11-01, retirados/face/RETIRO.md): lo retirado no se sirve ni se precachea, su URL deja
// una lápida accesible, y lo vivo que compartía se mudó a /game/ sin que nadie siga pidiéndolo en /face/.
// Uso: node --test atlas/retiro_face_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const R = (f) => new URL('../' + f, import.meta.url);
const T = (f) => readFileSync(R(f), 'utf8');
const RETIRADOS = readdirSync(R('retirados/face/')).filter((f) => /\.(js|css)$/.test(f) && f.startsWith('face'));
const servidos = (dir, out = []) => { for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? servidos(p, out) : /\.(html|js|css)$/.test(n) && out.push(p); } return out; };

test('ningún módulo retirado vive en public/ ni lo pide ninguna página servida', () => {
  assert.ok(RETIRADOS.length >= 16, 'los dieciséis módulos de las pieles están en retirados/face/');
  const todo = servidos(R('public/').pathname).map((p) => readFileSync(p, 'utf8')).join('\n');
  for (const f of RETIRADOS) {
    assert.ok(!existsSync(R('public/face/' + f)), f + ' sigue servido');
    assert.ok(!todo.includes('/face/' + f), f + ' sigue pedido desde una página servida');
  }
});

test('el precache no lista lo retirado y sí lo mudado', () => {
  const l = T('public/sw-listas.js');
  for (const f of RETIRADOS) assert.ok(!l.includes("'/face/" + f + "'"), f + ' sigue en el precache');
  for (const f of ['army.html', 'face_canon.css', 'face_terminal.js']) {
    assert.ok(existsSync(R('public/game/' + f)) && l.includes("'/game/" + f + "'"), f + ' no está en /game/');
    assert.ok(!existsSync(R('public/face/' + f)), f + ' quedó duplicado en /face/');
  }
});

test('cada URL retirada deja una lápida: noindex, lleva al mapa con un objetivo de 44 px y lo dice en texto', () => {
  for (const f of ['atlantis', 'zombie', 'walker']) {
    const t = T('public/face/' + f + '.html');
    assert.match(t, /<title>Retired · /, f);
    assert.match(t, /<meta name="robots" content="noindex">/, f);
    assert.match(t, /min-height:44px[^>]*href="\/openworld\/"/, f + ' sin enlace táctil al mapa');
    assert.match(t, /role="status">This test page was retired/, f + ' no dice por qué');
    assert.ok(!/<script/.test(t) && t.length < 2048, f + ' no es una lápida mínima');
  }
});

test('el recibo nombra cada fichero retirado', () => {
  const r = T('retirados/face/RETIRO.md');
  assert.match(r, /face\*\.\{js,css\}/);
  for (const f of ['atlantis', 'zombie', 'walker', 'army.html', 'face_canon.css', 'face_terminal.js']) assert.ok(r.includes(f), f);
});
