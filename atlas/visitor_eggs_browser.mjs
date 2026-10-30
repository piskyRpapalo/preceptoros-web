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
  const port = srv.address().port, cdpPort = 9700 + (process.pid % 90);
  ch = launchChrome(cdpPort);
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
  ok(await hasta('!!document.getElementById("visitor-start")',10000),'visitor controls available');
  await ev('document.getElementById("visitor-start").click()');
  ok(await hasta('!!document.getElementById("visitor-beacon")',10000),'visit started without Identity');
  await ev('document.getElementById("visitor-beacon").click()');
  ok(await hasta('document.getElementById("visitor-beacon").disabled && !document.getElementById("visitor-summon-tc1").disabled',10000),'beacon granted once');
  await ev('document.getElementById("visitor-summon-tc1").click()');
  ok(await hasta('!!document.getElementById("visitor-hatch-1")',10000),'paid egg exists');
  await ev(`(async()=>{for(let i=0;i<20;i++){document.getElementById('visitor-step').click();await new Promise(r=>setTimeout(r,0));}})()`);
  ok(await hasta('!document.getElementById("visitor-hatch-1").disabled',10000),'egg ready after steps');
  await ev('document.getElementById("visitor-hatch-1").click()');
  ok(await hasta('document.getElementById("visitor-play").textContent.includes("Troops 1")',10000),'adopted troop available');
  const saved=await ev(`(async()=>{const x=await AtlasArmy.cajaWeb('atlas-army','army','mia',true).lee();return x;})()`);
  const result={record:saved[0].adopcion,signature:saved[0].firma,publicKey:saved[0].adopcion.clave_publica};
  ok(await ev('typeof Identity === "undefined"'),'no persistent identity used');
  const sizes=await ev('Array.from(document.querySelectorAll("#visitor-play button")).map(x=>x.getBoundingClientRect().height)');
  ok(sizes.every(x=>x>=44),'accessible controls');
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
  ok(await hasta('!!document.getElementById("visitor-start")',10000),'reload requires a fresh visit');
  console.log(JSON.stringify({piece:'JN-3',medidas,fallos}));
}
main().catch(e=>{fallos.push(String(e));console.log(JSON.stringify({fallos}));}).finally(()=>{try{ws?.close();}catch{}ch?.close();srv?.close();process.exitCode=fallos.length?1:0;});
