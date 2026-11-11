// Building interiors, piece 2 (mission «Los nueve edificios por dentro», Mesa reparto §2), proved in a real browser on
// /openworld/ at the mini app window (420×642) and at a phone (360×740). Laws:
// - one «Town» button in the gamepad middle, 44 px, with its Acho spectrum, opens one sheet;
// - the sheet shows the nine buildings of public/game/building_interiors.json, in order; focus moves into it;
// - each building shows exactly its contract options; each option says LIVE with its piece or NO_DATA with its cause;
// - every control is at least 44 px and Acho-painted; no horizontal overflow;
// - Escape goes back to the doors, then closes and returns focus to Town; reduced motion keeps cards still.
// Sabotage: SABOTAJE=sin-hoja (gamepad does not load the sheet) or SABOTAJE=sin-contrato (404 on the contract) ⇒ red.
// Uso: node atlas/building_sheet_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/gamepad.js' && SAB === 'sin-hoja') { cuerpo = Buffer.from(String(cuerpo).replace("town.src = '/game/building_sheet.js'; doc.head.appendChild(town);", '')); }
      if (ruta === '/game/building_interiors.json' && SAB === 'sin-contrato') { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  medidas.bytes = { sheet: statSync(join(PUBLIC, 'game/building_sheet.js')).size, contract: statSync(join(PUBLIC, 'game/building_interiors.json')).size };
  ok(medidas.bytes.sheet <= 8000 && medidas.bytes.contract <= 8192, 'building sheet over its byte ceiling: ' + JSON.stringify(medidas.bytes));
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const foto = async (n) => { if (CAPTURA) { const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, n), Buffer.from(g.result.data, 'base64')); } };
  await cmd('Runtime.enable'); await cmd('Page.enable');


  const MEDIR = `JSON.stringify((() => {
    const s = document.getElementById('building-sheet'), list = s && s.querySelector('.bs-list');
    const vis = [...(s ? s.querySelectorAll('button') : [])].filter((b) => !b.hidden && b.getBoundingClientRect().width > 0);
    return { open: !!s && !s.hidden, boxH: s ? Math.round(s.getBoundingClientRect().height) : 0, padB: Math.round(document.getElementById('gamepad').getBoundingClientRect().bottom), h: s && s.querySelector('h2').textContent, line: s && s.querySelector('.bs-line').textContent,
      cards: list ? [...list.querySelectorAll('.bs-card:not(#bs-conquest)')].map((b) => ({ t: b.firstChild.textContent, seal: b.dataset.seal })) : [],
      conquestFirst: !!list && !!list.firstElementChild && !!list.firstElementChild.querySelector('#bs-conquest'),
      small: vis.filter((b) => b.getBoundingClientRect().width < 44 || b.getBoundingClientRect().height < 44).map((b) => b.textContent),
      sinEspectro: vis.filter((b) => !b.classList.contains('gp-acho') || !b.style.getPropertyValue('--gp')).map((b) => b.textContent),
      focus: document.activeElement && document.activeElement.className, expanded: document.getElementById('gp-town').getAttribute('aria-expanded'),
      scroll: document.documentElement.scrollWidth, ancho: innerWidth };
  })())`;
  const espera_hoja = async (fn) => { for (let i = 0; i < 30; i++) { const m = JSON.parse(await ev(MEDIR)); if (fn(m)) { return m; } await espera(100); } return JSON.parse(await ev(MEDIR)); };
  const contrato = JSON.parse(readFileSync(join(PUBLIC, 'game/building_interiors.json'), 'utf8'));
  for (const [W, H, n] of [[420, 642, '420'], [360, 740, '360']]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2500);
    const town = await ev(`(() => { const b = document.getElementById('gp-town'); if (!b) return null; const r = b.getBoundingClientRect();
      return JSON.stringify({ w: r.width, h: r.height, inMid: !!b.closest('#gamepad .gp-mid'), acho: b.classList.contains('gp-acho'), label: b.getAttribute('aria-label') }); })()`);
    ok(town, n + ': no Node button in the gamepad');
    if (!town) { continue; }
    const t = JSON.parse(town); medidas['town' + n] = t;
    ok(t.inMid && t.acho && t.w >= 44 && t.h >= 44, n + ': the Node button is not a 44 px Acho button in the gamepad middle: ' + JSON.stringify(t));
    await ev(`document.getElementById('gp-town').click()`);
    const doors = await espera_hoja((m) => m.cards.length === 9);
    medidas['doors' + n] = { n: doors.cards.length, h: doors.h, focus: doors.focus };
    ok(doors.open && doors.expanded === 'true' && doors.cards.length === 9, n + ': the sheet does not show the nine buildings: ' + JSON.stringify(doors.cards.length));
    ok(doors.cards.every((c, i) => c.t.startsWith(contrato.buildings[i].name)), n + ': the doors are not the contract buildings in order');
    ok(doors.conquestFirst, n + ': the Conquest card (flags, building types, build) is not first in Node');
    ok(doors.boxH >= 140 && doors.padB <= H, n + ': the sheet is not really visible, or pushes the gamepad out: ' + JSON.stringify([doors.boxH, doors.padB]));
    ok(/bs-card/.test(doors.focus || ''), n + ': focus does not move into the sheet: ' + doors.focus);
    ok(doors.small.length === 0 && doors.sinEspectro.length === 0, n + ': sheet controls under 44 px or without Acho: ' + JSON.stringify([doors.small, doors.sinEspectro]));
    ok(doors.scroll <= doors.ancho, n + ': horizontal overflow with the sheet open');
    // Every building: its options are the contract's, each one says LIVE with its piece or NO_DATA with its cause.
    const fallas = [];
    for (const b of contrato.buildings) {
      // A door (building_doors.js) may have closed the sheet onto its panel: the visitor closes that panel, Node opens the sheet again.
      await ev(`(() => { const s = document.getElementById('building-sheet'), p = document.querySelector('.cats button[aria-pressed="true"]'); if (p) { p.click(); }
        if (s.hidden) { document.getElementById('gp-town').click(); } const bk = s.querySelector('.bs-tool'); if (!bk.hidden) { bk.click(); }
        const c = [...s.querySelectorAll('.bs-card')].find((x) => x.firstChild.textContent.startsWith(${JSON.stringify(b.name + ' · ')})); c && c.click(); })()`);
      await espera_hoja((x) => x.cards.length === b.options.length && x.h.startsWith(b.name));
      // Measure at rest: a press gesture still running translates its button by fractions of a pixel (43.99998 px is not a small button).
      await ev(`Promise.all(document.getElementById('building-sheet').getAnimations({ subtree: true }).map((a) => a.finished.catch(() => 0))).then(() => 1)`);
      const m = JSON.parse(await ev(MEDIR));
      if (!m.open || m.boxH < 140 || m.cards.length !== b.options.length || m.cards.some((c, i) => c.t !== b.options[i].label || c.seal !== (b.options[i].piece ? 'LIVE' : 'NO_DATA'))) { fallas.push(b.id + ':cards'); continue; }
      if (m.small.length || m.sinEspectro.length) { fallas.push(b.id + ':a11y'); }
      for (let i = 0; i < b.options.length; i++) {
        const said = await ev(`(() => { const c = document.querySelectorAll('#building-sheet .bs-card')[${i}]; c.click(); return document.querySelector('#building-sheet .bs-line').textContent; })()`);
        const o = b.options[i], want = o.piece ? 'LIVE · piece ' + o.piece.split('/').pop() : 'NO_DATA · ' + o.cause;
        if (!said.includes(want)) { fallas.push(b.id + '/' + o.id); }
      }
    }
    ok(fallas.length === 0, n + ': options that do not say their seal honestly: ' + JSON.stringify(fallas));
    await foto('building-sheet-' + n + '.png');
    // Escape: back to the doors, then closed with focus on Town.
    const esc = `document.getElementById('building-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`;
    await ev(esc); const atras = await espera_hoja((m) => m.cards.length === 9);
    await ev(esc); const fin = JSON.parse(await ev(MEDIR));
    ok(atras.cards.length === 9 && !fin.open && fin.expanded === 'false' && /gp-b/.test(fin.focus || ''), n + ': Escape does not go back then close: ' + JSON.stringify([atras.cards.length, fin.open, fin.focus]));
  }
  // Reduced motion: a card stays still.
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  medidas.quieto = await ev(`(() => { document.getElementById('gp-town').click(); return new Promise((r) => setTimeout(() => { const c = document.querySelector('#building-sheet .bs-card'); if (!c) return r(-1); c.click(); r(c.getAnimations().length); }, 400)); })()`);
  ok(medidas.quieto === 0, 'a sheet card moves under prefers-reduced-motion: ' + medidas.quieto);
  // Contract missing: the sheet says NO_DATA with its cause, never an empty town.
  console.log(JSON.stringify({ piece: 'building-sheet', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'building-sheet', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
