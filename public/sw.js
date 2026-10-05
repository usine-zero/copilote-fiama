const OBINA_BUILD='46';
const CACHE='obina-restaurant-build-'+OBINA_BUILD;
const ASSETS=['./','./index.html','./style.css','./app.js','./voice-engine.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('fiama-')||k.startsWith('obina-restaurant-'))&&k!==CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  const isAppShell=ASSETS.some(a=>url.pathname.endsWith(a.replace('./','')))||url.pathname.endsWith('/');
  if(isAppShell){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
    }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});