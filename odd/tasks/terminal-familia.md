# Terminal familia · plano (MODO PLAN, propose-only)

Encargo 2026-11-02. Base `main` 5406d6bd (sello `do`, medido en `public/sw.js:1` y en producción).
Este fichero es el único cambio del PR: **cero código, cero `public/`, cero resello**. Se construye tras FIRMO.

## V1 · contradicción «Colony: 1 nodes» vs «estado.json has no colonia» — MEDIDA

No es caché ni captura vieja. Son **la misma voz (Map, `#state`) en dos instantes**, y el estado es el correcto:

1. **Service worker descartado.** `sw.js` deja pasar todo `.json` que no esté en `CONTENIDO_JSON`/`MAPA_JSON`;
   `/openworld/estado.json` no está en ninguna → el SW no lo toca. Además se pide con `cache: 'no-cache'`
   (`openworld_page.js:284`). Producción sirve hoy `colonia` con 4 nodos (medido con curl).
2. **«has no colonia»** = el `render()` síncrono de `openworld_page.js:277`, antes de que llegue el fetch
   (`colonia === null`). Texto falso: no es que el fichero no tenga colonia, es que aún no se ha leído.
3. **«1 nodes · 1 buildings»** = `AtlasOpenworldState.leer()` sobre el estado de main, medido en node:
   `{nodes:["cabin"], buildings:1, hidden:3, seals:{beelink,doggee-a,doggee-b: NO_DATA, cabin: LIVE}}`.
   El filtro (solo LIVE/STALE se dibuja) es ley IC7-S3 (D7) y es honesto; lo que falla es la frase.

Propuesta (entra en TF-1 como T9-bis, solo texto): t0 → «Loading the map…»; tras leer → «Your cabin is
awake · 3 more places still asleep» visible, y `hidden`/sellos en detalles. Sin tocar el filtro.

## TF-1 · texto visible (un PR, solo redacción + `<details>`)

Regla común: lo visible es una frase humana en inglés (el juego habla solo inglés: va a `atlas-en.json`
cuando la clave ya existe allí); `NO_DATA` **con su causa** sigue existiendo, pero plegado en
«Technical details». Los `data-*` del DOM (`data-sello`, `data-ciclo`) no cambian: los leen pruebas.

| # | Dónde (medido) | Hoy | Propuesta visible | Plegado |
|---|---|---|---|---|
| T1 | `radio_message_log.js:25-33` `burbuja()` | `<b>quien</b><span>sello</span><span>fuente · Δ</span>` sin separador → «PreceptorNO_DATAchat» | «Preceptor · not measured yet · chat»; mapa sello→humano: LIVE «live», STALE «a while ago», NO_DATA «not measured yet» | sello crudo en `title` + detalles |
| T1b | mismo, `pinta()` línea `R.ultimo` | `quien · NO_DATA · texto` | mismo mapa humano | — |
| T2 | `colonia_pagina.js:230` `texto()` | «sky #17131f» | quitar el hex de la frase; cielo en palabras solo si hay tabla medida (no inventar nombres de color) | hex en detalles |
| T3 | `map_painter.js:40` campo `r` del frame | «49 water, 77 sand… cells» | **duda D1**: `r` es parte del frame `preceptoros.floor/1` (≤1 024 B, contrato). Propongo NO tocar `r`; cambiar solo dónde se pinta | cifras al `<details id="more">` existente |
| T4 | `map_chunks.js:43,46` `out.say` | «Map chunks: 7 of 7… NO_DATA key (cause)» | «Map loaded» / «Part of the map is still missing» | claves y causas |
| T5 | `map_chat.js:10` disclosure | bytes, SHA-256, licencias | «The guide runs on your device; nothing leaves it.» | `<details><summary>How the guide works</summary>` con el texto íntegro actual (licencias se conservan: obligación MIT/Apache) |
| T6 | `openworld/index.html:166,173` | «The chat is not live yet: NO_DATA…», «NO_DATA: no local answer model…» | «The guide is still asleep; you can wake it below.» | causa en detalles |
| T7 | `radio_message_log.js:29` `chat_edad` | «Δ NO_DATA (game cycle unavailable or reset) cycles» | «N turns ago» / «turn not measured» | Δ y causa en `title` |
| T8 | `summon_reveal.js:106` | «NO_DATA (game cycle unavailable; showing the measured final frame) · …» | «rareza · cuenta» limpio | causa en `title`/detalles |

Riesgo: mínimo, pero **no nulo** — `test_web.py`/`arnes_*` pueden fijar cadenas literales. Antes de
cambiar cada una: `grep -rn "<cadena>" test_web.py atlas/ arnes_sw.mjs`; si una prueba fija el texto,
se actualiza en el mismo commit y se enseña en rojo primero (regla 2 de CLAUDE.md).

## TF-2 · panel compacto (PR aparte, FIRMO aparte)

`openworld/index.html:138-161`: 10 `<li class="voice">` + log + formulario. Propuesta: barra de 4 botones
(`role="tablist"`, ≥44 px) encima de `#voices`; cada `<li>` lleva `data-cat`; se muestra una categoría:

- **Start**: Welcome + Guide (por defecto) · **Explore**: Map + Floor + Walkers + Zoom
- **Play**: House + Army · **About**: Radio + cerebro (`#map-brain`) + More

Log y formulario quedan fijos debajo (superficie del chatbot único). Sin JS nuevo pesado: un módulo
<2 KiB que solo alterna `hidden`. `aria-live` de las voces ocultas sigue vivo → **duda D3**.

## Dudas con causa

- **D1** `r` del floor frame es contrato (`map_painter.js:42` lanza si ≥1 024 B); cambiar su texto
  puede tocar fixtures/hash. Propuesta: no tocarlo, solo su presentación.
- **D2** «Tutorial» y el log no están en ninguna de las 4 categorías del encargo; propongo Tutorial→Start.
- **D3** Con una voz oculta, ¿sus avisos `aria-live` deben seguir sonando? Propongo: solo la categoría activa.
- **D4** Todo cambio en `public/` sube el peso de la puerta (`gzip_juego_b` < 153 600 B): se mide tras TF-1.

## Pasos tras FIRMO
1. TF-1 en rama propia → gates (CLAUDE.md §3) → sello (letra tras `do`) → PR → FIRMO → deploy (DEPLOY.md).
2. TF-2 igual, PR separado.
