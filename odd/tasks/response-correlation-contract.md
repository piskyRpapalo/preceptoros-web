# Response Correlation Contract

**Fecha:** 2026-11-16  
**Autor:** Junie (constructor de contratos)  
**Hallazgo:** Codex CLI — respuesta de Node 0 de otro visitante aceptada por el cliente  
**Estado:** Contrato puro + 44 tests, listo para integración

---

## 1. Problema P0

Codex encontró que una respuesta simulada de Node 0 perteneciente a otro visitante y otro turno fue aceptada por el cliente.

**Raíz:** `classroom_chat.js` envía el seed del visitante en el CIEF, pero al recibir la respuesta solo verifica la cadena de hashes (tic/hash/sello), sin comprobar que la respuesta pertenezca al mismo visitante que hizo la pregunta.

## 2. Contrato

`atlas/puros/response_correlation.js` (339 líneas) define las garantías mínimas de correlación:

| Garantía | Función | Descripción |
|----------|---------|-------------|
| Contexto por visitante | `createCorrelationContext(seed)` | Cada visitante tiene su propio contexto de correlación |
| Petición con identidad | `buildRequest(ctx, text, page)` | Cada petición lleva visitorSeed, tic, hash_esperado, request_id |
| Correlación respuesta | `acceptResponse(ctx, req, resp)` | Verifica visitor, tic, sello, estructura |
| Detección cruzada | `detectCrossVisitor(req, resp)` | Rechaza explícitamente respuestas de otro visitante |
| Detección de turno | `detectTurnMismatch(req, resp)` | Rechaza respuestas con tic incorrecto |
| Integridad cadena | `verifyChain(ctx, resp)` | Verifica que tic avanza secuencialmente |
| Fin de visita | `endVisit(ctx)` | Incrementa generación, resetea cadena |
| Chequeo generación | `checkGeneration(ctx, gen)` | Rechaza peticiones de generación antigua |
| Estado NO_DATA | `noDataState(cause)` | Devuelve NO_DATA cuando no se puede correlacionar |
| Chequeo completo | `fullCorrelationCheck(ctx, req, resp)` | Verifica todas las garantías en orden |

## 3. Decisiones

- **R1:** Correlación ≠ autenticidad del servidor. El contrato verifica que la respuesta pertenece a esta petición, no que el servidor es quien dice ser.
- **R2:** Una respuesta sin identificador de visitante se rechaza como NO_DATA, no se acepta.
- **R3:** El contexto no se contamina al rechazar una respuesta cruzada.
- **R4:** `endVisit()` incrementa la generación; cualquier respuesta pendiente de la generación anterior se rechaza.

## 4. Integración con `classroom_chat.js`

Para integrar el contrato en el código de Claude:

1. En `map_chat.js` línea 87, al enviar, construir la petición con `buildRequest()`.
2. En `map_chat.js` línea 96, al recibir, llamar `acceptResponse()` antes de mostrar la respuesta.
3. Si `acceptResponse()` devuelve `cross_visitor_rejected`, mostrar "NO_DATA · Response does not belong to this visit."
4. Si devuelve `turn_mismatch`, mostrar "NO_DATA · Turn sequence broken."
5. La generación (`visitGeneration` en `map_chat.js`) ya existe — usar `checkGeneration()` para reforzarla.

## 5. Archivos

| Archivo | Líneas | Tests | Descripción |
|---------|--------|-------|-------------|
| `atlas/puros/response_correlation.js` | 339 | — | Contrato puro |
| `atlas/response_correlation_cases.mjs` | 503 | 44 | Pruebas con sabotajes |

**Total: 44 tests, 0 fallos, 2 ejecuciones verificadas.**
