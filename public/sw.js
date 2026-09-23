/* preceptoros.org · Service Worker. App Shell del Agora.
 *
 * EL QUE HABIA NO ESTABA ENCHUFADO
 * --------------------------------
 * La version anterior cacheaba cuatro URLs y respondia `caches.match() ||
 * fetch()` a TODO -- incluida la API. Un cache-first sin caducidad sobre una
 * API sirve la misma respuesta para siempre: la peor forma de mentir, porque
 * la pagina no puede notarlo. Daba igual, eso si: ninguna pagina lo
 * registraba. Era un PWA sobre el papel y cero PWA en el navegador.
 *
 * TRES REGLAS, Y NINGUNA LISTA DE DOMINIOS
 * ----------------------------------------
 * No hay ni un host escrito aqui. La frontera es el ORIGEN, que el navegador
 * ya sabe: una lista de dominios permitidos envejece en cuanto cambia el
 * tunel, y envejece en silencio.
 *
 *   1. Otro origen (la API del Agora, el CDN de WebLLM) -> pasa de largo y NO
 *      se cachea nunca. Lo que no es nuestro no lo guardamos.
 *   2. JSON del propio sitio (counters.json, anuncios.json) -> solo red.
 *      Podria cachearse y quedaria mas bonito sin conexion, y seria la misma
 *      mentira que la portada publicando 19 pruebas cuando el gate media 26:
 *      cifras viejas con cara de frescas. Si no hay red, el fetch falla y el
 *      sensor de honestidad de la pagina dice NO_DATA con su causa. Eso es lo
 *      correcto, no un fallo que haya que suavizar.
 *   3. Navegacion y estaticos -> del cache, revalidando por detras.
 *
 * SIN CONEXION no se devuelve una pagina en blanco ni el dinosaurio del
 * navegador: se sintetiza aqui mismo. Sintetizada y no un fichero suelto por
 * dos motivos -- el techo de 7 paginas del gate, y que un fichero de respaldo
 * tambien puede faltar del cache justo el dia que hace falta.
 */
/* Subir VERSION o el cambio NO llega: ver `config/sw-huella.txt`. */
const VERSION = 'preceptoros-2026-17-abai';
const SHELL = 'shell-' + VERSION;
const OBRA = 'obra-' + VERSION;

/* Las listas de QUE se cachea viven en `sw-listas.js`, partidas por asunto
   el 2026-09-19 porque este fichero se quedo a 266 B del tope. El `?v=` no
   es adorno: ata la copia de las listas a esta version de cache. */
importScripts('/sw-listas.js?v=' + VERSION);

function rutasDelShell() {
  const r = ['/', '/hitos.html', '/manifest.webmanifest'].concat(HUB);
  for (const l of IDIOMAS) for (const p of PAGINAS) r.push('/' + l + '/' + p);
  return r;
}

/* UNA RESPUESTA REDIRIGIDA NO SE PUEDE SERVIR A UNA NAVEGACION, y esa es la
   averia que tumbo el sitio entero en Chrome el 2026-09-08. Cloudflare Pages
   sirve `/es/benchmark.html` con un 307 hacia `/es/benchmark`; `fetch` sigue el
   salto y la respuesta que vuelve trae `redirected: true`. Guardarla y luego
   devolverla desde el worker es justo lo que el navegador rechaza, y no con un
   404 sino con un ERR_FAILED seco -- por eso parecia el dominio caido y no una
   pagina rota. `/` y `/es/` se libraban por no llevar `.html`: son las unicas
   rutas que no redirigen.

   Se limpia AL ESCRIBIR, que es por donde entra, y se comprueba AL LEER,
   porque un shell de otra version puede seguir vivo en un telefono que no ha
   vuelto a instalar. El `.html` se conserva como clave: los enlaces del sitio
   lo llevan, y una clave sin extension no responderia a su peticion sin red. */
function sinRedireccion(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(b => new Response(b, {
    status: res.status, statusText: res.statusText, headers: res.headers }));
}

