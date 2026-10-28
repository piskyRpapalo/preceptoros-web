// Synthetic ordered journey. An event is an observation, never an authentication receipt.
export const INITIAL = Object.freeze({ stage: 'key', events: [] });
const NEXT = Object.freeze({ key: ['key_ready', 'lighthouse'], lighthouse: ['lighthouse_reached', 'fight'], fight: ['fight_requested', 'pending'] });
export function step(state, event) {
  if (!state || !Object.hasOwn(NEXT, state.stage) || !Array.isArray(state.events))
    return { ok: false, cause: 'invalid_or_complete_state', state };
  const [expected, next] = NEXT[state.stage];
  if (event !== expected) return { ok: false, cause: 'unexpected_observation', state };
  return { ok: true, cause: next === 'pending' ? 'fight_receipt_not_measured' : 'synthetic_observation',
    state: { stage: next, events: [...state.events, event] } };
}
export function replay(events) {
  let state = INITIAL;
  if (!Array.isArray(events)) return { ok: false, cause: 'events_not_array', state };
  for (const event of events) {
    const result = step(state, event);
    if (!result.ok) return result;
    state = result.state;
  }
  return { ok: true, cause: state.stage === 'pending' ? 'fight_receipt_not_measured' : 'synthetic_observation', state };
}
