# Test registry · FENCE

## Problem
Existing tests of the seal, state writer, model tools and coder frame are not
declared in the main gate. A green gate can omit them.

## Outcome
The existing Python and Node suites run in both passes of the web gate.

## Affects
The web CI workflow and its contributors. No served files change.

## Constraints
Keep the existing runners and both passes. Do not count a fixture as a test.

## Open questions
The workerd regression uses a pinned runtime and a synthetic upstream. The list
described as six files includes that upstream fixture; it is not a separate test.
