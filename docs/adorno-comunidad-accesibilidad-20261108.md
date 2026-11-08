# El adorno de la comunidad: accesibilidad cosida a las misiones (2026-11-08)

> Compañero del cruce de la mina (`docs/cruce-mina-gentle-hub-20261108.md`, ya fusionado en main) y de la comisión de claude (`docs/misiones-claude-clave-20261108.md`). Cada patrón se **cita UNA vez**, se **adapta** y se **rechaza lo ajeno**. Ley nueva tras el cruce: el regalo que el cruce ya nombró como joya (M1-M16) NO se renombra otra vez aquí; se ancla a su joya. Las cinco marcas del índice mandan: fuente con ancla, estado medido, vara, recibo <1.024 B, FIRMO por cabeza exacta. Propose-only: nada se fusiona sin la firma del Soberano.

## 1 · Dónde viven las misiones (localización)

- **LA FUENTE**: sección 9 de `docs/canon-map-details-20261107.md`. Toda misión nace ahí; ninguna vista crea misiones paralelas.
- **EL ÍNDICE**: `docs/indice-territorios-ste-20261108.md` (niveles STE-1 a STE-4; aquí se ELIGE la misión).
- **LAS COMISIONES**: `docs/misiones-claude-clave-20261108.md` · `docs/comision-grafica-claude-20261108.md`.
- **EL CRUCE**: `docs/cruce-mina-gentle-hub-20261108.md`, ya en main (las joyas M1-M16 asignadas a las filas; propone UNA fila nueva: la embajada).
- **LAS VISTAS**: tablero · escalera · censo · campaña · `docs/reparto-paneles-20261108.md`.
- **En vivo**: preceptoros.org.

## 2 · La doctrina que juzga cada regalo

Ningún regalo rompe: EN 301 549 como techo · 44 px táctiles · reduced-motion nativo · ocho lenguas · doctrina sin teclado (voz + joystick) · audio voluntario · tabla semántica · color nunca solo · fail-closed · Math.random prohibido · SCRUB · cero peticiones no declaradas. El regalo que rompe la doctrina no es regalo: se devuelve con causa.

## 3 · Los regalos de accesibilidad (patrones del oficio, renombrados)

### EL TIMBRE
De gentle-dot (Gentleman-Programming: `status.rs` y `set_dot_state`) y gentle-agent-state. Cuatro estados nativos (ready / working / needs-you / unavailable) con icono que cambia solo, cero tokens; cola de esperas y alerta sonora cuando el aviso queda fuera de pantalla.
**Ancla en el cruce**: joya M2, la cola de FIRMO (mismo original). El gesto ya está nombrado; aquí solo se viste de accesibilidad.
**ADAPTAMOS**: los cuatro estados, la cola, la alerta off-screen. **RECHAZAMOS**: telemetría que salga de la casa.
**Adorna**: B9 (fila nueva), E4, CL1, G1.
**La vara**: abrir la app y ver qué agente espera sin leer una línea de texto; el cambio se anuncia por aria-live.

### EL DICTADO REVISADO
De gentle-dot (`apps/desktop/src-tauri/src/voice/`: Parakeet local, 25 lenguas, offline por defecto) y omarchy-gentle-dot. El dictado aterriza revisable; la respuesta se lee en voz alta.
**Ancla en el cruce**: joya M4, la voz local (mismo original). Se renombra aquí porque «la voz del parlante» ya es el nombre de la misión CL1: dos cosas distintas no comparten nombre en la casa.
**ADAPTAMOS**: dictado → texto que se revisa antes de enviar; lectura en voz alta; voz local primero. **RECHAZAMOS**: nube de voz sin firma.
**Adorna**: A4, L7, C6, D10, J1, K2c (la estrella de la voz).
**La vara**: el modo de solo audio (D10) se juega sin mirar la pantalla; el corte de audio declara NO_DATA con causa.

