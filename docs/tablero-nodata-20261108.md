# El tablero del hueco honesto · El ranking de NO_DATA (2026-11-08)

> Decreto del Soberano (2026-11-08): «las misiones más difíciles son las que tienen más NO_DATA: hay que construir algo antes para tener más información». Este documento convierte ese decreto en la ley del ranking del mapa de misiones: cada hueco NO_DATA del corpus es una misión, o el prerrequisito de una. El preceptor juega construyendo; el Soberano firma UNA vez por pieza entera. Propose-only. La fuente única sigue siendo la sección 9 del canon; este tablero la ORDENA por dificultad.

## 1 · La ley del ranking

- Un hueco NO_DATA con causa y vara es una misión esperando dueño. Un hueco sin vara medible es una misión DORMIDA: se cita, no se inventa.
- **Dificultad = cuántos huecos la misión convierte en MEDIDO + cuántas piezas hay que construir antes.** Rango I (1-2 huecos, sin prerrequisitos) a Rango IV (5 o más, cadena de 2+ misiones).
- **El desbloqueo es el juego**: completar la misión N produce el recibo que la misión N+k necesitaba. El hueco de hoy es la puerta de mañana: construir la pieza anterior ES tener más información.
- **Una FIRMO por pieza entera**: la pieza se construye completa antes de pedir la firma; el Soberano firma la cabeza exacta una sola vez, nunca por trozos.
- Tras cada merge el tablero se re-mide: el rango de cada misión se recalcula contando sus huecos restantes. Se cuenta, no se estima.

## 2 · El censo de huecos (medido del corpus, 2026-11-08)

