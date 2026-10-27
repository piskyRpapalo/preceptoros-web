// North D1 (2026-10-26): /get-the-app/ says only what the release card says. Every download is an asset of the
// card's version, every fingerprint is the card's, the test table is the card's `pruebas`, and nothing external
// loads with the page. The same judge runs on two sabotaged copies, which must fail.
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const leer = (r) => readFileSync(new URL('../' + r, import.meta.url), 'utf8');
const R = JSON.parse(leer('public/release.json'));
const PAGINA = leer('public/get-the-app/index.html');

function juez(t, r) {
  const fallos = [], sha = Object.fromEntries(r.assets.map((a) => [a.nombre, a.sha256]));
  const base = `https://github.com/${r.repo}/releases/download/${r.version}/`;
  const bajas = [...t.matchAll(/href="(https:\/\/github\.com\/[^"]+\/releases\/download\/[^"]+)"/g)].map((m) => m[1]);
  if (bajas.length < 3) { fallos.push('fewer than 3 downloads: ' + bajas.length); }
  bajas.forEach((u) => { if (!u.startsWith(base) || !(u.slice(base.length) in sha)) { fallos.push('download not in the card: ' + u); } });
  const huellas = [...t.matchAll(/<code class="sha" data-asset="([^"]+)">([0-9a-f]{64})<\/code>/g)];
  if (huellas.length < 2) { fallos.push('fewer than 2 fingerprints'); }
  huellas.forEach((m) => { if (sha[m[1]] !== m[2]) { fallos.push('fingerprint differs from the card: ' + m[1]); } });
  if (!t.includes(r.sha256_manifiesto)) { fallos.push('manifest sha missing'); }
  const filas = [...t.matchAll(/<tr data-asset="([^"]+)" data-estado="([^"]+)">/g)].map((m) => m[1] + ':' + m[2]);
  const carta = r.pruebas.map((p) => p.asset + ':' + p.estado);
  if (JSON.stringify(filas) !== JSON.stringify(carta)) { fallos.push('test table differs from the card: ' + filas.join(',')); }
  if (/<(script|img|iframe)[^>]+src="https?:|<link[^>]+href="https?:[^"]*"[^>]*rel="stylesheet"|<link[^>]+rel="stylesheet"[^>]+href="https?:/.test(t)) { fallos.push('loads something external'); }
  if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(t.replace(/sha256|v\d+\.\d+/g, ''))) { fallos.push('an IP address in the page'); }
  return fallos;
}

test('D1 · /get-the-app/ only says what release.json says', () => {
  const f = juez(PAGINA, R);
  if (f.length) { throw new Error(f.join(' | ')); }
});

test('D1 · the landing links the guide, inside the visible Tools block (NORTE 7 PR 1)', () => {
  const portada = leer('public/index.html');
  if (!portada.includes('<li><a href="/get-the-app/">')) { throw new Error('the landing does not link /get-the-app/'); }
  if (portada.indexOf('id="tools-dispositivo"') > portada.indexOf('<li><a href="/get-the-app/">')) { throw new Error('the link is not inside the Tools block'); }
});

test('SABOTAGE D1 · one changed fingerprint or another version turns the judge red', () => {
  const h = R.assets.find((a) => a.nombre === 'install.sh').sha256;
  const otra = h.slice(0, -1) + (h.endsWith('0') ? '1' : '0');
  if (!juez(PAGINA.replace(h, otra), R).some((x) => /fingerprint/.test(x))) { throw new Error('a changed fingerprint stayed green'); }
  if (!juez(PAGINA.replace('/download/' + R.version + '/install.sh', '/download/v9.9/install.sh'), R).some((x) => /download/.test(x))) { throw new Error('another version stayed green'); }
});

// NORTE 5 a1 (2026-10-27): the launch gate's data is the cards'. Lane 2 lights only with a SIGNED receipt per system in
// release.json; a model enters with its measured bytes, its machine and date, and a download only with a sha256.
const C = JSON.parse(leer('public/cerebros.json'));
function juezGate(t, r, c) {
  const m = t.match(/<script type="application\/json" id="gate-datos">([^<]*)<\/script>/);
  if (!m) { return ['no gate data in the page']; }
  const d = JSON.parse(m[1]), fallos = [];
  if (d.version !== r.version) { fallos.push('gate version differs from the card'); }
  if (JSON.stringify(d.release.firmada) !== JSON.stringify(r.firmada || {})) { fallos.push('a signed receipt not in the card'); }
  const puerta = c.cerebros.filter((x) => x.puerta && Number.isInteger(x.bytes));
  if (d.cerebros.length !== puerta.length) { fallos.push('models differ from the landing models'); }
  d.cerebros.forEach((x) => { const o = puerta.find((p) => p.id === x.id);
    if (!o || x.size_gb !== Math.round(o.bytes / 1e7) / 100 || x.maquina !== c.backend || x.fecha !== c.medido.slice(0, 10)) { fallos.push('model figure not measured: ' + x.id); }
    if ((x.sha256 || null) !== (o && o.sha256 || null)) { fallos.push('a sha256 not in the card: ' + x.id); } });
  if (!/<script src="\/game\/launch_gate\.js"><\/script>\s*<script src="\/assets\/get_app_gate\.js"><\/script>/.test(t)) { fallos.push('the gate scripts are missing'); }
  return fallos;
}
test('NORTE 5 a1 · the launch gate says only what the cards say', () => {
  const f = juezGate(PAGINA, R, C);
  if (f.length) { throw new Error(f.join(' | ')); }
});
test('SABOTAGE NORTE 5 a1 · an invented signed receipt or an invented sha256 turns the judge red', () => {
  const firmada = PAGINA.replace('"firmada":{}', '"firmada":{"linux":true}');
  if (!juezGate(firmada, R, C).some((x) => /signed receipt/.test(x))) { throw new Error('an invented signed receipt stayed green'); }
  const sha = PAGINA.replace('"sha256":null', '"sha256":"' + 'a'.repeat(64) + '"');
  if (!juezGate(sha, R, C).some((x) => /sha256/.test(x))) { throw new Error('an invented sha256 stayed green'); }
});
