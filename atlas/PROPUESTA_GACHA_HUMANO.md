# PROPUESTA · Humanizar el gacha (cosecha de joyas) · 2026-10-11 · Claude (Opus 5.5)

Sello: **PROPUESTA_PENDIENTE_FIRMA**. Nada construido. Cada pieza, su coste y su FIRMO por separado. Extiende la
ceremonia R8; no la sustituye. Fuente del encargo: no citada (se dice como llegó).

## Lo medido antes de proponer (cambia dos piezas)

| Premisa del encargo | Lo que hay en el código | Consecuencia |
|---|---|---|
| «El seq monótono del sobre ya permite calcular la piedad» | La invocación **no es un sobre**. Firma `{esquema:'atlas.invocacion/1', tc, ciclo, n}` (`public/game/ui.js:126`), sin `seq` ni `prev`; `n` vuelve a 0 en cada carga (`ui.js:14`). La semilla es sha256 de la firma (`db.js:190`) | Sin cadena no hay piedad verificable: hace falta **G0** antes que nada |
| «Perder el 50/50» | No hay 50/50: la rareza sale de las aristas (`gacha.js:88-91`, tabla por mil en `valores.js`) y no hay unidad destacada | La pieza 5, tal como viene, **no tiene a qué agarrarse** (ver abajo) |
| «Sin cosecha pasiva (V3.0 = veneno sellado)» | **La cosecha pasiva existe hoy en el motor**: `atlas-piso.js:279` → `M.dormir(E, Date.now() - oculto)`; el Bosque produce «mientras dormías» hasta 24 h de reloj de pared | **CONTRADICCIÓN_ABIERTA**: quitarla toca `atlas-motor.js` (no se toca sin firma) y cambia las leyes medidas |
| «V3.0 = veneno sellado» | No encuentro esa doctrina en `mente/doctrina` | NO_DATA de la fuente: ¿dónde está sellada? |
| Odds visibles | La tabla entera por mil y por TC **ya existe** (R5, publicada en el Taller) | La pieza 4 es barata: llevarla al gesto |
| Huevos | Viven en memoria (`ui.js:14`, `huevos = []`): no está medido si sobreviven a recargar con partida guardada | **PLAUSIBLE** (sin medir en navegador): cobre gastado y huevo perdido. Se mide en G0 |

**Techo:** `ui.js` pesa 16.355 B (le quedan 29) y es INTOCABLE sin firma; casi todo lo de abajo lo toca. **Antes de
cualquier pieza: trocear `ui.js`** (la invocación y el nido a su módulo), con su propio FIRMO.

## Las piezas

| # | Pieza | Qué se construye | Coste | Toca | FIRMO |
|---|---|---|---|---|---|
| T | Troceo de `ui.js` | Invocación + nido a `ui-invoca.js` (UMD), sin cambio visible; prueba de gemelos | S | `ui.js` (intocable) | ☐ |
| G0 | **Cadena de invocaciones** | `atlas.invocacion/2`: `seq` monótono por clave + `prev` (huella del anterior), como `atlas.sobre/1`; guardada en el aparato (caja IndexedDB); huevos persistidos. Una invocación que falta en la cadena es un hueco DETECTABLE | M | contrato nuevo en `data/` (+1 bueno, 6 violaciones), `db.js` | ☐ |
| 1+2 | **Piedad visible, calculada por el cliente** | `piedad(cadena)` pura (node = navegador): tiradas desde la última ≥ umbral y cuántas faltan para la garantía; se ve en la ceremonia y en el botón. **Con huecos en la cadena, la piedad sale NO_DATA** (si se pudiera esconder un éxito, se inflaría la piedad: la cadena lo impide). El rack no lleva cuenta de nadie | M | `gacha.js` (la garantía decide el resultado: **cambia la economía firmada y el `packSha`**) | ☐ + **cifras tuyas**: umbral, N de la garantía |
| 3 | **Crónica de deseos** | La vitrina guarda TODA cápsula (también las soltadas): ciclo, sello, aristas. Odds a posteriori junto a la tabla, con el aviso de muestra pequeña (no se lee azar en 10 tiradas) | M | sobre G0 | ☐ |
| 4 | **Odds antes del gesto** | Junto a cada botón de invocar: la tabla por mil de ESA cápsula y, con 1+2, la probabilidad de la garantía. Sin cálculo nuevo: lee `valores.js` | S | UI | ☐ |
| 5 | Redención del fallo | **Sin 50/50 no aplica.** Dos salidas: (a) se FUNDE con 1+2: cada tirada bajo el umbral ES el mérito acumulado, y se ve; (b) crear un estandarte con unidad destacada: **mecánica nueva**, L, decisión tuya, no mía | (a) 0 · (b) L | — | ☐ a · ☐ b |
| 6 | **El mundo respira, no farmea** | (a) S: al volver, el bioma CUENTA lo que pasó (el paseo J1 siguió, la radio siguió), proyección sin ganancia. (b) Quitar o acotar `M.dormir`: motor, leyes y `pruebas_web` cambian | (a) S · (b) M | (b) `atlas-motor.js` | ☐ a · ☐ b (resuelve la contradicción) |
| 7 | **Aliados que crecen por uso** | Veteranía por tropa desde los registros firmados de `arena.combate` en que luchó. Primero SOLO aspecto (insignias, formación); que cambie el combate es otro FIRMO (contrato y `packSha`). Nada se compra: no hay tienda | L | `escuadron.js`, registros | ☐ aspecto · ☐ combate |

