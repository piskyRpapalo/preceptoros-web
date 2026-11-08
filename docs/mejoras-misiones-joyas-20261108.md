# Las mejoras de las misiones: las joyas del original medidas al detalle (2026-11-08)

Encargo del Soberano: escribir ya las mejoras de las misiones con las joyas de las piezas del original como inspiración. No las joyas que se ven desde lejos (esas ya viven en el cruce, docs/cruce-mina-gentle-hub-20261108.md): las que solo se ven leyendo el original línea por línea, con número medido. El original se midió en clon fresco (gentle-dot, cabeza 9732fb31, 6 de noviembre) y las bases propias de la casa se contaron hoy. Ley intacta: nada se injerta, se destila; cada número se mide, jamás se adivina; la fila única del índice manda (docs/indice-territorios-ste-20261108.md).

## 1. La ley del detalle

1. CADA NÚMERO SE MIDE. Ninguna mejora dice "más rápido" o "más grande": dice el número del original, y la casa lo re-mide al destilarlo.
2. EL GESTO ES LA JOYA. Los gestos (la pregunta que se hace visible, el negar gratis, el icono que cambia solo) valen más que los algoritmos: el gesto viaja, la piel no.
3. LA PIEL ES ACHO. Nombre, matemática y código se re-escriben nativos; del original solo cruzan el gesto y el número, siempre citados.

## 2. Las mejoras, misión por misión

### A5 · el plegado con presupuesto medido
Original: gentle-dot, packages/daemon/src/rotation.ts (medido: 9732fb31).
- El techo: la sesión viva se reemplaza al pasar 20 MB de archivo o 10 compactaciones (límites ajustables por variable de entorno).
- La semilla: la sesión nueva arranca con el último resumen de compactación, y ese resumen el motor ya lo escribió: cero llamadas extra al modelo. La compactación no es gasto: es ahorro.
- Antes de la primera compactación: el relevo previo más los últimos 12 mensajes, cada uno recortado a 2.000 caracteres.
- La nota de relevo es invisible: el usuario ve un solo chat continuo; la nota solo le dice al motor que siga natural y no la mencione.
- La línea rota se salta: el archivo se lee línea por línea y una línea rasgada no tumba la memoria.
Mejora: A5 estrena presupuesto medido (techo en bytes contados; relevo por resumen ya escrito; los últimos 12 recortados a 2.000). El techo de la casa se calibra contra los turnos reales: el más largo medido hoy ocupa 6.143 bytes.

### B1 y F10 · la cola que te espera, con los gestos de la pregunta
Original: gentle-dot, packages/ui/src/components/AskCard.tsx.
- La pregunta se hace visible: la tarjeta se trae a la vista, al hueco más cercano, cuando llega bajo una conversación larga. Ninguna pregunta muere abajo del doblez.
- NEGAR ES GRATIS: aprobar pide el PIN de la web; declinar no pide nada. La puerta cuesta al entrar, no al salir.
- Dos métodos medidos: en la app nativa la pregunta sale en diálogo propio y la web solo muestra que espera; en la web con PIN, el PIN vale para aprobar y el botón de negar va al lado.
Mejora: la cola de FIRMO estrena sus gestos: la tarjeta de la firma se trae a la vista; negar no cuesta; aprobar pide la llave. La lista de espera vive en el Mando con sting.

### E4 y B5 · los cuatro estados, con cara y con causa
Original: gentle-dot, apps/desktop/src-tauri/src/status.rs y el registro del propio demonio.
- Cuatro estados nativos con icono propio por estado: listo, trabajando, te necesita, no disponible. El icono cambia solo: cero tokens. El estado es del sistema, no del modelo.
- El estado no disponible trae causa medida del registro: el conector no responde (la conexión se cerró) o la respuesta se cortó sin razón de fin.
Mejora: la tabla semántica del Mundo gana las causas: cada habitante muestra su estado y, si está caído, su causa.

### B8 y L3 · el sello interno del molde
Medido en el decisor propio de la casa: cada conjunto de reglas lleva su propio sha256 dentro; si el sello no cuadra con las reglas: "se tocaron sin sellar", y se rechaza (fail-closed). La huella de entrada sin forma se recalcula y se declara la causa.
Mejora: el juez (B8) y el inventario de schemas (L3) adoptan la misma ley: todo conjunto viaja con su sello interno; el sello que no cuadra es molde tocado sin sellar.

