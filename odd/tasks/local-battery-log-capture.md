# Bounded local battery output

Status: PROPOSAL · local tooling only · no public runtime or CI behavior changes.

## Objective

Prevent repeated local gate runs from appending unbounded output to `/tmp`. The historical 16,935,735,296-byte file was a dead marathoning artifact: sampled blocks across its length contain repeated complete `GATES_ALL_PASSED` output for 101 suites. It was closed and dated 2026-10-28 when inspected on 2026-10-31; no live process handle remained. The exact historical PID is unavailable, so this piece prevents recurrence at the local capture boundary rather than changing a guessed test process.

## Scope and behavior

- Add `bin/capturar-bateria --name <label> -- <command...>` as an explicit local wrapper for a gate/battery command.
- Example: `bin/capturar-bateria --name gate -- python test_web.py`.
- Store output at `$XDG_STATE_HOME/preceptoros-web/batteries/`; when unset, use `~/.local/state/preceptoros-web/batteries/`.
- Capture merged stdout/stderr byte-for-byte while also streaming it to the caller's terminal; return the wrapped process's exit status.
- Enforce a hard 100 MiB maximum per file while streaming, including a single oversized output chunk. Rotate `.log`, `.log.1`, `.log.2`, `.log.3`; total retained output is at most 400 MiB per label.
- Keep files private (`0600`) and the directory private (`0700`). Validate labels to prevent path traversal. Serialize concurrent writers for the same label.
- If an existing managed log is not a regular file or exceeds the cap, fail closed before launching the wrapped command; do not silently truncate evidence.
- This wrapper is opt-in for local commands. GitHub Actions continues to use its native bounded run logs and is unchanged. No repository battery automatically writes to disk through this wrapper.

## Proposed files

1. `odd/tasks/local-battery-log-capture.md` — scope, evidence and acceptance.
2. `bin/capturar-bateria` — standard-library Python capture and bounded rotation.
3. `tests/test_capturar_bateria.py` — temporary-XDG tests for byte fidelity, terminal forwarding, exit status, rotation, maximum file size, unsafe labels, and fail-closed oversized existing files.
4. `README.md` or developer tooling index — one local usage example, without changing CI or application commands.

## Acceptance

- Unit tests use a small injected test limit; production CLI limit remains fixed at 100 MiB and cannot be raised by arguments or environment.
- A command emitting more than four file limits leaves no log file above 100 MiB, keeps at most four generations, and still streams all bytes to the caller.
- A failing wrapped command returns its original non-zero status.
- No files are written under `/tmp`, the repo, or public output by default; the chosen XDG path and file modes are measured in tests.
- The full web gate remains separate from this local helper and its logs. No public assets, service, model, or state are changed.

## Log

- 2026-10-31 · Mesa addendum says the writer was a completed 2026-10-28 marathoning process; archived file inspection confirms repeated gate output, old mtime, and no open handle. No active PID can be attributed. Prevention is therefore implemented as a bounded local capture wrapper, not a mutation of the web CI workflow.
