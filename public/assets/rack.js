/* preceptoros.org · el cerebro del rack.
 *
 * EL MODELO DEL QUE HABLA ESTA PAGINA NO VIVE EN TU NAVEGADOR. Vive en el rack
 * del Soberano y se sirve por un tunel. Por eso la portada ya no ofrece
 * descargar dos gigas ni buscarte una Ollama: no hace falta que pongas tu la
 * maquina. Abres, eliges idioma y hablas.
 *
 * TODO: tunel cloudflare pendiente. SON DOS COSAS, NO UNA.
 *
 * 1) LA RUTA, que NO es la que parecia. El tunel SI esta arriba: el Soberano
 *    lo levanto en `la-fragua` y enruta `api.preceptoros.org` hacia
 *    `127.0.0.1:9002` de ese nodo, donde corre `uvicorn agora_api:app`
 *    (FastAPI). O sea: al otro lado NO hay una Ollama, hay una app propia.
 *    El 404 medido el 2026-09-01 en `/`, `/api/tags` y `/openapi.json` no es
 *    de red ni de DNS: es que `agora_api` no publica todavia esas rutas.
 *
 *    Este fichero habla el contrato de Ollama --POST /api/generate, NDJSON,
 *    una linea por trozo, `eval_count` con los tokens reales-- porque es el
 *    que ya hablan `localai.js` y el rack. Para que esto conecte, `agora_api`
 *    tiene que exponer ESE contrato. Queda escrito como propuesta en
 *    `p0x/propuestas/`: `la-fragua` es propose-only desde aqui y su backend no
 *    se toca por SSH.
 *
 * 2) CORS, y sin esto el tunel solo no basta. Medido el mismo dia desde el
 *    navegador: `Access to fetch at api.preceptoros.org/api/generate has been
 *    blocked by CORS policy: No 'Access-Control-Allow-Origin' header`. Como
 *    quien contesta es FastAPI y no Ollama, la cabecera la pone `agora_api`
 *    con su `CORSMiddleware` y `allow_origins=["https://preceptoros.org"]`
 *    --no `OLLAMA_ORIGINS`, que aqui no pinta nada--. Se
 *    deja escrito aqui porque es exactamente la clase de detalle que se
 *    descubre dos veces: una hoy, midiendo, y otra dentro de un mes cuando el
 *    tunel este arriba y la pagina siga sin contestar sin decir por que.
 *
 * Con las dos cosas puestas, esto funciona sin tocar una linea de aqui.
 *
 * Mientras no apunte, la pagina NO finge: dice que no hubo respuesta, dice por
 * que, y te da el JSON para llevartelo a la IA que ya uses. Un chat que se
 * queda en blanco es peor que uno que explica su averia.
 *
 * CERO PETICIONES AL CARGAR, y no es una cortesia: es la frase del pie. Aqui
 * no se pregunta nada hasta que alguien manda un turno. Por eso tampoco hay
 * sonda de latencia -- el badge del cerebro se calla en vez de inventar un
 * cero, que es la regla de la casa para toda cifra que no se ha medido.
 */
(function () {
  var BASE = 'https://api.preceptoros.org';

  window.Rack = {
    base: BASE,
    /* NDJSON: una linea, un trozo. Es el formato de Ollama, y el tunel sirve a
       Ollama -- si algun dia se pone un adaptador delante, el contrato que hay
       que respetar es este, no el de OpenAI. */
    stream: function (modelo, prompt, alTrozo) {
      return fetch(BASE + '/api/generate', {
        method: 'POST',
        body: JSON.stringify({ model: modelo, prompt: prompt, stream: true })
      }).then(function (r) {
        // Un 404 con cuerpo JSON es exactamente lo que devuelve hoy el tunel
        // sin ruta. Se convierte en error AQUI para que el turno lo cuente con
        // su codigo, en vez de intentar leer un cuerpo que no es NDJSON.
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var lector = r.body.getReader(), dec = new TextDecoder();
        var resto = '', total = null;
        return (function leer() {
          return lector.read().then(function (t) {
            if (t.done) return total;
            resto += dec.decode(t.value, { stream: true });
            var lineas = resto.split('\n'); resto = lineas.pop();
            lineas.forEach(function (l) {
              if (!l.trim()) return;
              var o; try { o = JSON.parse(l); } catch (e) { return; }
              if (o.response) alTrozo(o.response);
              if (o.eval_count) total = o.eval_count;   // tokens REALES del motor
            });
            return leer();
          });
        })();
      });
    }
  };
})();
