const STATIC_CACHE = 'lfuture-static-v2';
const API_CACHE = 'lfuture-api-v2';
const PUBLIC_NAVIGATION_PATHS = new Set([
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/politica de privacidad.html',
    '/sobre nosotros.html'
]);
const PRECACHE_URLS = [
    './index.html',
    './login.html',
    './register.html',
    './manifest.json',
    './assets/icon.svg',
    './global.css',
    './login y register.css',
    './auth.js',
    './api.js',
    './config.js',
    './register-sw.js',
    './toast.js',
    './editor-3d-core.js',
    './engines/editor-3d-bootstrap.js',
    './engines/editor-3d-core.js',
    './engines/editor-3d-transform.js',
    './engines/editor-3d-ui-bridge.js',
    './engines/render-manager.js',
    './engines/scene-manager.js',
    './engines/three-engine.js',
    './engines/viewport-controls.js'
];
const PUBLIC_API_PATHS = new Set(['/api/health', '/api/proyectos/globales']);

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('lfuture-') && key !== STATIC_CACHE && key !== API_CACHE)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

function isCacheableApiRequest(request, url, response) {
    const cacheControl = response.headers.get('Cache-Control') || '';
    return request.method === 'GET'
        && PUBLIC_API_PATHS.has(url.pathname)
        && !request.headers.has('Authorization')
        && response.status === 200
        && !/private|no-store/i.test(cacheControl)
        && !response.headers.has('Set-Cookie');
}

function isStaticRequest(request, url) {
    if (request.method !== 'GET' || url.origin !== self.location.origin) return false;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return false;
    if (request.destination === 'document') return PUBLIC_NAVIGATION_PATHS.has(url.pathname);
    return ['document', 'manifest', 'script', 'style', 'image', 'font', 'worker'].includes(request.destination);
}

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || request.method !== 'GET') return;

    if (url.pathname.startsWith('/api/')) {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (isCacheableApiRequest(request, url, response)) {
                    const cache = await caches.open(API_CACHE);
                    await cache.put(request, response.clone());
                }
                return response;
            } catch {
                const cached = await caches.match(request);
                return cached || Response.json(
                    { success: false, message: 'Sin conexión. Este recurso no está disponible sin conexión.' },
                    { status: 503, headers: { 'Cache-Control': 'no-store' } }
                );
            }
        })());
        return;
    }

    if (request.mode === 'navigate' && !PUBLIC_NAVIGATION_PATHS.has(url.pathname)) {
        event.respondWith(fetch(request).catch(async () => {
            const cache = await caches.open(STATIC_CACHE);
            return (await cache.match('./login.html')) || Response.error();
        }));
        return;
    }

    if (!isStaticRequest(request, url)) return;
    event.respondWith((async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
            const response = await fetch(request);
            if (response.ok && response.type === 'basic') {
                await cache.put(request, response.clone());
            }
            return response;
        } catch {
            if (request.mode === 'navigate') {
                return (await cache.match('./login.html')) || Response.error();
            }
            return Response.error();
        }
    })());
});