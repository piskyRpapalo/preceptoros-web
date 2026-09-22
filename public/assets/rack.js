/* preceptoros.org · el cerebro del rack.
 *
 * EL MODELO DEL QUE HABLA ESTA PAGINA NO VIVE EN TU NAVEGADOR. Vive en el rack
 * del Soberano y se sirve por un tunel. Por eso la portada ya no ofrece
 * descargar dos gigas ni buscarte una Ollama: no hace falta que pongas tu la
 * maquina. Abres, eliges idioma y hablas.
 *
 * EL TUNEL ESTA ARRIBA Y CONTESTA. Medido el 2026-09-22 desde el origen
 * `https://preceptoros.org`: `POST /api/generate` da 200, trae
 * `access-control-allow-origin` correcto y el modelo contesta. Hasta ese dia
 * este comentario anunciaba, como tarea pendiente, que al tunel le faltaban la
 * ruta y el CORS --- y las dos cosas llevaban tiempo hechas. Un comentario que
 * miente sobre el estado es peor que ninguno: la siguiente sesion lo cree.
 * (No se cita la frase vieja a proposito: una prueba vigila que no vuelva, y
 * citarla aqui la haria encontrarse a si misma.)
 *
 * Lo que se descubrio por el camino y sigue valiendo: al otro lado NO hay una
 * Ollama, hay `agora_api` (FastAPI) en `la-fragua`, que HABLA el contrato de
 * Ollama --POST, NDJSON, `eval_count` con los tokens reales--. Y el CORS lo
 * pone su `CORSMiddleware`, no `OLLAMA_ORIGINS`, que ahi no pinta nada.
 *
 * LA COLA. `agora_api` atiende de uno en uno (16,1 tok/s en total, igual con
 * uno que con ocho) y manda la posicion y la espera en cabeceras `X-Cola-*`
 * que llegan ANTES que el primer token. Este fichero las lee y las reparte con
 * `preceptor:cola`; las pinta `cola.js`. Y ante un 503 ya no tira el cuerpo:
 * el servidor dice la causa y el remedio, y el turno los ensena.
 *
 * Si algun dia deja de contestar, la pagina NO finge: dice que no hubo respuesta, dice por
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

  /* `cola.js` se pide aqui, al primer turno, y no desde la portada: el griego
     tiene 65 bytes libres y no cabe ni una etiqueta. Y asi se cumple «cero
     peticiones al cargar»: nada viaja hasta que alguien pregunta. */
  function asegurarCola() {
    if (window.Cola || document.getElementById('cola-js')) return;
    var s = document.createElement('script');
    s.src = '/assets/cola.js';
    s.id = 'cola-js';
    document.head.appendChild(s);
  }

  /* El ultimo estado se guarda en `Rack.cola` ademas de emitirse: si
     `cola.js` llega despues que las cabeceras, lo lee de ahi y descuenta el
     tiempo pasado con `t0`, en vez de empezar la cuenta de cero. */
  function avisa(d) {
    d.t0 = Date.now();
    window.Rack.cola = d;
    window.dispatchEvent(new CustomEvent('preceptor:cola', { detail: d }));
  }

  window.Rack = {
    base: BASE,
    /* NDJSON: una linea, un trozo. Es el formato de Ollama, y el tunel sirve a
       Ollama -- si algun dia se pone un adaptador delante, el contrato que hay
       que respetar es este, no el de OpenAI. */
    stream: function (modelo, prompt, alTrozo) {
      asegurarCola();
      return fetch(BASE + '/api/generate', {
        method: 'POST',
        /* `think: false` NO ES OPCIONAL, y hasta el 2026-09-20 no iba.
           Medido ese dia contra el tunel, con el modelo de la puerta
           (`qwen3:1.7b`, familia Qwen3, que piensa por defecto): la misma
           pregunta gasta 349 tokens y devuelve 1.142 caracteres de
           razonamiento en un campo `thinking` que este fichero NI SIQUIERA
           LEE --- solo mira `o.response` ---. O sea que TODA conversacion de
           preceptoros.org estaba pagando tiempo de pared por un texto que
           nadie iba a ver nunca.
           Es la trampa que el canon de la casa lleva escrita desde el
           2026-09-13 con MiniCPM5 --3.500 tokens en 77,8 s para no devolver
           nada-- y la que dice que un tag explicito no protege: el
           pensamiento viene del modelo, no del tag. Aqui llego por la puerta
           de atras, al cambiar la puerta a un modelo de esa familia.
           Ollama ignora el campo en los modelos que no piensan, asi que
           ponerlo siempre no cuesta nada y quita el pie de la piedra para el
           siguiente modelo de esa familia que entre. */
        /* UN TECHO DE TOKENS, y no es prudencia teorica. Medido en
           produccion el 2026-09-20: el modelo de la puerta SIN system prompt
           se metio en un bucle --- «Traducir entre idiomas» repetido unas
           ciento cincuenta veces --- y siguio escribiendo. Sin techo, un
           modelo que degenera escribe hasta agotar el contexto: en un
           telefono eso son minutos de bateria y una pantalla que crece sola.
           400 da de sobra para las tres frases que pide el papel de la casa,
           y corta el bucle en cuanto empieza. El que se corte se VE --- la
           respuesta acaba a media frase ---, que es mejor que una espera que
           no termina y no dice por que. */
        body: JSON.stringify({ model: modelo, prompt: prompt, stream: true,
                               think: false,
                               options: { num_predict: 400 } })
      }).then(function (r) {
        var cab = function (k) { return r.headers.get('X-Cola-' + k); };
        if (cab('Posicion') !== null) {
          avisa({ fase: 'cola', posicion: +cab('Posicion'),
                  espera: +cab('Espera-S'), estado: cab('Estado-Modelo'),
                  tope: +cab('Tope'), tokS: +cab('Tok-S') });
        }
        // UN ERROR SE CUENTA CON SU CAUSA, NO CON SU CODIGO. `agora_api`
        // responde a un 503 con `{estado, causa, remedio}` --- «la cola esta
        // llena (12 de 12)», «vuelve en un minuto» --- y hasta el 2026-09-22
        // aqui se tiraba ese cuerpo y el turno decia solo «HTTP 503». Se deja
        // el codigo delante para que siga leyendose igual que antes.
        if (!r.ok) {
          return r.json().catch(function () { return null; }).then(function (j) {
            var d = (j && (j.detail || j)) || {};
            // «llena» se reconoce por la causa que escribe `agora_api` en su
            // tope de cola. Es un acoplamiento a su redaccion, y por eso
            // queda dicho: si cambia esa frase, el aviso vuelve a ser generico.
            avisa({ fase: /cola/.test(d.causa || '') ? 'llena' : 'fin',
                    causa: d.causa, remedio: d.remedio });
            throw new Error('HTTP ' + r.status
              + (d.causa ? ' · ' + d.causa : '')
              + (d.remedio ? ' · ' + d.remedio : ''));
          });
        }
        var lector = r.body.getReader(), dec = new TextDecoder();
        var resto = '', total = null, primero = true;
        return (function leer() {
          return lector.read().then(function (t) {
            if (t.done) { avisa({ fase: 'fin' }); return total; }
            resto += dec.decode(t.value, { stream: true });
            var lineas = resto.split('\n'); resto = lineas.pop();
            lineas.forEach(function (l) {
              if (!l.trim()) return;
              var o; try { o = JSON.parse(l); } catch (e) { return; }
              if (o.response) {
                if (primero) { primero = false; avisa({ fase: 'generando' }); }
                alTrozo(o.response);
              }
              if (o.eval_count) total = o.eval_count;   // tokens REALES del motor
            });
            return leer();
          });
        })();
      }).then(null, function (e) {
        // Red caida, CORS, stream roto: la cuenta atras no puede quedarse
        // colgada en pantalla prometiendo una respuesta que ya no llega.
        avisa({ fase: 'fin' });
        throw e;
      });
    }
  };
})();
