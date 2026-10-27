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
// NORTE 5 [3] (2026-10-27, decree ·6452880777): "play the game" left with thegame.js. The game's door is the entry world's
// page: the page and every same-origin script and stylesheet it loads, gzip per file. Same ceiling (150 KiB).
const puerta = readFileSync(new URL('face/basic.html', root), 'utf8');
const entry = new Set(['face/basic.html']);
for (const [, path] of puerta.matchAll(/<script[^>]*\ssrc="\/([^"]+)"/g)) entry.add(path);
for (const [, path] of puerta.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\/([^"]+)"/g)) entry.add(path);
assert(entry.size > 1, 'initial assets cannot be measured');
assert(!files.some((p) => /^atlas-(?!en)[a-z]{2}\.json$/.test(p)), 'a non-English game text is back: one language until MVP');
let gzip = 0;
for (const path of entry) {
  assert(files.includes(path), 'initial artifact missing: ' + path);
  gzip += gzipSync(readFileSync(new URL(path, root)), {level:9}).byteLength;
}
assert(gzip < 153600, 'initial gzip exceeds 150 KiB');
console.log(JSON.stringify({gate:'phase',public_text_files:checked.length,initial_files:entry.size,gzip_initial_b:gzip}));
