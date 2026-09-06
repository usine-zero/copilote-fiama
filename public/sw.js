const FIAMA_BUILD='44';
const CACHE='fiama-v1-build'+FIAMA_BUILD;
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin===location.origin && (u.pathname.endsWith('/app.js')||u.pathname.endsWith('/style.css')||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/'))){
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