| Hueco | Causa | La vara que lo mide | Misión |
|---|---|---|---|
| «27 benchmark sessions» del perfil | conteo no verificado contra el listing del lab | conteo del listing, comando+fecha+máquina | N1 |
| «colonia measured live 2026-11-01» | falta el recibo de ese día | recibo del faro o contadores con su SHA | N2 · SERVIDA (#738, 3a83bccf) |
| tope de 16 KiB servido en texto público | ley revocada por D2: 25 MiB por bloque, 1.024 B para frames y llms | diff del texto público contra el canon | N3 · MEDIDA (#739, ac37a62c) |
| residentez del cerebro en la web | saberlo exige API local que la ley no deja llamar en la página | frame proyectado con CAUSA_RESIDENTE | N4 · SERVIDA (#742, 24365369) |
| paridad de proyección app/web | las implementaciones difieren | el mismo frame clavado por sha256 en ambas | N4 · SERVIDA (#742, 24365369) |
| matemática no firmada que corre en el mapa | lo PROPOSED no renderiza sin FIRMO | declaración de piezas firmadas + test | N5 |
| regresión visual invisible | sin hash sellado del conjunto de frames | guardián de hash en CI | N6 |
| presupuesto de bytes sin número | «dentro del presupuesto» declarado en ningún contrato | techo por chunk y por vecindad EN el contrato | N7 · SERVIDA (#737, 1f667006) |
| jugable desde fuera sin probar | CI verde no es jugable | PRUEBA_5_MINUTOS de un humano real con recibo | N8 |
| instalación limpia sin cronómetro | nadie la midió de punta a punta | cronómetro en flota limpia, por destino | N9 |
| Windows y macOS sin probar | instalación medida solo en Linux | la misma vara por destino | N9 |
| APK Android inexistente | sin empaquetado medido | la misma vara, o «no probado» con causa | N9 |
| coder útil en 8 GB | nadie midió un coder pequeño en el teléfono débil | RAM pico + tok/s + UNA tarea real | N10 |
| julios por token y vatios | sin sensor de energía | sensor medido o NO_DATA sensor_not_exposed | N11 |
| sello energético del hardware | sin medida no hay sello | la vara del sensor, primero | N11 |
| aprendizaje real del usuario | NO_DATA si no deja artefacto medible | el ciclo cerrado del Lab | N12 |
| evidencia LIVE de la creación firmada | audio y tacto físicos sin medir en el rack | medición física con recibo | N12 |
| cumplimiento legal completo | postura de diseño no es cumplimiento | firma de humano cualificado | N14 (dormida) |

> **Re-medida (2026-11-09, main 8d338bd7):** N2, N3, N4 y N7 cerradas el 8-nov — PR #738 (merge 3a83bccf), #739 (ac37a62c), #742 (24365369) y #737 (1f667006); N5 y N6 pierden su prerrequisito. Filas actualizadas abajo.

## 3 · Las misiones por rango

### Rango I · El patio (sin prerrequisitos: el preceptor con tiempo hoy empieza aquí)
- **N1 · Count the sessions**: contar el listing del lab y ajustar o reportar la cifra del perfil. El perfil es manos del Soberano: el drift se REPORTA con fichero:línea, no se edita.
- **N2 · Show the receipt**: hallar y citar el recibo del 1 de noviembre, o declararlo ausente con causa. **Servida (2026-11-08, PR #738, merge 3a83bccf):** el recibo del 1-nov quedó declarado ausente con causa (counters 404 en historial; el recibo más antiguo medido es del 2026-11-02).
- **N3 · Retire the dead law**: proponer (jamás editar sin decreto) la línea que sustituye el tope revocado en los textos públicos. **Servida (2026-11-08, PR #739, ac37a62c):** medido; no quedaba ley muerta que retirar en los textos de la web (el llms.txt del perfil, primer caso, es mano del Soberano).

### Rango II · La escalada (1 prerrequisito)
- **N4 · Project the first frame** (desbloquea N5 y N6): el censo de cerebros proyectado a silueta Acho <1.024 B, con su NO_DATA de residentez pintado como CAUSA_RESIDENTE; verificado por el juez; la misma huella en app y web. Una pieza, dos huecos: residentez y paridad. **Servida (2026-11-08, PR #742, 24365369).**
- **N5 · Declare the map mathematics** (pide N4): la lista de piezas del canon FIRMADAS que corren en el mapa; lo propuesto renderiza NO_DATA con causa «matemática propuesta, no firmada».
- **N6 · Guard the frames in CI** (pide N4): hash sellado por conjunto de frames: una regresión visual se vuelve roja sin ojo humano.
- **N7 · Declare the byte budget**: techo por chunk y por vecindad visible escrito EN el contrato del mapa; la fase visual hereda una ley, no una esperanza. **Servida (2026-11-08, PR #737, 1f667006).**

### Rango III · La cadena (2 prerrequisitos)
- **N8 · Prove the five minutes of the visitor** (pide la cuenta efímera, el tutorial, los duelos y el gacha): la partida de diez minutos que se sostiene sola, jugada por un humano real desde fuera, con recibo. Es el gate que CI no puede dar: verde en CI no es jugable fuera.
- **N9 · Time the install** (pide el instalador verificado): cronómetro de instalación limpia por destino; Windows, macOS y el APK salen de NO_DATA o quedan con causa «no probado».
- **N10 · Measure the small coder** (pide la flota): RAM pico, tok/s y UNA tarea real del coder pequeño en el teléfono débil, antes de prometer el búnker de orquestación.
- **N11 · Stamp the honest energy** (pide sensor): vatios medidos o NO_DATA sensor_not_exposed; habilita el precio figurado del censo y el sello del hardware. Dueño: el rack; la web solo lee.

### Rango IV · Los jefes (se abran al cerrar las anteriores)
- **N12 · Close the factory loop (LAB-4)** (pide N8 y N11): F2 escribe como preceptor más, los benchmarks corren LIVE con sello de procedencia, el LoRA come preguntas medidas: la fábrica se alimenta a sí misma. El aprendizaje del usuario sale de NO_DATA cuando deja artefacto medible; la evidencia LIVE de la creación exige audio y tacto medidos en el rack.
- **N13 · Paint the provenance sky** (pide el productor de estado y los sellos): cada recibo de la cadena una estrella; la constelación ES la crónica de la casa. Es el set-piece final de la campaña: se mira hacia arriba.
- **N14 · The qualified review** (DORMIDA): cumplimiento legal = NO_DATA hasta firma de humano cualificado; la casa declara postura de diseño, jamás cumplimiento. Despierta cuando llegue el revisor; sin ella, la fase de publicación no saca imagen ni vídeo.

## 4 · Misiones dormidas con cita (no se inventan)
- Esporas P2P y canal acústico entre nodos: puerta territorial firmada (sin canales encubiertos).
- La Grieta: despierta tras el cierre de la integración (decreto); hoy es textura honesta.
- Audio Worklets en tres capas: sin dispositivo nativo medido no hay capa.

## 5 · Cómo se juega
UNA pieza por PR · la pieza ANTES de la firma · rama sobre main fresco · SCRUB · recibo <1.024 B con la cuenta de huecos convertidos («N4 cierra 2: residentez, paridad») · CI verde · FIRMO del Soberano por cabeza exacta. El preceptor elige por impacto × desbloqueo × coste; el ranking dice qué pesa, no quién manda. El tablero se re-mide tras cada merge: cerrar una misión rebaja el rango de las que la esperaban.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
