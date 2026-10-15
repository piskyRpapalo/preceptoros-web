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
for (const name of ['phase_gate.mjs', 'phase_M0_cases.mjs', 'chrome_launch.mjs', 'chrome_launch_cases.mjs', 'sin_undefined.mjs']) {
  assert(readFileSync(new URL(name, import.meta.url)).byteLength < 16384, name);
}
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
let gzip = 0;
for (const path of entry) {
  assert(files.includes(path), 'initial artifact missing: ' + path);
  gzip += gzipSync(readFileSync(new URL(path, root)), {level:9}).byteLength;
}
assert(gzip < 153600, 'initial gzip exceeds 150 KiB');
console.log(JSON.stringify({gate:'phase',public_text_files:checked.length,initial_files:entry.size,gzip_initial_b:gzip}));
