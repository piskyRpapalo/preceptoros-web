# Canon matemático del lenguaje de burbujas · registro

Estado: REGISTRADO por dictamen del Desk (2026-10-28), con las decisiones del Soberano del mismo día. Es canon firmado:
las ideas, ejemplos y joyas cuentan como firmados según la ley ODD (web/AGENTS.md). Cada entrada dice de dónde sale.
Lo no medido o no encontrado va como NO_DATA con causa.

## 1 · Procedencia (fuentes con hash)

| Pieza | Fuente | sha256 (primeros 16) | Verificación |
|---|---|---|---|
| Hash espacial | `render_seed.js` (cosecha joyas) | b909dc1e41f0ca5c | `atlas/bb_canon_casos.mjs`: 280 vectores generados ejecutando el original |
| Fórmula de cosecha | `render_combat.js:64-65` | 409af47e76f0716f | 135 vectores (seed y resultado), fórmula copiada literal |
| Tabla visual (7 estados) | `fourier-shapes.js` (mockup_mvp) | 73a282e7d747d969 | objeto evaluado en una VM; hue igual que `tabla_semantica.js` |
| Registro de cosecha | `joyas.jsonl` (32 filas) · `TABLA_JOYAS.md` | 9e998dff170ae919 · 4342a9fd6b341126 | 32/32 verificados (Desk, 2026-10-26) |

Dónde viven las fuentes: `~/Cuarentena/TheGame.v1.1/` (fuera de git). Por eso ni el repo ni los textos de ideas
contenían estas constantes: pertenecían al juego viejo y se retiraron con la corte D. El registro las recupera.
El generador de vectores es `atlas/fixtures/genera_vectores_canon.mjs`; sus salidas están en `atlas/fixtures/bb_canon_vectores.json`.

## 2 · Hash espacial (canon)

    x = a ^ (b·73856093) ^ (c·19349663)  (en uint32)
    x ^= x<<13;  x ^= x>>>17;  x ^= x<<5;   resultado = x >>> 0

Implementación: `public/game/bb_canon.js` (la expresión del original, sin cambios). Decisión marcada: la combinación XOR de los
tres términos es la del original; el lote 1 usaba una variante de dos argumentos sin finalizador, que **no era canon** y queda sustituida.

## 3 · Cosecha (canon)

    seed = hash(vertices, spectrum, valve + selected)
    resultado = PENETRATES si (seed % 100) < 40 + 3·vertices + 10·valve ; si no, FILTERED

Implementación: `cosecha()` en `public/game/bb_canon.js`. Se verifica contra 135 vectores del original.

## 4 · Tabla semántica extendida (aditiva)

`public/game/tabla_semantica.js` conserva intactos los siete estados, sus hues y `DERIVADOS`. Se añade `VISUAL`, con los
campos de cada estado: saturation, lightness, waveAmplitude, waveFrequency, feedbackAlpha, feedbackScale, feedbackRotation,
pulseActive, pulseFrequency (y fourierTerms en STALE). Acceso: `visual(sello)`; un sello desconocido devuelve `null`.

Nombre: el físico es `PROPUESTA`; el mockup lo llama `PROPUESTA_PENDIENTE_FIRMA` (mismo hue, 45).

**Discrepancia abierta:** `DERIVADOS` (flujo, pulso_hz, escala) y `VISUAL` (pulseFrequency, feedbackAlpha…) describen el mismo
concepto con valores distintos (por ejemplo, pulso de LIVE: 5.16 Hz frente a 0.005 de waveFrequency). Se conservan los dos.
Decisión pendiente del Soberano: cuál manda.

**Radio fase 1 (`bb_radio.js`):** el pulso usa `DERIVADOS.pulso_hz` (la fuente física, en Hz). Con eso la prueba de
sincronía (un tick de desfase = rojo) es medible: con `VISUAL.pulseFrequency` (0.02–0.05 Hz) un tick cambia el pulso
un 0.26 %, bajo cualquier umbral honesto. Consecuencia: LIVE pulsa (5.16 Hz) en la radio, mientras que
`VISUAL.LIVE.pulseActive` dice `false`. La radio no lee `pulseActive`. Decisión pendiente: cuál de los dos campos manda.

