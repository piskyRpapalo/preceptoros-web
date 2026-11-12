// North D1 (2026-10-26): /get-the-app/ says only what the release card says. Every download is an asset of the
// card's version, every fingerprint is the card's, the test table is the card's `pruebas`, and nothing external
// loads with the page. The same judge runs on two sabotaged copies, which must fail.
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const GATE = createRequire(import.meta.url)('../public/game/launch_gate.js');

const leer = (r) => readFileSync(new URL('../' + r, import.meta.url), 'utf8');
const R = JSON.parse(leer('public/release.json'));
const PAGINA = leer('public/get-the-app/index.html');

function juez(t, r) {
  const fallos = [], sha = Object.fromEntries(r.assets.map((a) => [a.nombre, a.sha256]));
  const base = `https://github.com/${r.repo}/releases/download/${r.version}/`;
  // 2026-11-09: the Android app is its own release on the same card (r.android); its download and fingerprint are judged the same way.
  const and = r.android || { version: '', assets: [] }, baseA = `https://github.com/${r.repo}/releases/download/${and.version}/`;
  const shaA = Object.fromEntries(and.assets.map((a) => [a.nombre, a.sha256]));
  const bajas = [...t.matchAll(/href="(https:\/\/github\.com\/[^"]+\/releases\/download\/[^"]+)"/g)].map((m) => m[1]);
  if (bajas.length < 3) { fallos.push('fewer than 3 downloads: ' + bajas.length); }
  bajas.forEach((u) => { if (!(u.startsWith(base) && u.slice(base.length) in sha) && !(and.version && u.startsWith(baseA) && u.slice(baseA.length) in shaA)) { fallos.push('download not in the card: ' + u); } });
  const huellas = [...t.matchAll(/<code class="sha" data-asset="([^"]+)">([0-9a-f]{64})<\/code>/g)];
  if (huellas.length < 2) { fallos.push('fewer than 2 fingerprints'); }
  huellas.forEach((m) => { if ((sha[m[1]] || shaA[m[1]]) !== m[2]) { fallos.push('fingerprint differs from the card: ' + m[1]); } });
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

test('D1 · the map links the guide from Settings; the landing keeps only its top (2026-11-09)', () => {
  if (!leer('public/game/settings_sheet.js').includes("'/get-the-app/'")) { throw new Error('Settings does not link /get-the-app/'); }
  const portada = leer('public/index.html');
  if (/id="(doors|tools-dispositivo|release)"/.test(portada)) { throw new Error('old landing blocks are back'); }
});

test('SABOTAGE D1 · one changed fingerprint or another version turns the judge red', () => {
  const h = R.assets.find((a) => a.nombre === 'install.sh').sha256;
  const otra = h.slice(0, -1) + (h.endsWith('0') ? '1' : '0');
  if (!juez(PAGINA.replace(h, otra), R).some((x) => /fingerprint/.test(x))) { throw new Error('a changed fingerprint stayed green'); }
  if (!juez(PAGINA.replace('/download/' + R.version + '/install.sh', '/download/v9.9/install.sh'), R).some((x) => /download/.test(x))) { throw new Error('another version stayed green'); }
});

// NORTE 5 a1 (2026-10-27): the launch gate's data is the cards'. Lane 2 lights only with a SIGNED receipt per system in
// release.json; a model enters with its measured bytes, its machine and date, and a download only with a sha256.
const C = JSON.parse(leer('public/brains.json'));
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


// WEB-ANDROID-DOWNLOAD-01: the signed APK is real, the web install prompt is not the Android APK,
// and no page may infer installed native version or report device telemetry without consent.
test('Android release is offered as a one-click APK download and a distinct update action', () => {
  const android = R.android;
  const entry = android?.assets?.[0];
  if (!entry || !/^[0-9a-f]{64}$/.test(entry.sha256) || entry.bytes <= 0) { throw new Error('no verified Android release'); }
  const embedded = JSON.parse(PAGINA.match(/<script type="application\/json" id="gate-datos">([^<]+)<\/script>/)[1]);
  if (embedded.android.url !== '/get-the-app/' + entry.nombre ||
      embedded.android.sha256 !== entry.sha256 ||
      embedded.android.version !== android.version ||
      embedded.android.bytes !== entry.bytes) { throw new Error('embedded Android release drifted from the signed release card'); }
  const G = awaitGate();
  const d = { os: 'android', pwa: { instalable: false }, release: {}, android: embedded.android, cerebros: [] };
  const app = G.vista(d).carriles.find((x) => x.id === 'app');
  if (!app.boton.activo || app.boton.etiqueta !== 'Download Android app' || app.clics !== 1 || app.sha256 !== entry.sha256) {
    throw new Error('Android must expose a one-click verified APK rather than a PWA');
  }
  const gate = leer('public/assets/get_app_gate.js');
  if (!gate.includes('Update Android app') || !gate.includes('installed_version_not_observable_from_web') ||
      !gate.includes("a.href = apk ? datos.android.url")) { throw new Error('missing update and honest installed-version reporting'); }
  const view = leer('public/game/visitor_view.js');
  if (view.includes('No APK is published')) { throw new Error('stale claim of missing APK'); }
});

function awaitGate() { return GATE; }

test('SABOTAGE Android download: absent or fabricated hash keeps APK lane closed', () => {
  for (const payload of [{}, {url: '/get-the-app/not-an-app.apk', sha256: '0'.repeat(64), bytes: 0},
    {url: 'https://example.invalid/evil.apk', sha256: '0'.repeat(64), bytes: 1340742},
    {url: '/get-the-app/PreceptorOS-android-1.0.1.apk', sha256: 'not-a-hash', bytes: 1340742}]) {
    const app = GATE.vista({os:'android',pwa:{},release:{},android:payload,cerebros:[]}).carriles.find(x => x.id==='app');
    if (app.boton.activo) { throw new Error('unverified APK was activated'); }
  }
});


test('Homepage downloads the same verified APK with one click (without claiming offline AI)', () => {
  const apk = R.android.assets[0];
  const home = leer('public/index.html');
  const route = '/get-the-app/' + apk.nombre;
  const links = home.match(/<a class="android-apk-action"[^>]+>/g) || [];
  if (links.length !== 2 || !links.every((a) => a.includes('href="' + route + '"') && a.includes(' download '))) {
    throw new Error('homepage APK and update links do not target the published release');
  }
  if (!home.includes('Local offline AI: NO_DATA')) { throw new Error('home falsely presents TWA as local AI'); }
  if (!/\.android-apk-action:focus-visible/.test(home)) { throw new Error('missing visible keyboard focus'); }
});
