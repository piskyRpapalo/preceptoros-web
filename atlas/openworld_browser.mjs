// Browser gate for the current OpenWorld terminal: one shared hex map, icon controls,
// overlay voices, a persistent chat, and visible keyboard-accessible map actions.
// Usage: node atlas/openworld_browser.mjs [capture-directory]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURE = process.argv[2] || null;
const HITL = readFileSync(new URL('./fixtures/hitl_state.json', import.meta.url));
const ONE = readFileSync(new URL('./fixtures/one_live_node.json', import.meta.url));   // one live node: the tutorial cabin is retired
let hitlOn = false;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [], external = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
let server, chrome, ws, seq = 0;
const pending = new Map();

function serve() {
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const http = createServer((req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(PUBLIC, '.' + path);
      if (!file.startsWith(resolve(PUBLIC))) { res.writeHead(403).end(); return; }
      const body = path === '/openworld/state.json' ? (hitlOn ? HITL : ONE) : readFileSync(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((resolve) => http.listen(0, '127.0.0.1', () => resolve(http)));
}

async function main() {
  server = await serve();
  const origin = 'http://127.0.0.1:' + server.address().port;
  const port = 9600 + (process.pid % 90);
  chrome = launchChrome(port);
  let pages;
  for (let i = 0; i < 60 && !pages && !chrome.failure(); i++) {
    await wait(250);
    try { pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
  }
  if (!pages) throw new Error(chrome.diagnostic());
  ws = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', () => reject(new Error('CDP websocket'))); });
  ws.addEventListener('message', (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
    if (data.method === 'Network.requestWillBeSent') {
      const url = data.params.request.url;
      if (/^https?:/.test(url) && new URL(url).origin !== origin) external.push(url);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const error = data.params.exceptionDetails;
      failures.push('browser exception: ' + String(error.exception?.description || error.text).split('\n')[0].slice(0, 100));
    }
  });
  const command = (method, params = {}) => new Promise((resolve) => {
    const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const key = async (name, code, vk, text) => {
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: vk, text });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: vk });
  };
  await command('Runtime.enable'); await command('Page.enable'); await command('Network.enable');
  await command('Network.setBlockedURLs', { urls: ['https://api.preceptoros.org/*'] });
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: origin + '/openworld/' }); await wait(2000);

  const initial = JSON.parse(await evaluate(`JSON.stringify((() => {
    const map = document.getElementById('map'), stage = document.getElementById('stage'), canvas = document.getElementById('surface');
    const voices = document.getElementById('voices'), chat = document.getElementById('chat'), bar = map.querySelector('.cats');
    const joy = stage.querySelector('#view-joystick'), form = document.getElementById('entry'), sr = (e) => { const r=e.getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom,r.width,r.height]; };
    let inkPixels = 0; try { const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data; for(let i=3;i<data.length;i+=4) if(data[i]) inkPixels++; } catch { inkPixels=-1; }
    return { title: document.querySelector('h1')?.textContent, canvases: document.querySelectorAll('canvas').length,
      inkPixels,
      map: sr(map), stage: sr(stage), canvas: sr(canvas), bar: sr(bar), panelParent: voices.parentElement.id, panelHidden: voices.hidden,
      chat: sr(chat), form: sr(form), joy: joy && sr(joy), padGone: !document.querySelector('.walk-pad'),
      count: bar?.querySelectorAll('button').length, labels: [...(bar?.querySelectorAll('button') || [])].map(b=>b.getAttribute('aria-label')),
      profileHidden: !!bar?.querySelector('[data-cat=Profile]')?.hidden, entryTools: !!document.getElementById('entry-tools'),
      intro: document.body.innerText }; })())`));
  ok(/^([A-Z][a-z]{3,9} · -?\d+, -?\d+|NO_DATA: visitor position unavailable)$/.test(initial.title || ''), 'map title does not identify the ephemeral account location: ' + initial.title);
  ok(initial.canvases === 1, 'OpenWorld renders more than one canvas: ' + initial.canvases);
  ok(initial.inkPixels > 2000, 'the map is blank: ' + initial.inkPixels);
  ok(initial.panelParent === 'stage' && initial.panelHidden, 'voice panels are not mounted as a closed overlay on the shared map');
  ok(initial.count === 3 && initial.labels.join('|') === 'Welcome|Profile|Communication', 'the three terminal leaves are missing or unnamed: ' + JSON.stringify(initial.labels));
  ok(initial.profileHidden && initial.entryTools, 'Profile is visible before a visit or the entry Tools button is missing');
  ok(initial.bar[1] >= initial.stage[3] - 1, 'voice controls are not immediately below the map: ' + JSON.stringify(initial.bar));
// Main's three-leaf entry starts closed; this is intentional after the communication moved behind its own leaf.
  ok(initial.chat[5] === 0 && initial.form[5] === 0, 'communication is open before it is requested');
  ok(initial.padGone, 'the retired six-direction pad is still on the map layer');
  ok(initial.joy && initial.joy[4] >= 44, 'the view joystick is not visible on the map layer: ' + JSON.stringify(initial.joy));

  const remoteChat = await evaluate(`(async () => {
    document.querySelector('.cats [data-cat=Communication]').click();
    const mode = document.getElementById('chat-destination'), form = document.getElementById('entry'), input = document.getElementById('question');
    const script=document.createElement('script'); script.src='/game/classroom_chat.js'; await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script)});
    let calls = [], original = AtlasAulaChat.turn;
    AtlasAulaChat.turn = async (fetcher, visit, text, chain, page) => { calls.push({visit, text, page}); return {ok:true,text:'Fixture response',chain:{tic:1,hash:'fixture',sello:{}},receiptState:{ok:false}}; };
    mode.value='hexelion'; mode.dispatchEvent(new Event('change'));
    input.value='before visit'; form.requestSubmit(); await new Promise(r=>setTimeout(r,30));
    const withoutVisit=calls.length, informed=document.getElementById('log').textContent.includes('Start an ephemeral visit');
    document.getElementById('visitor-start').click(); await new Promise(r=>setTimeout(r,700));
    const profileAvailable=!document.querySelector('.cats [data-cat=Profile]').hidden;
    document.querySelector('.cats [data-cat=Profile]').click();
    const profileHasVisit=!!document.querySelector('#visitor-play #visitor-end');
    document.querySelector('.cats [data-cat=Communication]').click();
    input.value='hello'; form.requestSubmit(); await new Promise(r=>setTimeout(r,100));
    const response=document.getElementById('log').textContent.includes('Fixture response');
    const sent=calls.slice(); document.getElementById('visitor-end').click(); await new Promise(r=>setTimeout(r,100));
    input.value='after visit'; form.requestSubmit(); await new Promise(r=>setTimeout(r,30));
    const afterEnd=calls.length, profileHiddenAfterEnd=document.querySelector('.cats [data-cat=Profile]').hidden; AtlasAulaChat.turn=original; mode.value='local'; mode.dispatchEvent(new Event('change')); input.value='';
    return {withoutVisit,informed,sent,response,afterEnd,profileAvailable,profileHasVisit,profileHiddenAfterEnd};
  })()`);
  ok(remoteChat && remoteChat.withoutVisit === 0 && remoteChat.informed && remoteChat.sent.length === 1 && /^[a-f0-9]{64}$/.test(remoteChat.sent[0].visit) && remoteChat.sent[0].page === '/openworld/' && remoteChat.response && remoteChat.afterEnd === 1 && remoteChat.profileAvailable && remoteChat.profileHasVisit && remoteChat.profileHiddenAfterEnd, 'Profile and remote chat must follow the active ephemeral visit only: ' + JSON.stringify(remoteChat));

  const panel = JSON.parse(await evaluate(`JSON.stringify((() => {
    const bar = document.querySelector('.cats'), buttons = [...bar.querySelectorAll('button')], voices = document.getElementById('voices');
    const map = buttons.find(b=>b.dataset.cat==='Welcome'), sizes = buttons.filter(b=>!b.hidden).map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height]});
    map.click(); const opened = !voices.hidden && getComputedStyle(voices).display !== 'none';
    const stage = document.getElementById('stage'), chat = document.getElementById('chat');
    const overlap = voices.getBoundingClientRect().top < stage.getBoundingClientRect().bottom;
    const place = voices.querySelector('.map-place');
    const hasMapStatus = !!voices.querySelector('#state') && !!voices.querySelector('#floor-state');
    const floorText = voices.querySelector('#floor-state')?.textContent || '';
    const cells = window.AtlasMapPainter?.world()?.cells?.list?.length || 0;
    map.click(); const closed = voices.hidden;
    return { opened, overlap, place: !!place, placeTag: place?.tagName, hasMapStatus, floorText, cells, closed,
      chatVisible: chat.getBoundingClientRect().height > 0, sizes }; })())`));
  ok(panel.opened && panel.overlap, 'Map voice does not open over the shared map: ' + JSON.stringify(panel));
  ok(panel.place && panel.placeTag === 'BUTTON' && panel.hasMapStatus, 'map destinations or status are not visible accessible panel content');
  ok(panel.cells > 1000 && /^Map loaded/.test(panel.floorText), 'the 2.5D floor is not painted: ' + JSON.stringify({ cells: panel.cells, floor: panel.floorText }));
  ok(panel.closed && !panel.chatVisible, 'closing Welcome must restore the unobstructed map');
  ok(panel.sizes.every(([w,h]) => w >= 44 && h >= 44), 'a voice control is below the 44 px touch target: ' + JSON.stringify(panel.sizes));
  ok(panel.sizes.every(([w]) => w <= 48), 'panel icons stretch across the map instead of remaining compact: ' + JSON.stringify(panel.sizes));

  const categories = JSON.parse(await evaluate(`JSON.stringify((() => {
    const bs=[...document.querySelectorAll('.cats button')].filter(b=>!b.hidden), voices=document.getElementById('voices');
    const results=bs.map(b=>{b.click(); const cat=b.dataset.cat, own=[...voices.querySelectorAll('[data-speaker]')].filter(v=>v.dataset.cat===cat);
      const visible=own.some(v=>v.getBoundingClientRect().width>0 && getComputedStyle(v).display!=='none');
      const over=[...voices.querySelectorAll('[data-speaker]')].filter(v=>v.dataset.cat!==cat).every(v=>getComputedStyle(v).display==='none');
      const composer=document.getElementById('entry').getBoundingClientRect().height>0; b.click(); return {cat,visible,over,composer};});
    return results; })())`));
  ok(categories.length === 2 && categories.every((row) => row.visible && row.over && row.composer === (row.cat === 'Communication')), 'Welcome and Communication leaves are broken: ' + JSON.stringify(categories));
  const start = JSON.parse(await evaluate(`JSON.stringify((() => { const b=document.querySelector('.cats [data-cat=Welcome]'); b.click(); const p=document.getElementById('play-now');
    const answer={play:!!p && p.getBoundingClientRect().height>=44,formClosed:document.getElementById('entry').getBoundingClientRect().height===0}; b.click(); return answer; })())`));
  ok(start.play && start.formClosed, 'Welcome must show the next step without opening Communication');

  const more = JSON.parse(await evaluate(`JSON.stringify((() => { const b=document.querySelector('.cats [data-cat=Communication]'); b.click();
    const d=document.getElementById('more'), select=document.querySelector('#more-look select');
    const folded=!!d && !d.open && !!select && d.contains(select); b.click(); return {folded}; })())`));
  ok(more.folded, 'the terminal look is not folded under More');

  const models = JSON.parse(await evaluate(`(async () => { const b=document.querySelector('.cats [data-cat=Welcome]'); b.click(); const t=document.getElementById('entry-tools'); t.click();
    const d=document.getElementById('model-catalog'); d.querySelector('summary').click(); await new Promise(r=>setTimeout(r,500));
    const result={frames:d.querySelectorAll('.model-frame').length,status:document.getElementById('model-catalog-state').textContent,
      labels:[...d.querySelectorAll('canvas')].every(c=>c.getAttribute('role')==='img' && /residency NO_DATA/.test(c.getAttribute('aria-label')||'')),toolsOpen:document.getElementById('voices').dataset.activeCategory==='Tools'};
    d.querySelector('summary').click(); t.click(); return JSON.stringify(result); })()`));
  ok(models.frames > 0 && /declared model frames/.test(models.status) && models.labels, 'the model panel does not show declared Acho frames with honest NO_DATA');

  await key('e','KeyE',69,'e'); await wait(250);
  const orbit = await evaluate("document.getElementById('surface').dataset.angle || '0'");
  ok(orbit === '60', 'the E key does not rotate the map to 60 degrees: ' + orbit);
  await key('Escape','Escape',27); await wait(100);

  const movement = await evaluate(`(async () => {
// The merged three-leaf layout now puts node places under Welcome (the former Map leaf).
    const cat=document.querySelector('.cats [data-cat=Welcome]'); if (cat && cat.getAttribute('aria-pressed') !== 'true') cat.click();
    await new Promise(r=>setTimeout(r,400));
    const place=document.querySelector('#map-node-list [data-node="home"]');
    const joy=document.querySelector('#stage #view-joystick'); const before=document.querySelector('h1').textContent;
    place?.click();
    await new Promise(r=>setTimeout(r,600));
    // The route can finish before building_chat mounts its exit control; wait for that measured state, not a fixed short delay.
    for (let i=0;i<100;i++) { const exit=document.getElementById('leave-building'); if (exit && !exit.hidden) break; await new Promise(r=>setTimeout(r,50)); }
    return {joyOnStage:!!joy && joy.parentElement===document.getElementById('stage'),
      buttons:document.querySelectorAll('#stage .view-joy button').length, before, after:document.querySelector('h1').textContent,
      live:(document.querySelector('#joy [aria-live]')||{}).textContent || ''};
  })()`);
  // Joystick decree (2026-11-07): one pan stick on the map; the right slot waits, NO_DATA, for the ephemeral character.
  ok(movement.joyOnStage && movement.buttons === 1, 'the view joystick is not the one-control view panner on the map: ' + JSON.stringify(movement));
  ok(/terminal: basic \(the node\)/.test(movement.live), 'a node place click does not walk and enter the node: ' + JSON.stringify(movement));

// Require a real Leave action before testing general chat; this catches a broken building exit.
  const leaveStatus = await evaluate(`(() => { const b=document.getElementById('leave-building'); if(!b || b.hidden) return 'NO_LEAVE_CONTROL'; b.click(); return document.getElementById('state').textContent; })()`);
  ok(/^Left building /.test(leaveStatus), 'the building conversation did not leave before general chat: ' + leaveStatus);

  await evaluate(`(() => { const q=document.getElementById('question'); q.value='hello'; document.getElementById('entry').requestSubmit(); })()`);
  await wait(800);
  const chatAnswer = await evaluate("document.querySelector('#log li:last-child')?.textContent || ''");
  ok(/^NO_DATA · /.test(chatAnswer), 'chat does not report unavailable model honestly: ' + chatAnswer);

  hitlOn = true;
  await command('Page.navigate', { url: origin + '/openworld/' }); await wait(1700);
  await evaluate("document.querySelector('.cats [data-cat=Welcome]').click()");
  const hitl = JSON.parse(await evaluate(`JSON.stringify((() => { const b=document.querySelector('#voice-walkers .hitl-mark');
    const r=b?.getBoundingClientRect(); return {exists:!!b, tag:b?.tagName, label:b?.getAttribute('aria-label'), width:r?.width||0,height:r?.height||0,
      visible:!!b && r.width>0 && getComputedStyle(b).display!=='none'}; })())`));
  ok(hitl.exists && hitl.tag === 'BUTTON' && hitl.visible && hitl.width >= 44 && hitl.height >= 44, 'HITL action is not visible as an accessible panel button: ' + JSON.stringify(hitl));
  let reached = false;
  for (let i=0;i<40 && !reached;i++) { await key('Tab','Tab',9); reached = await evaluate("document.activeElement.matches('#voice-walkers .hitl-mark')"); }
  ok(reached, 'Tab never reaches the HITL button');
  if (hitl.exists && reached) {
    await evaluate("document.querySelector('#voice-walkers .hitl-mark').focus()"); await key('Enter','Enter',13,'\r'); await wait(300);
    const opened = await evaluate("document.querySelector('#joy [aria-live]')?.textContent || ''");
    ok(/terminal: basic/.test(opened), 'keyboard Enter does not activate the visible HITL panel button: ' + opened);
  }
  hitlOn = false;

  for (const [width,height,mobile] of [[360,716,true],[412,844,true],[1280,800,false]]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile}); await wait(150);
    const layout = JSON.parse(await evaluate(`JSON.stringify((() => { const m=document.getElementById('map').getBoundingClientRect(), c=document.getElementById('chat').getBoundingClientRect(),
      s=document.getElementById('surface').getBoundingClientRect(), f=document.getElementById('entry').getBoundingClientRect();
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,map:[m.left,m.top,m.right,m.bottom],chat:[c.left,c.top,c.right,c.bottom],surface:[s.width,s.height],formBottom:f.bottom}; })())`));
    ok(layout.scroll <= layout.width, 'page scrolls sideways at viewport ' + width + ': ' + JSON.stringify(layout));
    ok(layout.map[2] >= layout.width - 1, 'the single map does not fill the viewport: ' + JSON.stringify(layout));
    ok(layout.formBottom <= height + 1, 'composer left the visible chat viewport: ' + JSON.stringify(layout));
  }
  ok(external.length === 0, 'browser tried to call an external host: ' + external.slice(0,3).join(', '));
  if (CAPTURE) {
    await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    writeFileSync(join(CAPTURE,'openworld-terminal.png'),Buffer.from(shot.result.data,'base64'));
  }
  console.log(JSON.stringify({ suite:'openworld-terminal', result:failures.length?'ROJO':'VERDE', initial, panel, categories, movement, models, hitl, failures }));
}

main().catch((error) => { failures.push('harness: ' + error.message); console.error(JSON.stringify({ suite:'openworld-terminal', result:'ROJO', failures })); })
  .finally(() => { try { ws?.close(); } catch {} chrome?.close?.(); server?.close(); process.exitCode = failures.length ? 1 : 0; });
