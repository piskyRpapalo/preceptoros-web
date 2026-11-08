# El reparto de la casa · cuántas opciones van en cada panel (2026-11-08)

> Encargo del Soberano (2026-11-08): encajar las 131 misiones del índice en la parte visual de la web y de la app, para que el preceptor gráfico sepa cuántas opciones van en cada panel y amueble los interfaces con confianza. Este documento ES la vista del reparto: no crea misiones (la fuente única las crea, docs/indice-territorios-ste-20261108.md), las reparte por panel y les pone número de opciones. Propose-only; se re-mide tras cada FIRMO. Medido: zonas.js y app.html (las 9 zonas de la app) y el conteo pieza por pieza del juego servido.

## 1 · La ley del número (las cuatro leyes del reparto)

1. **LA MANO ABIERTA.** Cada panel muestra de 3 a 7 opciones. Menos de 3 = se fusiona con su vecino. Más de 7 = una sola puerta que abre la sub-lista. El visitante jamás ve una pared de botones.
2. **LA MISIÓN NO ES LA OPCIÓN.** Una misión es trabajo detrás de una puerta; una opción es lo que la mano toca. Las misiones de calidad (recibos, alarmas, presupuestos) no se pintan: se citan (sección 5).
3. **EL MAPA ES EL MENÚ DE LA WEB.** La web no tiene barra de pestañas: sus paneles son EDIFICIOS del mapa. La app sí tiene barra de 9 zonas: 9 x 44 px = 396 px caben en el teléfono; 10 x 44 = 440 px no cabían. Esa medida fundó las nueve.
4. **TODO LO VISIBLE NACE CON RECIBO.** Cada opción usada enciende una estrella en el cielo del mapa (N13). Cada zona de la app nace con su sting. Lo que no puede probarse se declara con su causa, jamás se simula.

## 2 · LA WEB · un mapa y nueve edificios

El visitante llega, ve el mapa, y entra a los edificios. Diez superficies visibles: el mapa más nueve edificios. Detrás de cada puerta vive una lista de misiones del índice WEB (69).

| Puerta | Opciones | Misiones que viven detrás |
|---|---|---|
| **EL MAPA** (la casa entera) | 7 | C1, C2, C3, C4, C5, C7, C9, D2, D8, E1, E5, E6, I8, I9, K1c, K2, N2, N4, N13 (19) |
| **EL ALBERGUE** (la bienvenida) | 4 | D1, I2, I3, I4 |
| **LA ADUANA DE TRES LLAVES** (la frontera) | 3 | I1, E2, J7 |
| **EL CORO** (comunicaciones) | 4 | C6, D10, I6, K3c |
| **EL TALLER** (el banco del visitante) | 5 | D12, J4, J5, K5, K8c, L12 |
| **LA LOTERÍA HONESTA** (el sorteo) | 2 | D4 |
| **EL COLISEO** (el duelo) | 5 | D5, D6, D7, D9, K6c |
| **EL ÁGORA** (la plaza pública) | 4 | D3, E4, J2, K7c, L13 |
| **LA CASA DEL VISITANTE** (el perfil) | 5 | D11, I5, J8, K2c, K4c |
| **EL MÉDICO DE GUARDIA** (accesibilidad) | 3 | I7, K5c, K11 |

**El interior de cada puerta, en llano:**

- **EL MAPA** (7): andar y pintar tu casilla (D2, C4, C5, K1c); tu cabaña, tu lugar (C3); entrar a un edificio (C1, C7, D8, I8, C9, I9: el cuerpo del edificio ES la puerta); el semáforo de vida del nodo (E1, K2, N2); el ejército de ondas del global (E6); la escalera del terreno (E5); el cielo: la primera silueta y la constelación de recibos (N4, N13).
- **EL ALBERGUE** (4): entrar y jugar sin cuenta (D1); lo que el visitante necesita, medido (I2); la bienvenida rehecha (I3); la niebla nunca vacía (I4).
- **LA ADUANA DE TRES LLAVES** (3): quién entra y con qué permiso (I1); las caravanas con su contrato, no su promesa (E2); la economía: sin cuenta eres cangrejo y tu lugar vale algo medible (J7).
- **EL CORO** (4): radio, chat y ecos, cada voz en su sitio (I6); el mundo habla con voz propia (C6); el modo de solo audio (D10); lo que se ve, se oye, se siente y se lee (K3c).
- **EL TALLER** (5): la mesa de cambios, cada cambio suena al nacer (J5); el mercader de lo mal escrito (J4); el cuaderno exportable (K8c); el tutorial del territorio (D12); el tablón de la agenda (L12).
- **LA LOTERÍA HONESTA** (2): ver las probabilidades ANTES de tirar; tirar. Una misión, dos opciones: el edificio más honesto de la casa. Si algún día pide más botones, se corrompió.
- **EL COLISEO** (5): el duelo contra la máquina, limpio y repetible (D5); el combate de ondas, una sola forma de pelear (D6); la conquista honesta: se gana solo si se peleó (D7); las invocaciones con permiso aparte (D9); las arenas entre nodos (K6c).
- **EL ÁGORA** (4): la plaza donde la privacidad dice su nombre (K7c); el chat de los edificios, que responde solo con lo que sabe (D3); conecta tu propia IA (J2); los vecinos de inteligencia y el tablón de huecos (E4, L13).
- **LA CASA DEL VISITANTE** (5): la mascota que evoluciona contigo (I5); el cangrejo honesto, siempre igual (D11); dos terrenos, una cuenta (J8); la torre de ascensión (K4c); la estrella de la voz (K2c).
- **EL MÉDICO DE GUARDIA** (3): el lector de pantalla nombra lo que el ojo ve (K11); el aparato débil juega completo aunque dibuje menos (K5c); las letras justas (I7).

