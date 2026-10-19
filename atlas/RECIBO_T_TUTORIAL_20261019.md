# RECIBO · VT5 · tutorial «De Onda a Nodo Soberano» F0–F3 (solo forma)

- Base: `origin/main` 1194fdd · rama `haiku/vt5-tutorial` · sin commit ni push.
- Modulo puro `public/game/tutorial_fases.js`: F0 doble puerta (`directo` → F3 · `niebla` → F1) · F1 pulso → disipa → arena101 → recompensa (3 huevos: cifra del encargo VT5, NO medida; las posturas Escudo/Pica/Arco no existen en el repo ni en el canon) · F2 campamento → primer_edificio (etiqueta medida) · F3 cartas → salto · `cruza` solo con `humano: true`.
- Disipa sin medida: el primer edificio queda `NO_DATA` con causa, no inventado.
- Invariante: red abierta solo en F3 · cruzado.
- Casos `atlas/tutorial_fases_casos.mjs`: 8 (1 válido de niebla a F3 con cruce humano, doble puerta, 6 violaciones: red sin humano, evento fuera de orden, 2 huevos, primer edificio sin etiqueta, puerta desconocida, red antes de F3).
- Rojo demostrado: quitar la comprobación de humano en copia desechable falla el caso de red sin humano.
- No se toca: `atlas/tutorial_casos.mjs` (genesis, FIRMO 2026-10-12). Un fallo mío lo sobrescribió; se restauró desde git (`git checkout`) antes de cerrar la caja. Los casos nuevos van en su propio fichero.
- Grupo `VT5` en `atlas/test_atlas.py` (fuera de la puerta). UI de F0–F3, cartas (`place_card_browser.mjs`) y pieles de Atlantis/Zombis: NO hechas, quedan para la siguiente entrega.
- Sello: VERSION intacta `preceptoros-2026-17-abje`; huella `a56ae901c01a1181`.
- Gates: test_web OK (78, 1 saltado) · arnes_sw 22/22 · test_atlas 186 OK.
- Pendiente: commit y push (mano del carbono).
