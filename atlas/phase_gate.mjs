// Phase budgets supplement the inherited suites; no runtime or public data changes.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const root = new URL('../public/', import.meta.url);
function walk(base) {
  return readdirSync(new URL(base, root)).flatMap(name => {
    const path = base + name;
    return statSync(new URL(path, root)).isDirectory() ? walk(path + '/') : [path];
  });
}
const files = walk('');
const checked = files.filter(p => /\.(?:js|css|json|html)$/.test(p));
for (const path of checked) {
  assert(readFileSync(new URL(path, root)).byteLength < 16384, path + ' exceeds 16 KiB');
}
// The 16 KiB phase ceiling on the lab instruments (this file, the phase cases, the browser
// harnesses) was abolished by the Sovereign, 2026-10-26 (FIRMO). Served files keep theirs above.
const loader = readFileSync(new URL('assets/thegame.js', root), 'utf8');
assert(/var LENGUAS = \['en'\]/.test(loader), 'English-only loader changed');
const scripts = loader.match(/var GUIONES = (\[[\s\S]*?\]);/);
const styles = loader.match(/\[('atlas\.css'[\s\S]*?)\]\.forEach/);
assert(scripts && styles, 'initial assets cannot be measured');
const entry = new Set(['assets/thegame.js', 'atlas-en.json']);
for (const [, path] of scripts[1].matchAll(/\[\s*'([^']+)'/g)) {
  entry.add(path.startsWith('/') ? path.slice(1) : 'assets/' + path);
}
for (const [, path] of styles[1].matchAll(/'([^']+)'/g)) entry.add('assets/' + path);
const front = readFileSync(new URL('assets/front_door_view.js', root), 'utf8');
const frontScripts = front.match(/var SCRIPTS = (\[[\s\S]*?\]);/);
assert(frontScripts, 'front door load set missing');
entry.add('assets/front_door_view.js'); entry.add('assets/front_door.css');
for (const [, path] of frontScripts[1].matchAll(/'([^']+)'/g)) entry.add(path.slice(1));
let gzip = 0;
for (const path of entry) {
  assert(files.includes(path), 'initial artifact missing: ' + path);
  gzip += gzipSync(readFileSync(new URL(path, root)), {level:9}).byteLength;
}
assert(gzip < 153600, 'initial gzip exceeds 150 KiB');
console.log(JSON.stringify({gate:'phase',public_text_files:checked.length,initial_files:entry.size,gzip_initial_b:gzip}));
