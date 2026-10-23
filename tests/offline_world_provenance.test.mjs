import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const piso = read('../public/assets/atlas-piso.js');
const motorSource = read('../public/assets/atlas-motor.js');
const sw = read('../public/sw.js');
const lists = read('../public/sw-listas.js');

function loadMotor(source = motorSource) {
  const module = { exports: {} };
  vm.runInNewContext(source, { module, isFinite, Math, Date });
  return module.exports;
}

test('missing world data is explicitly marked neutral by the shipped engine', () => {
  const motor = loadMotor();
  assert.equal(motor.leyes(null).nd, true);
  assert.equal(motor.leyes({ pruebas_web: 100, arnes_sw: '2/2', gzip_juego_b: 1 }).nd, false);
});

test('world fetch failure reaches the neutral engine input', () => {
  assert.match(piso, /json\('atlas-mundo\.json'\)\.catch\(function \(\) \{ return null; \}\)/);
  assert.match(piso, /LEY = M\.leyes\(MUNDO\)/);
});

test('measurement JSON is excluded from the service-worker content allowlist', () => {
  const contentList = lists.match(/const CONTENIDO_JSON =([\s\S]*?);/);
  assert.ok(contentList, 'content allowlist must remain explicit');
  assert.doesNotMatch(contentList[1], /atlas-mundo\.json/);
  assert.match(sw, /url\.pathname\.endsWith\('\.json'\)[\s\S]*?CONTENIDO_JSON\.indexOf\(url\.pathname\) < 0/);
});

test('sabotage: suppressing the neutral provenance bit is detected', () => {
  const sabotaged = motorSource.replace('nd = !mundo', 'nd = false');
  assert.notEqual(sabotaged, motorSource, 'sabotage target must exist');
  assert.equal(loadMotor(sabotaged).leyes(null).nd, false);
  assert.throws(() => assert.equal(loadMotor(sabotaged).leyes(null).nd, true));
});
