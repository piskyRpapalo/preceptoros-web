const VERSION = 'preceptoros-2026-17-ar';
const SHELL = 'shell-' + VERSION;
const OBRA = 'obra-' + VERSION;

importScripts('/sw-listas.js?v=' + VERSION);

function rutasDelShell() {
  // Recencia y canon ingles (2026-10-25): las nueve portadas de lengua son 301 a `/`.
  // Sello 2026-10-28 (corte Norte 7, pieza C): /play/ sale del shell; el juego viejo ya no se precachea.
  return ['/', '/manifest.webmanifest'].concat(HUB);
}

function sinRedireccion(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(b => new Response(b, {
    status: res.status, statusText: res.statusText, headers: res.headers }));
}

function precachear(cache, rutas) {
  return Promise.all(rutas.map(r => fetch(r)
    .then(res => res && res.ok ? sinRedireccion(res).then(l => cache.put(r, l))
                               : null)
    .catch(() => null)));
}

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
  return IDIOMAS.indexOf(l) >= 0 ? l : 'en';
}

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
  if (req.method !== 'GET') return;                 

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/api/world-state') return;

  if (RED_PRIMERO.indexOf(url.pathname) >= 0) { e.respondWith(redPrimero(e)); return; }

  
  
  if (url.pathname.endsWith('.json') &&
      CONTENIDO_JSON.indexOf(url.pathname) < 0) return;
  if (req.mode === 'navigate') { e.respondWith(navegacion(e)); return; }
  e.respondWith(estatico(e));
});
