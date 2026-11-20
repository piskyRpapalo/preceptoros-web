// Chat Live HUD · regression contract: one accessible surface, the browser's own audio.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const terminal = req('../public/game/terminal_panel.js');
const sheet = req('../public/game/panel_sheet.js');
const chat = req('../public/game/open_talk.js');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const terminalSrc = read('../public/game/terminal_panel.js');
const chatSrc = read('../public/game/open_talk.js');
const panelCss = read('../public/game/panel_sheet.css');
const adventureCss = read('../public/game/first_adventure.css');
const radio = req('../public/game/radio_frame.js');

test('Chat Live is the only user-facing title, retaining internal category for existing consumers', () => {
  assert.equal(sheet.TITLES.Communication, 'Chat Live');
  assert.match(terminalSrc, /b\.textContent = 'Chat Live'/);
  assert.match(terminalSrc, /Choose Chat Live, Radio, Echoes or Guide/);
  assert.doesNotMatch(terminalSrc, /'Communication destination'/);
});

test('opening Chat Live is the single opt-in to view public 24h history', () => {
  assert.match(terminalSrc, /openworld:chatlive-open/);
  assert.match(terminalSrc, /selectChannel\(destination \|\| 'public'\)/);
  assert.match(chatSrc, /doc\.addEventListener\('openworld:chatlive-open', open\)/);
  assert.doesNotMatch(chatSrc, /Show the last 24 hours/);
  assert.match(chatSrc, /if \(!refresh\) \{ refresh = watch/);
});

test('one translucent surface appears below Chat Live, without a full communication sheet', () => {
  assert.match(panelCss, /#stage #voices\.map-voices\[data-active-category=Communication\]\{animation:none;inset:54px/);
  assert.match(panelCss, /border:0;border-radius:0;box-shadow:none;background:transparent/);
  assert.match(panelCss, /\.sheet-head \.acho/);
  assert.match(panelCss, /\.sheet-head button/);
});

test('the active tutorial is never covered by the public chat HUD', () => {
  assert.match(adventureCss, /#fa\{position:absolute;z-index:7;top:54px/);
  assert.match(adventureCss, /:has\(#voices\.map-voices\[data-active-category=Communication\]:not\(\[hidden\]\)\) #fa\{visibility:hidden\}/);
  assert.match(terminalSrc, /openworld:chatlive-unread/);
});

test('public history is navigable without 200 repeated announcements from polling', () => {
  assert.match(chatSrc, /day\.setAttribute\('role', 'log'\)/);
  assert.match(chatSrc, /day\.setAttribute\('aria-live', 'off'\)/);
  assert.match(chatSrc, /var pending = false|pending = false/);
  assert.match(chatSrc, /if \(doc\.visibilityState === 'hidden' \|\| pending\)/);
  assert.match(chatSrc, /public_chat_history_unavailable|public chat history unavailable/);
});

test('new messages do not create an automatic second sound over Listen or radio', () => {
  assert.match(chatSrc, /Do not layer a second automatic chime/);
  assert.doesNotMatch(chatSrc, /toast\(doc, news\[0\]\.avance\); chime\(win\)/);
});

test('Radio reuses deterministic local web frames without network or mandatory node', () => {
  const frame = read('../public/game/radio_frame.js');
  assert.match(frame, /function readings\(/);
  assert.match(frame, /function sound\(/);
  assert.doesNotMatch(frame, /fetch\(|XMLHttpRequest|WebSocket/);
  assert.equal(typeof radio.readings, 'function');
  const r = radio.readings({seal:'NO_DATA',source:'fixture',cycle:0,text:'not measured'});
  assert.equal(r.seal,'NO_DATA');
  assert.ok(r.machine && r.reader && r.ear && r.eye);
});

test('Acho and Listen remain present and rely on existing system speech', () => {
  const h = read('../public/game/panel_sheet.js');
  assert.match(h, /class="acho"/);
  assert.match(h, /textContent = '🔊 Listen'/);
  assert.match(h, /AtlasSoundFirst/);
});
