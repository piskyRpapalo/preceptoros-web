// PIEZA 4: one measured PASOS schema, inherited screen scripts and skippable tour.
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const rows = [], sourceSabotage = process.argv.includes('--sabotage-source'), schemaSabotage = process.argv.includes('--sabotage-schema');
const test = (name, f) => { try { const v = f(); rows.push({ caso: name, ok: v === true, detalle: v === true ? '' : String(v) }); } catch (e) { rows.push({ caso: name, ok: false, detalle: e.message }); } };
const json = x => JSON.stringify(x);
function load(name, ctx) { const path = new URL('../public/game/' + name, import.meta.url); if (!existsSync(path)) throw new Error('missing implementation: ' + name); vm.runInContext(readFileSync(path, 'utf8'), ctx, { filename: name }); }
function fixture() {
  const state = { cycle: 40, swim: 0, army: 1, fights: 0, tombs: 0, metric: 936, records: {} };
  const menuIDs = ['pliego-estado', 'pliego-lugares', 'radio-estado', 'ondas', 'taller', 'pliego-tutorial'];
  const screen = id => ({ titulo: id, lineas: [['What', id], ['State', 'life ' + state.metric + '/1000'], ['Sound', 'NO_DATA (no sound measured)']], actions: [{ id: 'reach', label: 'Touch this place' }], next: 'Touch the measured place; skip if unavailable.' });
  const ctx = vm.createContext({ console, Promise, Math, Number, JSON,
    AtlasJuego: { instantanea: () => ({ ciclo: state.cycle, recursos: { cobre: 12 } }), texto: () => 'Keep the reef alive' },
    AtlasCangrejoLibre: { skills: () => [{ id: 'reach', eventos: 1 }, { id: 'swim', eventos: state.swim }] },
    AtlasIncubadora: { army: () => Array.from({ length: state.army }, () => ({})) },
    AtlasArenaUI: { record: () => ({ g: state.fights, p: 0 }) },
    AtlasArrecife: { lapidas: () => Array.from({ length: state.tombs }, (_, i) => ({ id: 'troop-' + i })) },
    AtlasValores: { tcs: { tc1: { coste: { cobre: 8 } } } },
    AtlasScreenScript: { menuIDs: () => menuIDs.slice(), menu: screen, lugar: screen },
    document: { getElementById: id => id === 'radio-chat' ? { classList: { contains: () => false } } : null, querySelector: () => null },
    setInterval() {}, AtlasRadioChat: { dice() {} }
  });
  load('genesis-tour.js', ctx);
  load('genesis_tutorial.js', ctx);
  return { ctx, state, screen };
}
test('tour implementation exists and loads without network or user state', () => !!fixture().ctx.AtlasTour);
test('six measured genesis actions remain first, then all real places and menu options once', () => {
  const { ctx } = fixture(), T = ctx.AtlasTutorial;
  ctx.AtlasTour.extiende(T.PASOS, id => T.demostradas(id));
  const six = ['reach', 'swim', 'fight', 'summon', 'dissolve', 'radio'];
  const place = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'].map(x => 'tour-place-' + x);
  const menus = ctx.AtlasScreenScript.menuIDs().filter(x => x !== 'pliego-tutorial').map(x => 'tour-menu-' + x);
  const expected = six.concat(place, menus);
  if (schemaSabotage) T.PASOS.push({ id: 'parallel-tour-schema', tour: true });
  const before = T.PASOS.length; ctx.AtlasTour.extiende(T.PASOS, id => T.demostradas(id));
  return json(T.PASOS.map(p => p.id)) === json(expected) && T.PASOS.length === before && new Set(T.PASOS.map(p => p.id)).size === before;
});
test('each tour descriptor reads the shared live source; changed figures update both renders', () => {
  const { ctx, state, screen } = fixture(), steps = [];
  ctx.AtlasTour.extiende(steps, id => state.records[id] || 0);
  for (const p of steps) {
    const key = p.id.replace(/^tour-(place|menu)-/, '');
    const expected = screen(key); const actual = p.lee();
    if (sourceSabotage) actual.lineas = [['State', 'invented decoration']];
    if (json(actual) !== json(expected) || !p.tour) return false;
    state.metric++; if (json(p.lee()) !== json(screen(key))) return false;
  }
  return steps.length > 0;
});
test('render and repeated reads never demonstrate an action; measured events do', () => {
  const { ctx, state } = fixture(), steps = [];
  ctx.AtlasTour.extiende(steps, id => state.records[id] || 0);
  const p = steps[0]; p.lee(); p.lee();
  if (p.mide() !== 0 || p.hecho(0, p.mide())) return false;
  state.records[p.id] = 1;
  return p.mide() === 1 && p.hecho(0, p.mide()) && !p.hecho(0, 0);
});
function atTour() {
  const f = fixture(), T = f.ctx.AtlasTutorial;
  f.ctx.AtlasTour.extiende(T.PASOS, id => T.demostradas(id));
  T.tic(); T.tic(); f.state.swim++; T.tic(); T.tic(); f.state.fights++; T.tic(); T.tic(); f.state.army++; T.tic(); T.tic(); f.state.tombs++; T.tic(); T.tic();
  return { ...f, T };
}
test('one existing tutorial progression reaches the tour after radio', () => {
  const { T } = atTour();
  return T.ficha().paso === 'tour-place-boya' && T.ficha().competencia === 6 && T.esquema().length === T.PASOS.length;
});
test('rejection or wrong step cannot advance; success is measured only for current tour action', () => {
  const { T } = atTour(), id = T.ficha().paso, before = T.ficha().competencia;
  T.demuestra('tour-place-coral', { ok: true }); T.demuestra(id, { cause: 'NO_DATA (place absent)', next: 'Create an identity or skip this stop.' }); T.tic();
  if (T.ficha().paso !== id || T.ficha().competencia !== before || T.demostradas(id)) return false;
  T.demuestra(id, { ok: true }); T.tic();
  return T.ficha().paso !== id && T.ficha().competencia === before + 1 && T.demostradas(id) === 1;
});
test('skip stop and skip tour always remain available and never add demonstrated competence', () => {
  const { T } = atTour(), before = T.ficha().competencia, id = T.ficha().paso;
  T.saltaPaso();
  if (T.ficha().paso === id || T.ficha().competencia !== before || T.demostradas(id)) return false;
  T.salta(); return T.ficha().paso === null && T.ficha().competencia === before && !!T.objetivo();
});
test('fading preserves place script, measured figures, sound cause and real action', () => {
  const { T, screen } = atTour(), lines = T.ficha().lineas;
  return T.ficha().verbosidad === 0 && screen('boya').lineas.every(row => lines.some(x => json(x) === json(row)));
});
test('missing screen source declares NO_DATA with cause and an actionable next step', () => {
  const ctx = vm.createContext({ console, Math, Number, JSON, document: { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null } });
  load('screen-script.js', ctx);
  const S = ctx.AtlasScreenScript;
  return ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'].every(id => { const s = S.lugar(id); return /NO_DATA \([^)]{6,}\)/.test(json(s.lineas)) && typeof s.next === 'string' && s.next.length > 10 && Array.isArray(s.actions); });
});
test('the place script inherits the Inspector lines and actions without a second description', () => {
  const actions = [{ id: 'look', label: 'Look', preview: 'Dry run: 8 cycles' }];
  const measured = { ficha: { que: 'Measured Observatory', estado: 'life 936/1000', actions }, x: 42, y: -64 };
  let count = 0;
  const expected = [['What', 'Measured Observatory'], ['State', 'life 936/1000'], ['Coordinate', 'world (42, -64)'], ['Sound', 'NO_DATA (no sound measured)']];
  const ctx = vm.createContext({ console, Math, Number, JSON, AtlasInspector: {
    registro: id => id === 'observatorio' ? measured : null,
    lineas: (f, x, y) => { count++; if (f !== measured.ficha || x !== 42 || y !== -64) throw new Error('different place source'); return expected; }
  } });
  load('screen-script.js', ctx);
  const first = ctx.AtlasScreenScript.lugar('observatorio');
  expected[1][1] = 'life 728/1000';
  const second = ctx.AtlasScreenScript.lugar('observatorio');
  return count === 2 && json(first.actions) === json(actions) && json(second.lineas) === json(expected);
});
test('screen script reads deterministic human text in order and omits machine JSON and hidden technical content', () => {
  const node = (tagName, textContent = '', childNodes = [], attrs = {}) => ({ nodeType: 1, tagName, textContent, childNodes, children: childNodes,
    hidden: !!attrs.hidden, open: !!attrs.open, getAttribute: key => attrs[key] || null, querySelectorAll: () => [], querySelector: () => null });
  const panel = node('SECTION', '', [node('H3', 'Measured screen'), node('DL', '', [node('DT', 'Life'), node('DD', '936/1000')]),
    node('PRE', '{"raw":"private machine dump"}'), node('TEXTAREA', 'raw JSON'), node('DETAILS', '', [node('P', 'secret technical payload')], { class: 'thegame-tecnico', open: false }),
    node('DETAILS', '', [node('P', 'open technical payload')], { class: 'thegame-tecnico', open: true }),
    node('P', 'Measured next action')]);
  const ctx = vm.createContext({ console, Math, Number, JSON }); load('screen-script.js', ctx);
  const a = ctx.AtlasScreenScript.guion(panel), b = ctx.AtlasScreenScript.guion(panel), txt = json(a);
  return txt === json(b) && txt.includes('Measured screen') && txt.includes('936/1000') && txt.includes('Measured next action')
    && !/private machine|raw JSON|secret technical|open technical/.test(txt) && txt.indexOf('Measured screen') < txt.indexOf('936/1000');
});
console.log(JSON.stringify(rows, null, 1));
process.exitCode = rows.every(x => x.ok) ? 0 : 1;