## Lo que no se negocia (reglas de casa, cómo se cumplen)
- **La ceremonia no decide**: la garantía vive en `gacha.js` (pura); R8 solo la enseña.
- **Determinista**: la piedad es función de la cadena; misma cadena, misma cifra en cualquier aparato (caso node).
- **Pity oculto prohibido**: si no se puede calcular, se dice NO_DATA con causa; nunca un número sin cadena.
- **Movimiento reducido y WCAG**: la cifra de piedad es texto, no solo un dibujo.
- **Licencias**: ninguna pieza trae imágenes ni sonidos de fuera.

## Orden que propongo
T → G0 → 4 → 1+2 (con tus cifras) → 3 → 6a → (6b, 7, 5b según decidas).

---

## Decisiones del Soberano (2026-10-11, mensaje extra) · registradas
- **G0 ACEPTADO**: cadena con `seq` y `prev`, guardada en el aparato. Cierra el hueco del huevo. **Rojo MEDIDO**
  (motor y guardado reales, en node): 125 ciclos para juntar 50 de cobre → invocar → recargar con `retoma`. El
  cobre se vuelve a cobrar (50 → 0) y vuelven **0 huevos**, porque viven en `ui.js: var huevos = []`. En el navegador:
  NO_DATA (headless no tiene una cuenta con 50 de cobre). Evidencia: `~/p0x/no-publicar/g0-huevo-20261011/`.
- **No hay 50/50 y así se queda.** La pieza 5 va por la vía (a): se funde con la piedad, coste 0. **5b: NO.**
- **V3.0 DECLARADO-por-Soberano**: «La Army no cobra por dormir. Lo que se gana se firma por acción. La cosecha
  pasiva es veneno.» Registrado en `mente/firmas/firmas_recibidas.jsonl`. Ficha propuesta en
  `mente/doctrina/VENENO_COSECHA_PASIVA.md`, pendiente de tu firma. La contradicción con `M.dormir` queda
  REGISTRADA y la resuelve 6b (FIRMO aparte, después).
- **Orden: T → G0 → 4 → 1+2 → 3 → 6a.** T está PREPARADO y no aplicado (ver abajo). En 4, la cifra de la tabla la fijas tú.

## T preparado, no aplicado
Rama `claude/T-troceo-ui`, sin fusionar ni empujar; parche en `atlas/propuestas/T_troceo_ui.patch`. La ficha de la
tropa (lienzo, traza, nombre, ficha, voz) pasa a `ui-ficha.js`. `ui.js` baja de 16.355 a 12.947 B (sitio para
G0). Cambio visible: ninguno. Medido en el navegador: la ficha movida pinta «Lanternfish · Normal · 4 edges ·
vid 10 · arm 2 · vel 6 · Sound» y 0 errores. Test nuevo + sabotaje (un gemelo vuelve a `ui.js`) en rojo.
**Coste lateral:** `thegame.js` queda a 21 B de su techo.

## Addendum «joyas gacha» · cómo encaja con lo firmado
| # | Pieza | Lo que ya hay | Propuesta | Coste | FIRMO |
|---|---|---|---|---|---|
| A0 | **Atadura de semilla (salvaguarda 5)** | La semilla ya es sha256 de la firma Ed25519 (`db.js:190`). Ojo: técnicamente no es un VRF, es una firma determinista | Con G0, el mensaje firmado lleva `seq` y `prev`: una semilla por puesto de la cadena. Así **se acaba el «grinding»** (hoy basta esperar ciclos para cambiar de semilla). La PWA recalcula, y si no cuadra: descarte y NO_DATA | dentro de G0 | ☐ |
| A1 | **Huevo Atlante con afijos** | **Los afijos ya existen**: `t.prefijo` / `t.sufijo` («af_*», `ui.js:56-60`) | Calidad del afijo por semilla y a la vista en la vitrina R8, extendiéndola. **CONTRADICCIÓN_ABIERTA**: la «ilustración 2D por GPU del rack» choca con «la web nunca hace fetch al rack», «los personajes son ondas» y «cero ráster» (addendum v2). Propongo que en la web el huevo sea su onda y que la ilustración del rack viva en la app. Lo decides tú | M | ☐ + decisión |
| A2 | **Piedad visible y AUDIBLE** | La radio ya toca la pentatónica sobre 220 Hz (`aiact-art50-state-radio.js`) | Cada estado, con su timbre: desafinación = grieta, pentatónica = biomasa, trémolo = integridad. **Siempre con su equivalente en texto** (WCAG 1.1.1). Nada parpadea más de 3 veces por segundo (WCAG 2.3.1). Con movimiento reducido: quieto | M | ☐ |
| A3 | **Crónica en filotaxis** | `escuadron.js` ya usa la espiral áurea (`AUREO`) | La vitrina coloca cada cápsula en espiral de girasol (137,5°) con la MISMA función: sin gemelo | S | ☐ |
| A4 | **Redención → Tip Jar y reputación** | El Tip Jar es PROPUESTA sin firmar (ideas11oct §9), con pagos | **CONTRADICCIÓN_ABIERTA**: llevar al Tip Jar el mérito de la mala suerte convierte la suerte en prioridad de pago, y esa es la línea del casino. Además lo pisa tu decisión 5(a). Propongo que el mérito se vea, sea intransferible y no entre en el Tip Jar hasta que lo firmes | 0 | ☐ |
| A5 | **Tabla R5/M18** | `valores.js` lleva la tabla PROPUESTA de R5 (meta: ≥60 % con 3-4 aristas) | Nada que construir: espera tu FIRMO con tus cifras. **Discrepancia a la vista:** tu sonar dice 5 % con más de 12 aristas, y la tabla de R5 midió 1,4-3,6 % de Leviatanes. Al fijarlo, la tabla cambia (y con ella el `packSha`) | 0 | ☐ |
