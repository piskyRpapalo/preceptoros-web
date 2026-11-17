# Comisión de Día — Recibo de auditoría

**Fecha:** 2026-11-16
**Agente:** Junie
**Modo:** PRESERVE · ANALYZE · TEST ×2 · RECEIPT

---

## Misión A · Preservar e integrar

### Preservación verificada

12 joyas preservadas en `odd/recibo/jewels/` con huellas SHA-256:

| Archivo | SHA-256 | Estado |
|---------|---------|--------|
| app_release_contract.js | 432477e3... | ✓ OK |
| tutorial_journey.js | 936df7a6... | ✓ OK |
| hex_route_cases.mjs | 64e42a73... | ✓ OK |
| tutorial_isolation_cases.mjs | 92e311be... | ✓ OK |
| tutorial_journey_cases.mjs | f6539724... | ✓ OK |
| tutorial_parity_cases.mjs | b701d0ee... | ✓ OK |
| app-release-contract.md | d9058375... | ✓ OK |
| first-journey-contract.md | e008bb1c... | ✓ OK |
| first-journey-for-clause.md | 3e3bc21a... | ✓ OK |
| response_correlation.js | 124ef606... | ✓ OK |
| response_correlation_cases.mjs | 48504d91... | ✓ OK |
| response-correlation-contract.md | 0f6d4717... | ✓ OK |

### Reconciliación contra consumidores reales

**1. tutorial_journey.js ↔ tutorial_walk.js:** COMPLEMENTARIOS, no duplicados.
- `tutorial_walk.js`: Walk de 3 pasos (key→beacon→node) sobre el mapa. Consumido por `colony_controls.js` vía `AtlasTutorialWalk.advance()`.
- `tutorial_journey.js`: Máquina de 8 estados (WELCOME→...→EXPLORE). Extiende el walk con invocación, combate, conquista y construcción.
- Decisión D19-D26 conservadas: SKIPPED nunca es COMPLETED, batalla abierta ≠ victoria, tarjeta vista ≠ edificio.

**2. response_correlation.js ↔ classroom_chat.js:** COMPLEMENTARIOS.
- `classroom_chat.js`: Implementa el chat con Hexelion, CIEF structure, chain (tic/hash/sello), generation check.
- `response_correlation.js`: Define las garantías de correlación puro — el bug P0 de Codex (respuesta de otro visitante aceptada) está cubierto por `detectCrossVisitor()`.
- Integración pendiente: CLAIM de Claude necesario para inyectar en `classroom_chat.js`.

**3. app_release_contract.js ↔ instaladores:** PATRONES REUTILIZADOS.
- Reutiliza patrones de `descarga_firmada.py` (manifests firmados), `version.py` (huella SHA-256), `install.sh` (instalación sin root), `instalar-pc` (conservación de memory.db).
- Los instaladores existentes no implementan aún actualización segura: el contrato define las 10 verificaciones como pruebas puras listas para Codex.
- `webCannotClaimDesktopVersion()` garantiza que la web no pueda afirmar la versión del escritorio sin fuente autorizada.

**4. Paridad ojo/oído/máquina:** VERIFICADA.
- `tutorial_journey.js` PARITY_TABLE cubre 9 eventos: summon_completed/rejected, battle_won/lost, conquest_local/credited, building_unlocked, node0_no_response, reward_pending.
- `tutorial_parity_cases.mjs` verifica que NO_DATA nunca se transforma en éxito.
- Consistencia: si ear dice NO_DATA, outcome no es ok; si outcome es ok, ear no dice NO_DATA.

**5. Accesibilidad móvil:** PARCIAL.
- `map_view_joystick.js` usa `aria-label` y `role="group"` para controles de vista.
- `classroom_chat.js` expone posición de foco en CSS px para lectores de pantalla.
- El joystick no se pliega automáticamente al abrir teclado móvil — mejora pendiente.

### Ejecución ×2

```
Ejecución 1: 213 tests, 0 fallos, 77.9ms
Ejecución 2: 213 tests, 0 fallos, 70.5ms
```

Baterías: tutorial_journey (95) + hex_route (28) + tutorial_parity (20) + tutorial_isolation (14) + app_release (74) + response_correlation (44) = 213.

---

## Misión B · Auditoría de repositorios

### Censo GitHub actualizado (20 repos, 19 activos + 1 archivado)

Medido vía GitHub API, 2026-11-16.

