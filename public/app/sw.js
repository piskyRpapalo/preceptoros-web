/* Public APP static shell. Never intercept or cache /api or remote requests. */
const CACHE='preceptoros-public-mini-ba3802be6db9';
const BASE=new URL('./',self.registration.scope);
const ASSETS=['./','./index.html','./app.css','./public-mini.css','./documents.js',
'./owner_model_slots.js','./companion_onboarding.js','./node_registration.js',
'./mini_project_guide.js','./offline_mini.js','./public-boot.js','./manifest.webmanifest',
'./assets/icono-192.png','./assets/icono-512.png','./assets/icono-512-maskable.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('preceptoros-public-mini-ba3802be6db9')&&k!==CACHE)
    .map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||
     !url.pathname.startsWith(BASE.pathname)||url.pathname.includes('/api/'))return;
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
