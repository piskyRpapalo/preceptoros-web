# E1 receipt · 2026-10-23

Base: `b720db791f101dbfa583029ce8f454aaa492497e`. Machine: Linux x86_64,
Node v22.22.1. Scope: portable creation contract, browser verifier, fixtures.

| Command | Result |
|---|---|
| `CREATION_SABOTAGE=1 node tests/creation_contract.test.mjs` | ROJO: 10 pass, 1 fail; damaged frame rejected with file hash or size cause |
| `node tests/creation_contract.test.mjs` | VERDE: 11 pass, 0 fail, 0 skip |
| `node --test tests/creation_contract.test.mjs` | VERDE: file process passes (runner reports 1 file) |
| `python3 test_web.py` | 78 tests; 76 passed, 1 skipped, 1 `NO_DATA` error: sandbox denies loopback socket bind |
| `node arnes_sw.mjs` | VERDE: 22/22 |

Measured: real Ed25519 verification and fresh signing, exact original manifest
bytes, independent parsing, changed frame/audio/manifest/signature rejection,
closed fields/names, frame boundary and complete package boundary. Valid fixture
contains test-only PCM samples, not an audible author journey. No private key is
stored. Source implementation is 6.8 KB and 112 lines (before receipt formatting).

NO_DATA: physical audio, browser rendering, touch and LIVE publication are outside
E1. Seal on the current branch: `preceptoros-2026-17-abix`, huella
`376b03edd0b315aa`; measured again on the aligned `origin/main` base. Huella:
closed filenames and exact byte signatures make
one fixture corpus reusable in the app verifier; its cross-language measurement
is E5. Ledger, gates, node charter and retired assets are untouched.
