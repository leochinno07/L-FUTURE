/**
 * sw.js - Service Worker para L-FUTURE
 * Implementación de la Optimización Básica #7: Modo Offline
 */

const CACHE_NAME = 'l-future-cache-v1';
const API_CACHE_NAME = 'l-future-api-cache-v1';

// Lista de archivos estáticos para cachear en la instalación
const STATIC_ASSETS = [
    '/',
    'inicio.html',
    'diseños1.0.html',
    'diseños L-Future.html',
    'diseños-3d.html',
    'perfil.html',
    'sobre nosotros.html',
    'global.css',
    'diseños1.0.css',
    'config.js',
    'auth.js',
    'diseños1.0.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/izitoast/dist/css/iziToast.min.css',
    'https://cdn.jsdelivr.net/npm/izitoast/dist/js/iziToast.min.js'
];

// Evento de instalación: cachear los assets estáticos
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando assets estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Evento de activación: limpiar cachés antiguos
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('[Service Worker] Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Evento fetch: interceptar peticiones y servir desde caché si es posible
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Estrategia: Cache First para assets estáticos
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
        event.respondWith(caches.match(request).then(cachedResponse => {
            return cachedResponse || fetch(request);
        }));
        return;
    }

    // Estrategia: Network First, then Cache para la API (solo GET)
    if (url.pathname.startsWith('/api/') && request.method === 'GET') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Si la petición fue exitosa, la cacheamos
                    const responseToCache = response.clone();
                    caches.open(API_CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Si la red falla, intentamos servir desde la caché
                    return caches.match(request);
                })
        );
        return;
    }

    // Para otras peticiones (POST, PUT, DELETE), solo ir a la red
    event.respondWith(fetch(request));
});