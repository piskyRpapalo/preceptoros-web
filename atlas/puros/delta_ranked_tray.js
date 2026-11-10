// B6 delta-ranked-tray: retrospective mission distance, no I/O or decisions.
// Input is a normalized, declared history from the single mission catalogue.
// CALCULATED describes arithmetic only; GitHub provenance is not verified here.
(function (root) {
  'use strict';
  const SCHEMA = 'preceptoros.delta-ranked-tray/1';
  const SHA = /^[a-f0-9]{40}$/i;
  const SOURCE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(issues|pull)\/[1-9][0-9]*$/;
  const ID = /^[A-Za-z0-9][A-Za-z0-9.:/_#-]{0,79}$/;
  const CONTRACT = /^[a-z][a-z0-9./_-]{0,79}$/;
  const noData = (cause) => ({ state: 'NO_DATA', cause });

  // Exact decimal fractions: 778.5 = 778.50; never use floating point.
  function position(s) {
    if (typeof s !== 'string') return null;
    const m = /^(0|[1-9][0-9]{0,8})(?:\.([0-9]{1,9}))?$/.exec(s);
    if (!m) return null;
    const places = (m[2] || '').length;
    const scale = 10n ** BigInt(places);
    return { n: BigInt(m[1]) * scale + BigInt(m[2] || '0'), d: scale };
  }
  const compare = (a, b) => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;

  function contractsOf(value) {
    if (value === null) return null; // Unknown is not an empty verified set.
    if (!Array.isArray(value) || value.length > 24 ||
        value.some((v) => typeof v !== 'string' || !CONTRACT.test(v)) ||
        new Set(value).size !== value.length) return undefined;
    return value.slice();
  }

  // Events are in causal order, from the source history. They are not timestamps.
  // introduced: {kind,id,position,source,contracts}; built: {kind,id,sha,source}.
  // One successful build per mission in this first, bounded contract.
  function audit(snapshot) {
    if (!snapshot || snapshot.schema !== SCHEMA || !SHA.test(snapshot.catalog_sha || ''))
      return noData('catalog_snapshot_invalid');
    const events = snapshot.events;
    if (!Array.isArray(events) || !events.length || events.length > 4000)
      return noData('history_missing_or_out_of_range');
    const missions = new Map(), places = [], built = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e || typeof e !== 'object' || !SOURCE.test(e.source || ''))
        return noData('source_invalid_at_' + i);
      if (typeof e.id !== 'string' || !ID.test(e.id))
        return noData('id_invalid_at_' + i);
      if (e.kind === 'introduced') {
        if (missions.has(e.id)) return noData('id_reused_at_' + i);
        const p = position(e.position), c = contractsOf(e.contracts);
        if (!p) return noData('position_invalid_at_' + i);
        if (c === undefined) return noData('contracts_invalid_at_' + i);
        if (places.some((other) => compare(p, other) === 0))
          return noData('position_collision_at_' + i);
        places.push(p);
        missions.set(e.id, { id: e.id, label: e.position, pos: p, at: i,
                              source: e.source, contracts: c, build: null });
      } else if (e.kind === 'built') {
        const m = missions.get(e.id);
        if (!m) return noData('build_without_introduction_at_' + i);
        if (m.build !== null) return noData('build_repeated_at_' + i);
        if (!SHA.test(e.sha || '')) return noData('build_sha_invalid_at_' + i);
        m.build = { at: i, sha: e.sha, source: e.source };
        built.push(m);
      } else {
        return noData('kind_unknown_at_' + i);
      }
    }

    const alerts = [];
    for (const m of missions.values()) {
      if (m.build) continue; // Resolved missions no longer raise open alarms.
      const later = built.filter((b) => compare(b.pos, m.pos) > 0);
      if (!later.length) continue;
      const D = later.filter((b) => b.build.at < m.at).length;
      const A = later.length - D;
      const known = later.filter((b) => m.contracts && b.contracts &&
        m.contracts.some((c) => b.contracts.includes(c))).map((b) => b.id);
      const unknown = later.some((b) => m.contracts === null || b.contracts === null);
      const I = unknown
        ? { state: 'NO_DATA', cause: 'contracts_unmeasured', known_minimum: known.length }
        : { state: 'CALCULATED', count: known.length };
      alerts.push({ id: m.id, position: m.label, D, A, I, source: m.source,
                    nearby_sample: later.slice(0, 3).map((b) => b.id) });
    }
    alerts.sort((a, b) => compare(missions.get(a.id).pos, missions.get(b.id).pos)
      || a.id.localeCompare(b.id, 'en'));
    return { state: 'CALCULATED', schema: SCHEMA, catalog_sha: snapshot.catalog_sha,
             provenance: 'DECLARED_NOT_VERIFIED', open_alarms: alerts };
  }
  function line(row) {
    const impact = row.I.state === 'CALCULATED' ? String(row.I.count) :
      'NO_DATA(' + row.I.cause + ')';
    return 'B6 ' + row.id + '@' + row.position + ' · D=' + row.D + ' A=' + row.A +
      ' I=' + impact + ' · propose-only';
  }
  const api = Object.freeze({ SCHEMA, position, compare, audit, line });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PreceptorDeltaRankedTray = api;
})(this);
