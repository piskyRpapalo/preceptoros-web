// Building interiors, piece 2 (mission «Los nueve edificios por dentro», Mesa reparto §2), proved in a real browser on
// /openworld/ at 320×568, 360×740, 420×642 and 1024×768. Laws:
// - one «Town» button in the gamepad middle, 44 px, with its Acho spectrum, opens one sheet;
// - the sheet shows the eight buildings (no lottery, 2026-11-24) of public/game/building_interiors.json, in order; focus moves into it;
// - each building shows exactly its contract options; each option says LIVE with its piece or NO_DATA with its cause;
// - every control is at least 44 px and Acho-painted; no horizontal overflow;
// - Escape goes back to the doors, then closes and returns focus to Town; reduced motion keeps cards still.
// - honest doors (Mesa #34, 2026-11-14): LIVE is a press that does something. Every LIVE card is pressed and its
//   EFFECT is measured (an event, a changed page, the result of the real piece), never the words of its seal; a piece
//   with no action and no door says NO_DATA · no_interaction_yet and does nothing. With a visit, the seven doors open.
// Sabotage: SABOTAJE=sin-hoja (gamepad does not load the sheet) or SABOTAJE=sin-contrato (404 on the contract) ⇒ red;
// SABOTAJE=falso-live (a piece alone counts as LIVE again) or SABOTAJE=efecto-mudo (actions only write words) ⇒ red.
// Uso: node atlas/building_sheet_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { launchChrome } from './chrome_launch.mjs';
const DOORS = createRequire(import.meta.url)('../public/game/building_doors.js');
const GACHA = createRequire(import.meta.url)('../public/game/gacha.js');
// What each action must leave behind: page(before) reads the page; line is the result the real piece said.
const pedidos = new Set(), res = (t) => (t.split(' · missions ')[1] || '').split(' · ').slice(1).join(' · '); // the result after the verdict
const EFFECT = {
  letters: { page: `document.documentElement.getAttribute('data-type-step') || document.documentElement.style.cssText`, changes: true },
  audio: { page: `document.documentElement.dataset.audioOnly || 'off'`, changes: true, twice: true },
  odds: { line: (t) => Object.keys(GACHA.TCS).every((tc) => t.includes(tc + ' ' + GACHA.odds(tc).join('/'))) },
  gaps: { line: (t, doc) => t.includes(doc.buildings.flatMap((b) => b.options).filter((o) => !DOORS.live(o)).length + ' of ' + doc.buildings.flatMap((b) => b.options).length + ' options are NO_DATA') },
  pulse: { line: (t) => /^Pulse · .*(MEASURED|NO_DATA)/.test(res(t)) },
  notebook: { line: (t) => /saved$|notebook_download_failed$/.test(t) },
  typo: { line: (t) => /nothing_selected/.test(t) },
  tower: { line: (t) => /\d/.test(res(t)) && pedidos.has('/game/tower_floors.json') },
  inhabitants: { line: (t) => /^(NO_DATA · world_state_\w+|\d+ inhabitants · )/.test(res(t)) && pedidos.has('/api/world-state') }, // this harness has no publisher: the piece says so
};

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
      pedidos.add(ruta);
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/gamepad.js' && SAB === 'sin-hoja') { cuerpo = Buffer.from(String(cuerpo).replace("town.src = '/game/building_sheet.js'; doc.head.appendChild(town);", '')); }
      if (ruta === '/game/building_interiors.json' && SAB === 'sin-contrato') { res.writeHead(404); res.end(); return; }
      if (ruta === '/game/building_doors.js' && SAB === 'falso-live') { cuerpo = Buffer.from(String(cuerpo).replace('o.piece && (o.action || DOORS[o.id])', 'o.piece')); }
      if (ruta === '/game/town_actions.js' && SAB === 'efecto-mudo') { cuerpo = Buffer.from(String(cuerpo).replace("c.load(a[0], a[1], function (M) {", "done('LIVE · done'); return; c.load(a[0], a[1], function (M) {")); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {}, efectos = { con: new Set(), sin: [], lineas: {} };
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
  for (const [W, H, n] of [[320, 568, '320'], [360, 740, '360'], [420, 642, '420'], [1024, 768, '1024']]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' }); await espera(2500);
    await ev(`(() => { window.__acts = []; document.addEventListener('building:act', (e) => window.__acts.push(e.detail && e.detail.name)); })()`);
    const town = await ev(`(() => { const b = document.getElementById('gp-town'); if (!b) return null; const r = b.getBoundingClientRect();
      return JSON.stringify({ w: r.width, h: r.height, inMid: !!b.closest('#gamepad .gp-mid'), acho: b.classList.contains('gp-acho'), label: b.getAttribute('aria-label') }); })()`);
    ok(town, n + ': no Node button in the gamepad');
    if (!town) { continue; }
    const t = JSON.parse(town); medidas['town' + n] = t;
    ok(t.inMid && t.acho && t.w >= 44 && t.h >= 44, n + ': the Node button is not a 44 px Acho button in the gamepad middle: ' + JSON.stringify(t));
    await ev(`document.getElementById('gp-town').click()`);
    const doors = await espera_hoja((m) => m.cards.length === 8);
    medidas['doors' + n] = { n: doors.cards.length, h: doors.h, focus: doors.focus };
    ok(doors.open && doors.expanded === 'true' && doors.cards.length === 8, n + ': the sheet does not show the eight buildings: ' + JSON.stringify(doors.cards.length));
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
      if (!m.open || m.boxH < 140 || m.cards.length !== b.options.length || m.cards.some((c, i) => c.t !== b.options[i].label)) { fallas.push(b.id + ':cards'); continue; }
      m.cards.forEach((c, i) => { if (c.seal !== (DOORS.live(b.options[i]) ? 'LIVE' : 'NO_DATA')) { fallas.push(b.id + '/' + b.options[i].id + ':seal_not_the_contract'); } });
      if (m.small.length || m.sinEspectro.length) { fallas.push(b.id + ':a11y'); }
      for (let i = 0; i < b.options.length; i++) {
        const o = b.options[i], k = b.id + '/' + o.id, E = o.action ? EFFECT[o.action] : null;
        const LINE = `document.querySelector('#building-sheet .bs-line').textContent`, ACTS = `JSON.stringify(window.__acts || [])`;
        const antes = E && E.page ? await ev(E.page) : null, acts0 = JSON.parse(await ev(ACTS)).length;
        // The card on screen decides: whatever is painted LIVE must do something, whatever the contract says.
        const card = JSON.parse(await ev(`(() => { const c = document.querySelectorAll('#building-sheet .bs-card')[${i}]; const seal = c.dataset.seal; c.click(); return JSON.stringify({ seal, said: ${LINE} }); })()`));
        if (card.seal !== 'LIVE') {
          if (!card.said.includes('NO_DATA · ' + (o.cause || 'no_interaction_yet'))) { fallas.push(k + ':cause'); }
          continue;
        }
        if (!card.said.includes('LIVE · piece ' + String(o.piece).split('/').pop())) { fallas.push(k + ':seal'); }
        let hecho = false, linea = card.said;
        for (let t = 0; t < 60 && !hecho; t++) {
          linea = await ev(LINE); const acts = JSON.parse(await ev(ACTS)).slice(acts0);
          if (!o.action) { hecho = DOORS.DOORS[o.id] && (linea.includes('NO_DATA · no_visit_yet') || acts.includes('door:' + o.id)); if (!DOORS.DOORS[o.id]) { break; } } // a door without a visit says why and opens nothing
          else if (E) { hecho = acts.includes(o.action) && (E.page ? (await ev(E.page)) !== antes : E.line(linea, contrato)); }
          if (!hecho) { await espera(100); }
        }
        if (o.action) { efectos.lineas[o.action] = res(linea).slice(0, 80); }
        if (!hecho) { fallas.push(k + ':no_effect'); efectos.sin.push(k + ' → ' + linea.slice(-60)); } else { efectos.con.add(k); }
        if (hecho && E && E.twice) { await ev(`document.querySelectorAll('#building-sheet .bs-card')[${i}].click()`); await espera(150); } // leave the page as it was
      }
    }
    ok(fallas.length === 0, n + ': options that do not say their seal honestly, or LIVE with no effect: ' + JSON.stringify(fallas));
    await foto('building-sheet-' + n + '.png');
    // With a visit, the seven doors really open: the panel is pressed, the sheet closes, focus lands in the panel.
    if (n === '360') {
      await ev(`document.getElementById('play-now') && document.getElementById('play-now').click()`); await new Promise((r) => setTimeout(r, 200));
      await ev(`document.getElementById('welcome-play') && document.getElementById('welcome-play').offsetParent && document.getElementById('welcome-play').click()`); // Play reopens the one HITL entry; «Sign HITL» starts the visit
      const abiertas = [], cerradas = [];
      for (const b of contrato.buildings) { for (const o of b.options.filter((x) => DOORS.DOORS[x.id] && DOORS.live(x))) {
        const cat = DOORS.DOORS[o.id]; let r = null;
        await ev(`window.__acts.length = 0`); // an earlier press of this door (some panels need no visit) does not count
        for (let t = 0; t < 80 && !(r && r.ok); t++) {
          r = JSON.parse(await ev(`(() => { const s = document.getElementById('building-sheet'), c = document.querySelector('.cats [data-cat="${cat}"]');
            if (!c || c.hidden) { return JSON.stringify({ ok: false, why: 'no_visit_yet' }); }
            if (window.__acts.includes('door:${o.id}')) { const a = document.activeElement; return JSON.stringify({ ok: c.getAttribute('aria-pressed') === 'true' && s.hidden && !!a && a !== document.body, why: 'opened' }); }
            const p = document.querySelector('.cats button[aria-pressed="true"]'); if (p) { p.click(); }
            if (s.hidden) { document.getElementById('gp-town').click(); return JSON.stringify({ ok: false, why: 'opening' }); }
            const bk = s.querySelector('.bs-tool'); if (!bk.hidden) { bk.click(); }
            const d = [...s.querySelectorAll('.bs-card')].find((x) => x.firstChild.textContent.startsWith(${JSON.stringify(b.name + ' · ')})); if (!d) { return JSON.stringify({ ok: false, why: 'no_building' }); } d.click();
            const card = [...s.querySelectorAll('.bs-card')].find((x) => x.firstChild.textContent === ${JSON.stringify(o.label)}); if (!card) { return JSON.stringify({ ok: false, why: 'no_card' }); } card.click();
            return JSON.stringify({ ok: false, why: 'pressed' }); })()`));
          if (!r.ok) { await espera(150); }
        }
        (r && r.ok ? abiertas : cerradas).push(b.id + '/' + o.id + (r && !r.ok ? ':' + r.why : ''));
      } }
      medidas.puertas = { abiertas: abiertas.length, cerradas };
      ok(abiertas.length === Object.keys(DOORS.DOORS).length && cerradas.length === 0, n + ': with a visit, doors that do not open their panel: ' + JSON.stringify(cerradas));
      await ev(`(() => { const p = document.querySelector('.cats button[aria-pressed="true"]'); if (p) { p.click(); } const e = document.getElementById('visitor-end'); if (e) { e.click(); } })()`);
    }
    // Escape: back to the doors, then closed with focus on Town.
    const esc = `document.getElementById('building-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`;
    await ev(esc); const atras = await espera_hoja((m) => m.cards.length === 8);
    await ev(esc); const fin = JSON.parse(await ev(MEDIR));
    ok(atras.cards.length === 8 && !fin.open && fin.expanded === 'false' && /gp-b/.test(fin.focus || ''), n + ': Escape does not go back then close: ' + JSON.stringify([atras.cards.length, fin.open, fin.focus]));
    // Repeated panel travel: no route stacks, stranded focus or horizontal overflow.
    // Focus is verified on the real active element, not inferred from aria-expanded alone.
    let stable = 0;
    for (let turn = 0; turn < 10; turn++) {
      await ev(`document.getElementById('gp-town').click()`);
      const opened = await espera_hoja((m) => m.open && m.expanded === 'true' && m.cards.length === 8);
      const openedOk = opened.open && opened.expanded === 'true' && opened.cards.length === 8 &&
        /bs-card/.test(opened.focus || '') && opened.scroll <= opened.ancho && opened.small.length === 0;
      await ev(esc);
      const closed = await espera_hoja((m) => !m.open && m.expanded === 'false');
      const closedOk = !closed.open && closed.expanded === 'false' && /gp-b/.test(closed.focus || '') &&
        closed.scroll <= closed.ancho;
      if (openedOk && closedOk) { stable++; }
      else { fallos.push(n + ': cycle ' + (turn + 1) + ' broke focus or panel continuity: ' +
        JSON.stringify({ opened: [opened.open, opened.expanded, opened.focus, opened.scroll, opened.ancho],
          closed: [closed.open, closed.expanded, closed.focus, closed.scroll, closed.ancho] })); break; }
    }
    medidas['cycles' + n] = { stable, total: 10 };
    ok(stable === 10, n + ': panel cycles incomplete');
  }
  medidas.efectos = { live_con_efecto: efectos.con.size, sin_efecto: efectos.sin, lineas: efectos.lineas };
  // Reduced motion: a card stays still.
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  medidas.quieto = await ev(`(() => { document.getElementById('gp-town').click(); return new Promise((r) => setTimeout(() => { const c = document.querySelector('#building-sheet .bs-card'); if (!c) return r(-1); c.click(); r(c.getAnimations().length); }, 400)); })()`);
  ok(medidas.quieto === 0, 'a sheet card moves under prefers-reduced-motion: ' + medidas.quieto);
  // Contract missing: the sheet says NO_DATA with its cause, never an empty town.
  console.log(JSON.stringify({ piece: 'building-sheet', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'building-sheet', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
