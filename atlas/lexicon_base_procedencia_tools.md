# Base del lexicon · procedencia de las entradas nuevas (tools-tab, PR #396)

| Fichero | Palabra | Donde aparece | Por que se registra |
|---|---|---|---|
| public/index.html | superviviente | identificador del cerebro en cerebros.json (`id`); pintado en el encabezado de cada cerebro | es la clave comun de los cinco ficheros cerebros-<idioma>.json (pt, de, fr, ar, es). Renombrarla exige tocar los cinco y las traducciones: cambio de datos, no de copy. |
| public/index.html | cerebro-superviviente | id del ancla del articulo (`cerebro-<id>`) | derivado del mismo id |

Alternativa no tomada: cambiar el id en cerebros.json y en las cinco traducciones. Decision pendiente del Soberano.
