import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const scene = require('../public/assets/codex_scene.js');
const projector = require('../public/game/lexical_projector.js');
const schemaPath = path.join(root, 'public/lexical_state_schema.json');
const live = projector.proyectarEscena(scene, 'ARMY', { ciclo: 7, st: 'MEASURED' });
const missing = projector.proyectarEscena({}, 'ARMY', {});
const badSize = { ...live, bytes: 1024 };
const missingCause = { v: live.v, st: 'NO_DATA', bytes: 0 };
const badItem = structuredClone(live);
badItem.p.a[0].i[0].unexpected = true;
const incomplete = structuredClone(live);
delete incomplete.p.n;
const input = { schemaPath, samples: [live, missing], invalid: [badSize, missingCause, badItem, incomplete] };
const validator = String.raw`
import json, sys
from jsonschema import Draft202012Validator
data = json.load(sys.stdin)
schema = json.load(open(data['schemaPath'], encoding='utf-8'))
Draft202012Validator.check_schema(schema)
v = Draft202012Validator(schema)
valid = [not list(v.iter_errors(x)) for x in data['samples']]
invalid = [bool(list(v.iter_errors(x))) for x in data['invalid']]
print(json.dumps({'valid': valid, 'invalid': invalid}))
`;
const result = spawnSync('python3', ['-c', validator], {
  cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 10000
});
if (result.status !== 0) {
  console.error('NO_DATA · schema validation unavailable: ' + (result.stderr || result.error || 'unknown'));
  process.exit(1);
}
const measured = JSON.parse(result.stdout);
const checks = [
  ['LIVE projection validates', measured.valid[0] === true],
  ['NO_DATA projection with cause validates', measured.valid[1] === true],
  ['LIVE payload at 1024 B is rejected', measured.invalid[0] === true],
  ['NO_DATA without cause is rejected', measured.invalid[1] === true],
  ['unknown item field is rejected', measured.invalid[2] === true],
  ['incomplete payload is rejected', measured.invalid[3] === true],
  ['all projector cases fit the channel', live.st === 'LIVE' && live.bytes < 1024],
  ['schema source stays within piece ceiling', readFileSync(schemaPath).length <= 16384]
];
for (const [name, ok] of checks) console.log((ok ? 'PASS ' : 'FAIL ') + name);
const failures = checks.filter(([, ok]) => !ok).length;
console.log(`${checks.length - failures}/${checks.length}${failures ? ' · RED' : ' · LIVE'}`);
process.exit(failures ? 1 : 0);
