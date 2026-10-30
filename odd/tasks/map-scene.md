# M1 · One map scene

## Contract

OpenWorld remains the sole map. A scene composes the already measured node and unit frames into a deterministic back-to-front render order. Complements may add frames to that scene; they do not create another map or state store.

## Slices

- M1-1: pure scene composition, deterministic ordering, closed input checks.
- M1-2: connect the composer to the OpenWorld colony renderer and verify live output.

## Receipt yardstick

Same input yields byte-identical order; invalid identities, coordinates, and oversized frames are refused. Browser output remains a single map.
