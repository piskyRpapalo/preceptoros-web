# Versioned 2D image creation package

This package boundary is separate from `preceptoros.creation/1`; that format
continues to accept a single Bubble ribbon frame and a statement WAV. The new
`preceptoros.creation.image/1` contract is implemented in
`tools/creation_image_package.js`. It packages only `image.png` and
`declaration.wav`, hashes each file, signs the exact UTF-8 manifest bytes with
Ed25519, and derives the creation ID from those same bytes.

Limits: complete encoded package 25 MiB; PNG 8 MiB; WAV 8 MiB; width and height
at most 2048; at most 4,194,304 pixels; manifest 16 KiB. PNG headers are
bounded before browser decode; the browser decoder must return matching
pixel dimensions. Unknown manifest/package/file fields, altered bytes,
invalid media, unavailable decode, and invalid signatures reject with a named
cause. The package code is a non-served contract library; no UI, generator,
network adapter, or deployment is included.

Generation remains `NO_DATA`: no approved image engine/model, model digest,
license chain, output-quality evidence, or survivor/zombie scene was measured.
Test digests and the 1×1 PNG are synthetic fixtures, not provenance or model
receipts. No claim is made that a prompt has been converted into a drawing.
