// Guarda A1B8: lo ausente es NO_DATA con causa; jamas undefined ni NaN visibles en theGame.
// Uso: node atlas/sin_undefined.mjs  (Chrome headless por CDP y python3 sirviendo public/; sin dependencias)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ATTR_EXPR = "[...document.querySelectorAll('[aria-label],[title]')].map(e=>(e.getAttribute('aria-label')||'')+' '+(e.title||'')).join('\\n')";
const fallos = [];
let pasos = 0;
let actual = { path: '-', step: 'arranque' };
const pend = new Map();
let id = 0;
let ws = null, ch = null, srv = null, dir = null;

async function main() {
  const port = 8900 + (process.pid % 90);
  const cdpPort = 9300 + (process.pid % 500);
  dir = mkdtempSync(path.join(tmpdir(), 'sinundef-'));
  srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: PUBLIC, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await espera(250); try { await fetch(`http://127.0.0.1:${port}/`); break; } catch {} }

  ch = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${dir}`,
    `--remote-debugging-port=${cdpPort}`, '--window-size=360,716', 'about:blank'], { stdio: 'ignore' });
  let lista = null;
  for (let i = 0; i < 60 && !lista; i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) throw new Error('Chrome no abrio el puerto de depuracion');
  const pag = lista.find((t) => t.type === 'page');
  ws = new WebSocket(pag.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const e = d.params.exceptionDetails;
      fallos.push({ path: actual.path, step: actual.step, snippet: String(e.exception?.description || e.text).slice(0, 60) });
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalua = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable');

  async function revisa(paso) {
    pasos++;
    const txt = (await evalua('document.body ? document.body.innerText : ""')) ?? '';
    const attr = (await evalua(ATTR_EXPR)) ?? '';
    const total = txt + '\n' + attr;
    for (const m of total.matchAll(/\bundefined\b|\bNaN\b/g)) {
      const ini = Math.max(0, m.index - 30);
      const fin = Math.min(total.length, m.index + m[0].length + 30);
      fallos.push({ path: actual.path, step: paso, snippet: total.slice(ini, fin) });
    }
  }

  for (const p of ['/en/', '/es/']) {
    actual = { path: p, step: 'carga' };
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}${p}` });
    await espera(7000);

    actual.step = 'abre'; await espera(1500); await revisa('abre');

    actual.step = 'startup';
    const stateEntry = await evalua("document.getElementById('menu-pliego-estado')");
    if (!stateEntry) { fallos.push({ path: p, step: 'startup', snippet: 'theGame state entry did not mount' }); }
    await evalua("document.getElementById('menu-pliego-estado')?.click()");
    await espera(1500);
    const stateBoot = await evalua("JSON.stringify({ready:Boolean(document.querySelector('#crab-state-screen') && document.querySelector('#thegame-estado'))," +
      "sections:[...document.querySelectorAll('#crab-state-screen [data-section]')].map(e=>e.dataset.section)," +
      "text:document.querySelector('#crab-state-screen')?.innerText||''," +
      "controls:[...document.querySelectorAll('#crab-state-screen button')].map(e=>e.innerText)," +
      "summon:document.querySelector('#crab-state-screen a[href=\\\"#thegame-ondas\\\"]')!==null})");
    let screen = null; try { screen = JSON.parse(stateBoot); } catch {}
    if (!screen?.ready || JSON.stringify(screen.sections) !== JSON.stringify(['who', 'body', 'core', 'budget', 'receipts', 'actions']) || !screen.summon) {
      fallos.push({ path: p, step: 'startup', snippet: 'crab state screen structure/order/action missing' });
    }
    if (/\{"|\bSave on this device\b|\bForget saved game\b|\bImport game\b/.test(screen?.text || '')) {
      fallos.push({ path: p, step: 'startup', snippet: 'machine data or controls leaked into the crab screen' });
    }
    if (!/WHO YOU ARE[\s\S]*YOUR BODY[\s\S]*CORE AND RIFT[\s\S]*YOUR BUDGET[\s\S]*RECEIPTS[\s\S]*WHAT YOU CAN DO/.test(screen?.text || '')) {
      fallos.push({ path: p, step: 'startup', snippet: 'state titles did not render in the fixed order' });
    }
    const summon = await evalua("JSON.stringify((() => { const base=document.getElementById('casa-estado'), card=base?.querySelector('#summon-access'), buttons=[...(card?.querySelectorAll('.summon-access-button')||[])]; return {top:base?.firstElementChild?.id==='summon-access',symbol:card?.querySelector('.summon-access-symbol')?.textContent,cap:card?.querySelector('.summon-access-cap')?.textContent,ids:buttons.map(b=>b.id),labels:buttons.map(b=>b.getAttribute('aria-label')),height:buttons.length?Math.min(...buttons.map(b=>parseFloat(getComputedStyle(b).minHeight))):0}; })())");
    let access = null; try { access = JSON.parse(summon); } catch {}
    if (!access?.top || access.symbol !== '∿' || access.cap !== 'Team limit: 6 waves' || access.ids.length !== 4 || access.height < 44 || !access.labels.every(x => /Cost: [0-9]+ copper · [0-9]+ light/.test(x || ''))) {
      fallos.push({ path: p, step: 'startup', snippet: 'Base summon card is not first, measured, priced or touch sized: ' + JSON.stringify(access) });
    }
    await revisa('startup');
    await evalua("document.getElementById('menu-pliego-estado')?.click()");
    await espera(300);

    const n = (await evalua("document.querySelectorAll('.thegame-menu-item').length")) ?? 0;
    const ids = (await evalua("[...document.querySelectorAll('.thegame-menu-item')].map((e,i)=>e.id||('item-'+i))")) ?? [];
    for (let i = 0; i < n; i++) {
      const paso = ids[i] || `item-${i}`;
      actual.step = paso;
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500); await revisa(paso);
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500);
    }

    actual.step = 'exclusion-panel-hoja';
    await evalua("document.getElementById('menu-ondas')?.click()"); await espera(1500);
    let superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    if (JSON.parse(superficies || '{}').panel) { fallos.push({ path: p, step: actual.step, snippet: 'Army hoja left the side panel open' }); }
    await evalua("document.getElementById('menu-pliego-estado')?.click()"); await espera(1500);
    superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    const exclusivas = JSON.parse(superficies || '{}');
    if (exclusivas.hoja) { fallos.push({ path: p, step: actual.step, snippet: 'side panel left an Army or Battle sheet open' }); }
    await evalua("document.getElementById('menu-pliego-estado')?.click()"); await espera(300);

    actual.step = 'chat';
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500); await revisa('chat');
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500);

    actual.step = 'inspector';  /* 0d: la ficha de cada pieza del mapa, mas un toque real al centro de la primera */
    const fichas = (await evalua("window.AtlasInspector ? JSON.stringify(AtlasInspector.todas()) : 'NO_INSPECTOR'")) ?? '';
    pasos++;
    if (!fichas || fichas === 'NO_INSPECTOR' || fichas === '[]' || /inspector: /.test(fichas)) { fallos.push({ path: p, step: 'inspector', snippet: 'sin fichas: ' + fichas }); }
    for (const m of fichas.matchAll(/\bundefined\b|\bNaN\b/g)) { fallos.push({ path: p, step: 'inspector', snippet: fichas.slice(Math.max(0, m.index - 30), m.index + 30) }); }

    actual.step = 'identidad';
    await evalua("document.querySelector('[popovertarget=identity-menu]')?.click()");
    await espera(1500); await revisa('identidad');
  }
}

let codigo = 0;
try {
  await main();
} catch (e) {
  fallos.push({ path: actual.path, step: 'harness', snippet: String(e.message).slice(0, 60) });
} finally {
  try { ws?.close(); } catch {}
  try { ch?.kill(); } catch {}
  try { srv?.kill(); } catch {}
  try { if (dir) rmSync(dir, { recursive: true, force: true }); } catch {}
}
console.log(JSON.stringify({ fallos, pasos }, null, 2));
process.exitCode = fallos.length ? 1 : 0;