### LA RADIO DE ESTADO
De gentle-stream (Gentleman-Programming: música generativa dirigida por estados de ánimo). El mapa suena según cómo está: calma, trabajo, alerta.
**Ancla en el cruce**: joya M12, la música por estado (mismo original, filas A4/C6/K3c).
**ADAPTAMOS**: estado → escena sonora; la síntesis es del canon (FM pentatónico, semilla viaja en el recibo). El audio como canal PRIMARIO del juego, no adorno. **RECHAZAMOS**: instrumentos o librerías que llamen afuera.
**Adorna**: C10 (fila nueva), C6, D10, K3c (el canal sonoro).
**La vara**: misma semilla, misma música; reduced-motion apaga la pantalla, jamás el juego (audio voluntario).

### EL PERIÓDICO
De pi-reply-thread (Gentle Hub) y el AskCard de gentle-dot. Toda espera a la vista: la pregunta que llega hace scroll hasta sí misma («Needs your answer»).
**Ancla en el cruce**: pi-reply-thread ya es de la joya M2 (la cola de FIRMO, fila B1). El periódico es esa misma cola vista como accesibilidad.
**ADAPTAMOS**: la lista única de esperas (PRs, checks, firmas) con su recibo; el scroll a la vista. **RECHAZAMOS**: la cola es de solo lectura; nadie contesta desde ella.
**Adorna**: B9, G1, K12 (los interruptores firmados).
**La vara**: cada espera lista con su causa; aria-live polite anuncia la nueva.

### EL ESPEJO
De gentle-emote (Gentle Hub, 19★). El agente actúa lo que hace con formas calculadas, sin gastar un token.
**Ancla en el cruce**: sin joya propia; pariente del icono por estado sin tokens (joya M8, la cara de la memoria).
**ADAPTAMOS**: presencia visual del preceptor por espectro a forma (D11); el estado se percibe con el audio apagado y con los colores de la tabla semántica (color nunca solo). **RECHAZAMOS**: adorno sin función.
**Adorna**: E4, I5 (el perfil con mascota), el estado del cabecero.
**La vara**: cambiar el estado del sistema cambia lo que se ve, sin leer texto.

### EL VELO
De veil.nvim (Gentleman-Programming) y veil (Gentle Hub). Datos personales redactados antes de salir de la máquina, con matriz honesta de capacidades.
**Ancla en el cruce**: joya M6, las vallas del visitante (mismo original).
**ADAPTAMOS**: redacción en la puerta de escritura (H4) y en SCRUB; la matriz honesta como tabla declarada. **RECHAZAMOS**: guardar lo redactado en otro lado.
**Adorna**: H4, J2, K7c (el ágora: la privacidad dice su nombre).
**La vara**: lo que sale por la puerta jamás lleva datos del visitante; la matriz se publica.

### LA CARTERA CIEGA
De qbit-vault (Gentle Hub) y el secure_store de gentle-dot. Los secretos se usan, jamás se ven; las credenciales se teclean en la app, no en el chat; el fichero va firmado y si cambió cerrado, se aparta y avisa.
**Ancla en el cruce**: joya M5, la aduana de llaves (mismo original, fila F1).
**ADAPTAMOS**: la llave del visitante en Ajustes; ficheros firmados con aviso de cambio. **RECHAZAMOS**: la llave dentro del aparato descargable.
**Adorna**: F1, H4, D1 (la identidad efímera).
**La vara**: usar la llave exige el gesto del humano; ningún panel la muestra.

### EL PANEL DE UN VISTAZO
De fisi-dock (Gentle Hub). Sesión, tareas, CI y cambios en un solo panel; la carga cognitiva es accesibilidad.
**ADAPTAMOS**: un panel, todo lo que espera; el visitante encuentra todo en dos movimientos. **RECHAZAMOS**: paneles paralelos (ley de la fuente única).
**Adorna**: B1 (el registro único), I3, I6.
**La vara**: la prueba de los cinco minutos (N8) con el visitante real; todo encontrado sin ayuda.

### LA CAJA DE UTILIDADES
Medida en los navegadores del borde, no heredada de un repo: `interactive-widget=resizes-content` (el teclado no tapa el insertor), `inputmode` y `enterkeyhint`, `aria-live` en los avisos, `forced-colors` y `prefers-contrast`, oklch+APCA para la piel, View Transitions con `reduced-motion`, popover nativo, scroll-snap (la cura del 440 px), ETag/304.
**ADAPTAMOS**: solo lo que MIDE en el teléfono débil. **RECHAZAMOS**: lo que no mide ahí.
**Adorna**: K5c, K10, K11, F7, F8, G4.
**La vara**: el lector de pantalla nombra lo que el ojo ve (K11); forced-colors probado y declarado.

