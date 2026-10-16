# State Readability Audit

This piece measures whether the existing compact game state can be read correctly.
It is an offline experiment under `atlas/`; it does not change the game, request a
signature, execute a proposed action, contact a model service or add browser requests.

## Reproduce the audit

```sh
node atlas/state_readability_cases.mjs
node atlas/state_readability_named_cases.mjs
node atlas/state_readability_geometry_cases.mjs
node atlas/state_readability_probe.mjs
node atlas/state_readability_probe.mjs --source atlas/evidence/state-readability-20261015/source-baseline.json --responses atlas/evidence/state-readability-20261015/responses-pass1.json
node atlas/state_readability_representation_experiment.mjs --runtime PATH --model PATH --output PATH
```

The no-argument probe measures the current source. The replay command binds the
recorded reader inputs to the captured historical source; its schema and SHA-256
are verified before scoring. Do not score old responses against today's source.

The source is evaluated in a fresh VM against frozen **SYNTHETIC** structural
fixtures. These observations are not a live visitor session. The VM is a testing
boundary for the trusted repository source, not a sandbox for arbitrary hostile code.

The report records the exact UTF-8 wire bytes, source and input hashes, dictionary
bytes, full task inputs with and without the dictionary, read-only checks and
determinism. Canonical hashes and exact wire hashes are separate. The budget is
strictly **less than 1024 bytes** for the state payload. The dictionary, task,
model wrapper, output grammar and any future signed envelope have separate costs;
none is silently included in the state budget or presented as free.

`reading_projection_faithful` covers only the six fields used by the reading task.
Coverage describes the known v1 shape. It does not certify an arbitrary future
schema or mathematical equivalence of the entire visible world.

## Historical source baseline · evidence captured before the T repair

`source-baseline.json` preserves the exact prior source (`f754e30326bb5fd6df00902cd1fa06c1af21e77ef60a5c599e275a3b9a1b9c21`).
The figures and reader responses below describe that snapshot only; they are not
measurements of the current `public/game/state_vector.js`.

| Synthetic fixture | Actual wire bytes | UTF-16 units | Strict byte budget |
| --- | ---: | ---: | --- |
| empty | 343 | 343 | Within |
| complete | 268 | 268 | Within |
| unicode | 1063 | 663 | Exceeded |
| overflow | 1947 | 1947 | Exceeded after the existing trim |

That baseline counted JavaScript string units and did not remeasure the final output
after trimming. The historical audit records both defects without changing the
source or evidence. Its dictionary was 650 bytes. Position was a home-relative
offset; absolute position, camera, building coordinates, harmonics, color mapping
and sound recipe were not transported by that vector.

## Current source contract · after the T repair

The current vector counts serialized JSON as UTF-8 bytes, trims radio and excess
place rows, then measures the resulting wire again. If it still cannot fit below
1024 bytes, it emits a bounded fail-closed vector with a cause for every unavailable
field. The current-source cases assert exact byte counts and the strict boundary;
the Unicode case verifies that trimming restores the budget, and the overflow case
verifies that no partial state escapes. The report marks that overflow reading as
`FAIL_CLOSED_WITH_CAUSES` only when every vector field is unavailable and each
contract key has a cause; its reading values are null (the coordinate reference is
`NO_DATA`), and absolute position remains absent from v1. Ordinary reads are marked
`SOURCE_VALUES`; partial or unexplained loss remains `MISMATCH`. Run the no-argument
probe to see the live fixture byte counts and current source hash.

The serializer contract is also declared in `data/atlas_vector_schema.json` as a
closed JSON Schema. `public/game/vector_contract.js` checks the emitted shape;
the game loader and offline precache load it before `state_vector.js`, which fails
closed with causes if validation is unavailable or rejects the vector. Runtime
reads distinguish a valid null tutorial result
(completed or skipped) from a missing reader, preserve reasons for unavailable
skill/resource fields, and reject malformed reader rows into `nd` causes. Reader
experiments remain tied to the source and inputs recorded in their evidence; this
source update does not remeasure model comprehension.

Integer fields use JavaScript's safe-integer range in the JSON Schema, matching
the runtime validator's `Number.isSafeInteger` checks.
Radio rows with an unavailable cycle retain `null` and require an `nd.q` cause;
the radio transcript and compact vector no longer turn a missing engine cycle
into a measured zero. The radio's cycle reader also returns `null` if the
snapshot reader is absent, throws, or supplies a non-safe cycle value.
The crab event reader, reef observation reader, and compact vector use the same
measured-cycle bounds as the lifecycle and NPC receipt contracts: an integer
from 0 through 1,000,000,000. A missing, malformed, or throwing snapshot is
not treated as a cycle.
Radio transcript ages and vector `q` cycle fields use those same bounds; the
closed vector schema and its runtime validator reject an out-of-range radio cycle.

