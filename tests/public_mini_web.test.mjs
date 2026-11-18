// MVP-A0: WEB imports APP #345 bytes unchanged; the public MINI is not a second app.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(name)=>readFileSync(join(ROOT,name),'utf8');
const hash=blob=>createHash('sha256').update(blob).digest('hex');
const manifest=JSON.parse(read('public/app/package-manifest.json'));
const files=Object.keys(manifest.files);
const official='e9074a88b7b8e00847ea0d789241fe95d62536d3bb84963028ab85dc003d50da';
test('official APP source and all 15 asset digests match the manifest',()=>{
  assert.equal(manifest.schema,'preceptoros.public-mini-package/1');
  assert.equal(manifest.source_repository,'piskyRpapalo/preceptoros-app');
  assert.equal(manifest.source_head,'cde2d0034d9d107ced9e16b88c095136d07ab37d');
  assert.equal(manifest.public_entry,'/app/');
  assert.equal(manifest.no_rack_connection,true);
  assert.equal(manifest.no_model_download,true);
  assert.equal(files.length,15);
  const actual=[];
  function walk(rel){for(const entry of readdirSync(join(ROOT,'public/app',rel),{withFileTypes:true})){
    const name=(rel?rel+'/':'')+entry.name;
    if(entry.isDirectory())walk(name);else actual.push(name);
  }}
  walk('');
  assert.deepEqual(actual.filter(x=>x!=='package-manifest.json').sort(),files.sort());
  for(const name of files)assert.equal(hash(readFileSync(join(ROOT,'public/app',name))),manifest.files[name],name);
});
test('ZIP verifier remains pinned and fails closed on a corrupt source archive',()=>{
  const importer=read('bin/import_public_mini.py');
  assert.match(importer,new RegExp(official));
  assert.match(importer,/source_zip_sha256_mismatch/);
  const dir=mkdtempSync(join(tmpdir(),'mvp-a0-corrupt-'));
  try{
    const fake=join(dir,'not-official.zip');writeFileSync(fake,Buffer.from('corrupt bundle'));
    const run=spawnSync('python3',['bin/import_public_mini.py','--zip',fake],{cwd:ROOT,encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr+run.stdout,/FAIL_CLOSED\(source_zip_sha256_mismatch\)/);
  }finally{rmSync(dir,{recursive:true,force:true})}
});
test('one official four-zone PWA scope, no bundled model nor rack authority',()=>{
  const app=read('public/app/index.html'),sw=read('public/app/sw.js');
  const webManifest=JSON.parse(read('public/app/manifest.webmanifest'));
  assert.equal(webManifest.id,'/app/');
  assert.equal(webManifest.scope,'/app/');
  assert.equal(webManifest.start_url,'/app/');
  assert.equal(app.match(/role="tab"/g).length,4);
  assert.match(app,/navigator.serviceWorker|public-boot\.js/);
  assert.match(sw,/pathname\.startsWith\(BASE\.pathname\)/);
  assert.match(sw,/preceptoros-public-mini-/);
  assert.match(sw,/url\.pathname\.includes\('\/api\/'\)/);
  assert.equal(manifest.no_model_download,true);
  assert.equal(manifest.no_rack_connection,true);
});
test('root WEB SW preserves MINI caches and never intercepts /app/',()=>{
  const sw=read('public/sw.js');
  assert.match(sw,/k\.startsWith\('shell-preceptoros-'\)/);
  assert.match(sw,/k\.startsWith\('obra-preceptoros-'\)/);
  assert.match(sw,/url\.pathname\.startsWith\('\/app\/'\)/);
  assert.doesNotMatch(sw,/ks\.filter\(k => k !== SHELL && k !== OBRA\)\.map/);
});
test('WEB public door points at official MINI and records mobile limitation',()=>{
  const door=read('public/get-the-app/index.html');
  assert.match(door,/href="\/app\/" id="mini-app-primary"/);
  assert.match(door,/href="\/app\/" id="mini-app-entry"/);
  assert.match(door,/Add to Home screen/);
  assert.match(door,/Install app/);
  assert.match(door,/NO_DATA\(external_phone_install_not_measured\)/);
});
test('Worker redirects exact /app while preserving parameters and serves /app/ unchanged',async()=>{
  const mod=await import('../worker/index.js');
  const env={ASSETS:{fetch:async()=>new Response('APP_READY',{status:200,headers:{'content-type':'text/html'}})}};
  const shortcut=await mod.default.fetch(new Request('https://preceptoros.org/app?ref=mesa'),env);
  assert.equal(shortcut.status,308);
  assert.equal(shortcut.headers.get('location'),'https://preceptoros.org/app/?ref=mesa');
  const canonical=await mod.default.fetch(new Request('https://preceptoros.org/app/'),env);
  assert.equal(canonical.status,200);
  assert.equal(await canonical.text(),'APP_READY');
});
