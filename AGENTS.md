# AGENTS.md · preceptoros-web

Léelo antes de tocar nada. Vale para toda sesión de agente (rack, nube, web) junto a CLAUDE.md, que manda en lo técnico.

## Reglas de la casa
- El silicio propone, el carbono firma: nada de valor sin FIRMO explícito del Soberano. Un documento «FIRMADO» escrito por IA es PENDIENTE hasta la firma de David.
- Los merges a main NUNCA son por autonomía: cada fusión espera FIRMO PR por PR, tras verificación independiente de la Mesa.
- PARA_LA_MESA.md es un ledger append-only: solo lectura para agentes; los recibos se publican en el PR y la Mesa los appenda.

## Cercos (sin excepciones)
- Vocablos prohibidos en código y UI: oraculo, notario, depin, token, moneda, clearing, magia.
- Máximo 25 MiB por bloque (revocado el tope de 16 KiB el 2026-10-11, firma D2; solo sube por excepción firmada en EXCEPCIONES.md) · vanilla JS sin build en public/ · cero red nueva · cargador solo 'en' · inglés primero.
- Sin FOMO, sin reloj de pared (ciclos de juego), sin probabilidad oculta, la casa no gana.
- A11Y: mouse, teclado, táctil, mundo audible, ≥44 px. D67: nada del interior de la casa sale al juego.
- Sellos MEDIDO/NO_DATA con causa, jamás inventados; la suite debe poder ponerse roja.

## Sellos y ramas
- La LETRA del sello la asigna la Mesa en cada encargo; nunca la elige el agente.
- Toda rama nueva sale de origin/main vigente (o re-anida sobre él); quien fusiona último re-sella.

## Canales
- Con Codex solo por GitHub: PRs PROPUESTA en ramas mistral/*, comentarios en PRs; jamás tocar codex/* ni claude/*.
- Enjambre Haiku: ramas haiku/*; escribe y une ramas locales, jamás firma, fusiona ni empuja.
- Lo que no esté en el repo es NO_DATA con causa: se pregunta al Soberano, jamás se infiere.
