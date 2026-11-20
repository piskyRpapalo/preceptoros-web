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
  // 2026-11-19: native v7 APK is declared in r.native with a separate data-asset key; include its SHA in the fingerprint map.
  const nat = r.native || {};
  const shaN = nat.sha256 ? { 'native-v7-apk': nat.sha256 } : {};
  if (r.native) {
    if (!/^[a-f0-9]{64}$/.test(nat.sha256 || '')) fallos.push('native APK hash not valid');
    if (nat.url !== nat.source_url ||
        nat.source_url !== 'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v7-20261119/PreceptorOS-android-0.3.0-v7.apk') {
      fallos.push('native direct GitHub Release differs from pinned source URL');
    }
    if (!t.includes('data-asset="native-v7-apk">' + nat.sha256 + '</code>')) {
      fallos.push('native APK fingerprint differs from card');
    }
    const m = t.match(/<script type="application\/json" id="gate-datos">([^<]+)<\/script>/);
    let embedded = null;
    try { embedded = m ? JSON.parse(m[1]) : null; } catch {}
    if (!embedded || !embedded.native || ['version','url','sha256','bytes','package','versionCode','publicado','estado','causa']
        .some((key) => embedded.native[key] !== nat[key])) {
      fallos.push('native embedded release card differs from release.json');
    }
    if (!embedded || !embedded.android ||
        ['version','url','sha256','bytes'].some((key) => embedded.android[key] !== nat[key])) {
      fallos.push('Android launch gate does not target the native APK');
    }
    const nativeDoor = (t.match(/<article class="door" id="door-native"[\s\S]*?<\/article>/) || [''])[0];
    if (!nativeDoor || !nativeDoor.includes('href="' + nat.url + '"')) {
      fallos.push('native download link absent or different');
    }
    if (t.indexOf('id="door-native"') >= t.indexOf('id="door-openworld"')) {
      fallos.push('native APK is not the first Android door');
    }
    if (nat.publicado !== true || nat.estado !== 'MEDIDO' || nat.causa !== null) {
      fallos.push('verified public release falsely marked unavailable');
    }
    const worker = leer('worker/index.js');
    if (!worker.includes('url.pathname === \'/get-the-app/PreceptorOS-android-0.3.0-v7.apk\'') ||
        !worker.includes(nat.source_url)) {
      fallos.push('native same-origin redirect not pinned to release asset');
    }
    if (t.includes('github_release_draft_not_published') || /releases\/download\/untagged-[^/"]+/.test(t)) {
      fallos.push('stale draft or untagged release URL leaked');
    }
  }
  const bajas = [...t.matchAll(/href="(https:\/\/github\.com\/[^"]+\/releases\/download\/[^"]+)"/g)].map((m) => m[1]);
  const nativePinnedRoute = r.native && t.includes('href="' + r.native.url + '"') ? 1 : 0;
  if (bajas.length + nativePinnedRoute < 3) {
    fallos.push('fewer than 3 verified downloads: ' + (bajas.length + nativePinnedRoute));
  }
  bajas.forEach((u) => { if (!(u.startsWith(base) && u.slice(base.length) in sha) &&
      !(and.version && u.startsWith(baseA) && u.slice(baseA.length) in shaA) &&
      !(nat.publicado === true && u === nat.source_url && /^[a-f0-9]{64}$/.test(nat.sha256 || '') && nat.bytes === 155998639)) {
    fallos.push('download not in the card: ' + u);
  } });
  const huellas = [...t.matchAll(/<code class="sha" data-asset="([^"]+)">([0-9a-f]{64})<\/code>/g)];
  if (huellas.length < 2) { fallos.push('fewer than 2 fingerprints'); }
  huellas.forEach((m) => { if ((sha[m[1]] || shaA[m[1]] || shaN[m[1]]) !== m[2]) { fallos.push('fingerprint differs from the card: ' + m[1]); } });
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
  const native = R.native;
  if (!native || !/^[0-9a-f]{64}$/.test(native.sha256) || native.bytes !== 155998639 ||
      native.publicado !== true) { throw new Error('native Android release unverified'); }
  const embedded = JSON.parse(PAGINA.match(/<script type="application\/json" id="gate-datos">([^<]+)<\/script>/)[1]);
  if (['url','sha256','version','bytes'].some((k) => embedded.android[k] !== native[k]) ||
      embedded.legacy_android.sha256 !== R.android.assets[0].sha256) {
    throw new Error('embedded Android release drifted from native or legacy card');
  }
  const G = awaitGate();
  const d = { os: 'android', pwa: { instalable: false }, release: {}, android: embedded.android, cerebros: [] };
  const app = G.vista(d).carriles.find((x) => x.id === 'app');
  if (!app.boton.activo || app.boton.etiqueta !== 'Download Android app' || app.clics !== 1 || app.sha256 !== native.sha256) {
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


test('Homepage exposes native Android v7 as download, while web wrapper stays only in legacy door', () => {
  const native = R.native;
  const home = leer('public/index.html'), js = leer('public/assets/three_actions.js');
  const expected = 'id="native-app-cta" href="' + native.source_url + '"';
  if (!home.includes(expected)) throw new Error('homepage does not link signed native v7 release directly');
  if (!home.includes('id="dayd-download" href="/get-the-app/#doors"')) throw new Error('get-the-app details inaccessible');
  if (home.includes('id="dayd-building"') || !home.includes('id="dayd-companion"')) throw new Error('Landing must keep the Companion guide and leave proposals inside the visitor flow');
  if (home.includes('/get-the-app/PreceptorOS-android-1.0.1.apk')) throw new Error('homepage promotes old wrapper');
  if (!js.includes("var APK = '" + native.source_url + "'")) throw new Error('homepage Android source is legacy APK');
  if ((js.split(native.sha256).length - 1) !== 1) throw new Error('Android native SHA must appear once');
  if (!js.includes("'Download PreceptorOS APP (APK, 156 MB)'") ||
      !js.includes("'Download the APP installer (install.sh)'")) throw new Error('download paths mislabeled');
  if (!js.includes('It is not the PreceptorOS APP and has no model inside')) throw new Error('legacy wrapper not distinguished');
  if (!js.includes('The public website cannot inspect an APP on another origin')) throw new Error('false update claim');
  if (/hexelion/i.test(js)) throw new Error('homepage must not promise Hexelion');
  if (!/\.ta-btn:focus-visible/.test(home)) throw new Error('missing visible focus');
});

// Native v7 publicly published, source URL and SHA pinned, legacy TWA secondary.
test('Native v7 · manifest and gate declare the real public native APK', () => {
  const nat=R.native;
  if (nat.version !== 'android-mvp-v7-20261119' || nat.sha256 !== '9c4d227db2ba395cdb232bdd3eb6a52f83d344f3386a99bb5274d42837eebe6b' ||
      nat.bytes !== 155998639 || nat.package !== 'org.preceptoros.app' || nat.versionCode !== 7 ||
      nat.publicado !== true || nat.estado !== 'MEDIDO' || nat.causa !== null) throw new Error('native release contract mismatch');
  if (nat.certificate_sha256 !== '16761a1e61376506acf4abdadfdddeb96ff18b4cc80a3d98205c91648e4c010f') throw new Error('native cert drift');
  const embedded=JSON.parse(PAGINA.match(/<script type="application\/json" id="gate-datos">([^<]+)<\/script>/)[1]);
  if (embedded.android.url !== nat.url || embedded.android.sha256 !== nat.sha256 ||
      embedded.native.publicado !== true) throw new Error('native first-class Android gate missing');
});

test('Native v7 · direct Release is primary; optional exact Worker redirect still constrained', async () => {
  if (juez(PAGINA,R).length) throw new Error(juez(PAGINA,R).join(' | '));
  if (PAGINA.indexOf('id="door-native"') > PAGINA.indexOf('id="door-openworld"')) throw new Error('legacy wrapper precedes native APP');
  if (!PAGINA.includes('id="native-android-download"') || !PAGINA.includes('href="' + R.native.url + '"')) throw new Error('native download anchor missing');
  const worker=(await import('../worker/index.js')).default;
  let assetHits=0;
  const env={ASSETS:{fetch:async()=>{assetHits++;return new Response('not an APK',{status:404});}}};
  for(const method of ['GET','HEAD']){
    const r=await worker.fetch(new Request('https://preceptoros.org/get-the-app/PreceptorOS-android-0.3.0-v7.apk',{method}),env);
    if (r.status !== 302 || r.headers.get('location') !== R.native.source_url || assetHits) {
      throw new Error('pinned Worker redirect did not route '+method+' to GitHub release');
    }
  }
  const missing=await worker.fetch(new Request('https://preceptoros.org/get-the-app/PreceptorOS-android-fake.apk'),env);
  if(missing.status !== 404 || assetHits !== 1) throw new Error('arbitrary APK path could redirect');
});

test('SABOTAGE Native v7 · wrong hash, URL and release status all turn the judge red', () => {
  const wrong=JSON.parse(JSON.stringify(R));wrong.native.sha256='f'.repeat(64);
  if(!juez(PAGINA,wrong).some(e=>/fingerprint|release card/.test(e)))throw new Error('wrong digest stayed green');
  const spoof=JSON.parse(JSON.stringify(R));spoof.native.source_url='https://example.invalid/evil.apk';
  if(!juez(PAGINA,spoof).some(e=>/release URL|pinned/.test(e)))throw new Error('external source spoof stayed green');
  const draft=JSON.parse(JSON.stringify(R));draft.native.publicado=false;
  if(!juez(PAGINA,draft).some(e=>/unavailable|release card/.test(e)))throw new Error('published state mismatch stayed green');
  if(!PAGINA.includes('/get-the-app/PreceptorOS-android-1.0.1.apk') ||
     !PAGINA.includes('8db3176a20ed973dab1f28642972bb97ab1ccd70ddbc7cf95f7a44affc7c4d8b')) {
     throw new Error('legacy wrapper history disappeared');
  }
});

// Lisbon table: a visitor can reach every honest door without mistaking an accepted PR for a LIVE node.
test('LISBON · three visitor doors, Companion docs and mapped/online distinction', () => {
  const home = leer('public/index.html');
  const app = leer('public/get-the-app/index.html');
  const CP = createRequire(import.meta.url)('../public/game/colony_page.js');
  const statement = CP.voz({nodes:3, edificios:0, bots:[]}, 0, false)[0];
  if (!home.includes('id="dayd-companion" href="/get-the-app/#companion-path"')) throw new Error('Companion not directly reachable from homepage');
  for (const href of ['/openworld/', '#doors', '#companion-path']) {
    if (!app.includes('href="'+href+'"')) throw new Error('missing get-app door: '+href);
  }
  for (const href of [
    'https://github.com/piskyRpapalo/preceptoros-companion/blob/main/CONTRIBUTING.md',
    'https://github.com/piskyRpapalo/preceptoros-companion/tree/main/companions/template'
  ]) if (!app.includes('href="'+href+'"')) throw new Error('missing deep link '+href);
  if (!app.includes('NO_DATA(world_publication_not_verified)')) throw new Error('docs-only PR wrongly implies world publication');
  if (!home.includes('rack is not a feedback mailbox') || !app.includes('rack is not a mailbox')) throw new Error('feedback must stay on the owner device');
  if (!statement.includes('3 nodes mapped') || !statement.includes('LIVE/STALE') || /places are awake/i.test(statement)) throw new Error('mapped nodes misrepresented as LIVE: '+statement);
});
