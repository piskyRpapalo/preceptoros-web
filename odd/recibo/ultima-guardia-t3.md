# Recibo — Última Guardia del Soberano

**Fecha:** 2026-11-16 00:17  
**Guardia:** ROUND T3 · DOS CANGREJOS · NODE 0 · PRIMER COLABORADOR  
**Constructor:** Junie

---

## BUILT

Tres piezas entregadas:

| Pieza | Archivo | Líneas | Tests |
|-------|---------|--------|-------|
| First Journey Contract | `atlas/puros/tutorial_journey.js` | 610 | 95 (4 baterías) |
| App Release Contract | `atlas/puros/app_release_contract.js` | 461 | 74 |
| **Response Correlation Contract** | `atlas/puros/response_correlation.js` | 339 | **44** |

**Total: 213 tests puros, sin DOM, sin reloj, sin Math.random, sin fetch.**

## TESTED ×2

```
RUN 1: 213 tests, 0 fallos, 74.9ms
RUN 2: 213 tests, 0 fallos, 74.2ms
```

Baterías ejecutadas:
- `atlas/tutorial_journey_cases.mjs` — 33 tests
- `atlas/hex_route_cases.mjs` — 28 tests
- `atlas/tutorial_parity_cases.mjs` — 20 tests
- `atlas/tutorial_isolation_cases.mjs` — 14 tests
- `atlas/app_release_cases.mjs` — 74 tests
- `atlas/response_correlation_cases.mjs` — 44 tests

## SABOTAGE

Sabotajes incluidos y verificados:

1. **Batalla sin pelear** (D23): Abrir pantalla de combate ≠ victoria → rechazado.
2. **Edificio sin construir** (D24): Ver tarjeta ≠ edificio construido → rechazado.
3. **Skip sin recompensas** (D25): Saltar a EXPLORE no fabrica recompensas.
4. **NO_DATA nunca es éxito** (D26): NO_DATA se mantiene como NO_DATA.
5. **Digest alterado** (app release): SHA-256 incorrecto → rechazado.
6. **Downgrade** (app release): Versión menor → rechazado.
7. **Inyección memory.db** (app release): Archivo de memoria en manifest → rechazado.
8. **Swap de producto** (app release): product_id diferente → rechazado.
9. **Firma vacía** (app release): Signature vacía → rechazado.
10. **Identidad falsa** (app release): product_id inventado → rechazado.
11. **Respuesta cruzada P0** (correlation): Respuesta de visitor B aceptada por visitor A → **rechazado**.
12. **Tic correcto, visitante incorrecto** (correlation): Mismo tic, otro visitor → **rechazado**.
13. **Visitante correcto, tic incorrecto** (correlation): Mismo visitor, otro tic → **rechazado**.
14. **Respuesta sin visitante** (correlation): Sin identificador → NO_DATA, no éxito.
15. **Generación antigua** (correlation): Después de endVisit → rechazado.
16. **Correlación ≠ autenticidad** (correlation): El contrato no afirma autenticidad del servidor.

## NO_DATA

- **NO_DATA(install_on_external_machine):** El contrato de app release no demuestra una actualización instalada en un equipo externo. Los tests son puros; la instalación real requiere un equipo con PreceptorOS instalado.
- **NO_DATA(implementation_in_classroom_chat):** El contrato de correlación no está integrado en `classroom_chat.js` ni `map_chat.js`. Claude debe aplicar el CLAIM antes de modificar esos archivos.
- **NO_DATA(optimistic_movement_fix):** La corrección del movimiento optimista (desplazamiento local no presentado como firmado) queda como NEXT para Codex.

## HEAD

Archivos protegidos en `odd/recibo/jewels/` con huellas SHA-256:

```
432477e3...  app_release_contract.js
936df7a6...  tutorial_journey.js
64e42a73...  hex_route_cases.mjs
92e311be...  tutorial_isolation_cases.mjs
f6539724...  tutorial_journey_cases.mjs
b701d0ee...  tutorial_parity_cases.mjs
d9058375...  app-release-contract.md
e008bb1ca4...  first-journey-contract.md
3e3bc21a...  first-journey-for-clause.md
124ef606...  response_correlation.js
48504d91...  response_correlation_cases.mjs
0f6d4717...  response-correlation-contract.md
```

## NEXT

### Para Codex CLI (prioridad P0)
1. Integrar `response_correlation.js` en `classroom_chat.js` y `map_chat.js`.
2. En `map_chat.js` línea 96, llamar `acceptResponse()` antes de mostrar la respuesta.
3. Corregir el movimiento optimista: un desplazamiento local no se presenta como firmado hasta que la autoridad lo acepte.

### Para Claude
1. Consumir `tutorial_journey.js` para la máquina de estados del tutorial.
2. El marcador `!` (`currentSignal()`) se integra en la interfaz sin modificar `tutorial_walk.js`.
3. Verificar CLAIM antes de tocar `classroom_chat.js` o `map_chat.js`.

### Para el Soberano
- Los archivos están sin seguimiento git en el checkout compartido.
- No se modificaron archivos bajo CLAIM de Claude ni Codex.
- Las 213 tests están listas para ejecutarse con `node --test atlas/*_cases.mjs atlas/response_correlation_cases.mjs`.

---

**SILICON PROPOSES · CARBON SIGNS · EVIDENCE DECIDES**