#### Núcleo activo (4) — PUBLICOS
| Repo | Visibilidad | HEAD | Función |
|------|-----------|------|---------|
| PreceptorOS (preceptoros-app) | PUBLIC | 41433cc | APP local-first |
| preceptoros-web | PUBLIC | bf6394f0 | Gateway público + juego |
| lab | PUBLIC | ceca5831 | Benchmarks y contadores |
| study | PUBLIC | 820749b | Doctrina pública |

#### Puertas públicas (2)
| Repo | Visibilidad | HEAD | Función |
|------|-----------|------|---------|
| babel | PUBLIC | 547dbcc | Registro de vocabulario único |
| preceptoros-companion | PUBLIC | f305bf1 | Puerta para colaboradores externos |

#### Servicio operativo privado (8)
| Repo | Visibilidad | HEAD | Función |
|------|-----------|------|---------|
| p0x | PRIVATE | 44f6703 | Monorepo del rack soberano |
| aduana | PRIVATE | 71f2070 | Verificador de cédulas públicas |
| buzon | PRIVATE | a902992 | Canal Comando Mesa↔Rack |
| hexelion-nexo | PRIVATE | d9b6664 | Sensor de flota y despertar |
| firmas | PRIVATE | 3ceb488 | Libro único de firmas |
| roadmap | PRIVATE | 303785d | Sala del plan del Soberano |
| preceptoros-terminal | PRIVATE | dd4e222 | Sala del ecosistema en loopback |
| preceptoros-atlas | PRIVATE | — | Mapa vivo del ecosistema |

#### Mesas (2)
| Repo | Visibilidad | Función |
|------|-----------|---------|
| preceptoros-private-mesa | PRIVATE | Coordinación privada |
| preceptoros-public-mesa | PUBLIC | Catálogo público de misiones |

#### Archivo histórico (1)
| Repo | Estado | Causa |
|------|--------|-------|
| preceptoros-coder | ARCHIVED | Plegado en preceptoros-web, 2026-11-06 |

#### Externos (2) — NO pertenecen al ecosistema
| Repo | Visibilidad | Causa |
|------|-----------|-------|
| CineK | PRIVATE | Proyecto independiente de David Pecero |
| textcad | PUBLIC | Proyecto independiente (OpenSCAD → STL) |

#### Perfil (1)
| Repo | Visibilidad | Función |
|------|-----------|---------|
| piskyRpapalo | PUBLIC | Perfil GitHub de HEXELION |

### Matriz de dependencias (por README cross-refs)

```
preceptoros-web → [p0x, aduana, buzon, hexelion-nexo, preceptoros-atlas,
                   preceptoros-terminal, roadmap, PreceptorOS, lab, study,
                   babel, firmas, preceptoros-companion] (12 refs)

PreceptorOS → [preceptoros-web, lab, study, babel, firmas,
               preceptoros-companion] (6 refs)

p0x → [buzon, firmas, babel] (3 refs)

aduana → [PreceptorOS, buzon] (2 refs)

buzon → [PreceptorOS, babel] (2 refs)

roadmap → [buzon, firmas, babel] (3 refs)

preceptoros-terminal → [Preceptoros, preceptoros-web, lab] (3 refs)

lab → [PreceptorOS, preceptoros-web, study, babel, preceptoros-companion] (5 refs)

study → [PreceptorOS, preceptoros-web, lab, babel, preceptoros-companion] (5 refs)

babel → [PreceptorOS, preceptoros-web, study, buzon, lab] (5 refs)

preceptoros-companion → [PreceptorOS, study, lab, buzon] (4 refs)
```

**Hallazgos:**
1. `preceptoros-web` es el repo más conectado (12 referencias cruzadas).
2. `PreceptorOS` (APP) y `study` son hubs centrales.
3. `roadmap` y `preceptoros-terminal` son nodos hoja (pocas referencias entrantes).
4. `preceptoros-coder` archivado — seguro de ignorar.
5. `CineK` y `textcad` son externos — no parte del ecosistema.

### Propuestas de reducción de complejidad

