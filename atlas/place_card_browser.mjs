// 6B-1 · arranque y taps reales. Fixture EMULATED aislado; no identidad, firma ni datos del usuario.
// node atlas/place_card_browser.mjs [--doogee] (ADB/CDP/reverse ya existentes en modo Doogee).
import { createServer } from 'node:http';
import { readFileSync, statSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const publico = fileURLToPath(new URL('../public/', import.meta.url));
const telefono = process.argv.includes('--doogee'), port = telefono ? 8802 : 8803, cdpPort = telefono ? 9223 : 9400 + process.pid % 300;
const quick = process.argv.includes('--quick');
const pausa = ms => new Promise(r => setTimeout(r, ms));
const tipos = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'];
const report = { fixture: 'EMULATED house coordinates; real game layers; no signing or storage changes', device: telefono ? 'Doogee S110' : 'Chrome headless', quick, taps: [], samples: [], failures: [] };
let chrome, dir, page, browser, target, originalActivity, rotation;
const conexiones = [];
async function conecta(url) {
  const ws = new WebSocket(url), pendientes = new Map(); let n = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pendientes.has(d.id)) { const { r, j, timer } = pendientes.get(d.id); clearTimeout(timer); pendientes.delete(d.id); d.error ? j(new Error(d.error.message)) : r(d.result); }
    if (d.method === 'Runtime.exceptionThrown') report.failures.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  });
  conexiones.push(ws);
  return { cmd: (method, params = {}) => new Promise((r, j) => { const id = ++n; const timer = setTimeout(() => { pendientes.delete(id); j(new Error('CDP timeout: ' + method)); }, 15000); pendientes.set(id, { r, j, timer }); ws.send(JSON.stringify({ id, method, params })); }) };
}
async function valor(expression) {
  const r = await page.cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ': ' + r.exceptionDetails.exception?.description);
  return r.result?.value;
}
const server = createServer((req, res) => {
  try {
    let f = path.resolve(publico, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!f.startsWith(publico)) throw Error('outside root');
    if (statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const mime = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(readFileSync(f));
  } catch { res.writeHead(404); res.end(); }
});
try {
  await new Promise((r, j) => { server.once('error', j); server.listen(port, '127.0.0.1', r); });
  if (telefono) {
    const a = execFileSync('adb', ['shell', 'dumpsys', 'activity', 'activities'], { encoding: 'utf8' });
    originalActivity = /(?:topResumedActivity|mResumedActivity)\s*[:=][^\n]*?\s([\w.]+\/[\w.$]+)(?=[}\s])/.exec(a)?.[1];
    rotation = { auto: execFileSync('adb',['shell','settings','get','system','accelerometer_rotation'],{encoding:'utf8'}).trim(),
      user: execFileSync('adb',['shell','settings','get','system','user_rotation'],{encoding:'utf8'}).trim() };
    if (!/^[01]$/.test(rotation.auto) || !/^[0-3]$/.test(rotation.user)) throw Error('rotation settings are NO_DATA');
    execFileSync('adb',['shell','settings','put','system','accelerometer_rotation','0']);
    execFileSync('adb',['shell','settings','put','system','user_rotation','0']);
  } else {
    dir = mkdtempSync(path.join(tmpdir(), 'tocables-'));
    chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=360,716', '--user-data-dir=' + dir, '--remote-debugging-port=' + cdpPort, 'about:blank'], { stdio: 'ignore' });
  }
  let info;
  for (let i = 0; i < 60 && !info; i++) { try { info = await (await fetch('http://127.0.0.1:' + cdpPort + '/json/version')).json(); } catch { await pausa(250); } }
  if (!info) throw Error('Chrome CDP not available');
  browser = await conecta(info.webSocketDebuggerUrl);
  target = (await browser.cmd('Target.createTarget', { url: 'about:blank' })).targetId;
  const tabs = await (await fetch('http://127.0.0.1:' + cdpPort + '/json')).json();
  page = await conecta(tabs.find(t => t.id === target).webSocketDebuggerUrl);
  await page.cmd('Runtime.enable'); await page.cmd('Page.enable'); await page.cmd('Network.enable');
  await page.cmd('Network.setBypassServiceWorker', { bypass: true }); await page.cmd('Network.setCacheDisabled', { cacheDisabled: true });
  if (telefono) execFileSync('adb', ['shell', 'am', 'start', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main'], { stdio: 'ignore' });
  await page.cmd('Page.navigate', { url: 'http://localhost:' + port + '/en/' });
  for (let i = 0; i < 80; i++) { if (await valor('Boolean(window.AtlasArrecife && window.AtlasInspector && window.AtlasPlaceCards)')) break; await pausa(250); }
  if (!(await valor('Boolean(window.AtlasPlaceCards)'))) throw Error('place cards did not boot');
  await valor(`(() => {
    const base = { x: AtlasNiebla.HEX.x, y: AtlasNiebla.HEX.y };
    window.__tocables = { base, pieces: [], times: [] };
    AtlasNiebla.sitioCasa = () => ({...base});
    const reg = AtlasInspector.registra;
    AtlasInspector.registra = function(cola, P, T) {
      reg(cola, P, T);
      const c = document.querySelector('.atlas-arena-mapa'), dpr = c.width / c.clientWidth, rect = c.getBoundingClientRect();
      __tocables.pieces = cola.filter(q => q.ficha && q.ficha().kind).map(q => {
        const p = P(q.col, q.fila), f = q.ficha(); return { kind:f.kind, name:f.que, x:rect.left+(p[0]+(f.hit?.dx||0))/dpr, y:rect.top+(p[1]+(f.hit?.dy||0))/dpr };
      });
      __tocables.times.push(performance.now());
    };
    AtlasMar.mueve('casa');
  })()`);
  await pausa(5000);
  report.visible = await valor('!document.hidden && !document.documentElement.classList.contains("con-hoja")');
  report.viewport = await valor('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
  if (!report.visible) throw Error('the map is hidden; fps is NO_DATA');
  report.version = /const VERSION = '([^']+)'/.exec(readFileSync(path.join(publico, 'sw.js'), 'utf8'))[1];
  report.footprint = readFileSync(new URL('../config/sw-huella.txt', import.meta.url), 'utf8').trim();
  for (let run = 0; run < 2; run++) {
    await valor('__tocables.times=[]'); await pausa(telefono && !quick ? 60000 : 2000);
    const s = await valor(`(() => {
      const t=__tocables.times,d=t.slice(1).map((x,i)=>x-t[i]).sort((a,b)=>a-b);
      return {frames:t.length,mean:t.length>1?(t.length-1)*1000/(t.at(-1)-t[0]):null,
        p50:d.length?1000/d[Math.floor(d.length*.5)]:null,p10:d.length?1000/d[Math.floor(d.length*.9)]:null,
        quality:window.AtlasCalidad?.modo||'NO_DATA',visible:!document.hidden};
    })()`);
    report.samples.push(s);
    if (!s.visible || !s.frames || (telefono && !quick && s.mean < 58)) report.failures.push('drawing cadence below reference or hidden: ' + JSON.stringify(s));
  }
  for (const tipo of tipos) {
    await valor('AtlasMar.mueve("casa")'); await pausa(1000);
    let p;
    for (let tries=0;tries<12;tries++) {
      p=await valor(`__tocables.pieces.find(p=>p.kind===${JSON.stringify(tipo)})`);
      if (!p) throw Error('piece missing: '+tipo);
      const size=await valor('({w:innerWidth,h:innerHeight,top:document.getElementById("thegame-menu").getBoundingClientRect().top})');
      const hit=await valor(`(() => {const e=document.elementFromPoint(${p.x},${p.y});return {canvas:!!e?.closest('.atlas-arena-mapa'),name:e?.id||e?.className||e?.tagName};})()`);
      if (hit.canvas && p.x>70 && p.x<size.w-10 && p.y>size.top+10 && p.y<size.h-65) break;
      const dir=p.x<=70?'izq':p.x>=size.w-10?'der':p.y<=size.top+80?'arr':'aba';
      await valor('AtlasMar.mueve('+JSON.stringify(dir)+')'); await pausa(700);
    }
    await page.cmd('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
    await page.cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
    await pausa(400);
    const f=await valor(`(() => {const p=document.getElementById('pliego-ficha');return {kind:p?.dataset.place,hidden:p?.hidden,
      lines:AtlasInspector.vista(),actions:[...p.querySelectorAll('[data-action]')].map(a=>({id:a.dataset.action,disabled:a.disabled,href:a.getAttribute('href')}))};})()`);
    const debug=await valor(`(() => {const e=document.elementFromPoint(${p.x},${p.y});return {hit:e?.id||e?.className||e?.tagName,
      width:innerWidth,height:innerHeight,viewport:visualViewport?{w:visualViewport.width,h:visualViewport.height,scale:visualViewport.scale}:null,
      open:[...document.querySelectorAll('#thegame-menu [aria-expanded=true]')].map(e=>e.id),boxHidden:document.getElementById('thegame-terminal')?.hidden};})()`);
    report.taps.push({expected:tipo,point:p,debug,...f});
    if(f.kind!==tipo||f.hidden||!f.lines?.some(l=>l[0]==='Touched')||!f.actions.length) report.failures.push('tap did not report its place/coordinate/actions: '+tipo);
    if (tipo === 'boya' && f.kind === 'boya') {
      const panel = await valor(`(() => {const s=document.querySelector('.shell-schematics');return s&&{text:s.innerText,buttons:[...s.querySelectorAll('button')].map(b=>({text:b.textContent,height:b.getBoundingClientRect().height})),input:!!s.querySelector('input[type=file]')};})()`);
      if (!panel || !panel.text.includes('Shell Schematics') || !panel.text.includes('not changed') || !panel.input || panel.buttons.length !== 2 || panel.buttons.some(b=>b.height<44)) report.failures.push('Shell Schematics controls or touch targets missing');
      const imported = await valor(`(async()=>{const s=document.querySelector('.shell-schematics'),i=s.querySelector('input[type=file]'),m=AtlasArrecife.manifiestoBoya({x:20,y:30}),dt=new DataTransfer();dt.items.add(new File([JSON.stringify(m)],'measured.json',{type:'application/json'}));Object.defineProperty(i,'files',{configurable:true,value:dt.files});i.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,50));return s.querySelector('[role=status]').textContent;})()`);
      if (!imported.includes('Imported structure preview') || !imported.includes('not applied or saved') || imported.includes('{')) report.failures.push('valid import did not show a text-only preview');
      const rejected = await valor(`(async()=>{const s=document.querySelector('.shell-schematics'),i=s.querySelector('input[type=file]'),dt=new DataTransfer();dt.items.add(new File(['{}'],'empty.json',{type:'application/json'}));Object.defineProperty(i,'files',{configurable:true,value:dt.files});i.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,50));return s.querySelector('[role=status]').textContent;})()`);
      if (!rejected.includes('NO_DATA') || !rejected.includes('missing a required field')) report.failures.push('invalid import did not report its cause');
      report.taps.at(-1).shellSchematics = { controls: panel, imported, rejected };
    }
    if (f.kind!==tipo && !report.screenshot) { const pic=await page.cmd('Page.captureScreenshot'); const file=path.join(tmpdir(),'tocables-debug.png'); writeFileSync(file,Buffer.from(pic.data,'base64')); report.screenshot=file; }
    if (f.kind===tipo && !f.hidden && tipo!=='coral') {
      await valor('document.querySelector("#pliego-ficha [data-action]")?.click()'); await pausa(200);
      const result=await valor(`({radio:!document.getElementById('radio-estado')?.hidden,
        receipts:!document.getElementById('pliego-lapidas')?.hidden,text:document.getElementById('pliego-ficha')?.innerText||''})`);
      if(tipo==='boya'&&!result.radio||tipo==='lapidas'&&!result.receipts||tipo==='observatorio'&&!result.text.includes('Look started')||tipo==='cristal'&&!result.text.includes('Measured receipts')) {
        report.failures.push('second gesture did not execute its real action: '+tipo);
      }
    }
    await valor('document.querySelector("#thegame-menu .thegame-menu-item[aria-expanded=true]")?.click()'); await pausa(200);
  }
} catch(e) { report.failures.push(e.stack); }
finally {
  if (target && browser) try { await browser.cmd('Target.closeTarget',{targetId:target}); } catch {}
  for(const ws of conexiones) try { ws.close(); } catch {}
  if(telefono && originalActivity) try { execFileSync('adb',['shell','am','start','-n',originalActivity],{stdio:'ignore'}); } catch {}
  if(rotation) try {
    execFileSync('adb',['shell','settings','put','system','user_rotation',rotation.user]);
    execFileSync('adb',['shell','settings','put','system','accelerometer_rotation',rotation.auto]);
  } catch {}
  chrome?.kill(); if(dir) try { rmSync(dir,{recursive:true,force:true}); } catch {}
  await new Promise(r=>server.close(r));
}
console.log(JSON.stringify(report,null,2));
process.exitCode=report.failures.length?1:0;
