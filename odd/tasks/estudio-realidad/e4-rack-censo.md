# estudio-realidad · E-4 · the rack census: incoherencias and NO_DATA of the beelink

Date: 2026-11-02 (night)
Law: the Sovereign's FIRMA «purguemos y hacemos a hexelion como debe ser» (chat TF, 2026-11-02) · decree SALA DE PRÁCTICAS ·6588307673 · receipts: census ·6588467491 · purge ·6588560177 · deploy dp ·6588661207 · incoherencias ·6588806497. Method: `e0-metodo.md` (#576). Docs-only, slow lane, never touches `public/`.

## How to read this

E-0 declared the other nodes of the rack out of reach for the study («propose-only, no SSH missions»). This piece closes part of that blindness with measurements the Sovereign ran with his own hands on the beelink and pasted to the Mesa. Vantage: **S** = the Sovereign's session on the beelink, FIRMA'd. Every number below is pasted, not fetched.

## Measured base (before the purge, 2026-11-02 21:04)

- beelink GPU: **AMD Hawk Point iGPU** (VGA 64:00.0), shared VRAM, no official ROCm → the small-model LoRA forge does NOT fit the beelink; minis forge on onexstation with the 120b. Closes a NO_DATA of the LORA-dual plan (·6588177632).
- disk 915 GB: **520 GB used (60 %)**; `~/.ollama` 165 GB · `~/.cache/huggingface` 51 GB (in `hub`) · docker image of the aula 7.16 GB.
- Ubuntu 26.04.1, kernel 7.0, load 7.31, MOTD temp 84.8 °C; `sensors` measured after: k10temp Tctl **77.6 °C** (crit 85 °C) — warm under three claude trains + nexo + aula, not critical.

## Incoherencias (measured contradictions, one card each)

| # | incoherence | measured | state |
|---|---|---|---|
| I1 | the aula (open-webui, self-declared «ventana de los hermanos, F2-alfa — solo tailnet») bound to the tailscale IP `100.81.82.34:8080` against the «no server» law | unit text · `ss` | **CORREGIDO POR** the user-unit override to `127.0.0.1:8080`; the clean `ss` paste is still missing: `NO_DATA: no receipt after the port parasite died` |
| I2 | the aula lived TWICE: docker (container exited 5 weeks, image 7.16 GB) + uv tool v0.11.1 (running since 10-31) | `docker ps -a` · `uv tool list` | **CORREGIDO POR** the purge: docker removed |
| I3 | `~/Cuarentena`, inside the Sovereign's home, was owned by user `vibecrew` (uid 1001, home 52 KB, no `.ssh`, no crontab, no processes) | `ls -ld` · `id` · `du` | **CORREGIDO POR** `chown -R pisky:pisky`; `vibecrew` is a purge candidate pending FIRMA; origin `NO_DATA: no creation record read` |
| I4 | open-webui and f1-heartbeat are USER units; the first census listed them among system units | `sudo systemctl restart open-webui` → «Unit not found»; `systemctl --user cat f1-heartbeat` | census corrected by the second pass; both scopes now noted |
| I5 | **nginx listens on `*:80`** (all interfaces) on the beelink; no prior census or registry names it | `sudo lsof -nP -iTCP:80 -sTCP:LISTEN` | `NO_DATA: config not read`. First step: `ls /etc/nginx/sites-enabled/` — is it `preceptoros-pwa.service`? Against the «no server» law if it serves beyond loopback/LAN |
| I6 | sage-a15 (REJECTED as canon brain, ·6588111541) stayed resident on onexstation (68 GB, 100 % GPU) while hexelion sat evicted | tanda + census | cure served (`ollama stop sage-a15` + `ollama run hexelion`); `NO_DATA: the run's output was not pasted — the throne has no receipt` |
| I7 | two IPv4 on `eno1` (192.168.50.202 + 192.168.50.150) | MOTD | `NO_DATA: cause not measured` |
| I8 | the deploy of letter `dp` ran hours after its FIRMO: production served `do` while main held `dp` | merge `3b8a05a3` (20:47Z) vs deploy version `1abcd637` (~21:0xZ) | closed the same night: atlas **181/181 · 0/0/0**; era `do` ended |

## The purge, measured (FIRMA «purguemos», receipt ·6588560177)

- disk: **520 → 441 GB = 79 GB freed** (915 GB at 51 %). Theoretical ~153 GB; real is less by shared layers, as warned before the purge.
- removed: docker duplicate · 16 ollama models (preceptor-* lineage ×10: charla×5, tribune×2, cuentacuentos, cazanido, v7 · 30b orphans ×6: soberano-coder, qwen3-coder:30b, minicpm47-texto, minicpm-v4.7, muse-glimmer, hemmingway) · aider-chat + mistral-vibe + crawl4ai (9 executables).
- archived and verified: `~/Cuarentena/purga-20261102/` holds `.aider`, `.aider-venv`, both histories, `.vibe`, `.vibe.toml`, `vibe` (config). Home measured clean.
- **kept (canon)**: the llama.cpp forge ALIVE in the beelink — `llama-finetune`, `llama-export-lora`, `llama-quantize` in `~/.llama.cpp/build` — tooling of the LoRA decree (·6588111592); mcp-server fetch/git/sqlite; ollama.service (loopback ✓), ollama-puente, hexelion-tunnel (127.0.0.1:21434 ✓), hexelion-nexo, f1-heartbeat, preceptoros-pwa, gh, claude/codex CLIs, `~/bin/hexelion`; 29 models kept (minis, embedders, mistral).

## NO_DATA closed tonight

GPU of the beelink · owner of Cuarentena · the listener of port 80 (named: nginx) · the aula's duplication · the purge's real yield.

## NO_DATA still open (first measurable step each)

| # | gap | first measurable step |
|---|---|---|
| 1 | what nginx serves on `*:80` | `ls /etc/nginx/sites-enabled/` + `curl -I 127.0.0.1:80`; name it or bind it |
| 2 | the aula's listening state after the override | `ss -tlnp | grep 8080` pasted clean (only open-webui on 127.0.0.1) |
| 3 | hexelion throne receipt | the `ollama ps` output of the ssh run on onexstation |
| 4 | content of `~/.cache/huggingface/hub` (51 GB) | `du -sh hub/* | sort -h | tail` — forge bases? purge only after inventory |
| 5 | what `ollama-puente.service` bridges | `systemctl cat ollama-puente` |
| 6 | origin of user `vibecrew` (~10-10) | `sudo journalctl -g vibecrew | head -3` or the auth log |
| 7 | 89 updates + 21 ESM + firmware pending | a maintenance window with no deploy that night |
| 8 | the 29 kept models carry no Acho card per model | the fleet census (H6), pending decree |

## Limits of this piece

- Every number comes from the Sovereign's pasted sessions; the study itself ran no SSH (E-0 rule held).
- The aula is third-party software under a branding-clause license (not MIT): it is the practices room, NOT canon. The native SALA (8831) keeps the law.
- No production was touched; the deploy of `dp` was the Sovereign's hands with the atlas receipt.

## Checklist

- [x] E4-1 · measured base: GPU, disk, temperatures.
- [x] E4-2 · eight incoherencias, each with correction or first step.
- [x] E4-3 · purge receipt and archive verification.
- [x] E4-4 · NO_DATA closed vs open, with first measurable steps.
- [ ] E4-5 · the open items turn into measurements (next session).

## Log

- 2026-11-02 night · E-4 written by Mesa TF on branch `mesa/e4-censo-rack-20261102` from main `62dd2fd5`. Docs-only. Waits for FIRMA + FIRMO.
