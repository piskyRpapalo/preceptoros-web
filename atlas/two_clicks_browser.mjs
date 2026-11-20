// One-click Sign HITL, in a real browser: from the landing `/` the user clicks «Sign HITL, and take a piece»
// which directly signs the visit on the SAME OpenWorld iframe (no second iframe/map). The welcome sheet hides
// on signed entry. The result: visit signed on this device, 100 copper, active visit, summon enabled.
// The welcome card is still reachable separately via a direct /openworld/ navigation for accessibility checks
// (dialog role, 44 px button, Escape closes, focus management).
// NO_DATA is reported when a signature cannot be verified.
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
  const evDirect = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
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

  // --- Step 1: Verify the landing door label and accessibility ---
  const puerta = await evDirect("(() => { const a = document.querySelector('a.start[href=\"/openworld/\"]'); return a ? a.textContent : null; })()");
  ok((puerta || '').trim() === 'Sign HITL, and take a piece',
    'the landing OpenWorld door label differs from the current contract: ' + puerta);

  // Verify the landing door is keyboard-accessible and at least 44 px
  const doorMetrics = JSON.parse(await evDirect(`JSON.stringify((() => {
    const a = document.querySelector('a.start[href="/openworld/"]');
    if (!a) return { h: 0, w: 0 };
    const r = a.getBoundingClientRect();
    return { h: r.height, w: r.width, tabindex: a.getAttribute('tabindex'), role: a.getAttribute('role') };
  })())`));
  ok(doorMetrics.h >= 44 && doorMetrics.w >= 44, 'landing door button below 44 px: ' + JSON.stringify(doorMetrics));

  // --- Step 2: One-click Sign HITL ---
  // Click the "Sign HITL" link on the landing page. This triggers AtlasWelcome.enter(true) in the iframe,
  // which signs the visit, closes the welcome card, and shows the map — all in one click.
  await clic('a.start[href="/openworld/"]');
  await espera(2500);

  // After clicking, the landing page should have pushed #openworld hash and shown the iframe
  const landingState = JSON.parse(await evDirect(`JSON.stringify((() => {
    const iframe = document.getElementById('landing-world');
    const result = document.getElementById('landing-result');
    return {
      hash: location.hash,
      ariaHidden: iframe ? iframe.getAttribute('aria-hidden') : null,
      tabIndex: iframe ? iframe.getAttribute('tabIndex') : null,
      bodyClass: document.body.className,
      result: result ? result.textContent : '',
      inert: document.querySelector('main')?.inert
    };
  })())`));
  ok(landingState.hash === '#openworld', 'landing did not push #openworld hash: ' + landingState.hash);
  ok(landingState.ariaHidden === 'false', 'iframe not shown after sign: aria-hidden=' + landingState.ariaHidden);
  ok(landingState.result === '', 'landing result should be empty after successful sign: ' + landingState.result);

  // Now switch evaluation context to the OpenWorld iframe
  enMapa = true;

  // --- Step 3: Verify the signed visit state in the OpenWorld iframe ---
  // Read copper from the canonical source: #state and #welcome-result both contain
  // "Visit signed on this device · N copper." after a successful sign (welcome_card.js:42).
  // Also read from the visitor-play details line "Copper N · Light ..." (visitor_play.js:85)
  // as a cross-check. Use the state element as the primary source since it's set directly
  // from receipt.state.copper.
  const postSign = JSON.parse(await ev(`JSON.stringify((() => {
    const card = document.getElementById('sheet-welcome');
    const beacon = document.getElementById('visitor-beacon');
    const end = document.getElementById('visitor-end');
    const state = document.getElementById('state');
    const result = document.getElementById('welcome-result');
    const play = document.getElementById('visitor-play');
    // Primary: parse copper from #state text "Visit signed on this device · N copper."
    const stateCopperMatch = state ? /· ([0-9]+) copper/.exec(state.textContent || '') : null;
    // Secondary: parse copper from #welcome-result text (same format)
    const resultCopperMatch = result ? /· ([0-9]+) copper/.exec(result.textContent || '') : null;
    // Tertiary: parse copper from visitor-play details line "Copper N · Light ..."
    const playCopperMatch = play ? /Copper ([0-9]+)/.exec(play.textContent || '') : null;
    // Use the first available canonical source
    const copper = stateCopperMatch ? +stateCopperMatch[1] : (resultCopperMatch ? +resultCopperMatch[1] : (playCopperMatch ? +playCopperMatch[1] : -1));
    const summon = document.getElementById('visitor-summon-tc1');
    const mapRect = document.getElementById('map')?.getBoundingClientRect();
    const activeEl = document.activeElement;
    return {
      cardHidden: card ? card.hidden : null,
      beaconExists: !!beacon,
      endExists: !!end,
      state: state ? state.textContent : '',
      result: result ? result.textContent : '',
      copper: copper,
      summonEnabled: !!summon && !summon.disabled,
      mapTop: mapRect ? mapRect.top : -1,
      activeElementId: activeEl ? activeEl.id : '',
      activeElementTag: activeEl ? activeEl.tagName : '',
      path: location.pathname
    };
  })())`));
  ok(postSign.path === '/openworld/', 'iframe path is not /openworld/: ' + postSign.path);
  ok(postSign.cardHidden === true, 'welcome card should be hidden after signed entry: cardHidden=' + postSign.cardHidden);
  ok(postSign.beaconExists, 'visitor beacon should exist after signed entry');
  ok(postSign.endExists, 'after one click no visit is active — visitor-end missing');
  ok(postSign.copper >= 100, 'after one click the copper is below 100: ' + postSign.copper);
  ok(postSign.summonEnabled, 'after one click the reef summon button is not enabled');
  ok(postSign.state.includes('signed on this device'), '#state does not announce signed visit: ' + postSign.state);
  ok(postSign.result.includes('signed on this device'), 'welcome-result does not confirm signed visit: ' + postSign.result);
  ok(postSign.mapTop >= 0 && postSign.mapTop < 844, 'after sign the map scrolled away: top=' + postSign.mapTop);
  ok(clics === 1, 'reaching the game took ' + clics + ' clicks, expected 1');
  await foto('one-click-signed.png');

  // --- Step 4: Verify map controls, summon labels, joysticks (Ojo del Doogee) ---
  const ojo = JSON.parse(await ev(`JSON.stringify((() => { const c = document.getElementById('surface'), m = c.getBoundingClientRect();
    const sum = [1, 2, 3, 4].map((n) => (document.getElementById('visitor-summon-tc' + n) || {}).textContent || '');
    const zb = [...document.querySelectorAll('#map .view-joy button')].map((b) => { const r = b.getBoundingClientRect(); return { l: b.getAttribute('aria-label'), w: r.width, h: r.height }; });
    const pl = JSON.parse(c.dataset.places || '[]');
    return { bar: !!document.getElementById('zoom-controls'), mapTop: m.top, scrollY: scrollY, sum, step: (document.getElementById('visitor-step') || {}).textContent, zb, pl,
      overlap: pl.some((a, i) => pl.some((b, j) => i < j && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)) }; })())`));
  ok(/^Summon at the Reef · 50 copper$/.test(ojo.sum[0]), 'the reef summon is not human: ' + ojo.sum[0]);
  ok(ojo.sum.slice(1).every((t) => /^Summon at the [A-Z][a-z]+ · \d+ copper \+ \d+ light · needs \d+ more/.test(t)) && !ojo.sum.some((t) => /tc\d/.test(t)), 'summon labels are not human or do not say what is missing: ' + JSON.stringify(ojo.sum));
  ok(ojo.step === 'Walk your crab: every hex is one step.', 'the step hint is not human: ' + ojo.step);
  // Decree 2026-11-07: the camera stick and the crab's stick, both labelled and at least 44 px.
  ok(ojo.zb.length === 2 && ojo.zb.every((b) => b.w >= 44 && b.h >= 44) && /^Turn and tilt the map/.test(ojo.zb[0].l || '') && /^Walk your character/.test(ojo.zb[1].l || '') && !ojo.bar, 'the map does not carry the labelled 44 px camera and character sticks: ' + JSON.stringify(ojo.zb));
  ok(ojo.pl.length === 0, 'the old screen-fixed place names are retired (Sovereign 2026-11-08) and still drawn: ' + JSON.stringify(ojo.pl));

  // Verify the House voice tab contains visitor-play
  const tabCheck = await ev(`(() => {
    const house = document.querySelector('#voices [data-speaker="House"]');
    const play = document.getElementById('visitor-play');
    return house ? String(house.contains(play)) : 'NO_DATA';
  })()`);
  ok(tabCheck === 'true', 'House voice tab does not contain visitor-play: ' + tabCheck);

  // --- Step 5: Verify welcome card separately via direct /openworld/ navigation ---
  // The welcome card IS still supported when navigating directly to /openworld/ without a prior sign.
  // We verify its accessibility properties: dialog role, 44 px button, Escape closes, focus management.
  // After navigating to /openworld/ directly, we are on a top-level page (not an iframe).
  // Reset enMapa since we're leaving the iframe context.
  enMapa = false;
  await cmd('Page.navigate', { url: origen + '/openworld/?colony=alone' });
  await espera(2000);

  // The terminal_panel.js categories() function starts with show(null) — all voices hidden.
  // The Welcome card lives inside [data-speaker="Welcome"] which is in the Welcome category.
  // We must explicitly activate the Welcome category via the .cats [data-cat=Welcome] button
  // before checking the visible 44px play button, focus, and Escape behavior.
  await evDirect(`(() => {
    const catBtn = document.querySelector('.cats [data-cat="Welcome"]');
    if (catBtn) { catBtn.click(); }
  })()`);
  await espera(500);

  // In a fresh /openworld/ navigation with Welcome category active, the welcome card should be visible
  const welcomeDirect = JSON.parse(await evDirect(`JSON.stringify((() => {
    const c = document.getElementById('sheet-welcome');
    const b = document.getElementById('welcome-play');
    const r = b ? b.getBoundingClientRect() : {};
    return {
      shown: !!c && !c.hidden,
      role: c ? c.getAttribute('role') : null,
      modal: c ? c.getAttribute('aria-modal') : null,
      title: (document.getElementById('welcome-h') || {}).textContent,
      focus: document.activeElement ? document.activeElement.id : '',
      h: r.height, w: r.width, top: r.top, bottom: r.bottom,
      look: !!document.getElementById('welcome-look'),
      ancho: document.documentElement.scrollWidth,
      viewport: [innerWidth, innerHeight]
    };
  })())`));
  ok(welcomeDirect.shown && welcomeDirect.role === 'dialog' && welcomeDirect.modal === 'false',
    'welcome card not a dialog on direct /openworld/ visit: ' + JSON.stringify(welcomeDirect));
  ok(welcomeDirect.title === 'Welcome to OpenWorld', 'welcome title wrong on direct visit: ' + welcomeDirect.title);
  // Selecting the Welcome tab changes focus: explicitly confirm its Sign control can receive keyboard focus.
  const welcomeFocus = await evDirect("(() => { const b = document.getElementById('welcome-play'); b.focus({preventScroll:true}); return document.activeElement === b; })()");
  ok(welcomeFocus === true, 'Sign HITL control cannot receive keyboard focus after selecting Welcome tab');
  ok(welcomeDirect.h >= 44 && welcomeDirect.w >= 44 && welcomeDirect.top >= 0 && welcomeDirect.bottom <= 844,
    'Sign HITL button below 44 px or off screen on direct visit: ' + JSON.stringify(welcomeDirect));
  ok(welcomeDirect.look && welcomeDirect.ancho <= 390, 'no Look around or sideways scroll on direct visit: ' + JSON.stringify(welcomeDirect));

  // Verify welcome-live status distinguishes NO_DATA from measured events
  const welcomeStatus = await evDirect(`(() => {
    const el = document.getElementById('welcome-live');
    if (!el) return null;
    const initial = el.textContent;
    document.dispatchEvent(new CustomEvent('world:summary', { detail: { ok: true, live: 2 } }));
    const measured = el.textContent;
    document.dispatchEvent(new CustomEvent('world:summary', { detail: { ok: false, cause: 'offline' } }));
    return { initial, measured, offline: el.textContent };
  })()`);
  ok(welcomeStatus && welcomeStatus.initial.includes('Live nodes: NO_DATA') &&
    welcomeStatus.measured.includes('Live nodes: 2.') && welcomeStatus.measured.includes('Shared visitors: NO_DATA') &&
    welcomeStatus.offline.includes('Live nodes: NO_DATA · offline'),
    'Welcome must distinguish synthetic measured event from initial/offline NO_DATA');
  await foto('welcome-direct.png');

  // --- Step 6: Escape closes the welcome card ---
  await evDirect("document.getElementById('welcome-play').focus()");
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  ok((await evDirect("document.getElementById('sheet-welcome').hidden")) === true, 'Escape does not close the welcome card');

  // --- Step 7: Verify NO external requests ---
  ok(externas.length === 0, 'external requests: ' + externas.join(' '));

  // --- Step 8: Verify NO_DATA on failed signature (baseline negative test) ---
  // Reuse the verified negative signature pattern from atlas/landing_visit_browser.cjs:
  // override crypto.subtle.verify BEFORE the page loads via Page.addScriptToEvaluateOnLoad.
  // Setting iframe.contentWindow.crypto after load is read-only and doesn't work.
  // We need a fresh page context, so navigate to landing and inject the override before
  // the iframe's /openworld/ content executes.
  // Inject in every fresh frame before its document scripts execute.
  const injected = await cmd('Page.addScriptToEvaluateOnNewDocument', {
    source: `if(typeof crypto!=='undefined'&&crypto.subtle){crypto.subtle.verify=async()=>false;}`
  });
  ok(!!injected.result?.identifier, 'CDP failed to install negative cryptography fixture before navigation');
  // Navigate fresh to landing so the iframe loads with the poisoned crypto
  await cmd('Page.navigate', { url: origen + '/' });
  await espera(2000);
  // Click Sign HITL — should fail with NO_DATA because crypto.subtle.verify returns false
  await clic('a.start[href="/openworld/"]');
  await espera(2000);
  const failedResult = await evDirect("(() => { return (document.getElementById('landing-result') || {}).textContent || ''; })()");
  const failProof = await evDirect("(() => ({ override: document.querySelector('#landing-world')?.contentWindow?.crypto?.subtle?.verify?.toString() || '', mapVisible:document.getElementById('landing-world')?.getAttribute('aria-hidden'), beacon:!!document.querySelector('#landing-world')?.contentDocument?.getElementById('visitor-beacon') }))()");
  ok(failedResult.includes('NO_DATA') || failedResult.includes('failed') || failedResult.includes('unavailable'),
    'failed signature should produce NO_DATA or failure message: ' + failedResult);
  ok(failProof.mapVisible === 'true' && !failProof.beacon, 'rejected proof must keep map hidden and never mint a visitor beacon: ' + JSON.stringify(failProof));

  console.log(JSON.stringify({ clics, postSign, ojo, welcomeDirect, failedResult, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
