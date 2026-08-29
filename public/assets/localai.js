/* preceptoros.org · buscar la IA local de quien mira.
   Si ya tienes Ollama corriendo, el cerebro mas soberano que puedes usar es el
   tuyo: cero descarga, cero nube, y con TUS modelos — incluido un LoRA propio.

   Solo se prueba 127.0.0.1. No es pereza: un navegador en https trata la
   loopback como origen de confianza y deja pasar la peticion, pero una IP de
   red (la del tailnet, por ejemplo) la bloquea por contenido mixto. Probar
   otra cosa seria prometer algo que el navegador va a cortar.

   Nada de esto ocurre al cargar: hay que pulsar. */
(function () {
  // 127.0.0.1 primero: es donde escucha Ollama recien instalado, y ademas el
  // navegador trata la loopback como origen de confianza aunque la pagina sea
  // https. Si no responde, se ofrece escribir otra direccion — util para quien
  // ata Ollama a una IP de red, como el rack de casa. Con la salvedad de que
  // desde https el navegador SOLO deja pasar la loopback: una IP de red la
  // corta por contenido mixto, y eso se dice antes de que alguien lo intente.
  var URL_BASE = 'http://127.0.0.1:11434';
  var block = document.getElementById('i18n');
  var zone = document.getElementById('motor');
  var fila = document.getElementById('local-ai');
  if (!block || !zone || !fila) return;
  var T = JSON.parse(block.textContent);
  var elegido = null;

  function nota(texto, clase) {
    var p = document.createElement('p');
    p.className = clase || 'tenue';
    p.textContent = texto;
    return p;
  }
  function buscar(boton) {
    boton.disabled = true;
    var salida = document.createElement('div');
    salida.appendChild(nota(T.laiBuscando));
    zone.appendChild(salida);
    fetch(URL_BASE + '/api/tags').then(function (r) { return r.json(); })
      .then(function (d) {
        salida.innerHTML = '';
        var modelos = (d.models || []).map(function (m) { return m.name; });
        if (!modelos.length) { salida.appendChild(nota(T.laiVacio, 'nodata')); boton.disabled = false; return; }
        salida.appendChild(nota(T.laiEncontrados + ' ' + modelos.length));
        var f = document.createElement('div');
        f.className = 'fila';
        modelos.forEach(function (n) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'leve'; b.textContent = n;
          b.addEventListener('click', function () {
            elegido = n;
            document.dispatchEvent(new CustomEvent('preceptor:localai', { detail: { modelo: n } }));
            salida.innerHTML = '';
            salida.appendChild(nota(T.laiListo + ' ' + n));
          });
          f.appendChild(b);
        });
        salida.appendChild(f);
      })
      .catch(function (e) {
        // Se declara la causa: sin Ollama y con Ollama-pero-sin-permiso son
        // dos averias distintas, y quien lee merece saber cual.
        salida.innerHTML = '';
        salida.appendChild(nota(T.laiNada + ' ' + (e && e.message ? e.message : e), 'nodata'));
        var otra = document.createElement('input');
        otra.type = 'text'; otra.placeholder = T.laiOtra; otra.value = URL_BASE;
        otra.setAttribute('aria-label', T.laiOtra);
        var ir = document.createElement('button');
        ir.type = 'button'; ir.className = 'leve'; ir.textContent = T.laiProbar;
        ir.addEventListener('click', function () {
          URL_BASE = otra.value.replace(/\/+$/, '');
          salida.remove(); boton.disabled = false; buscar(boton);
        });
        salida.appendChild(otra);
        var f2 = document.createElement('div'); f2.className = 'fila';
        f2.appendChild(ir); salida.appendChild(f2);
        salida.appendChild(nota(T.laiMixto));
        boton.disabled = false;
      });
  }
  // El turno contra Ollama, en streaming. NDJSON: una linea, un trozo.
  window.LocalAI = {
    modelo: function () { return elegido; },
    stream: function (prompt, alTrozo) {
      return fetch(URL_BASE + '/api/generate', {
        method: 'POST',
        body: JSON.stringify({ model: elegido, prompt: prompt, stream: true })
      }).then(function (r) {
        var lector = r.body.getReader(), dec = new TextDecoder(), resto = '', total = null;
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

  var boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'leve'; boton.textContent = T.laiBuscar;
  boton.addEventListener('click', function () { buscar(boton); });
  fila.appendChild(boton);
})();
