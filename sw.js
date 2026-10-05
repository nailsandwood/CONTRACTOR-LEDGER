// Contractor Ledger service worker: lets the page open without internet.
const CACHE = 'nw-ledger-v1';
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html'])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never touch Google login / Drive API traffic (fonts are fine to cache)
  if(/(^|\.)(googleapis\.com|accounts\.google\.com|apis\.google\.com|gstatic\.com)$/.test(url.hostname) && !/^fonts\./.test(url.hostname)) return;
  const isPage = req.mode === 'navigate' || url.origin === location.origin;
  if(isPage){
    // network first (so updates arrive), fall back to saved copy when offline
    e.respondWith(fetch(req).then(res=>{
      const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res;
    }).catch(()=>caches.match(req).then(r=> r || caches.match('./index.html') || caches.match('./'))));
  } else {
    // libraries/fonts: cache first
    e.respondWith(caches.match(req).then(r=> r || fetch(req).then(res=>{
      const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res;
    })));
  }
});
