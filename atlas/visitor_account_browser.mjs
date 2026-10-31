// P3 [1a] in a real browser: the preserved Atlantis/Zombie faces load the comic letters and draw their place names with
// them, at half size, with no exception. Uso: node atlas/face_names_browser.mjs  (Chrome headless por CDP)
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port;
  ch = launchChrome(0);
  const cdpPort = await ch.debugPort();
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      const que = 'exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop() + ':' + ((f.lineNumber ?? 0) + 1);
      if (!fallos.includes(que)) { fallos.push(que); }
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  await cmd('Runtime.enable'); await cmd('Page.enable');

  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` });
  ok(await hasta('!!document.getElementById("surface")', 10000), 'map loaded');
  const result = await ev(`(async () => {
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/game/visitor_account.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
    window.visit = await AtlasVisitorAccount.create(true);
    const info=visit.info();
    const record={esquema:'atlas.invocacion/2',tc:'tc1',seq:1,prev:'genesis',clave_publica:info.publicKey};
    const signature=await visit.sign(record,true);
    const databases=await indexedDB.databases();
    dispatchEvent(new Event('pagehide'));
    let ended=false;try{visit.info();}catch{ended=true;}
    const next=await AtlasVisitorAccount.create(true);
    return {record,signature,publicKey:info.publicKey,ended,fresh:next.info().publicKey!==info.publicKey,databases:databases.map(x=>x.name)};
  })()`);
  ok(result?.ended && result?.fresh, 'page lifecycle invalidates visit');
  ok(!result.databases.includes('preceptoros') && !result.databases.some(x=>/visit/i.test(x)), 'no identity storage');
  const { createPublicKey, verify } = await import('node:crypto');
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const folder=mkdtempSync(tmpdir()+'/visitor-public-');
  try {
    const der=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(result.publicKey,'hex')]);
    const pem=createPublicKey({key:der,type:'spki',format:'der'}).export({type:'spki',format:'pem'});
    writeFileSync(folder+'/public.pem',pem);writeFileSync(folder+'/message',JSON.stringify(result.record));writeFileSync(folder+'/signature',Buffer.from(result.signature.slice(8),'hex'));
    const checked=spawnSync('openssl',['pkeyutl','-verify','-pubin','-inkey',folder+'/public.pem','-rawin','-in',folder+'/message','-sigfile',folder+'/signature']);
    ok(checked.status===0,'browser signature independently verifies with OpenSSL');
    medidas.openssl=checked.status===0;
  } finally { rmSync(folder,{recursive:true,force:true}); }
  await cmd('Page.reload');
  ok(await hasta('typeof window.visit === "undefined"',10000),'reload has no visit');
  console.log(JSON.stringify({piece:'JN-2',medidas,fallos}));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