/* `addAll` es todo-o-nada: una sola ruta que devuelva 404 tumba la instalacion
   entera y el sitio se queda sin PWA por un fichero. Se piden de una en una y
   se tolera la que falte -- un shell incompleto sirve; ninguno, no. */
function precachear(cache, rutas) {
  return Promise.all(rutas.map(r => fetch(r)
    .then(res => res && res.ok ? sinRedireccion(res).then(l => cache.put(r, l))
                               : null)
    .catch(() => null)));
}

/* `skipWaiting` Y `claim`, y hacen falta los dos. Sin el primero un worker
   nuevo se queda en espera hasta que se cierran TODAS las pestanas del sitio:
   se despliega un arreglo, la persona recarga, y sigue viendo lo de ayer
   servido por el worker viejo. Con `estatico` --cache primero, refresco por
   detras-- eso son DOS recargas para ver un cambio, y la primera parece que no
   ha pasado nada. Se vio el 2026-09-05: las transparencias estaban en
   produccion y no se veian en el navegador de quien las pidio.

   El precio esta medido y se acepta: una pestana abierta puede pasar de la
   version vieja a la nueva a mitad de sesion. En un sitio estatico de siete
   paginas eso es un salto de estilos; en uno con formularios a medias seria
   otra conversacion. */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL)
    .then(c => precachear(c, rutasDelShell()))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => k !== SHELL && k !== OBRA).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

/* --- la pagina de sin conexion ---------------------------------------- */

const SIN_RED = {
  es: ['Sin conexión', 'Esta página no está en tu caché todavía.',
       'PreceptorOS corre en tu máquina; esta web solo es la puerta. '
       + 'Vuelve a intentarlo cuando tengas red.', 'Reintentar'],
  en: ['Offline', 'This page is not in your cache yet.',
       'PreceptorOS runs on your machine; this site is only the door. '
       + 'Try again when you have a connection.', 'Retry'],
  it: ['Senza connessione', 'Questa pagina non è ancora nella tua cache.',
       'PreceptorOS gira sulla tua macchina; questo sito è solo la porta. '
       + 'Riprova quando avrai la rete.', 'Riprova'],
  de: ['Keine Verbindung', 'Diese Seite ist noch nicht in deinem Zwischenspeicher.',
       'PreceptorOS läuft auf deinem Rechner; diese Seite ist nur die Tür. '
       + 'Versuch es wieder, wenn du Netz hast.', 'Erneut versuchen'],
  ru: ['Нет связи', 'Этой страницы пока нет в твоём кэше.',
       'PreceptorOS работает на твоей машине; этот сайт — только дверь. '
       + 'Попробуй снова, когда будет сеть.', 'Повторить'],
  el: ['Χωρίς σύνδεση', 'Αυτή η σελίδα δεν είναι ακόμη στη μνήμη σου.',
       'Το PreceptorOS τρέχει στο μηχάνημά σου· αυτός ο ιστότοπος είναι μόνο η πόρτα. '
       + 'Δοκίμασε ξανά όταν έχεις δίκτυο.', 'Ξαναδοκίμασε'],
  fr: ['Hors ligne', "Cette page n'est pas encore dans votre cache.",
       'PreceptorOS tourne sur votre machine ; ce site est seulement la porte. '
       + 'Réessayez quand vous aurez du réseau.', 'Réessayer'],
  pt: ['Sem ligação', 'Esta página ainda não está na tua cache.',
       'O PreceptorOS corre na tua máquina; este site é só a porta. '
       + 'Tenta outra vez quando tiveres rede.', 'Tentar de novo'],
  ar: ['بلا اتصال', 'هذه الصفحة ليست في ذاكرتك المؤقتة بعد.',
       'يعمل PreceptorOS على جهازك؛ هذا الموقع مجرّد الباب. '
       + 'حاول مجددًا حين تتوفّر الشبكة.', 'أعد المحاولة']
};

function idiomaDe(url) {
  const l = new URL(url).pathname.split('/')[1];
  return IDIOMAS.indexOf(l) >= 0 ? l : 'es';
}

