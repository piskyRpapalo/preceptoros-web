# Screen-space names · fixture

PROPUESTA · REQUIERE_FIRMA. Baseline `bdd4005`, 2026-10-28: the existing T4 preview paints initials inside its scaling SVG (`preview/plantilla.html:116`); no screen-space name control or zoom control exists in that panel. T3 card `docs/norte7-tarjetas/T3-nombres-pantalla.md` records the production zoom input and unmeasured drawing path. The Sovereign's ruling in web #387 ·6480922688 sets zoom 0.6–3 and a 16 px minimum, with 44 px touch targets. No production behavior is asserted.

Slice: an offline standalone fixture using `colony-projection/1`, screen-space buttons for three synthetic nodes, explicit zoom input, keyboard operation and deterministic positioning. Ground scales; labels remain at least 16 CSS px and controls at least 44 CSS px. A screen-space hit test must agree with the control rectangles. Names and status remain data, no live node or liveness is claimed. Fixture first, then visual review and production wiring as separate work. Existing full-map bitmap parity and weakest-device performance remain NO_DATA because this fixture has not measured them.

Log: interaction on physical touch and real fleet display remains NO_DATA until exercised. A real fleet node status cannot be inferred from this synthetic fixture.

## Receipt

MEDIDO: headless Chrome at 500 and 1200 CSS viewport widths, 25 zoom values 0.6–3. `python3 preview/check-screen-browser.py` measures computed font size, actual button rectangles, clipped controls, pairwise overlap and programmatic activation: zero failures on 75 controls per width. A 390 px window request produced a 500 px viewport; 390 px viewport behavior is NO_DATA. Off-scene nodes pin to the edge and say so in the accessible name. This is a fixture-specific three-node sample, not a general collision solver. Native browser button hit testing supplies interaction; the pure box predicate is tested separately. Physical taps, all device sizes, selected-creature sizing and production integration are NO_DATA. `node preview/check-screen-labels.cjs` checks clamp, axial projection and box edges. [Before](../../docs/norte7-screen-label-fixture/before.png) shows the existing T4 preview, [after](../../docs/norte7-screen-label-fixture/after.png) the new fixture at zoom 1; screenshots are headless viewport captures, not physical display evidence.

Sabotage: changing the label font to 12 CSS px causes the browser judge to fail; restoring 16 px returns green.
