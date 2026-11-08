# La union del tablero · adenda a las misiones v2 (openrig, la maquina declarada)

> Adenda a docs/misiones-claude-clave-v2-20261108.md (canon). El decreto pedia el patron de openrig: orquestacion multi-agente por maquinas de estado declarativas sobre nodos aislados. La v2 lo absorbe en A6 sin cita de fuente. Esta pieza lo cita, lo renombra con nombre ya acuñado y cose la union. No crea misiones. No reescribe leyes. Cero codigo. Propose-only.

## 1 · El patron de openrig, con nombre de la casa

openrig (github.com/mvschwarz/openrig) orquesta varios agentes con maquinas de estado declarativas sobre nodos tmux aislados.

- ADAPTAMOS: los estados del coro viven en UNA tabla declarativa. El supervisor LEE la tabla, no a los agentes. Cada agente vive en su celda aislada. La tabla manda; el codigo obedece.
- RECHAZAMOS: los nodos tmux. La casa no tiene tmux. La celda de la casa es un proceso hijo con lease (mision L4). RECHAZAMOS toda capa de consenso (veto ya servido con la celda dormida).
- RENOMBRAMOS: nada. La casa ya nombro el concepto: LA MAQUINA (mision D5, la tabla declarativa de estados). Un nombre por concepto: manda Babel. openrig cita su fuente UNA vez; LA MAQUINA ya es de la casa.

## 2 · La union de puertas (lo que ninguna pieza dijo sola)

LA MAQUINA ya vive en tres puertas. La union las cose con UNA gramatica:

1. LA CARAVANA (caravana_schema.json, maquina de 6 estados): la gramatica nativa del mundo.
2. EL DUELO (D5): la misma tabla declarativa, validacion absoluta por transicion.
3. EL CORO (A6): los estados del coro como datos, no como codigo.

La regla de la union: UNA sola familia de esquema alimenta las tres. Quien funde una cuarta gramatica, escribe una pieza sobrante (G6). La v2 ya lo dice para los jueces del CI; esta adenda lo extiende a las maquinas de estado.

## 3 · Lo que A6 agrega (las piezas que escribe claude)

1. LA TABLA DEL CORO: los estados del coro como UN fichero de datos, misma familia que caravana_schema.json. El supervisor jamas escribe un estado en codigo.
2. EL SUPERVISOR LEE: el supervisor consulta la tabla y las celdas; despierta en el evento (gate rojo, pregunta nueva); cero cron (ley del despertador). Tope de lectura 5 s.
3. LA CELDA SIN LEASE DUERME: coste casi cero (ley ya servida). El lease es un estado mas de la tabla.

La vara: la misma tabla produce el mismo coro; una transicion ilegal cierra la ronda, no la arregla. Alimenta: B4, CL1, L4.

## 4 · La cuenta de la v2, declarada

La Mesa conto la pieza v2 con bucle codePointAt: 17.179 B (el cuerpo del PR declaro 17.095 B; manda la cuenta de la Mesa).

- Ley dura del bloque publico: 25 MiB (el tope de 16 KiB murio por firma D2, 2026-10-11). La v2 cumple con holgura.
- Techo de 16.384 B: la ley escrita lo asigna a las piezas del LIBRO (el libro unico de firmas). La v2 no es una pieza del LIBRO.
- Lectura de eficiencia (la de N3: 16.384 B por pieza como ley viva de eficiencia): la v2 la supera por 795 B. LITIGIO DECLARADO. FIRMO decide: o la v2 se recorta 795 B en una pieza de cura, o la lectura de eficiencia queda acotada al LIBRO. La Mesa no recorta sin decreto: nada se borra sin FIRMO.

## 5 · Cierre

Recibo en la puerta 19 del canal de la casa, con la cuenta exacta. Comentario corto en la puerta 54 al cerrar. Propose-only: nada se fusiona sin FIRMO del Soberano por cabeza exacta.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