**Las 14 misiones que NO se pintan en la web** (sus superficies son el sello, el semáforo y la alarma, jamás un botón): C8 (las tres vistas son el mismo estado: ley, no menú), E3 y E7 (las familias de pruebas y la válvula viven en el Lab), K1 (el costo del click se declara en el contrato), K3, K4, K10 (viven dentro de UNA luz del semáforo: cuatro luces sería ruido), L7, L8, L9 (las varas citan, no muestran), N5, N6, N7 (matemáticas declaradas, cuadros guardados, presupuesto de bytes: escritura, no dibujo), N8 (el examen humano, fuera de la pantalla).

## 3 · LA APP · nueve zonas medidas (zonas.js y app.html, 2026-11-08)

La barra tiene 9 zonas (396 px caben; 10 no cabían: medida fundacional). El insertor vive anclado abajo; el título vive UNA vez en el cabecero. Nombres medidos contra el HTML vivo:

| Zona medida | Opciones | Misiones que viven detrás |
|---|---|---|
| **MANDO** (la brújula y las firmas) | 4 | F10 + el re-target de la brújula (canon) |
| **CONVERSACIÓN** (el hilo; el canon la llama Hablar) | 3 | CL1 + elegir contexto + la cita o la confesión |
| **GOBIERNO** (el canon la llama Frontera/A2A) | 6 | Espejo del dueño de la Aduana web: I1+E2 (web) + H1 (otros) + las tres tarjetas de la cédula del nodo (medidas hoy en Ajustes). PROPUESTA: se mudan aquí |
| **CUADERNO** | 4 | A5, J3 + la bandeja local (medida hoy en Ajustes; mudanza propuesta) |
| **LAB** | 5 | F6, L10 + la ventana de los 24 del territorio LAB (sección 4) |
| **HARNESS** (equipo y ciclos del motor) | 4 | A6, B5 (lab), F5 |
| **PUERTA PÚBLICA** (la llave y el documento de la IA) | 3 | F2 (el documento = el tronco traducido) + H1 espejo |
| **MODELOS** (ES el Mundo: OpenWorld embebido) | 4 | J1, F9, F3 + queda claro si visitas o gobiernas |
| **AJUSTES** | 5 | F1, F7, F8, K12, L1 + las obras (voz de creación y publicación) + la redacción |

**El interior de cada zona, medido en el HTML:**

- **MANDO** (4): las firmas; la brújula con sus dos modos (The Path / Detail); el aviso honesto con causa. El orquestador local (A6) vive su lado motor en Harness.
- **CONVERSACIÓN** (3): el hilo vivo; el contexto elegido; la cita o la confesión. Los agentes preguntan con SU voz (CL1), nunca con la tuya.
- **GOBIERNO** (6): la política A2A con versión y vigencia (hoy NO_DATA declarado en pantalla: medido); quién entra; caravanas espejo; + las tres tarjetas de la cédula (exportar cédula firmada, proponer nodo sin firma, declarar edificio).
- **CUADERNO** (4): el recuento; los turnos con capturado≠consentido; anidar en la memoria (se anida el texto ya tachado, jamás el pegado); la bandeja local.
- **LAB** (5): canales recientes; el enlace al Lab del rack; modelos locales; experimentos (sección 4); el mapa de la escalera (L10).
- **HARNESS** (4): el equipo medido; los ciclos del motor con frescura y causa; los interruptores de agentes (B5); la telemetría blindada (F5). Aquí vive el orquestador local (A6).
- **PUERTA PÚBLICA** (3): la llave de entrada (copiable); el documento que lee la IA (copiable); la vista que traduce las marcas de ausencia. Es la cara local de la Aduana: el invitado lee el contrato antes de tocar.
- **MODELOS/MUNDO** (4): el OpenWorld embebido que solo se pide al abrir la zona (lazy, medido); reintentar; abrir en otra pestaña; visitar o gobernar, sin duda posible.
- **AJUSTES** (5): redacción (el filtro, con el payload a la vista); conservar la app en este aparato; las obras (voz de creación y publicación firmada); preferencias, accesibilidad y fuentes (F7, F8 por construir); interruptores firmados (K12) y el reloj de instalación (L1).

