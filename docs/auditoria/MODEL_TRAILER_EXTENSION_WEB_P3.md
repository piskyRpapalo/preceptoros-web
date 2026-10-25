# P3 · Extensión del tráiler Model · web (commits fuera del rango auditado)

**Base de la auditoría heredada:** study#81 (merged 5dc0194a), receipt `web=1251:39:1212@2d880ab`.
**Rango nuevo (esta extensión):** `2d880ab..567ab71` (origin/main al abrir este PR). Solo commits fuera de ese rango.
**Historia:** no reescrita. Ningún trailer existente se edita (K7).

## Snapshot (Step-0)
- Commits fuera del rango: **5**.
- Trailers `Model:` en el rango: **0**.
- Trailers `Co-Authored-By:` en el rango: **2** (`Claude Haiku 5.5 <noreply@anthropic.com>`).
- Trailers `Model:` con valor `GLM (Vibe)`: 0 en el rango (la identidad del Mesa está exenta de mapeo, K6).

## Tabla (mapeo)

| Valor | Commits | Mapeo |
|---|---|---|
| `Claude Haiku 5.5` (Co-Authored-By) | 2 (`ac00953`, `07539ea`) | **NO_DATA** · cause: el mapeo de la auditoría es solo Mistral / ChatGPT; el proveedor de este valor (Anthropic) no está en la tabla. No se asigna a ninguno de los dos. |
| `GLM (Vibe)` (Model:) | 0 | exento (identidad del Mesa, K6) |
| sin trailer | 3 (merges `567ab71`, `c54d782`, `e90c2e2`) | NO_DATA · cause: sin trailer |

## Commits del rango
- 1. 567ab71 · 2026-10-25 · David · Merge pull request #315 from piskyRpapalo/haiku/atlantis-terrain-r3-20261025
- 2. c54d782 · 2026-10-25 · David · Merge branch 'main' into haiku/atlantis-terrain-r3-20261025
- 3. e90c2e2 · 2026-10-25 · David · Merge pull request #314 from piskyRpapalo/haiku/face-world-split-r2-20261025
- 4. 07539ea · 2026-10-25 · David · face: R3 del plan de mundos, terreno propio de atlantis
- 5. ac00953 · 2026-10-25 · David · face: R2 del plan de mundos, el terreno sale de face_world.js

## Límites
- No se consultaron las fuentes oficiales de catálogo de modelos en esta pasada; el mapeo de `Claude` es NO_DATA por esa razón, no por inferencia.
- Esta extensión no fija política: la decisión sobre el valor `Claude` la toma el Mesa.