## 5 · Escenas F2 (lista canónica, con cita)

Fuente de la lista: `p0x/propuestas/2026-10-17_plan-all-in-preceptor.md` (líneas 321–326) y
`p0x/propuestas/2026-10-17_pegamento-vectorial.md` (capa A). Estado: PROPUESTA, sin escena renderizada todavía.

| Escena | Qué es | Joya | Ecuación citada |
|---|---|---|---|
| F2.1 Espectro → criatura | la criatura nace de sus armónicos | J-SN-01/02/03 | x(t)=Σ aₖ·cos(kωt+φₖ) truncada a N (ver discrepancia) |
| F2.2 Osciloscopio | Lissajous por armónico | J3, J1 osc_nyquist, J-TG-01 | [k, ax, ay, fase] |
| F2.3 Gusanos de transición | el recorrido sale del estado τ | J10, J-WEB-02 | τ viaja en el estado; ciclo, no reloj |
| F2.4 Batímetro y hueco honesto | la columna que nunca toca fondo | J11, joya 20 | sin valor = hueco, no cero |
| F2.5 Hierba, viento y agua sobre la niebla | senos con fase por posición | J-SN-12, decreto §2 | senos con fase según posición |
| F2.6 Eco de procedencia | espejo emulado; NO_DATA corta el borde | J12, J-TG-02 | NO_DATA corta el borde |

**Discrepancia F2.1:** la escena usa `cos` en el tiempo; la forma de contorno del canon (bb_forma.js) usa `sin` en el ángulo.
Son dos usos distintos de la misma serie. Se registran los dos; decisión pendiente si F2.1 debe usar la forma de contorno.

## 6 · Ley de presupuesto (con su citación)

- **Por bloque: 25 MiB.** Firma D2 (2026-10-11), que revoca el tope de 16 KiB por bloque (web/AGENTS.md).
  Decreto del Desk (2026-10-28): reemplaza a todo tope anterior. El tope de 16.384 B por pieza de los encargos
  del 2026-10-28 queda revocado.
- **1.024 B:** se mantiene para frames, paquetes y `llms.txt`.
- **Gate `phase_gate.mjs` (techo de 16 KiB sobre public/):** es ley revocada. NO se cambia en esta pieza. Una pieza posterior
  lo actualiza a la ley firmada, con la cita D2 + decreto de hoy, como cambio declarado.

## 7 · Otras leyes que este canon usa

- **Azar determinista:** prohibido `Math.random` (canon 2026-10-03, citado en el encargo del Desk). Las piezas usan xorshift32.
- **Sin reloj de pared:** el avance es por ciclos o tics, no por `Date.now` (ideas 11 oct, «tics lógicos»).
- **Un solo origen del color:** la tabla física; un sello fuera de ella no tiene color (NO_DATA).
- **Sin build:** `public/` es JavaScript vanilla.
- **Vocabulario vetado:** token, oráculo, notario, depin, moneda, clearing, magia (web/AGENTS.md; decreto 2026-10-28: también en docs internos).

## 8 · Lo que sigue NO_DATA

- **Fórmula de gacha honesta completa:** la cosecha está registrada; el resto de la gacha (rachas, temporadas, personas) no
  tiene canon aún.
- **Escenas F2.1–F2.6 renderizadas:** ninguna. Sin captura, sin hash de lista de dibujo.
- **Coste de frame:** no medido; sin escena no hay bucle de frame.

## 9 · Verificación

`node atlas/bb_canon_casos.mjs` (12 casos) y `node atlas/bb_lote1_casos.mjs` (15 casos). Recibos: `atlas/bb_lote1_receipt.json`.
