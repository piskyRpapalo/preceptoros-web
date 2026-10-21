# Served contract identifier census · 2026-10-21

Base `0b5da04`; read-only lexical census for #157. Spanish contract identifiers are present.
Scope: explicit vocabulary in `atlas/d1_contract_census.py`, matched against quoted JSON keys under public/. This is a lower bound, not a complete language classifier. Repeated keys on one line count once; values and private identifiers are not copied. Translation-table keys are included and are not necessarily visible prose.

Matched files: 19. Unique file/key/line tuples: 177.

| Served path | Keys @ lines | Source SHA-256 |
|---|---|---|
| `public/atlas-ar.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `514658be0ef492781d27e475f6bce6b100f64ddd1a541a4197c6cd152d415460` |
| `public/atlas-arena-en.json` | esquema@2; nota@4 | `7b1fcd697fbd4c461ac92d465f760c33c0fc1e3061528785685d4bcf9534e958` |
| `public/atlas-casa-en.json` | esquema@2; nota@4 | `b7d4d2719ac45606aa43f2088599f3b018c5828124b7537745717354ce0b06b5` |
| `public/atlas-de.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `7e97f6133abe7b709274adeb094f4a4d9a3b0483f0cee8dac9064c1bcef9d70a` |
| `public/atlas-el.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `0176e07fb88312a0e9b5707c905fe7c847bfafb835300d5d1577c70661ab6ec8` |
| `public/atlas-en.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `2f55d6286d01946d5c74cba45c09ad5bda8d3d014f3dae3023e3be23e9ea3ea1` |
| `public/atlas-es.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `1937d3654f2f4eb5e00a483f416376980432a04bccba748dccaa4798d0a9e1eb` |
| `public/atlas-fr.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `1a86f532a63d049a18d630bd91655c3a7fa942d2ff7cfbdb974aa61b9dec1ab3` |
| `public/atlas-it.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `f45d64473355698f3aa7fce8a0d2b600f8dbfea39c1d31ac372e693ffe87c48e` |
| `public/atlas-mundo.json` | esquema@2 | `86618c6b372441827063d81c77efb9830177dca929ae2a560a9649aeddbde5f8` |
| `public/atlas-opina-en.json` | nota@12 | `544a9f7746a32b36ac926941eeacd84676a8201417db24f1ff52c0cec3638b3c` |
| `public/atlas-pt.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `59efc13c205dc02b7bbe4e079bda5a3d3aa106438e3706756b968bf46cf91d01` |
| `public/atlas-record.json` | esquema@2; integridad_max@9,22,43,52,65,86,95,108,129; nivel_nucleo@14,35,57,78,100,121 | `961d12164808d9d0984d7f0d59ca6b038e722e2e27ca429a271ccaf2aafcafc1` |
| `public/atlas-ru.json` | cobre@1; esquema@1; luz@1; nota@1; oxigeno@1; sello@1; sonido@1 | `d28eb3b1f57f34c607eb31cf2038eb38dfaddd36e603d3aa7626baf3aeed5426` |
| `public/cerebros.json` | causa@1; esquema@1; estado@1; nota@1 | `a7450c9c387d43305035419a8632f1b091e36c0e82a96bdf773680906a51133d` |
| `public/counters.json` | causa@47,54; clave@8,15,22,29,36,43,50,57,64,71; como@12,19,26,33,40,61,68,75; esquema@2; estado@9,16,23,30,37,44,51,58,65,72; fecha@3; metricas@6; nota@5; ultima_lectura@4; unidad@11,18,25,32,39,46,53,60,67,74; valor@10,17,24,31,38,45,52,59,66,73 | `bd0942e1913b6545808ba7c6c60105d66048a133c1c2f60d8128e64bac80bfb1` |
| `public/dictionary.json` | anclaje_abierto@1; archivo_verificador@1; estandar_humano@1; id_interno@1; movimiento@1; nombre_juego@1; onda_hz@1; semiotica@1; trazo@1 | `8b6e8fccbaf2f00a1d1ae4af353da7899512da0c54d6102a5275df6270cbd327` |
| `public/nexo-v1.json` | esquema@2; nota@18 | `a7d2152e339b5b14f7ef1997cc8a37a49ff0e5827b7ee14d6952767bedfe8bee` |
| `public/release.json` | causa@78; esquema@2; estado@77,85,91,97,103; fecha@6; nombre@11,16,21,26,31,36,41,46,51,56,61,66,71; nota@107 | `8459e70e0344fe8d892273351115546e0837a15ba63851fcd51699c9839907e2` |

The concrete #157 case also remains in `public/game/gacha.js:78,82-86`: campo_origen and the values medido/emulado. ORIGENES is the enum identifier. causa_origen has zero matches in that file on this base. These are source identifiers and values, not a rendered-language measurement.

Cause: existing serialized field names remain Spanish even where display text is English. `public/dictionary.json` has nine matched fields; translating values did not rename that contract. No field has been renamed in this proposal.
Visual exposure, all JavaScript identifiers and unlisted vocabulary: NO_DATA, outside this lexical pass. Canon status remains pending.

Open 1 (#157): does the Mesa authorize a versioned migration of these served contract keys and their consumers?