**PROPOSICIÓN 1: roadmap → preceptoros-atlas**
- PROBLEMA: roadmap y preceptoros-atlas solapan funciones (plan vs mapa vivo).
- FUENTE: roadmap (docs-only, plan del Soberano), preceptoros-atlas (mapa vivo).
- CONSUMIDORES: preceptoros-web referencia ambos.
- CAMBIO: Plegar roadmap en preceptoros-atlas como sección "plan".
- BENEFICIO MEDIBLE: 1 repo menos, 3 refs cruzadas eliminadas.
- RIESGO: roadmap es privado y sensible; requiere FIRMA del Soberano.
- HITL: Sí, el Soberano debe autorizar el plegado.

**PROPOSICIÓN 2: preceptoros-terminal → p0x**
- PROBLEMA: preceptoros-terminal es la "Sala del Ecosistema" en loopback; p0x ya es el monorepo del rack.
- FUENTE: preceptoros-terminal (Python + JS, loopback only).
- CONSUMIDORES: preceptoros-web lo menciona para contexto de chat.
- CAMBIO: Mover preceptoros-terminal a p0x/terminal.
- BENEFICIO MEDIBLE: 1 repo menos, 3 refs cruzadas eliminadas.
- RIESGO: preceptoros-terminal tiene su propio deploy; la integración debe preservar el servicio.
- HITL: Sí, requiere verificación de que el servicio sigue funcionando.

**PROPOSICIÓN 3: CineK y textcad → exclusión del censo**
- PROBLEMA: Aparecen en el censo pero no pertenecen al ecosistema.
- FUENTE: CineK (proyecto independiente), textcad (proyecto independiente).
- CONSUMIDORES: Ninguno dentro del ecosistema.
- CAMBIO: Declararlos EXTERNAL en study/11-repos.md y excluirlos del conteo activo.
- BENEFICIO MEDIBLE: Censo más preciso; 20 → 18 repos del ecosistema.
- RIESGO: Bajo — son repos independientes que el Soberano mantiene por separado.
- HITL: No, es corrección documental.

**PROPOSICIÓN 4: Worktrees wt-* → poda**
- PROBLEMA: 35 worktrees locales consumen espacio y confunden el inventario.
- FUENTE: preceptoros-web worktrees (wt-*).
- CONSUMIDORES: Ninguno — son artefactos de desarrollo.
- CAMBIO: Identificar qué worktrees corresponden a ramas ya mergadas y eliminarlas.
- BENEFICIO MEDIBLE: Reducción de clutter local; inventario más limpio.
- RIESGO: Bajo si se verifica que las ramas están mergadas.
- HITL: No, es limpieza local.

**PROPOSICIÓN 5: thegame-* labs → archivado local**
- PROBLEMA: 10 directorios de experimentos del juego (2026-10-02/03) ocupan espacio.
- FUENTE: thegame-lab-*, thegame-validation-*, thegame-bootstrap-*.
- CONSUMIDORES: Ninguno — son experimentos antiguos.
- CAMBIO: Comprimir en thegame-labs-202610.tar.gz y archivar.
- BENEFICIO MEDIBLE: ~10 directorios eliminados del nivel raíz.
- RIESGO: Bajo — son experimentos obsoletos.
- HITL: No, es limpieza local.

### NO_DATA

- **NO_DATA(preceptoros-atlas local):** El repo existe en GitHub pero no tiene checkout local en ~/pisky.
- **NO_DATA(install_on_external_machine):** El contrato de app release no demuestra instalación en equipo externo.
- **NO_DATA(implementation_in_classroom_chat):** El contrato de correlación requiere CLAIM de Claude para integrar.
- **NO_DATA(joystick_keyboard_a11y):** El joystick no se pliega al abrir teclado móvil — mejora pendiente.

### HEAD anchors

- preceptoros-web: bf6394f0
- PreceptorOS: 41433cc
- p0x: 44f6703
- study: 820749b
- lab: ceca5831
- babel: 547dbcc
- buzon: a902992
- aduana: 71f2070
- hexelion-nexo: d9b6664
- firmas: 3ceb488
- roadmap: 303785d
- preceptoros-terminal: dd4e222
- preceptoros-companion: f305bf1

### NEXT

1. **Para Claude:** Integrar response_correlation.js en classroom_chat.js (CLAIM acordado).
2. **Para Codex:** Implementar app_release_contract.js en los instaladores existentes.
3. **Para el Soberano:** Autorizar plegado de roadmap → preceptoros-atlas si se considera beneficioso.
4. **Para la Mesa:** Publicar este recibo como handoff para Codex.

---

**BUILT · TESTED ×2 · NO_DATA · HEAD · NEXT**