/* R-WIDGET rige tambien aqui: el texto va dentro de un panel con su fondo y su
   color declarados. Una pagina de error es justo donde se cae la disciplina, y
   es la que se lee con peor luz y peor animo. */
function paginaSinRed(url) {
  const l = idiomaDe(url), t = SIN_RED[l];
  return new Response(
    '<!doctype html><html lang="' + l + (l === 'ar' ? '" dir="rtl' : '') + '"><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + t[0] + ' · PreceptorOS</title><style>'
    + ':root{--marmol:#E4E8EC;--panel-bg:#F2F5F7;--panel-fg:#1E1826;'
    + '--tenue:#5D5668;--violeta:#4B37C4;'
    + '--display:"Iowan Old Style","Palatino Linotype",Palatino,'
    + '"URW Palladio L","Book Antiqua",Georgia,"DejaVu Serif",serif;'
    + '--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}'
    + '*{box-sizing:border-box;margin:0}'
    + 'body{background:var(--marmol);font:15px/1.6 var(--mono);'
    + 'min-height:100dvh;display:flex;align-items:center;'
    + 'justify-content:center;padding:1.5rem}'
    + '.panel{background:var(--panel-bg);color:var(--panel-fg);'
    + 'border:1px solid rgba(30,24,38,.14);padding:1.4rem 1.6rem;'
    + 'max-width:32rem}'
    + 'h1{font-family:var(--display);font-size:1.35rem;margin-bottom:.5rem}'
    + 'p{margin-top:.6rem;color:var(--tenue);font-family:var(--display)}'
    + 'button{margin-top:1.1rem;font:inherit;font-family:var(--mono);'
    + 'color:var(--violeta);background:none;'
    + 'border:2px solid var(--violeta);padding:.5rem 1rem;cursor:pointer}'
    + '</style><body><main class="panel"><h1>' + t[0] + '</h1><p>' + t[1]
    + '</p><p>' + t[2] + '</p>'
    + '<button onclick="location.reload()">' + t[3] + '</button>'
    + '</main></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* --- estrategias ------------------------------------------------------- */

/* Stale-while-revalidate: se sirve lo que hay al instante --que es lo que
   mide el LCP-- y se refresca por detras para la proxima visita. */
function refrescarDetras(req, cache) {
  return fetch(req).then(res => {
    if (!res || !res.ok) return res;
    return sinRedireccion(res).then(limpia => {
      cache.put(req, limpia.clone());
      return limpia;
    });
  });
}

function navegacion(e) {
  return caches.open(SHELL).then(cache =>
    cache.match(e.request, { ignoreSearch: true }).then(guardada => {
      const red = refrescarDetras(e.request, cache).catch(() => null);
      if (guardada && !guardada.redirected) return guardada;
      return red.then(res => res || paginaSinRed(e.request.url));
    }));
}

/* Red primero, cache como red de seguridad. Lo contrario de `estatico`. */
function redPrimero(e) {
  return caches.open(OBRA).then(cache =>
    fetch(e.request).then(res => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cache.match(e.request).then(g => g || Response.error())));
}

function estatico(e) {
  return caches.open(OBRA).then(cache =>
    cache.match(e.request).then(guardada => {
      const red = refrescarDetras(e.request, cache).catch(() => null);
      if (guardada) return guardada;
      return red.then(res => res || Response.error());
    }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // regla 1: solo lecturas

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // regla 1: otro origen, de largo

  if (RED_PRIMERO.indexOf(url.pathname) >= 0) { e.respondWith(redPrimero(e)); return; }

  // regla 2: una MEDIDA se sirve fresca o no se sirve. El contenido declarado
  // en CONTENIDO_JSON queda fuera de esta regla, y por eso esta nombrado.
  if (url.pathname.endsWith('.json') &&
      CONTENIDO_JSON.indexOf(url.pathname) < 0) return;

  if (req.mode === 'navigate') { e.respondWith(navegacion(e)); return; }
  e.respondWith(estatico(e));
});
