# Historical face audit

## Explore
The face validator refers to JavaScript retired in cut 752338ff. Restoring only
codex_scene exposes further missing dependencies. Current app/web face parity
is a separate check and must not be hidden.

## Implement
The audit runner restores missing historical JavaScript from the parent of the
cut into a disposable archive, never into served assets. It runs the existing
validator against an explicit app checkout and returns its real exit code.

## Check
`python3 bin/audit_historical_face.py APP_CHECKOUT`: record frame sizes,
sentences, sound and parity. The historical scenes and current app are distinct;
this is not production validation. Device captures and all drawing coverage
remain NO_DATA until individually exercised. No restored file is deployed.

## Receipt · 2026-11-03, Beelink
The runner restored 111 retired JS files in its temporary tree. The historical
validator reached all three skins: 2,378 shared frames per skin, plus 180 cast
frames each for two skins; worst reachable frame 966 B. It then failed the
app/web `face.js` parity assertion. Exit 1: parity is not green. Doogee captures,
all individual drawings and production behavior remain NO_DATA.
