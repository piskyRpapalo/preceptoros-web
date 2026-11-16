# First Journey Contract — Handoff para Claude

**Fecha:** 2026-11-16  
**Autor:** Junie (constructor de contratos)  
**Destinatario:** Claude (WEB #857 — Node 0 + corrección envío inmediato chat)  
**Estado:** Contrato puro listo para consumir, sin conflictos con tutorial_walk.js

---

## 1. Resumen

El contrato `atlas/puros/tutorial_journey.js` (610 líneas) define una máquina de estados pura para la primera aventura guiada:

```
WELCOME → TRAVEL → NODE_0 → SUMMON → BATTLE → CONQUEST → BUILD → EXPLORE
```

Cada transición declara: prerrequisito, evento observado, acción ofrecida, resultado, causa de rechazo y siguiente acción.

## 2. Relación con `tutorial_walk.js`

**No hay duplicación.** Los dos módulos cubren capas distintas:

| Módulo | Capa | Responsabilidad |
|--------|------|-----------------|
| `tutorial_walk.js` | Mapa | 3 pasos de caminata (key, beacon, node) sobre nodos LIVE/STALE |
| `tutorial_journey.js` | Estado | 8 estados de la aventura completa (invocación, combate, conquista, construcción) |

`tutorial_walk.js` se encarga de **dónde camina el jugador** en el mapa.  
`tutorial_journey.js` se encarga de **qué fase de la aventura** está el jugador.

Para integrarlos: el evento `player_arrived` que avanza `TRAVEL → NODE_0` puede dispararse cuando `tutorial_walk.js` completa el paso `key` en el primer nodo.

## 3. El marcador `!` (señal de acción prioritaria)

Cada estado expone exactamente un control prioritario mediante `currentSignal(journey)`:

```js
{
  actionId: 'open_map',        // Identificador legible por máquina
  label: 'Abrir el mapa',      // Nombre accesible
  voice: 'Toca el botón para abrir el mapa',  // Instrucción para voz
  enabled: true,               // Si está deshabilitado, el tutorial explica por qué
  whyDisabled: null            // Causa si !enabled
}
```

Si el jugador se pierde, `whatDoNow(journey)` devuelve la instrucción actual en texto plano.

## 4. Decisiones clave

- **D19:** `SKIPPED` nunca se convierte en `COMPLETED`. Un paso omitido se registra como omitido.
- **D23:** Abrir la pantalla de combate no es victoria. Se requiere `battle_won`.
- **D24:** Ver la tarjeta de un edificio no lo construye. Se requiere `building_constructed`.
- **D25:** Saltar a `EXPLORE` no fabrica recompensas no obtenidas.
- **D26:** `NO_DATA` nunca se transforma en éxito para mejorar la experiencia.

## 5. Paridad ojo/oído/máquina

Cada evento produce un significado único para:
- **Ojo:** marcador visual, tarjeta, animación
- **Oído:** instrucción o confirmación
- **Máquina:** estado y recibo con esquema `preceptoros.journey/1`

9 eventos cubiertos: invocación completada/rechazada, combate ganado/perdido, conquista local/acreditada, edificio desbloqueado, Node 0 sin respuesta, recompensa pendiente.

## 6. Aislamiento entre visitantes

`createVisitorJourney(visitorId)` crea un viaje independiente. Dos visitantes en el mismo nodo reciben instrucciones correspondientes a cada uno. Si uno abandona, el otro continúa.

## 7. Archivos entregados

| Archivo | Líneas | Tests | Descripción |
|---------|--------|-------|-------------|
| `atlas/puros/tutorial_journey.js` | 610 | — | Contrato puro |
| `atlas/tutorial_journey_cases.mjs` | 356 | 33 | Transiciones, rechazos, skip |
| `atlas/hex_route_cases.mjs` | 286 | 28 | Rutas hexagonales, BFS, celdas prohibidas |
| `atlas/tutorial_parity_cases.mjs` | 183 | 20 | Paridad ojo/oído/máquina |
| `atlas/tutorial_isolation_cases.mjs` | 232 | 14 | Aislamiento entre visitantes |
| `odd/tasks/first-journey-contract.md` | 88 | — | Especificación con decisiones D19-D26 |

**Total: 95 tests, 0 fallos, 2 ejecuciones verificadas.**

## 8. Integración sugerida

Para consumir el contrato desde la interfaz:

1. Importa `tutorial_journey.js` como módulo puro.
2. Crea un viaje con `createVisitorJourney(visitorId)`.
3. En cada evento del juego, llama `transition(journey, eventName, context)`.
4. Lee `currentSignal(journey)` para el marcador `!`.
5. Muestra `whatDoNow(journey)` cuando el jugador pregunte "¿Qué hago ahora?".
6. Usa `progress(journey)` para el seguimiento de avance.

No se requieren cambios en `tutorial_walk.js`. Los dos módulos coexisten sin conflicto.
