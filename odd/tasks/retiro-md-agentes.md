# Retiro de los .md por herramienta (claude/codex) — decreto del Soberano

> Orden del Soberano (2026-11-05): eliminar los .md de claude y de codex; todos los agentes son preceptores; los orquestadores son las tres mesas mistral (web). Pieza declarada bajo LA MARCHA: una pieza, un PR.

## Objetivo
- Un solo contrato por repo: AGENTS.md como puerta técnica única (web, app, lab).
- Retirar CLAUDE.md de la web: sus 5 punteros vivos quedan en AGENTS.md (mapa único, Babel, CONTRACT del companion, LA MARCHA, SCRUB/recibos).
- Gemelas de la misma ola: PreceptorOS#174 y lab#137 (punteros puros, sin política propia); p0x#82 (retiro de PLAN_CLAUDE/PLAN_CODEX con heredados a HANDOFF.md).

## Verificación
- Tras el merge: `grep -r "CLAUDE.md" AGENTS.md README.md CONTRIBUTING.md docs/` → 0 referencias vivas.
- AGENTS.md crece ~400 B; queda lejos del techo de casa.

## Log
- 2026-11-05 · Mesa: pieza cocinada; FIRMA por cabeza exacta en buzon#30; los punteros transplantados se verificaron contra el CLAUDE.md retirado antes de borrarlo.