**EL PANEL DE LOS CEREBROS VIVE EN EL CABECERO, NO EN UNA ZONA** (medido): la flechita abre el diálogo de modelos locales, y el Lab lleva la lista. A1, A4, A7, A8, I10 no son pestaña: son ese diálogo y esa lista.

**F4 ES EL AMUEBLE, NO UNA SALA:** la misión de los interiores de los nueve paneles no tiene zona propia: es el trabajo que llena las nueve.

**Cuenta de las 23 de la app:** Mando 1 (F10) + Conversación 1 (CL1) + Gobierno 0 propio (espejo I1+E2+H1) + Cuaderno 2 (A5, J3) + Lab 2 (F6, L10) + Harness 3 (A6, B5, F5) + Puerta 1 (F2) + Mundo 3 (J1, F9, F3) + Ajustes 5 (F1, F7, F8, K12, L1) + cerebros 5 en el cabecero y el Lab (A1, A4, A7, A8, I10) = 23. Ninguna huérfana.

## 4 · EL LAB · la ventana de la fábrica (una sala, seis familias)

Los 24 del territorio LAB no son 24 botones: son seis familias de trabajo que se ven como UNA lista de experimentos (B2) con cinco opciones de panel.

| Familia | Trabajo en llano | Misiones |
|---|---|---|
| **EL CENSO** | contar y medir lo que hay, con la misma vara | L2, L3, N1, N10 |
| **LA FÁBRICA Y SU LAZO** | el registro único, la cara, el enlace, y el agente que escribe recibos, jamás firmas | B1, B2, B3, B4 (=N12), B5, B6, B8 |
| **EL ENTRENAMIENTO** | el cerebro chico de la casa y su examen, definidos ANTES de correr | A2, A9, H6, H2, L14 |
| **LA VÁLVULA Y LA ENERGÍA** | qué gana el cerebro con y sin arnés; los julios con sello | K7, L5 (=N11) |
| **LA CASCADA Y EL ENJAMBRE** | el segundo piso con alquiler que vence; el enjambre nace, trabaja y muere con recibo | L4, L11, H5, B7 |
| **EL MARCADOR** | una tarjeta, seis dimensiones medidas o confesadas | K8 |

Opciones del panel Lab (5): la lista de experimentos; los interruptores de agentes; el reporte de 100 caracteres; los enlaces a otros paneles; el marcador de hábitats. Las siete familias de pruebas (E3, web) y la válvula (E7, web) se muestran AQUÍ como filas de la lista, no como paneles propios.

## 5 · EL SÓTANO · lo que jamás se pinta (se cita)

Quince misiones del territorio OTROS y catorce puertas de la web viven fuera de la pantalla. Sus superficies son tres: el sello del cabecero, la luz del semáforo y la línea de firma.

- **El canal y la casa:** A3 (Hexelion escribe su recibo), G1 (actas limpias), G2 (la litera viva), G3 (PRs verdes), G5 (sellos re-medidos), G6 (el foco único), G7 (la poda).
- **Los contratos:** H1 (la ley del nodo), H3 (auditar el mapa contra el código), H4 (la primera puerta de escritura: todos los ataques pensados con su respuesta; trabaja PARA la Aduana), N3 (la ley muerta retirada), N14 (la firma externa, dormida), L16 (el Mac ausente).
- **El vigilante del enjambre:** H5 trabaja para el Lab aunque viva aquí.

**Regla del sótano:** quien ponga un botón de presupuesto de bytes en la cara del visitante no entendió la casa. Esas misiones se citan en el recibo y sostienen el sello; no se muestran.

## 6 · LOS PUENTES · la navegación ya construida

Las doce piezas-puente del toque nativo son el mapa de navegación entre paneles: cada puente nace dentro de una puerta y aterriza en otra.

