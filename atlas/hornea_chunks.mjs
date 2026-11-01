// P2 · el horno de chunks (laboratorio, no se sirve). Escribe public/map/carta.json (atlas.carta/1), un fichero por chunk
// public/map/chunks/<cq>_<cr>.<sha8>.json (atlas.chunk/1) y el arte por id en public/art/<id>.json (atlas.asset/1).
// DETERMINISTA: misma semilla, mismos bytes y mismos sha (sin Math.random ni Date). El arte son datos: ondas y paletas.
// Uso: node atlas/hornea_chunks.mjs [--check]   (--check falla si lo servido no es lo que se hornearía)
import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../public/game/map_carta.js');
const R = 8, SEED = 20261101, RING = 2;            // ring 1 = the 7 chunks of the cabin (precached); ring 2 adds 12 (edge cache)
export const BUDGET = { chunk_bytes_max: 65536, visible_bytes_max: 458752 };   // atlas.carta/1 budget amendment (2026-11-01)
// Lattice centres with hex distance <= ring in lattice steps: ring 1 first, in the order of C.neighbourhood, then ring 2.
function rings(n) {
  const a = [2 * R + 1, -R], b = [R, R + 1], out = C.neighbourhood([0, 0], R).map((c) => [c, 1]);
  out[0][1] = 0;
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const d = Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j));
    if (d >= 2 && d <= n) out.push([[i * a[0] + j * b[0], i * a[1] + j * b[1]], d]);
  }
  return out;
}
const OUT = new URL('../public/', import.meta.url);

// Integer hash (xorshift-multiply on 32 bits): the floor detail comes from (seed, q, r) only.
function h32(seed, q, r) { let x = (seed ^ Math.imul(q, 374761393) ^ Math.imul(r, 668265263)) >>> 0; x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0; return (x ^ (x >>> 16)) >>> 0; }
function cell(q, r) {
  const d = C.dist(q, r), n = h32(SEED, q, r) % 100;
  if (d <= 3) return [q, r, 1, 'floor'];                                     // the cabin clearing is always walkable
  const h = n < 22 + Math.min(d, 20) ? 0 : 1 + (n % 3);                      // water grows toward the edge of the known sea
  return [q, r, h, h === 0 ? 'water' : 'floor'];
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const json = (o) => JSON.stringify(o) + '\n';

export function hornea() {
  const files = new Map();
  const palette = { v: 'atlas.asset/1', id: 'sea-palette', kind: 'palette',
    frame: { t: 'Sea palette', d: 'Four bands of the sunken forest: deep water, shallow water, sand and moss. Each band also has a pattern, so colour is never the only cue.', role: 'floor' },
    data: { bands: [{ kind: 'water', h: 0, var: '--sea-deep', pattern: 'waves' }, { kind: 'floor', h: 1, var: '--sea-sand', pattern: 'dots' }, { kind: 'floor', h: 2, var: '--sea-moss', pattern: 'hatch' }, { kind: 'floor', h: 3, var: '--sea-rock', pattern: 'cross' }] } };
  files.set('art/sea-palette.json', json(palette));
  const chunks = [];
  for (const [c, ring] of rings(RING)) {
    const cells = [];
    for (let dq = -R; dq <= R; dq++) for (let dr = Math.max(-R, -dq - R); dr <= Math.min(R, -dq + R); dr++) cells.push(cell(c[0] + dq, c[1] + dr));
    const water = cells.filter((x) => x[3] === 'water').length;
    const here = c[0] === 0 && c[1] === 0;
    const frame = { t: here ? 'Cabin chunk' : 'Sea chunk ' + C.key(c), d: (here ? 'The tutorial cabin clearing. ' : '') + cells.length + ' cells: ' + water + ' water, ' + (cells.length - water) + ' floor.' };
    const body = json({ v: 'atlas.chunk/1', c, seed: SEED, frame, cells, assets: ['sea-palette'] });
    const s = sha(body), name = 'map/chunks/' + C.key(c) + '.' + s.slice(0, 8) + '.json';
    files.set(name, body);
    chunks.push({ id: C.key(c), c, sha256: s, bytes: Buffer.byteLength(body), frame, file: '/' + name, ring });
  }
  const carta = { v: 'atlas.carta/1', radius: R, seed: SEED, budget: BUDGET, frame: { t: 'Sunken forest map', d: chunks.length + ' hex chunks in two rings around the tutorial cabin, radius ' + R + '. Each chunk is asked for by its area key only.' }, chunks: chunks.map(({ file, ring, ...k }) => k) };
  files.set('map/carta.json', json(carta));
  const precache = chunks.filter((c) => c.ring <= 1).map((c) => c.file.slice(1));   // offline first scene: ring 1 only
  // The edge manifest (not served): names the ring-2 files that only the edge cache holds, so nothing in public/ is an orphan.
  const borde = json({ v: 'atlas.borde/1', note: 'Baked chunks NOT precached: served immutable by the edge (worker/index.js).', files: chunks.filter((c) => c.ring > 1).map((c) => c.file) });
  return { files, carta, chunks, precache, borde };
}

const check = process.argv.includes('--check');
const { files, carta, precache, borde } = hornea();
const BORDE = new URL('./borde_chunks.json', import.meta.url);
const err = C.checkCarta(carta); if (err) { console.error('carta: ' + err); process.exit(1); }
if (check) {
  const bad = [...files].filter(([f, b]) => !existsSync(new URL(f, OUT)) || readFileSync(new URL(f, OUT), 'utf8') !== b).map(([f]) => f);
  const served = existsSync(new URL('map/chunks/', OUT)) ? readdirSync(new URL('map/chunks/', OUT)).map((n) => 'map/chunks/' + n) : [];
  const stale = served.filter((f) => !files.has(f));
  const listas = readFileSync(new URL('sw-listas.js', OUT), 'utf8'), listed = [...listas.matchAll(/'\/(map\/chunks\/[^']+)'/g)].map((m) => m[1]);
  const want = precache;
  if (want.some((f) => !listed.includes(f)) || listed.some((f) => !want.includes(f))) { console.error('ROJO · sw-listas.js no precachea exactamente los chunks del anillo 1 (el anillo 2 es del borde)'); process.exit(1); }
  if (!existsSync(BORDE) || readFileSync(BORDE, 'utf8') !== borde) bad.push('atlas/borde_chunks.json');
  if (bad.length || stale.length) { console.error('ROJO · horno distinto de lo servido: ' + bad.concat(stale).join(', ')); process.exit(1); }
  console.log('VERDE · ' + files.size + ' ficheros horneados = servidos'); process.exit(0);
}
rmSync(new URL('map/chunks/', OUT), { recursive: true, force: true });
writeFileSync(BORDE, borde);
for (const [f, b] of files) { mkdirSync(new URL('.', new URL(f, OUT)), { recursive: true }); writeFileSync(new URL(f, OUT), b); }
console.log(JSON.stringify({ precache: precache.length, ficheros: files.size, bytes: [...files.values()].reduce((a, b) => a + Buffer.byteLength(b), 0), chunks: carta.chunks.map((c) => c.id + ':' + c.bytes) }));
