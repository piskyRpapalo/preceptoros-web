/* preceptoros.org · el idioma del Manifiesto.
 *
 * La pagina vive en la raiz, como `hitos.html`, asi que no hereda el idioma de
 * su carpeta: se lo pregunta al navegador y cae al castellano. Es la misma
 * solucion que la otra pagina de raiz, y por eso no estrena mecanismo.
 *
 * No se guarda ni se pregunta: esta pantalla se ve una vez y se cierra. Quien
 * quiera cambiar de idioma lo hace en el sitio donde eso se decide.
 */
(function () {
  var bloque = document.getElementById('i18n');
  if (!bloque) return;
  var todos;
  try { todos = JSON.parse(bloque.textContent); } catch (_) { return; }
  var quiere = (navigator.language || 'es').slice(0, 2).toLowerCase();
  var t = todos[quiere] || todos.es;
  if (!t) return;
  document.documentElement.lang = todos[quiere] ? quiere : 'es';
  document.getElementById('titulo').textContent = t.titulo;
  document.getElementById('cuerpo').textContent = t.cuerpo;
  var s = document.getElementById('saltar');
  s.setAttribute('aria-label', t.saltar);
  s.title = t.saltar;
  // El pie tambien se traduce: una pagina que declara como se produce y lo
  // declara en un idioma que no es el de quien mira no ha declarado nada.
  if (t.pieTitulo) document.getElementById('pie-titulo').textContent = t.pieTitulo;
  if (t.pie1) document.getElementById('pie-1').innerHTML = t.pie1;
  if (t.pie2) document.getElementById('pie-2').innerHTML = t.pie2;
})();