| Puente | Une |
|---|---|
| EL ASIENTO DEL CORO | Mando ↔ Lab ↔ la litera |
| EL DUEÑO ÚNICO | el mapa ↔ la Aduana ↔ el mantenimiento |
| LA MEMORIA CORTÉS | Cuaderno ↔ el solo audio ↔ el tutorial |
| EL PRECIO DOBLE DEL CLICK | la Lotería ↔ el costo del click ↔ la energía |
| EL MOLDE FIRMADO | el cuerpo de los edificios ↔ el cuaderno ↔ la aprobación |
| LA PELEA SELLADA | el Coliseo ↔ los cuadros guardados ↔ la silueta |
| LA PUERTA QUE ENSEÑA | los edificios ↔ el tutorial ↔ su continuación |
| EL PULSO DEL CEREBRO | el censo ↔ los benchmarks ↔ las pruebas ↔ el cielo |
| EL LECTOR DESCONFIADO | la lectura ↔ la primera puerta ↔ la litera |
| EL MÉDICO DE LA LITERA | el lazo del agente ↔ los PRs verdes ↔ la litera |
| EL ÁGORA QUE SE LEE | la plaza ↔ el chat ↔ los canales ↔ los instrumentos |
| EL JARDÍN DEL TALLER | el taller ↔ los interiores ↔ el cuaderno |

## 7 · Veredictos suspicaces de la Mesa

1. **La web NO copia la barra de la app.** El mapa es el menú; los edificios son las pestañas. Una barra de 10 pestañas en la web sería la app en el sitio equivocado.
2. **La Lotería es el termómetro de la casa.** Una misión, dos opciones. El día que pida tres botones, algo se corrompió arriba.
3. **El semáforo es UNA luz, no cuatro.** K3, K4, K10 y K1 son trabajo de calidad; mostrarlas como cuatro luces sería convertir la vigilancia en ruido. Una luz con su causa al tocarla.
4. **Las caravanas se enseñan como contrato, no como viaje.** Sin motor medido, NO_DATA con causa. La Aduana muestra el contrato y confiesa lo que aún no corre.
5. **La novena ya tiene nombre: Harness, y ya vive en el HTML.** Medidas las nueve contra zonas.js y app.html: Mando, Conversación, Gobierno, Cuaderno, Lab, Harness, Puerta pública, Modelos y Ajustes. La zona Modelos hospeda el OpenWorld; los cerebros viven en la flechita del cabecero y la lista del Lab. El Terminal del Usuario queda sin pestaña: su color te sigue en la cara web.
6. **Ajustes es hoy el cuello de botella de la app: 8 tarjetas medidas en una sola zona.** Mudanzas propuestas: las tres tarjetas de la cédula del nodo → Gobierno; anidar y la bandeja → Cuaderno. Ajustes queda con 5 opciones.
7. **Las 131 misiones caben en menos de 60 opciones.** La web: 38 en 10 puertas. La app: 36 en 9 zonas y un cabecero. El Lab: 5. La casa acumula trabajo detrás de las puertas, no botones en las paredes.
8. **La web ya tiene material en las diez puertas: 115 piezas medidas en el juego servido.** El Albergue tiene welcome_card; la Lotería, gacha; el Coliseo, wave_duel_scene y visitor_conquest; el Ágora, building_chat y live_invocation; el Taller, ui-workshop y acho_editor; el Mapa, map_painter, fog_of_war y map_view_joystick; la Casa, face_terminal y crab_render_hd; la Aduana, node_signature_verify; el Médico, acho_letters y acho_language. Se compone lo medido: no se dibuja desde cero.
9. **El reparto respeta el renombramiento:** los nombres de la casa (el Coro, el Albergue, la Aduana de Tres Llaves, el Médico de Guardia, la Lotería Honesta, el Duelo de Varianza Baja) se citan UNA vez aquí y el preceptor los rebautiza en pantalla como declare su plan: dentro de la jaula, decide y declara.

## 8 · Lo que falta decidir (roza este reparto, no lo bloquea)

- La K doble: cosecha de campaña vs censo de ideas (el índice las mantiene como dos rankings: el tablero N por ley #713, la escalera L como familia de instrumentos).
- La mudanza de tarjetas de la app (cédulas → Gobierno; anidar y bandeja → Cuaderno): FIRMO del preceptor gráfico cuando amueble.
- La estética exacta de cada puerta: del plan del preceptor. Este documento da el número de opciones y la lista de misiones por puerta; el resto lo declara él dentro de la jaula.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
