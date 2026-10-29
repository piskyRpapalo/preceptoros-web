// Checks the generated fixture's actual rendering and button handlers without a browser.
import { readFileSync } from 'node:fs';
import { runInNewContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();
const document = { getElementById(id) {
  if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', setAttribute() {},
    addEventListener(_type, handler) { this.click = handler; } });
  return elements.get(id);
} };
const context = { document };
runInNewContext(script, context);
const frames = runInContext('D.hist4', context);
const lanes = runInContext('D.carriles', context);
for (let tick = 0; tick < frames.length; tick++) {
  if (tick) document.getElementById('t4-paso').click();
  const expected = frames[tick].flatMap((cell, index) => tick &&
    cell.x === frames[tick - 1][index].x && cell.y === frames[tick - 1][index].y ? [lanes[index]] : []);
  assert.ok(document.getElementById('t4-estado').textContent.endsWith(expected.join(', ') || 'ninguno'));
  const groups = [...document.getElementById('t4-svg').innerHTML.matchAll(/<g role="img"[\s\S]*?<\/g>/g)];
  assert.equal(groups.length, lanes.length);
  for (const [group] of groups) assert.equal((group.match(/<text\b/g) || []).length, 1);
}
console.log(`PASS: ${frames.length} fixture frames; lane waits and one mark per body`);