### LA PAUSA
De Wellness-Reloj-pi (Gentle Hub, 16★). El humano también es un aparato del sistema: pausas contadas, agua, vista 20-20-20.
**ADAPTAMOS**: el aviso de pausa como panel del Lab, apagable, sin medir nada del humano. **RECHAZAMOS**: guardar salud, telemetría corporal, o cualquier dato de la persona.
**Adorna**: candidato a pieza de la sala de estudio (B7), no fila propia.
**La vara**: el aviso se apaga y no vuelve sin permiso; cero datos guardados.

## 4 · La costura por fila (el resumen para el índice)

| Fila | Regalo | Qué aporta | Estado |
|---|---|---|---|
| D10 · audio mode | EL DICTADO REVISADO + LA RADIO DE ESTADO | jugar sin pantalla | fase 1 fusionada; modo NO_DATA |
| K3c · los cuatro canales | LA RADIO + EL ESPEJO + LA CAJA | lo visto, oído, sentido y leído en cada pieza | propuesta (claude) |
| K11 · los instrumentos honestos | LA CAJA (aria-live, forced-colors) | el lector de pantalla nombra lo que el ojo ve | propuesta |
| K5c · la degradación honesta | EL PULSO (ya vivo) + LA CAJA | el aparato débil juega entero | propuesta (claude) |
| K10 · la web desnuda | LA CAJA (modo avión) | el semáforo dice la verdad | propuesta |
| F7 · accesibilidad completa | toda la CAJA + doctrina EN 301 549 | que se lea todo, no solo que se vea | propuesta |
| D2 · el segundo mando | LA CAJA (inputmode, enterkeyhint) | el teclado alcanza todo; 44 px | decreto; personaje NO_DATA |
| A4 · L7 · C6 · J1 | EL DICTADO REVISADO | el canon de audio sonando | medido / propuesta |
| B9 (nueva) | EL TIMBRE + EL PERIÓDICO | quién te necesita, a la vista | fila nueva propuesta |
| C10 (nueva) | LA RADIO DE ESTADO | el mapa suena según su estado | fila nueva propuesta |
| E4 · vecinos de inteligencia | EL ESPEJO + EL TIMBRE | habitantes con estado, cero tokens | propuesta |
| H4 · J2 · K7c | EL VELO + LA CARTERA CIEGA | la puerta sin datos del visitante | propuesta |
| I3 · I6 · B1 | EL PANEL DE UN VISTAZO | carga cognitiva medida | propuesta (decreto) |
| G1 · el banquillo del juez | EL PERIÓDICO | actas y esperas, limpias | medido, vivo |

**Filas nuevas pendientes de decreto:** la embajada (M9 del cruce, ya propuesta a la fuente única), B9 y C10 (propuestas de este adorno). La fuente única decide; el reparto no se mueve hasta el FIRMO de cada una.

## 5 · El orden de la costura (mi gusto; propone, FIRMO decide)

1. **K11** (el lector de pantalla nombra lo que el ojo ve): la vara más barata y el regalo más hondo; sin él, F7 no existe.
2. **B9** (el timbre): la cola de needs-you; ya tiene originales medidos.
3. **D10 + C10** (el audio como canal primario).
4. **K3c** (los cuatro canales, ya de claude).
5. **LA PAUSA**, al final, decorativa y apagable.

## 6 · Las leyes del adorno

- Propose-only: una pieza por PR; la pieza se construye ANTES de pedir la firma; FIRMO por cabeza exacta.
- Cada patrón se cita UNA vez: la casa no copia nombres ajenos; lo que el cruce nombró, se ancla.
- El texto que el usuario ve va en Acho; el nombre de cada misión queda en inglés STE.
- Recibo <1.024 B por pieza, SCRUB limpio (se publican las reglas, jamás los canales).
- Se re-mide tras cada FIRMO.
