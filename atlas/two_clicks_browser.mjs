// Two clicks, in a real browser and with real mouse clicks: from the landing `/` the OpenWorld door (1), then «Play now»
// on the welcome card of /openworld/ (2) → a visit is active (signed on this device), copper ≥ 100 from the beacon and the
// reef summon button is enabled. Also: the card is a labelled dialog, its main button gets focus, 44 px, Escape closes.
// Uso: node atlas/two_clicks_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
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
const fallos = [], externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, clics = 0, enMapa = false;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9500 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: enMapa ? `document.querySelector('#landing-world').contentWindow.eval(${JSON.stringify(e)})` : e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  // A real click: the mouse at the centre of the element as laid out on screen (whatever covers it gets the click).
  // quieto: the element is already on screen (asserted before), so the test itself does not scroll the page.
  const clic = async (sel, quieto) => {
    const scope = enMapa ? "document.querySelector('#landing-world').contentDocument" : 'document';
    const c = JSON.parse(await cmd('Runtime.evaluate', { expression: `(() => { const e = ${scope}.querySelector(${JSON.stringify(sel)}); if (!e) { return 'null'; } ${quieto ? '' : "e.scrollIntoView({ block: 'center' });"} const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`, awaitPromise: true, returnByValue: true }).then((x) => x.result?.result?.value ?? null));
    if (!c) { fallos.push('nothing to click: ' + sel); return; }
    for (const type of ['mousePressed', 'mouseReleased']) { await cmd('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', clickCount: 1 }); }
    clics++;
  };
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/' }); await espera(1200);
  const puerta = await ev("(() => { const a = [...document.querySelectorAll('a.door')].find((x) => /OpenWorld/.test(x.textContent)); return a ? a.textContent : null; })()");
  ok(/Play now: the map, your crab and the chat\./.test(puerta || ''), 'the OpenWorld door does not say «Play now»: ' + puerta);
  await clic('a.door[href="/openworld/"]'); enMapa = true; await espera(2000);
  const llegada = JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('sheet-welcome'), b = document.getElementById('welcome-play'), r = b ? b.getBoundingClientRect() : {};
    return { path: location.pathname, shown: !!c && !c.hidden, role: c && c.getAttribute('role'), modal: c && c.getAttribute('aria-modal'), title: (document.getElementById('welcome-h') || {}).textContent,
      focus: document.activeElement && document.activeElement.id, h: r.height, w: r.width, top: r.top, bottom: r.bottom, look: !!document.getElementById('welcome-look'), ancho: document.documentElement.scrollWidth,
      viewport: [innerWidth,innerHeight], body: [document.body.getBoundingClientRect().width,document.body.getBoundingClientRect().height], map: (()=>{const x=document.getElementById('map')?.getBoundingClientRect();return x&&[x.width,x.height]})(), parent: (()=>{const x=frameElement?.getBoundingClientRect();return x&&[x.width,x.height]})() }; })())`));
  ok(llegada.path === '/openworld/', 'click 1 did not reach /openworld/: ' + llegada.path);
  ok(llegada.shown && llegada.role === 'dialog' && llegada.modal === 'false', 'the welcome card is not a dialog voice at the top of the panel: ' + JSON.stringify(llegada));
  ok(llegada.title === 'Welcome to the sunken forest', 'the welcome title is wrong: ' + llegada.title);
  const welcomeStatus = await ev(`(() => {
    const el=document.getElementById('welcome-live');
    document.dispatchEvent(new CustomEvent('world:summary',{detail:{ok:true,live:2}}));
    const measured=el.textContent;
    document.dispatchEvent(new CustomEvent('world:summary',{detail:{ok:false,cause:'offline'}}));
    return {measured,offline:el.textContent};
  })()`);
  ok(welcomeStatus && welcomeStatus.measured.includes('Live nodes: 2.') && welcomeStatus.measured.includes('Live visitors: NO_DATA') && welcomeStatus.offline.includes('Live nodes: NO_DATA · offline'), 'Welcome must distinguish measured live nodes from unavailable counts');
  ok(llegada.focus === 'welcome-play', 'focus is not on «Play now»: ' + llegada.focus);
  ok(llegada.h >= 44 && llegada.w >= 44 && llegada.top >= 0 && llegada.bottom <= 844, 'the «Play now» button is below 44 px or off screen: ' + JSON.stringify(llegada));
  ok(llegada.look && llegada.ancho <= 390, 'no «Look around first» or sideways scroll: ' + JSON.stringify(llegada));
  await foto('dos-clics-welcome.png');
  await clic('#welcome-play', true); await espera(1500);
  await ev("document.querySelector('.cats [data-cat=Welcome]').click()");
  // Ojo del Doogee (2026-11-02): after «Play now» the map stays in view, the summon buttons say place and cost in words, the map
  // carries only the labelled pan joystick (the character's joystick is born with the character), and the place names on the map are legible (>= 12 CSS px) and never collide.
  const ojo = JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('surface'), m = c.getBoundingClientRect();
    const sum = [1, 2, 3, 4].map((n) => (document.getElementById('visitor-summon-tc' + n) || {}).textContent || '');
    const zb = [...document.querySelectorAll('#map .view-joy button')] /* gamepad (2026-11-07): the stick sits under the map */.map((b) => { const r = b.getBoundingClientRect(); return { l: b.getAttribute('aria-label'), w: r.width, h: r.height }; });
    const pl = JSON.parse(c.dataset.places || '[]'), px = c.width / m.width, yx = +c.dataset.youx / px, yy = +c.dataset.youy / px;
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    return { bar: !!document.getElementById('zoom-controls'), mapTop: m.top, scrollY: scrollY, sum, step: (document.getElementById('visitor-step') || {}).textContent, zb, pl, overlap: pl.some((a, i) => pl.some((b, j) => i < j && hit(a, b))),
      zoom: [...document.querySelectorAll('#map .view-joy')].some((j) => { const z = j.getBoundingClientRect(), q = { x: z.left - m.left, y: z.top - m.top, w: z.width, h: z.height }; return pl.some((a) => hit(a, q)); }),
      crab: pl.some((a) => a.x < yx && yx < a.x + a.w && a.y < yy && yy < a.y + a.h) }; })())`));
  ok(ojo.mapTop >= 0 && ojo.mapTop < 844, 'after Play now the map scrolled away: ' + JSON.stringify({ top: ojo.mapTop, y: ojo.scrollY }));
  ok(/^Summon at the Reef · 50 copper$/.test(ojo.sum[0]), 'the reef summon is not human: ' + ojo.sum[0]);
  ok(ojo.sum.slice(1).every((t) => /^Summon at the [A-Z][a-z]+ · \d+ copper \+ \d+ light · needs \d+ more/.test(t)) && !ojo.sum.some((t) => /tc\d/.test(t)), 'summon labels are not human or do not say what is missing: ' + JSON.stringify(ojo.sum));
  ok(ojo.step === 'Walk your crab: every hex is one step.', 'the step hint is not human: ' + ojo.step);
  // Decree 2026-11-07, fulfilled 2026-11-08: the camera stick and the crab's stick, both labelled and at least 44 px.
  ok(ojo.zb.length === 2 && ojo.zb.every((b) => b.w >= 44 && b.h >= 44) && /^Turn and tilt the map/.test(ojo.zb[0].l || '') && /^Walk your character/.test(ojo.zb[1].l || '') && !ojo.bar, 'the map does not carry the labelled 44 px camera and character sticks: ' + JSON.stringify(ojo.zb));
  ok(ojo.pl.length >= 4 && ojo.pl.every((p) => p.cap >= 12) && !ojo.overlap && !ojo.crab && !ojo.zoom, 'map place names are small, few or colliding: ' + JSON.stringify(ojo.pl));
  const jugando = JSON.parse(await ev(`JSON.stringify((() => { const s = document.getElementById('visitor-summon-tc1'), t = (document.getElementById('visitor-play') || {}).textContent || '';
    const m = /Copper (\\d+)/.exec(t); return { card: document.getElementById('sheet-welcome').hidden, copper: m ? +m[1] : -1, summon: !!s && !s.disabled, end: !!document.getElementById('visitor-end'),
      tab: String(!!document.querySelector('#voices [data-speaker="House"]')?.contains(document.getElementById('visitor-play'))), state: document.getElementById('state').textContent, result: document.getElementById('welcome-result').textContent }; })())`));
  ok(clics === 2, 'reaching the game took ' + clics + ' clicks, not 2');
  ok(jugando.end, 'after two clicks no visit is active');
  ok(jugando.copper >= 100, 'after two clicks the copper is below 100: ' + jugando.copper);
  ok(jugando.summon, 'after two clicks the reef summon button is not enabled');
  ok(jugando.card === true && jugando.tab === 'true', 'the welcome card did not give way to the House voice of the panel: ' + JSON.stringify(jugando));
  ok(/Visit started · signed on this device · 100 copper from the beacon · you can summon twice/.test(jugando.state), '#state does not announce the visit: ' + jugando.state);
  ok(/Play the tutorial by walking to the beacon, or press Skip tutorial/.test(jugando.result), 'the tutorial choice is not said: ' + jugando.result);
  await foto('dos-clics-playing.png');
  // «Look around first» and Escape: a fresh page, the card closes and the map is there.
  enMapa = false; await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1500);
  await ev("document.querySelector('.cats [data-cat=Welcome]').click()");
  await ev("document.getElementById('welcome-play').focus()");
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  ok((await ev("document.getElementById('sheet-welcome').hidden")) === true, 'Escape does not close the welcome card');
  ok(externas.length === 0, 'external requests: ' + externas.join(' '));
  console.log(JSON.stringify({ clics, llegada, ojo, jugando, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
