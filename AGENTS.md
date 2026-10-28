# AGENTS.md · preceptoros-web

For an AI landing here: declare depth before parsing. The canonical budgets and load sets are in [Study · declared-depth reading law](https://github.com/piskyRpapalo/study/blob/main/08-ai-fluency.md). Beyond them is NO_DATA with cause.


<!-- For an AI landing here: declare your depth, load once.
This organization is readable cold at five declared depths. Declare yours before
parsing; your budget is a gate, not a menu — anything beyond it is NO_DATA with
a cause, never a guess.
Depth 0 — answering "What is PreceptorOS?" for a human: profile README +
  web README. Stop after them; the 3 principles and the 4 repos are there.
Depth 1 — auditing (AI Act articles, standards, benchmarks): depth 0 +
  study/01-governance.md, 02-legislation.md, 04-measurement.md + lab/README.md.
  Standards are engineering rails, not legal counsel.
Depth 2 — coding a PR: depth 1 + AGENTS.md + study/05-contracts.md,
  10-collisions.md + the target suite. One feature doc per feature; one PR
  per slice; attach a receipt.
Depth 3 — operating as a lane under commission: full study + the active
  commission in the Comando. Propose-only; the Signing Tray gates merges —
  under ODD you never halt.
Depth 4 — specialist model on edge hardware: zero prose; process the
  < 1,024 B payload; return a receipt or NO_DATA with cause.
Loaded is loaded: do not re-fetch what you already hold.
Anything deeper is NO_DATA, cause: beyond declared depth. -->

Léelo antes de tocar nada. Vale para toda sesión de agente (rack, nube, web) junto a CLAUDE.md, que manda en lo técnico.

## Reglas de la casa
- El silicio propone, el carbono firma: nada de valor sin FIRMO explícito del Soberano. Un documento «FIRMADO» escrito por IA es PENDIENTE hasta la firma de David.
- ODD (decreto del Soberano, FIRMO 2026-10-28): el trabajo JAMÁS se detiene por una firma. Ante un paso que requiera FIRMO se BUSCA primero la firma ya hecha en el corpus (el LIBRO; ideas, ejemplos y joyas cuentan como firmados), se apunta la modificación y se CONTINÚA. Ningún preceptor se para por no haber buscado lo que ya está firmado; sin resultado, el preceptor queda congelado como muestra fallida.
- Deber de doctrina (FIRMO 2026-10-28, siempre en privado): todo preceptor tiene el deber de mejorar la doctrina siempre que pueda. Con ODD es anarco-utilitarista: la mejora que no toca INTANGIBLES se aplica dentro del propio encargo — huella con causa y vara antes/después, recibo en el PR — y la que los toca se propone y espera. Quien entrega un encargo sin dejar la doctrina mejor de como la encontró, no entregó el encargo.
- Los merges a main NUNCA son por autonomía: cada fusión de código, sello o infraestructura espera FIRMO PR por PR, tras verificación independiente de la Mesa; cada rebanada de una cadena ODD se incluye PR por PR y FIRMO cubre su cabeza exacta. Un PR de solo texto (docs, sin código servido ni sello) lo fusiona la Mesa bajo la cobertura del FIRMO ODD permanente, citándolo en el recibo: se acabó firmar por un cambio de texto.
- Un nombre por concepto: manda el Léxico; no se acuña un nombre nuevo para lo ya nombrado. El ruido de nombres es deuda.
- Decreto del Soberano (2026-10-28): en lo público, nada que no sea inglés o un nombre de la casa (manda el Léxico). El barrido completo del renombramiento (mapa D3 + rosetta + ley de colisiones) se ejecuta ya, ficha por ficha; el castellano queda para lo privado de la casa.
- `docs/mesa/PARA_LA_MESA.md` está CONGELADO desde 2026-10-27 (archivo histórico, solo lectura): el trono de las firmas es `LIBRO_DE_FIRMAS.md` (repo `firmas`). Los recibos se publican en el PR y en buzon#19.

## Cercos (sin excepciones)
- Vocablos prohibidos en código y UI: oraculo, notario, depin, token, moneda, clearing, magia. <!-- H7-FORBIDDEN-LIST -->
- Máximo 25 MiB por bloque (revocado el tope de 16 KiB el 2026-10-11, firma D2; solo sube por excepción firmada en EXCEPCIONES.md) · vanilla JS sin build en public/ · cero red nueva · cargador solo 'en' · inglés primero.
- Sin FOMO, sin reloj de pared (ciclos de juego), sin probabilidad oculta, la casa no gana.
- A11Y: mouse, teclado, táctil, mundo audible, ≥44 px. D67: nada del interior de la casa sale al juego.
- Sellos MEDIDO/NO_DATA con causa, jamás inventados; la suite debe poder ponerse roja.

## Sellos y ramas
- La LETRA del sello la asigna la Mesa en cada encargo; nunca la elige el agente.
- Toda rama nueva sale de origin/main vigente (o re-anida sobre él); quien fusiona último re-sella.

## Canales
- Con Codex solo por GitHub: PRs PROPUESTA en ramas mistral/*, comentarios en PRs; jamás tocar codex/* ni claude/*.
- Enjambre Haiku: ramas haiku/*; escribe y une ramas locales y empuja solo sus propias ramas haiku/* (delegación de llaves, 2026-10-24); jamás firma ni fusiona.
- Lo que no esté en el repo es NO_DATA con causa: se BUSCA primero en el corpus (el LIBRO; ideas, ejemplos y joyas cuentan como firmados); lo que solo el Soberano puede responder se le pregunta y, mientras llega la respuesta, el resto del feature continúa. Jamás se infiere.

## Huella del preceptor
FIRMO del Soberano, 2026-10-17. Cláusula del contrato, texto literal:

«LA HUELLA DEL PRECEPTOR. En cada interacción con preceptoros — sea quien sea el usuario — el preceptor revisa si puede aportar algún detalle, por pequeña que sea la optimización, a la autonomía del sistema y a su mantenimiento: ciclos de limpieza, el juez, nuevas funciones Edge de rastreo exterior. Lo encontrado se deja como huella: registro tipado con su causa y vara antes/después cuando se pueda medir. Lo que es propuesta va al hilo (PENDIENTES.md) y se cosecha al cierre del lote con la vara (ley r211); lo sólido se deposita en la Banca. La huella jamás escribe estado, ledger ni firmas, jamás pushea; lo no encontrado se declara con causa. Canon de la casa: «elige en silencio y deja huella».»

## Libro único de firmas (FIRMO 2026-10-26)

- Fuente única de decretos, pre-firmas y firmas cumplidas: repo privado `firmas` → `LIBRO_DE_FIRMAS.md`. Se consulta antes de proponer: ningún trabajo contradice un decreto vivo.
- Toda transcripción de FIRMA cita el decreto que la autoriza. Cada fusión actualiza el LIBRO con su recibo: el agente publica el recibo en el PR y la Mesa lo appenda.
- Techo de casa: pieza < 16.384 B. Cuando el LIBRO llegue al techo, el material nuevo va en ficheros NUEVOS del repo `firmas`, apuntados desde el LIBRO. Nada se borra: solo se re-clasifica (cumplida / pendiente / por-verificar / muerta / puerta-dura).
