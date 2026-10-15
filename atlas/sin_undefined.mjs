// Guarda A1B8: lo ausente es NO_DATA con causa; jamas undefined ni NaN visibles en theGame.
// Uso: node atlas/sin_undefined.mjs  (Chrome headless por CDP y python3 sirviendo public/; sin dependencias)
import { spawn } from 'node:child_process';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ATTR_EXPR = "[...document.querySelectorAll('[aria-label],[title]')].map(e=>(e.getAttribute('aria-label')||'')+' '+(e.title||'')).join('\\n')";
const fallos = [];
let pasos = 0;
let actual = { path: '-', step: 'arranque' };
const pend = new Map();
let id = 0;
let ws = null, ch = null, srv = null;

async function main() {
  const port = 8900 + (process.pid % 90);
  const cdpPort = 9300 + (process.pid % 500);
  srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: PUBLIC, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await espera(250); try { await fetch(`http://127.0.0.1:${port}/`); break; } catch {} }

  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) throw new Error(ch.diagnostic());
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
    actual.step = 'glyph-accessibility';
    const glyph = await evalua(`(() => {
      if (!window.AtlasGlyph) return JSON.stringify({ready:false});
      const host=document.createElement('div'); host.id='semiotic-fixture';
      (document.getElementById('thegame')||document.body).appendChild(host);
      AtlasGlyph.monta(host,[1,0,0,2],'A cyan shield keeps red packets inside the boundary.');
      const svg=host.querySelector('svg'), b=host.querySelector('button'), status=host.querySelector('[role=status]');
      const result={ready:true,role:svg?.getAttribute('role'),label:svg?.getAttribute('aria-label'),height:b?parseFloat(getComputedStyle(b).minHeight):0,
        quiet:status?.textContent,description:host.innerText}; host.remove(); return JSON.stringify(result);
    })()`);
    let glyphData=null; try { glyphData=JSON.parse(glyph||'{}'); } catch {}
    if (!glyphData?.ready || glyphData.role!=='img' || !/signal cyan.*transport vector/i.test(glyphData.label||'') || glyphData.height<44 || !/Sound is off until you tap/.test(glyphData.quiet||'') || !/red packets/.test(glyphData.description||'')) {
      fallos.push({path:p,step:actual.step,snippet:'glyph rendering/accessibility/audio opt-in mismatch: '+JSON.stringify(glyphData)});
    }
    await revisa(actual.step);

    actual.step = 'hexelion-dictionary';
    const dictionary = await evalua(`(async () => {
      const A=window.AtlasHexelionDictionary;
      if (!A) return JSON.stringify({ready:false});
      await A.ready;
      const host=document.createElement('details'); host.open=true; document.body.appendChild(host); A.monta(host);
      await new Promise(r=>setTimeout(r,30));
      const buttons=[...host.querySelectorAll('.hexelion-crystal')]; buttons[1]?.click();
      const result={ready:true,count:buttons.length,nativeButtons:buttons.every(b=>b.tagName==='BUTTON'&&!b.hasAttribute('role')),state:A.state(),detail:host.querySelector('.hexelion-crystal-detail')?.innerText||'',
        glyph:!!host.querySelector('.hexelion-crystal-detail .semiotic-glyph svg[role=img]'),anchorsVisible:/Wikidata:|EUR-Lex-CELEX:/.test(host.innerText),
        reward:/Cobre|Coppers|Capture star/.test(host.innerText)}; host.remove(); return JSON.stringify(result);
    })()`);
    let dictionaryData = null; try { dictionaryData = JSON.parse(dictionary || '{}'); } catch {}
    if (!dictionaryData?.ready || dictionaryData.count !== 43 || !dictionaryData.nativeButtons || dictionaryData.state?.total?.indexOf('NO_DATA') !== 0 ||
        !/Clear Reef/.test(dictionaryData.detail) || !dictionaryData.glyph || dictionaryData.anchorsVisible || dictionaryData.reward) {
      fallos.push({ path: p, step: actual.step, snippet: 'public catalogue interaction or limits mismatch: ' + JSON.stringify(dictionaryData) });
    }
    await revisa(actual.step);

    actual.step = 'startup';
    const stateEntry = await evalua("document.getElementById('menu-history')");
    if (!stateEntry) { fallos.push({ path: p, step: 'startup', snippet: 'theGame state entry did not mount' }); }
    await evalua("document.getElementById('menu-history')?.click()");
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
    if (!access?.top || access.symbol !== '∿' || access.cap !== 'Team limit: 10 waves' || access.ids.length !== 4 || access.height < 44 || !access.labels.every(x => /Cost: [0-9]+ copper · [0-9]+ light/.test(x || ''))) {
      fallos.push({ path: p, step: 'startup', snippet: 'Base summon card is not first, measured, priced or touch sized: ' + JSON.stringify(access) });
    }
    await revisa('startup');
    await evalua("document.getElementById('menu-history')?.click()");
    await espera(300);

    const n = (await evalua("document.querySelectorAll('.thegame-menu-item').length")) ?? 0;
    const ids = (await evalua("[...document.querySelectorAll('.thegame-menu-item')].map((e,i)=>e.id||('item-'+i))")) ?? [];
    const labels = await evalua("JSON.stringify([...document.querySelectorAll('.thegame-menu-item')].map(e=>e.getAttribute('aria-label')))");
    const routeLabels = JSON.parse(labels || '[]').map(x => x.replace(/ · alert$/, ''));
    if (n !== 5 || JSON.stringify(routeLabels) !== JSON.stringify(['History mode','Waves Army','Buildings','Nodes & Events','How to start?'])) {
      fallos.push({ path: p, step: 'sidebar', snippet: 'expected the five English routes: ' + String(labels) });
    }
    for (let i = 0; i < n; i++) {
      const paso = ids[i] || `item-${i}`;
      actual.step = paso;
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500); await revisa(paso);
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500);
    }

    actual.step = 'nodes-roster';
    await evalua("document.getElementById('menu-nodes')?.click()"); await espera(1500);
    const roster = await evalua("JSON.stringify({visible:!document.getElementById('pliego-nodos')?.hidden,text:document.getElementById('pliego-nodos')?.innerText||''})");
    const rosterData = JSON.parse(roster || '{}');
    if (!rosterData.visible || !/nodo\.0\.hexelion/.test(rosterData.text) || !/nodo\.1\.doogee/.test(rosterData.text) || !/Beelink/.test(rosterData.text) || !/Doogee S110/.test(rosterData.text) || !/heartbeat.*NO_DATA/i.test(rosterData.text)) {
      fallos.push({ path: p, step: actual.step, snippet: 'node roster missing a declared device or honest heartbeat state: ' + JSON.stringify(rosterData) });
    }
    if (process.env.SABOTAGE_SKILL_LIVE === '1') { await evalua("document.querySelector('#pliego-skills ul')?.removeAttribute('aria-live')"); }
    const mando = await evalua("JSON.stringify({panel:!document.getElementById('pliego-skills')?.hidden,skillsLive:document.querySelector('#pliego-skills ul')?.getAttribute('aria-live'),buttons:[...document.querySelectorAll('#pliego-skills .crab-joystick button')].map(b=>({label:b.getAttribute('aria-label'),height:getComputedStyle(b).minHeight})),voice:document.querySelector('[data-voice-control]')?.textContent||''})");
    const mandoData = JSON.parse(mando || '{}');
    if (mandoData.skillsLive !== 'polite' || mandoData.buttons?.length !== 4 || !mandoData.buttons.every(b => parseFloat(b.height) >= 44 && /^Move (north|south|east|west)$/.test(b.label || '')) || !/Voice movement: NO_DATA.*speech recognition/i.test(mandoData.voice)) {
      fallos.push({ path: p, step: 'crab-controls', snippet: 'live skill announcements, directional controls, or honest voice-control status missing' });
    }
    await evalua("document.getElementById('menu-start')?.click()"); await espera(1200);
    const entry = await evalua("document.getElementById('pliego-entrada')?.innerText||''");
    if (!/Enter as a crab/.test(entry) || !/nodo\.1\.doogee/.test(entry)) { fallos.push({ path: p, step: 'entry', snippet: 'the visitor cannot choose the Doogee node as a crab' }); }
    await evalua("document.getElementById('menu-waves')?.click()"); await espera(1500);
    let superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    if (JSON.parse(superficies || '{}').panel) { fallos.push({ path: p, step: actual.step, snippet: 'Army hoja left the side panel open' }); }
    await evalua("document.getElementById('menu-history')?.click()"); await espera(1500);
    superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    const exclusivas = JSON.parse(superficies || '{}');
    if (exclusivas.hoja) { fallos.push({ path: p, step: actual.step, snippet: 'side panel left an Army or Battle sheet open' }); }
    await evalua("document.getElementById('menu-history')?.click()"); await espera(300);

    actual.step = 'chat';
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500); await revisa('chat');
    const channelCount = await evalua("document.querySelectorAll('#radio-chat [role=tab]').length");
    if (channelCount !== 3) { fallos.push({ path: p, step: 'chat', snippet: 'three communication channels did not render' }); }
    await evalua("[...document.querySelectorAll('#radio-chat [role=tab]')].find(b=>b.textContent==='Chat')?.click()"); await espera(200);
    const noData = await evalua("document.getElementById('radio-chat-no-data')?.innerText||''");
    if (!/NO_DATA.*global chat.*tested repository channel/i.test(noData)) { fallos.push({ path: p, step: 'chat', snippet: 'global chat does not declare its repository-data cause' }); }
    const records = await evalua("JSON.stringify((()=>{const r=window.AtlasRadioChat;if(r)r.dice({quien:'Browser test',texto:'synthetic message for schema check',fuente:'browser-test',sello:'SIMULATED'});return r?.registro().slice(-1).map(x=>Object.keys(x));})())");
    if (!records || !/quien/.test(records) || !/sello/.test(records) || !/fuente/.test(records) || !/ciclo/.test(records) || !/texto/.test(records)) {
      fallos.push({ path: p, step: 'ai-fluency', snippet: 'Radio does not expose structured, sourced messages to the agent interface' });
    }
    await evalua("[...document.querySelectorAll('#radio-chat [role=tab]')].find(b=>b.textContent==='Radio')?.click()");
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500);

    actual.step = 'inspector';  /* 0d: la ficha de cada pieza del mapa, mas un toque real al centro de la primera */
    const fichas = (await evalua("window.AtlasInspector ? JSON.stringify(AtlasInspector.todas()) : 'NO_INSPECTOR'")) ?? '';
    pasos++;
    if (!fichas || fichas === 'NO_INSPECTOR' || fichas === '[]' || /inspector: /.test(fichas)) { fallos.push({ path: p, step: 'inspector', snippet: 'sin fichas: ' + fichas }); }
    if (!fichas.includes('HEXELION Star')) { fallos.push({ path: p, step: 'inspector', snippet: 'map queue has no HEXELION Star building card' }); }
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
  fallos.push({ path: actual.path, step: 'harness', snippet: String(e.message) });
} finally {
  try { ws?.close(); } catch {}
  try { await ch?.close(); } catch {}
  try { srv?.kill(); } catch {}
}
console.log(JSON.stringify({ fallos, pasos }, null, 2));
process.exitCode = fallos.length ? 1 : 0;