These runtime assertions measure only the serializer contract. They do not revise
or silently recalculate historical response scores, which remain bound to the
preserved source snapshot.

## Recorded local reader experiment

The evidence directory preserves two balanced passes of four fixtures under two
conditions: the same task and wire, with or without the dictionary. Each reading
used a new local process, one CPU thread, temperature 0 and the same seed. The
model and runtime hashes, configuration, wrapper and output grammar are recorded.
No expected answer or example answer was supplied to the model.

| Result | With dictionary | Without dictionary |
| --- | ---: | ---: |
| Readings | 8 | 8 |
| Valid response format | 8 | 8 |
| Fully correct six-field reading | 0 | 0 |
| Correct individual fields | 20/48 | 28/48 |
| Correctly preserved unavailable fields | 6/18 | 16/18 |
| Invented absolute positions | 2 | 0 |

All 16 processes completed normally; no output or context truncation was detected.
Collection took 241.89 seconds. Energy and monetary cost are **NO_DATA** because
neither an energy reading nor an execution tariff was measured. This is one small
model and four fixtures, not evidence about all models or user learning.

The frozen grammar restricted copper to integer/null, which matches these four
fixtures. The evaluator also accepts finite fractional resources. The grammar
constrains output form; it supplies neither the correct resource values nor
permission to act. Its 926 bytes and the 163-byte ChatML wrapper are declared
separately from the state and task.

Recorded offline responses are scored as `DECLARED` evidence of collection in the
portable evaluator; the local experiment records what was actually measured. No
cryptographic attestation of a model invocation is claimed. All proposals remain
unreviewed data with `executed: false`.

## Gates and next decisions

The auditor has a byte-count sabotage that must fail before the normal cases pass.
The cases also cover altered resource order, invented coordinates, missing values,
fractional resources, invalid output, exact input binding and denied side effects.
`atlas/test_atlas.py` runs this gate. Physical phone rendering is not applicable to
this piece because it changes no public runtime or rendered surface.

An auditor passing its tests certifies the measurement tool. The measured language
and model comprehension remain separately red or incomplete. Runtime correction,
binary layout, persistence, signed actions and public publication retain their own
contracts and review points. The local dictionary can be evolved and compared
against this preserved baseline without rewriting its evidence.

## Named State Projection experiment · historical candidate measurements

`state_readability_named.mjs` proposes a lossless named projection of the existing
v1 vector. Resource names, x/y home offsets and building fields are explicit. Source
values and causes are preserved. It does not inject answers to the six-field task,
infer absolute positions or manufacture missing mathematical or sensory data.

| Synthetic fixture under historical source baseline | Named candidate bytes | Disposition |
| --- | ---: | --- |
| empty | 711 | Accepted |
| complete | 862 | Accepted |
| unicode | 1657 | Rejected whole |
| overflow | 3996 | Rejected whole |

A rejected projection emits no sendable state. The experiment never removes fields
to fit. Its 907-byte dictionary is recorded separately and is not supplied to the
reader in the named condition. The same reading task is used; first-read task and
model framing costs remain visible even when a state fits the wire budget.

The projection declares `PARTIAL`: the source still lacks absolute geometry,
camera, harmonics, color mapping and sound recipe. This candidate is not a change
to the live game or certification of a complete visual, audible or tactile language.

The recorded named experiment made eight attempts in two passes: four accepted
state readings and four rejections before inference. All four model responses had
valid format; only the empty-state readings were fully correct (2/4). The complete
state preserved the correct resource value but lost the crab offset and buoy phase.
Twenty of 24 fields and all 14 unavailable fields were read correctly. No absolute
position was invented. Collection took 40.09 seconds without detected truncation.
The output grammar permitted finite fractional copper here; that difference from
the baseline grammar is declared. This exploratory comparison is not a causal claim.

## Typed Geometry experiment · historical candidate measurements

`state_readability_geometry.mjs` composes the named projection with position tuples
and an explicit coordinate space. An exact-id dictionary associates the buoy with
its measured manifest type. Unknown identifiers keep a null type and a cause. No
identifier pattern is guessed and no phase value is translated. The manifest anchor
and source hash are recorded separately from the transmitted state.

The empty and complete states are 781 and 951 bytes. Oversized states of 1746 and
4085 bytes are rejected whole. The 1612-byte dictionary is measured separately and
does not enter this reader condition. Source, task and candidate were frozen before
the held-out readings; those fixtures were not disclosed to the candidate author.

## Current wire prompt comparison · 2026-10-15

`state_readability_prompt_experiment.mjs` reuses the current source fixtures and
response validator. Across 2 passes it compares the original reading task against
an explicit map of the compact wire keys. It also toggles the vector declaration
as extra prompt text. The output JSON grammar is held constant in all 32 readings;
“vector dictionary” below means only the input declaration, never the output
grammar. Each call used a fresh process and synthetic data.

