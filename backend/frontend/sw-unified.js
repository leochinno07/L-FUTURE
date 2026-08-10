const CACHE_NAME = 'lfuture-static-v1';
const API_CACHE = 'lfuture-api-v1';
const STATIC_ASSETS = [
  './inicio.html', './perfil.html', './diseños-3d.html', './diseños1.0.html',
  './global.css', './inicio.css', './perfil.css', './diseños-3d.css', './toast.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // API requests -> network first
  if(url.pathname.startsWith('/api/') || url.searchParams.has('api')){
    event.respondWith(
      fetch(req).then(res => { caches.open(API_CACHE).then(c => c.put(req, res.clone())); return res; }).catch(()=> caches.match(req))
    );
    return;
  }

  // Static assets -> cache first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => { caches.open(CACHE_NAME).then(c=>c.put(req,res.clone())); return res; }).catch(()=> {
      // fallback to index for SPA style
      if(req.mode === 'navigate') return caches.match('./inicio.html');
      return new Response('Offline', {status:503, statusText:'Offline'});
    }))
  );
});
