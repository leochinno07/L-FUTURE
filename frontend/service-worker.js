/**
 * service-worker.js - Modo Offline
 * Optimización Básica #7
 */

const CACHE_NAME = 'lfuture-v1';
const urlsToCache = [
    'inicio.html',
    'perfil.html',
    'diseños-3d.html',
    'diseños-3d.js',
    'diseños1.0.html',
    'auth.js',
    'inicio.js',
    'perfil.js',
    'diseños1.0.js',
    'toast.js',
    'global.css',
    'inicio.css',
    'perfil.css',
    'diseños-3d.css'
];

// Instalación
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activación
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch - Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si es exitoso, actualizar cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Si falla, usar cache
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        return new Response('Contenido no disponible offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});
