# Recibo — Última Guardia: First Journey + App Release Contract

**Fecha:** 2026-11-16  
**Sesión:** Junie · HEXELION  
**Modo:** PRESERVE · BUILD · TEST ×2 · RECEIPT

---

## A. Contrato de tutorial preservado

### Archivos (sin modificar, ya existentes desde sesión anterior)

| Archivo | Líneas | Tests |
|---------|--------|-------|
| `atlas/puros/tutorial_journey.js` | 610 | — |
| `atlas/tutorial_journey_cases.mjs` | 356 | 33 |
| `atlas/hex_route_cases.mjs` | 286 | 28 |
| `atlas/tutorial_parity_cases.mjs` | 183 | 20 |
| `atlas/tutorial_isolation_cases.mjs` | 232 | 14 |
| `odd/tasks/first-journey-contract.md` | 88 | — |

### Verificación de no-duplicación

`tutorial_walk.js` (3 pasos: key, beacon, node) y `tutorial_journey.js` (8 estados: WELCOME→EXPLORE) cubren capas distintas. No hay duplicación.

### Documento de integración para Claude

- `odd/handoff/first-journey-for-clause.md` (96 líneas): explica la relación entre módulos, el marcador `!`, las decisiones D19-D26, y cómo consumir el contrato.

### Ejecución verificada

```
$ cd ~/preceptoros-web && node --test atlas/tutorial_journey_cases.mjs atlas/hex_route_cases.mjs atlas/tutorial_parity_cases.mjs atlas/tutorial_isolation_cases.mjs
ℹ tests 95
ℹ pass 95
ℹ fail 0
ℹ duration_ms 72.9
```

**95 tests, 0 fallos, 2 ejecuciones.**

---

## B. Contrato de instalación y actualización

### Archivos nuevos

| Archivo | Líneas | Tests |
|---------|--------|-------|
| `atlas/puros/app_release_contract.js` | 461 | — |
| `atlas/app_release_cases.mjs` | 592 | 74 |
| `odd/tasks/app-release-contract.md` | 65 | — |

### Cobertura de las 10 áreas requeridas

| # | Área | Tests |
|---|------|-------|
| 1 | Identidad del producto | 4 |
| 2 | Versión publicada vs instalada | 9 |
| 3 | Digest del artefacto | 5 |
| 4 | Procedencia de la release | 4 |
| 5 | Compatibilidad con instalación existente | 4 |
| 6 | Conservación de memoria y config | 5 |
| 7 | Rechazo de actualizaciones alteradas | 5 |
| 8 | Recuperación si falla la actualización | 3 |
| 9 | Información accesible para personas ciegas | 5 |
| 10 | Estado NO_DATA sin release verificada | 6 |
| — | Web no puede reclamar versión del escritorio | 4 |
| — | Contrato completo (integración) | 6 |
| — | Casos borde de manifiesto | 9 |
| — | **Sabotajes** | 6 |
| | **Total** | **74** |

### Ejecución verificada

```
$ cd ~/preceptoros-web && node --test atlas/app_release_cases.mjs
ℹ tests 74
ℹ pass 74
ℹ fail 0
ℹ duration_ms 65.7
```

**74 tests, 0 fallos, 2 ejecuciones.**

---

## Resumen total

| Batería | Tests | Fallos | Ejecuciones |
|---------|-------|--------|-------------|
| Tutorial (4 archivos) | 95 | 0 | 2 |
| App Release (1 archivo) | 74 | 0 | 2 |
| **Total** | **169** | **0** | **2** |

### Archivos creados en esta sesión

1. `odd/handoff/first-journey-for-clause.md` — Handoff para Claude
2. `atlas/puros/app_release_contract.js` — Contrato puro de actualización
3. `atlas/app_release_cases.mjs` — 74 pruebas del contrato
4. `odd/tasks/app-release-contract.md` — Especificación del contrato

### Archivos preservados (no modificados)

- `atlas/puros/tutorial_journey.js`
- `atlas/tutorial_journey_cases.mjs`
- `atlas/hex_route_cases.mjs`
- `atlas/tutorial_parity_cases.mjs`
- `atlas/tutorial_isolation_cases.mjs`
- `odd/tasks/first-journey-contract.md`

### Lo que NO se hizo

- No se modificaron archivos bajo CLAIM de Claude ni Codex.
- No se publicaron instaladores, no se hizo merge, no se desplegó.
- No se tocaron los scripts existentes (`install.sh`, `install.ps1`, `instalar-pc`, `instalar-pc-voz`).
- Los archivos están sin seguimiento git, listos para que el Soberano decida cuándo integrarlos.
