// WAVE-VISUAL-01 · Piece B cases: the five invocation keys, translated to real operations.
// The controller is pure: it plans, it never summons/hatches/adopts/sands/signs. Run twice:
//   node atlas/crab_invoke_cases.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./puros/crab_invoke.js');
const G = require('../public/game/gacha.js');
const K = require('../public/game/canon.js');

const results = [];
function check(name, ok, detail) {
  results.push(ok ? { caso: name, ok: true } : { caso: name, ok: false, detalle: detail == null ? '' : String(detail) });
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const seed = K.sha('wave-visual-01:invoke');
const troop = G.tirada(seed, 'tc2');
const caps = { summon: true, hatch: true, sand: true };
const state = { copper: 200, light: 100, busy: false, eggs: [], troops: [] };
const happy = {
  egg: { consent: true, caps, state: { copper: 200, light: 100, busy: false }, costs: G.TCS, tier: 'tc2' },
  hatch: { consent: true, caps, state: { busy: false, eggs: [{ seq: 3, tc: 'tc2', ready: false }, { seq: 7, tc: 'tc1', ready: true }] } },
  plus: { caps, identity: true, troop, stat: 'velocidad', stats: ['vida', 'armadura', 'velocidad', 'sigilo'] }
};

// 1 · exactly the five requested actions, in key order, with English labels
check('five actions are declared', C.ACTIONS.length === 5, JSON.stringify(C.ACTIONS));
check('ids are egg/hatch/adopt/plus/defense',
  JSON.stringify(C.ACTIONS.map((a) => a.id)) === JSON.stringify(['egg', 'hatch', 'adopt', 'plus', 'defense']));
check('keys are 1..5', JSON.stringify(C.ACTIONS.map((a) => a.key)) === JSON.stringify(['1', '2', '3', '4', '5']));
check('names are Egg/Hatch/Adopt/Wave+/Defense',
  JSON.stringify(C.ACTIONS.map((a) => a.name)) === JSON.stringify(['Egg', 'Hatch', 'Adopt', 'Wave+', 'Defense']));
// 2 · keyboard mapping: plain 1..5 map; modified keys stay with the browser; everything else is null
for (const a of C.ACTIONS) {
  check('key ' + a.key + ' maps to ' + a.id, C.keyOf({ key: a.key }) === a.id, C.keyOf({ key: a.key }));
  check('key ' + a.key + ' with Alt is ignored', C.keyOf({ key: a.key, altKey: true }) === null);
  check('key ' + a.key + ' with Ctrl is ignored', C.keyOf({ key: a.key, ctrlKey: true }) === null);
}
check('unknown key is null', C.keyOf({ key: '9' }) === null);
check('non-string key is null', C.keyOf({ key: 5 }) === null);
check('missing event is null', C.keyOf(null) === null);
// 3 · consent is never assumed: no egg/hatch plan without an explicit press
for (const id of ['egg', 'hatch']) {
  const p = C.plan(id, Object.assign({}, happy[id], { consent: false }));
  check(id + ' without consent is disabled', p.enabled === false && p.cause === 'consent_required', JSON.stringify(p));
  check(id + ' without consent runs nothing', p.ok === false && p.args === undefined);
}
// 4 · the happy path plans the real operation with its real cost, and mutates nothing
const egg = C.plan('egg', clone(happy.egg));
check('egg plans tc2', egg.ok === true && egg.enabled === true && egg.args.tc === 'tc2', JSON.stringify(egg));
check('egg carries the measured price', egg.say.includes('200 copper') && egg.say.includes('100 light'), egg.say);
check('egg plan is deterministic', JSON.stringify(C.plan('egg', happy.egg)) === JSON.stringify(egg));
const before = JSON.stringify(happy.egg);
C.plan('egg', happy.egg); C.bar(happy.egg); C.press({ key: '1' }, happy.egg);
check('controller does not mutate its input', JSON.stringify(happy.egg) === before);
// 5 · budget boundary and overrun
const poor = Object.assign({}, happy.egg, { state: { copper: 199, light: 100, busy: false } });
const broke = C.plan('egg', poor);
check('budget overrun is refused', broke.enabled === false && broke.cause === 'insufficient_resources', JSON.stringify(broke));
check('overrun says how much is missing', broke.say.includes('1 more copper'), broke.say);
const noLight = C.plan('egg', Object.assign({}, happy.egg, { state: { copper: 200, light: 99, busy: false } }));
check('light overrun is refused', noLight.cause === 'insufficient_resources' && noLight.say.includes('1 more light'), noLight.say);
const exact = C.plan('egg', Object.assign({}, happy.egg, { state: { copper: 200, light: 100, busy: false } }));
check('exact budget is allowed', exact.ok === true, JSON.stringify(exact));
// 6 · egg negatives: unknown tier, busy visit, unmeasured resources, missing state
check('unknown tier is refused', C.plan('egg', Object.assign({}, happy.egg, { tier: 'tc9' })).cause === 'unknown_egg_class');
check('busy visit is refused', C.plan('egg', Object.assign({}, happy.egg, { state: { copper: 200, light: 100, busy: true } })).cause === 'visit_busy');
check('unmeasured resources are refused', C.plan('egg', Object.assign({}, happy.egg, { state: { copper: NaN, light: 0 } })).cause === 'state_unmeasured');
check('missing visit state is refused', C.plan('egg', Object.assign({}, happy.egg, { state: null })).cause === 'state_unmeasured');
check('missing signed API is refused', C.plan('egg', Object.assign({}, happy.egg, { caps: {} })).cause === 'capability_not_available');
// 6a · malformed egg costs: string values, NaN, Infinity, negative, fractional, missing fields, wrong types
var badCostStr = { tc2: { coste: { cobre: 'BAD', luz: 'BAD' } } };
check('string cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostStr })).cause === 'malformed_cost');
var badCostNaN = { tc2: { coste: { cobre: NaN, luz: NaN } } };
check('NaN cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostNaN })).cause === 'malformed_cost');
var badCostInf = { tc2: { coste: { cobre: Infinity, luz: -Infinity } } };
check('Infinity cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostInf })).cause === 'malformed_cost');
var badCostNeg = { tc2: { coste: { cobre: -1, luz: -5 } } };
check('negative cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostNeg })).cause === 'malformed_cost');
var badCostFrac = { tc2: { coste: { cobre: 1.5, luz: 2.7 } } };
check('fractional cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostFrac })).cause === 'malformed_cost');
var badCostMissing = { tc2: { coste: {} } };
check('missing coste fields are refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostMissing })).cause === 'malformed_cost');
var badCostNull = { tc2: { coste: null } };
check('null coste is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostNull })).cause === 'malformed_cost');
var badCostObj = { tc2: { coste: { cobre: { x: 1 }, luz: 0 } } };
check('object cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostObj })).cause === 'malformed_cost');
var badCostArr = { tc2: { coste: { cobre: [1], luz: 0 } } };
check('array cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostArr })).cause === 'malformed_cost');
var badCostUndefined = { tc2: { coste: { cobre: undefined, luz: 0 } } };
check('undefined cobre is refused', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostUndefined })).cause === 'malformed_cost');
var badCostZero = { tc2: { coste: { cobre: 0, luz: 0 } } };
check('zero coste is allowed (valid non-negative integer)', C.plan('egg', Object.assign({}, happy.egg, { costs: badCostZero, state: { copper: 0, light: 0, busy: false } })).ok === true);
// 6b · malformed visit resources: string, NaN, Infinity, negative copper/light
var badStateStr = { copper: 'lots', light: 'plenty', busy: false };
check('string copper in state is refused', C.plan('egg', Object.assign({}, happy.egg, { state: badStateStr })).cause === 'state_unmeasured');
var badStateInf = { copper: Infinity, light: Infinity, busy: false };
check('Infinity copper in state is refused', C.plan('egg', Object.assign({}, happy.egg, { state: badStateInf })).cause === 'state_unmeasured');
var badStateNeg = { copper: -10, light: -5, busy: false };
check('negative copper in state is refused', C.plan('egg', Object.assign({}, happy.egg, { state: badStateNeg })).cause === 'state_unmeasured');
var badStateFrac = { copper: 200.5, light: 100.3, busy: false };
check('fractional copper in state is refused', C.plan('egg', Object.assign({}, happy.egg, { state: badStateFrac })).cause === 'state_unmeasured');
// 7 · hatch: a ready egg hatches under the same consent (Q-06); a green timer is not consent
const hatch = C.plan('hatch', clone(happy.hatch));
check('hatch picks the ready egg', hatch.ok === true && hatch.args.seq === 7, JSON.stringify(hatch));
check('hatch reuses the press as adoption consent', hatch.args.consent === true && hatch.say.includes('Q-06'), hatch.say);
check('hatch with an explicit unready seq is refused', C.plan('hatch', Object.assign({}, happy.hatch, { seq: 3 })).cause === 'egg_not_ready');
check('hatch with an unknown seq is refused', C.plan('hatch', Object.assign({}, happy.hatch, { seq: 99 })).cause === 'egg_not_ready');
check('hatch with no eggs is refused', C.plan('hatch', Object.assign({}, happy.hatch, { state: { eggs: [] } })).cause === 'egg_not_ready');
check('hatch with no egg list is refused', C.plan('hatch', Object.assign({}, happy.hatch, { state: {} })).cause === 'state_unmeasured');
// 8 · adopt: the build has no second adoption step, so the answer is NO_DATA, not a fake step
const adopt = C.plan('adopt', { consent: true, caps });
check('adopt is NO_DATA', adopt.ok === false && adopt.enabled === false && adopt.cause === 'adoption_is_part_of_hatch', JSON.stringify(adopt));
check('adopt says NO_DATA in words', adopt.say.includes('NO_DATA') && adopt.say.includes('Q-06'), adopt.say);
// 9 · Wave+: only a measured troop, a signed identity and an eligible stat
const plus = C.plan('plus', clone(happy.plus));
check('plus plans the sanding of one stat', plus.ok === true && plus.args.semilla === troop.semilla && plus.args.stat === 'velocidad', JSON.stringify(plus));
check('plus states the edges stay the same', plus.say.includes('edges stay the same'), plus.say);
check('plus without the Workshop API is refused', C.plan('plus', Object.assign({}, happy.plus, { caps: {} })).cause === 'capability_not_available');
check('plus without identity is refused', C.plan('plus', Object.assign({}, happy.plus, { identity: false })).cause === 'identity_required');
check('plus without a troop is refused', C.plan('plus', Object.assign({}, happy.plus, { troop: null })).cause === 'troop_missing');
check('plus with a bad seed is refused', C.plan('plus', Object.assign({}, happy.plus, { troop: { semilla: 'deadbeef' } })).cause === 'troop_missing');
check('plus with an ineligible stat is refused', C.plan('plus', Object.assign({}, happy.plus, { stat: 'aura', stats: ['vida'] })).cause === 'stat_not_eligible');
check('plus with no stat is refused', C.plan('plus', Object.assign({}, happy.plus, { stat: null })).cause === 'stat_not_eligible');
// 10 · defense: no local order exists; the word in a combat log is not an action
const defense = C.plan('defense', {});
check('defense is NO_DATA', defense.ok === false && defense.cause === 'no_defense_service_in_this_build', JSON.stringify(defense));
check('defense says NO_DATA in words', defense.say.includes('NO_DATA'), defense.say);
// 11 · unknown actions never run and never invent an id
const unknown = C.plan('teleport', { consent: true, caps });
check('unknown action is refused', unknown.enabled === false && unknown.cause === 'unknown_action', JSON.stringify(unknown));
check('unknown action says NO_DATA', unknown.say.includes('NO_DATA'), unknown.say);
// 12 · the bar shows all five keys and keeps availability separate from the press
const bar = C.bar(Object.assign({}, happy.egg, { state: { copper: 0, light: 0, busy: false } }));
check('bar has five rows', bar.length === 5);
check('bar keeps key order', JSON.stringify(bar.map((r) => r.key)) === JSON.stringify(['1', '2', '3', '4', '5']));
check('bar rows carry their action object', bar.every((r) => r.action && r.action.id === r.id && r.name && r.op), JSON.stringify(bar.map((r) => [r.id, !!r.action])));
check('bar shows the egg as unavailable without funds', bar[0].enabled === false && bar[0].cause === 'insufficient_resources', JSON.stringify(bar[0]));
check('bar leaves adopt and defense as NO_DATA', bar[2].enabled === false && bar[4].enabled === false);
// 13 · a real press plans, a modified press does not
const pressed = C.press({ key: '4' }, happy.plus);
check('press 4 plans Wave+', pressed && pressed.id === 'plus' && pressed.plan.ok === true, JSON.stringify(pressed));
check('press 5 plans Defense NO_DATA', C.press({ key: '5' }, {}).plan.cause === 'no_defense_service_in_this_build');
check('modified press is ignored', C.press({ key: '4', metaKey: true }, happy.plus) === null);
check('unknown press is ignored', C.press({ key: '0' }, happy.plus) === null);
// 14 · no accidental mutation of the troop either
const troopBefore = JSON.stringify(troop);
C.plan('plus', happy.plus); C.press({ key: '4' }, happy.plus);
check('controller does not mutate the troop', JSON.stringify(troop) === troopBefore);
// 15 · purity: no DOM, clock, randomness, network, storage or audio in the controller
const src = readFileSync(new URL('./puros/crab_invoke.js', import.meta.url), 'utf8');
for (const word of ['Math.random', 'Date', 'performance', 'fetch(', 'XMLHttpRequest', 'document', 'localStorage', 'AudioContext', 'setTimeout', 'sonidos', 'suena']) {
  check('pure source: no ' + word, !src.includes(word));
}
// 16 · no clock-driven change: two full runs of every plan are byte-identical
const all = () => ['1', '2', '3', '4', '5'].map((k) => JSON.stringify(C.press({ key: k }, happy.plus)));
check('a full run is deterministic', JSON.stringify(all()) === JSON.stringify(all()));
// 17 · the controller never claims authority it does not have
for (const row of bar.concat([C.plan('adopt', {}), C.plan('defense', {})])) {
  check('no plan invents a signature or a receipt', !('firma' in row) && !('recibo' in row), JSON.stringify(row));
}

const fail = results.filter((c) => !c.ok);
console.log('CRAB-INVOKE ' + (fail.length ? 'ROJO' : 'VERDE') + ' · ' + results.length + ' cases · ' + fail.length + ' failures');
console.log(JSON.stringify({ casos: results }));
process.exitCode = fail.length ? 1 : 0;