### N6 · la huella de la cara
Medido en los tests de la cara: los archivos del juego público van clavados por sha256; si alguien edita una copia, el test lo canta.
Mejora: la huella ya viva se declara joya propia y se extiende al recibo del taller: cada pieza de la cara lleva su hash.

### G2 · el presupuesto del pensar, por escala
Medido en la casa: el juez rápido pide pensar bajo con techo de 512 fichas; la guía pide 2.048; la traza de razonamiento se muestra solo si fue compleja; y el lector de respuestas entiende las dos formas: un modelo con plantilla de pensamiento devuelve el contenido en el campo de pensamiento.
Mejora: G2 come primero esta tabla: 512 el juez, 2.048 la guía, la traza solo si fue compleja, el lector de las dos formas del campo.

### L2 y F6 · el pulso con escala real
Medido hoy en la base de bucles de la casa: 4 bucles, 12.894 latidos, 381 hallazgos (el detalle más largo: 1.122 bytes), 123 corridas del laboratorio, 10 estados.
Mejora: el censo vivo (L2) muestra la escala contada, no una barra inventada: latidos, hallazgos y corridas desde la base.

### B2 · la memoria con la cara puesta
Medido hoy en la base de memoria de la casa: 4 engramas con su índice de texto completo vivo, 154 salidas, 148 turnos, la pregunta más larga 6.143 bytes, la respuesta más larga 357 bytes; y 6 conversaciones con su propio índice de texto completo.
Mejora: la cara del Lab muestra los números propios: engramas, salidas, turnos. SQLite con índice de texto completo es el canon del original (engram) y ya galopa en casa; el original presta la cara (su TUI propia) y la ley: guardar y recordar son actos separados.

### A4 con C6 y K3c · la música por estado
Original: gentle-stream (push medido el 6 de noviembre; la rama principal quedó el 23 de octubre): música generativa dirigida por el ánimo.
Mejora: el ánimo se alimenta de los cuatro estados de la tabla semántica; la síntesis (FM pentatónica, 220 Hz) es del canon propio. El original presta el gesto: el mundo suena según quién vive en él.

### F1 · la llave con gesto medido
Original: gentle-dot, secure_store y el patrón PIN del original: las credenciales se teclean en la app, jamás en el chat; los conectores importados nacen de solo lectura, con sus herramientas escondidas, y piden permiso uno por uno; el borrador de conector empieza igual: solo lectura.
Mejora: el paquete de 2 clics estrena el gesto: la llave se teclea una vez en ajustes, jamás en la conversación; cada conector externo nace de solo lectura y pide por caja.

### H4 · la compuerta fuera del alcance
Original: gentle-dot, approvals: la compuerta vive fuera del alcance del agente; el permiso vale por sesión; el modo sin freno dura máximo 1 hora y solo lo enciende el humano.
Mejora: H4 cierra con la ley medida: la compuerta no la alcanza el agente; negar es gratis; el sin freno expira solo.

## 3. Las joyas que faltaban (las que solo se ven leyendo línea por línea)

1. El resumen ya escrito se reutiliza: la sesión nueva no pide nada al modelo. Compactar es ahorrar.
2. NEGAR ES GRATIS: el costo de la puerta está en entrar, no en salir.
3. La pregunta se trae a la vista: ninguna tarjeta muere abajo del doblez.
4. El icono por estado sin tokens: el estado es del sistema, no del modelo.
5. El sello interno: tocar sin sellar se canta solo.
6. La línea rota se salta: la memoria no tumba por un archivo rasgado.
7. El presupuesto del pensar por escala: 512 el juez, 2.048 la guía, la traza solo si fue compleja.

## 4. La fusión al registro único

Estas líneas no hacen lista aparte: al decretarlo, cada mejora se funde en su fila del índice de 131 (el registro único de la fábrica, B1), con su cita y su número. Tres listas paralelas son el foco duplicado que G6 vigila.

## 5. El orden para los preceptores

1. codex: A5 con los números del plegado; luego la cola (B1 y F10) con los gestos.
2. claude: la tabla de estados con causas (E4 y B5); luego la música (A4, C6, K3c).
3. La Mesa: el sello interno (B8 y L3); la embajada (M9) espera decreto.

## 6. Veredicto

El original no se copia: se mide. Siete gestos de detalle confirman la ley: el gesto viaja, la piel es Acho, y cada número que sube a un PR trae su medición al lado. Lo que la primera lectura de la mina trajo como filas, esta pieza lo trae como números: el plegado tiene techo, la pregunta tiene gesto, el estado tiene causa y el sello canta solo.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
