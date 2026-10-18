# COMPLIANCE — the measured public map

**What this is:** the public compliance map of the WEB part — each anchor with
its measured basis. Nothing here is legal advice; every line cites what was
measured, or declares NO_DATA with cause. The certification of applicability
(`applies` vs `self-imposed`) belongs to the carbon, by sign-off; this map
never decides it.

*(ES: el mapa de cumplimiento medido y público. La asignación de aplicabilidad
es del carbono, FIRMO; el mapa exige presencia y forma.)*

## Measured anchors

| Anchor | Where it lives | Measured basis | Status |
|---|---|---|---|
| EU AI Act, Art. 14 (CELEX:32024R1689) | llms.txt D33 [applies] · G3 HITL Ed25519 one-click (PR #102) | human review before any consequential action; param_gate with sabotage red demonstrated | applies (sign-off) |
| EU AI Act Arts. 4/10/12/13/15 (CELEX:32024R1689) | llms.txt D34–D38 [self-imposed] | transparency and literacy echoes in guides and game | self-imposed (sign-off) |
| AI Act (CELEX:32023R2854, 32024R2847, 32022R2554) | llms.txt D39–D41 [self-imposed] | measured citations, guardian-checked | self-imposed (sign-off) |
| GDPR Art. 25 (CELEX:32016R0679) | ephemeral-crab design; zero telemetry; D44 [applies] | no network requests on load; privacy by design | applies (sign-off) |
| WCAG 2.2 AA (2.5.8) | A11Y wave round 110 (pieces 1–5) | single aria-live; forced-colors; 24/44 px targets; 2:1 tap-to-move; print unplugged | self-imposed (sign-off) |
| Accessibility Directive (CELEX:32019L0882) | llms.txt [self-imposed] — never cited as R (guardian family 2) | tests/citations.test.mjs enforces the letter | self-imposed (sign-off) |

## Ceilings and gates

- 25 MiB per block (D2 revocation of the 16 KiB cap, 2026-10-11); vanilla JS
  in public/; zero new network; loader 'en' only; English first.
- No hidden probability; the house never wins; no FOMO; no wall clock.
- Guardian suite must be able to go red: `node --test tests/` (75 web tests,
  total = pass + skip, self-checked).

## Open gaps (declared, never hidden)

- EL LÉXICON bridges (45): NO_DATA — cause: enumeration not yet served to the
  public side; they enter when the lexicon lands.
- WebLLM CDN exception (piece 04): PENDING audit and documentation.
- ENERGY_BUDGET.md (piece 05): NO_DATA watts sensor — cause: sensor not exposed.
