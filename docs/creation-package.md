# Portable creation · version 1

Status: implementation proposal for E1. An author signature binds an artwork and
its audible statement. It grants no node capabilities, is not a node charter and
is not evidence of LIVE publication. The fixture voice is synthetic test data.

## Bytes and envelope

Transport is one UTF-8 JSON file, at most 26,214,400 bytes including whitespace.
The envelope has exactly these fields:

```json
{"schema":"preceptoros.creation/1","manifest":"<original JSON text>","public_key":"<64 lowercase hex>","signature":"<128 lowercase hex>","files":{"frame.json":"<base64>","declaration.wav":"<base64>"}}
```

The public key is raw 32-byte Ed25519; the signature is the complete 64-byte
Ed25519 signature. Sign and verify the exact UTF-8 bytes of `manifest`. Never
serialize parsed JSON to verify. Creation ID is lowercase SHA-256 of those same
bytes. The valid shared fixture deliberately starts its manifest with a newline.
Private keys never travel. Base64 is canonical RFC 4648 with padding, no whitespace,
and no alternate alphabet. Receivers reject unknown or missing fields and files.
JSON parsing follows JSON.parse semantics (duplicate properties resolve to the
last occurrence); producers emit unique properties. Non-finite numeric values are
rejected. Byte limits are UTF-8 bytes, not character counts.

The manifest has exactly `schema`, `author`, `description`, `voice_profile`,
`files`. `schema` is `preceptoros.creation/1`; author and description are nonblank
Unicode strings of at most 256 and 4,096 UTF-8 bytes respectively, with no unpaired
surrogates. `voice_profile` is 64 lowercase hex characters: the voice profile ID.
The original manifest is nonblank valid Unicode and at most 16,384 UTF-8 bytes.

`files` is an ordered array of exactly two descriptors:

```json
[{"name":"frame.json","size":216,"sha256":"<64 lowercase hex>"},{"name":"declaration.wav","size":48,"sha256":"<64 lowercase hex>"}]
```

Sizes above are illustrative; actual sizes and SHA-256 must match decoded bytes.
Descriptors have exactly `name`, `size`, `sha256`. Size is a positive safe integer
at most 26,214,400. Filenames and order are closed as shown. No paths, MIME-driven
execution, URLs, directory traversal, extra files or executable content exist.
The complete encoded package ceiling applies independently of decoded sizes.

## MVP content

`frame.json` is nonempty UTF-8 JSON strictly smaller than 1,024 bytes. This version
accepts one ribbon only, using the existing Bubble vocabulary:

```json
{"v":"preceptoros.bubble/1","id":"CREATION","cv":[412,515],"style":"clear","atoms":[{"k":"keepsake","i":[{"o":"ribbon","f":"cyan","s":"ink","d":0,"lw":2.5,"pts":[[206,258],[210,258]]}]}]}
```

Every object has exactly the illustrated fields. `id` matches `[A-Z0-9_-]{1,32}`;
style is `volume`, `etch` or `clear`. All other scalar values are fixed as shown.
`pts` contains at least two pairs of integer-valued numbers, x in 0..412 and y in
0..515. JSON `1.0` is integer-valued; booleans are not numbers. No previous frame,
embedded code, or external dependencies are admitted. The editor can hold an
empty draft, but it cannot sign it as a creation.

`declaration.wav` is a nonempty RIFF/WAVE, PCM format 1, mono, signed 16-bit,
8,000..96,000 Hz. The 44-byte header has `RIFF`, size=length−8, `WAVE`, `fmt `,
fmt-size=16, PCM=1, channels=1, rate, byte-rate=rate×2, block-align=2, bits=16,
`data`, data-size=length−44. Data size is positive and even; no extra chunks or
trailing bytes. This closed cut allows the same browser and Python validators.
WAV bytes express the statement; Ed25519 supplies authenticity, not vocal
biometrics. PCM validity does not prove audible output or intelligibility.

## Voice exchange (E2/E3)

The local catalog is UTF-8 JSON, at most 25 MiB, with exact fields `schema`,
`profile`, `profile_id`, `clips`. Schema is `preceptoros.creation-voice/1`.
`profile` is the exact JSON string describing the local model SHA-256 and fixed
voice parameters, without local paths. `profile_id` is SHA-256 of its UTF-8 bytes.
Every clip is `{text,size,sha256,data}`: nonblank text, decoded WAV size, digest,
and canonical base64 WAV. The exact inventory is:

`add`, `undo`, `redo`, `border`, `reject`, `repeat`, `cyan`, `ink`, `x`, `y`,
`points`, `digit_0` through `digit_9`, `signing`, `signed`, `exported`, `published`,
`unavailable`, `ready`, `empty`, `limit`.

The declaration descriptor has exact fields `schema`, `profile_id`, `text`,
`size`, `sha256`, `data`; schema is `preceptoros.creation-declaration/1`. It uses
the same profile ID and WAV rules. E3 also downloads the raw WAV. The creation
flow checks profile equality, decodes the statement and binds its bytes to the
signed manifest. It must not replace a missing voice with another engine.

## APIs and fixtures

`public/game/creation_package.js` is vanilla browser code (`CreationPackage`)
and CommonJS. `prepare({author,description,voice_profile,frame,audio})` returns
`{manifest,files}`. Sign `manifest` using `Identity.firmarTexto`, then call
`finish(prepared,publicKey,signature)`; it verifies before returning the envelope.
`verify(rawTextOrBytes)` returns `{id,manifest,frame,audio,package}` after all checks.
Helpers: `sha256`, `encode`, `decode`, `wav`, `frame`, `manifest`, `bytes`, `MAX`.
Failures throw; callers surface the cause without publishing partial content.

Shared fixtures in `tests/fixtures/creation/` include a real signed valid package,
four changed-byte packages, and a runtime size recipe. The large case is generated
in memory rather than checking in a file above the block ceiling. `generate.mjs`
uses a new ephemeral key only in memory; no private material is saved.
Run `node tests/creation_contract.test.mjs`. Setting `CREATION_SABOTAGE=1` asks the
judge to accept the corrupt frame and must exit nonzero. Receipts and control
responses are a separate channel: strictly fewer than 1,024 UTF-8 bytes, reject
whole responses at the boundary. Creation files never enter that control channel.
