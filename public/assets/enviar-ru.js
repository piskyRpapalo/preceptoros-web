/* preceptoros.org · los rotulos de la puerta hacia el rack. Uno por lengua.
 *
 * POR QUE VIVEN FUERA DEL HTML, medido el 2026-09-14. Estas ocho claves estaban
 * repetidas en TRES paginas por OCHO lenguas: veinticuatro copias de las mismas
 * ocho frases. Y no era solo peso -- `el/index.html` se salio del tope de 16 KiB
 * en cuanto se tradujeron de verdad: seis lenguas las llevaban EN INGLES, que es
 * el mismo respaldo silencioso que ya tiene entrada propia en OPTIMIZACIONES
 * (A17), solo que en otro idioma.
 *
 * Veinticuatro copias no divergen «si alguien se descuida»: divergen seguro. La
 * prueba es que ya lo habian hecho.
 *
 * POR QUE UN `.js` Y NO UN `.json`. Por lo mismo que `prompts-<idioma>.js`, y
 * esta medido alli: el service worker excluye los `.json` del cache salvo los
 * tres que nombra --son MEDIDAS, y una medida vieja con cara de fresca es una
 * averia-- asi que un `.json` no se cachearia y la puerta se quedaria muda sin
 * red. Un `.js` cae en la rama `estatico`: cache primero, disponible sin
 * esperar a nadie.
 *
 * `enviar.js` sigue llevando su respaldo en castellano por si este fichero
 * faltara. Eso es degradar, no romper -- pero el respaldo NO es traduccion, y
 * por eso el gate comprueba que las ocho lenguas existan.
 */
window.ENVT = {
 "envBoton": "Отправить в стойку",
 "envEnviando": "Запрашиваем задачу…",
 "envEncolado": "Отправлено и в очереди на проверку. Стойка ничего не публикует, пока это не посмотрит человек: ",
 "envFallo": "Не удалось отправить",
 "envSinCanal": "стойке пока некуда их принимать",
 "envSinFirmaTexto": "личность этого браузера пока не умеет подписывать задачу",
 "envRemedio": "Твоя работа остаётся подписанной на твоём устройстве. Экспортируй файл из «Исправить этот ответ» и передай его как сможешь.",
 "envAviso": "Они идут подписанными и с твоим открытым ключом. Стойка ставит их в очередь на проверку человеком: ничего не публикуется автоматически."
};