| Prompt | Input vector dictionary | Correct six-field readings | Valid format | Median latency |
|---|---:|---:|---:|---:|
| Existing task | absent | 4/8 | 8/8 | 5.00 s |
| Explicit key map | absent | 6/8 | 8/8 | 5.46 s |
| Existing task | present | 0/8 | 8/8 | 5.69 s |
| Explicit key map | present | 4/8 | 8/8 | 5.93 s |

The explicit map scored 2 more correct readings without the declaration. Adding
the declaration corresponded with lower correctness for both prompt variants.
This small, synthetic comparison is an association, not a causal claim. It supports
keeping the map as a candidate prompt and excluding the verbose vector declaration
from future reader prompts until a larger held-out measurement. Neither prompt is
connected to the live game by this experiment.

Runtime: llama.cpp build 10068 (`571d0d540`), CPU only (`gpu_layers=0`), one thread,
temperature 0, seed 14, context 4096, max output 512, offline mode. Model:
qwen2.5-coder-1.5b. Source SHA-256:
`5f481fcecc5e0a13d871baa2901f5cc5f28dd2e3afea794b5e011ff6b10d5546`.
Runtime SHA-256: `7119bef261611b26f326f7c4da4dc3fdeb7bb28e2faf1ec392bda7b21215ef52`.
Model blob SHA-256:
`29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104`.
Exact token counts are **NO_DATA**: the runtime exposes evaluation counters that
do not verify sampled token totals. Full inputs, responses, latencies and hashes are
in `evidence/state-readability-20261015/prompt-experiment-20261015.json`.
`state_readability_prompt_cases.mjs` is included in `atlas/test_atlas.py`; it
recomputes every input and response-text hash, exact 2×4×2×2 coverage, expected
reading, output validation and summary. Sabotages for unknown artifact keys,
unknown record keys and altered inputs/outputs must fail closed.

## Current paired compact vs named reading · 2026-10-15

`state_readability_representation_experiment.mjs` reuses the current source
fixtures, named projection and closed response evaluator. It sends the same two
accepted fixtures (`empty`, `complete`) as compact and named JSON in two passes,
using matched path instructions, identical generation settings and fresh offline
`llama-completion` processes. `llama-cli` was rejected during setup because its
interactive UI polluted stdout and initialized an incompatible sampler path; the
measured bundle's `llama-completion` emits the response channel needed here.

The first paired attempt used the CLI and is retained as failed evidence in
`representation-experiment-current.json`: 0/8 valid outputs, with sampler errors.
It is excluded from model-reading scores. Prompt refinement produced the following
results; separate artifacts retain every response and input hash:

| Prompt revision | Compact exact readings | Named exact readings | Format valid | Median latency, compact / named |
| --- | ---: | ---: | ---: | ---: |
| Explicit tuple/index map (`v2`) | 2/4 | 0/4 | 8/8 | 10.62 / 12.45 s |
| Direct assignment and null rule (`v3`) | 0/4 | 2/4 | 8/8 | 10.95 / 12.98 s |

The prompt edits reversed which representation scored better, so this small
measurement does not establish a winner. In v3, named JSON correctly represented
the empty state twice, while compact JSON confused the missing crab with the
coordinate reference; on the complete state compact JSON twice read the crab
tuple incorrectly, while named JSON abstained on crab and buoy phase. All outputs
were structurally valid but only 2/8 readings were exact in v3. Neither projection
is approved for live reading on this evidence. The larger named form also took
about 2 seconds longer at the median in both revisions. Only `empty` and
`complete` fit both shapes; Unicode and overflow are outside this comparison.

Runtime: llama.cpp build 10068 (`571d0d540`), CPU only (`gpu_layers=0`), one
thread, temperature 0, seed 14, context 4096, max output 512. Model:
qwen2.5-coder-1.5b. Source SHA-256:
`5f481fcecc5e0a13d871baa2901f5cc5f28dd2e3afea794b5e011ff6b10d5546`.
Runtime SHA-256: `7119bef261611b26f326f7c4da4dc3fdeb7bb28e2faf1ec392bda7b21215ef52`.
Model SHA-256:
`29d8c98fa6b098e200069bfb88b9508dc3e85586d20cba59f8dda9a808165104`.
Exact sampled token totals and energy are **NO_DATA**: this runner records wall
latency and hashes but does not independently collect those measurements. The
artifacts are `representation-experiment-v2.json` and
`representation-experiment-v3.json`; no prompt, projection or model is connected
to the live game by this experiment.

Recheck v3 without inference:

```sh
node atlas/state_readability_representation_experiment.mjs --validate atlas/evidence/state-readability-20261015/representation-experiment-v3.json --runtime PATH --model PATH
```

The validator binds each record to the current fixture bytes, prompt input, wrapped
model input, response hash and closed output evaluator, then recomputes coverage
and summaries. A successful recheck reports `{"ok":true,"errors":[]}`.
