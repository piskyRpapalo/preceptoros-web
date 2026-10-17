# UI and language canon

Source baseline: `codex/d1-asunto-11` at `20ad881494e42b6ce56f43b116ef3682da3cc080`. This document preserves the operational rules represented by comments removed for D1 assunto 12. Module exports, runtime strings, and behavior remain unchanged.

## Shared arena surface

`public/game/ui-arena-comun.js:1-8` defines the shared arena labels and rendering entry point. Language-specific arena labels are loaded from language data; shared labels remain in the game surface. `public/game/ui-arena.js:1-27,60-108` separates map selection from battle, presents one primary action, and omits absent upgrade data rather than serializing an undefined value. Its replay path at `:132-170` reuses the established battle replay when available and keeps the existing scene fallback. The game roster and local record are read from their established sources at `:253-265`.

## Duel and unit card

`public/game/ui-duelo.js:1-11,35-49,126` keeps duel actions attached to the person's active identity, makes sharing an explicit user action, and measures abandonment in game cycles.

`public/game/ui-ficha.js:1-10,35-90` renders a unit from its language data, deterministic harmonic form, signed attributes when present, and local voice data. Missing attributes stay distinguishable from current-version attributes. Voice playback uses the local voice source when available and an oscillator fallback otherwise. The card reports the local chain's history and keeps the textual list equivalent to the visual traits.

## Invocation and army

`public/game/ui-invoca.js:1-5,24-46` keeps invocation as a separate module and restores the locally stored, signed invocation chain only after identity is available and the chain is reverified.

`public/game/ui.js:1-18,29-39,56-100,138-208` owns incubation and army presentation. It uses the same cycle contract as buildings and non-player characters, restores verified local state, exposes the exact odds and full edge table before the action, and uses the same integer table for display and selection. The action remains local and deterministic; unavailable or unverifiable saved data is reported rather than treated as valid.

## Terminal navigation and frame

`public/assets/terminal_menu_shell.js:1-18,28-40,72-116,138-185` defines five stable destinations with panels grouped inside them. Opening and closing use one transition path; repeated requests do not start a competing transition. The drawer and sheets preserve their existing content, outside clicks close the open surface, and page feedback remains in its existing destination rather than becoming a sixth one.

`public/assets/terminal_window_frame.js:1-16,31-40,60-96` derives panel source and seal color from the shared semantic table. A panel's age advances in game cycles and resets when its observed content changes. Header mutations are excluded from the observed panel region to prevent a self-triggering observation loop. Missing source data remains explicit.

## Scope and evidence

This migration transfers canon from comments into documentation; it does not alter exports, language strings, layout, navigation, identity checks, persistence, or game outcomes. The source references above point to the pre-migration files at the declared baseline. Runtime and accessibility behavior remain subject to the repository's existing tests and browser-specific measurements.
