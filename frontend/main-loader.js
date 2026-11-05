// main-loader.js - Módulo de entrada que inyecta scripts clásicos en orden
// Prefiere cargar activos frontend ligeros que existen en este repositorio.
// Algunos archivos de motor pesados son opcionales (legacy) y pueden no estar presentes en cada checkout.
// Intentaremos cargar cada script pero continuaremos en caso de fallo para que la página no se cuelgue.
const SCRIPTS = [
  './config.js',
  './config.module.js',
  './auth.module.js',
  './auth.js',
  './api.js',
  './monitoring.js',
  './toast.js',
  './user-ui.js',
  './mis-proyectos.js',
  './proyectos-globales.js',
  './inicio.js',
  './diseños1.0.js',
  './engines/editor-3d-core.js?module',
  './engines/three-engine.js?module',
  './engines/scene-manager.js?module',
  './engines/render-manager.js?module',
  './engines/viewport-controls.js?module',
  './engines/editor-3d-ui-bridge.js?module',
  './engines/editor-3d-transform.js?module',
  './engines/editor-3d-bootstrap.js?module'
];

function loadScript(src, attrs = {}){
  return new Promise(async (resolve, reject) => {
    try{
      // Si src parece una URL externa absoluta, cargar tal cual
      const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
      // Determinar si es un módulo por extensión o por query ?module explícita
      const isModule = typeof src === 'string' && (src.endsWith('.module.js') || src.endsWith('.mjs') || src.includes('?module'));

      if(!isExternal){
        // Resolver relativo a este módulo para que Vite pueda mapear la ruta en modo dev
        try{
          src = new URL(src, import.meta.url).href;
        }catch(e){
          // fallback: dejar src sin cambios
        }
      }

      if(isModule){
        // Usar import dinámico para que Vite resuelva el grafo de módulos correctamente en dev
        await import(src);
        return resolve(src);
      }

      // Inyección clásica de script
      const s = document.createElement('script');
      s.src = src;
      Object.keys(attrs).forEach(k => s.setAttribute(k, attrs[k]));
      s.onload = () => resolve(src);
      s.onerror = (e) => reject(new Error('Fallo al cargar ' + src));
      document.head.appendChild(s);
    }catch(err){
      reject(err);
    }
  });
}

async function loadAll(){
  try{
    for(const src of SCRIPTS){
      try{
        await loadScript(src);
      }catch(err){
        // no fatal: loggear y continuar cargando scripts restantes
        console.warn('Script opcional falló al cargar:', src, err && err.message);
      }
    }
    // Si el asset loader expone un init() esperamos para que las páginas puedan preferir activos locales
    if(window.AssetLoader && typeof window.AssetLoader.init === 'function'){
      try{
        await window.AssetLoader.init();
        console.log('AssetLoader inicializado, modelo por defecto:', window.DEFAULT_TSHIRT_MODEL);
      }catch(e){ console.warn('AssetLoader init falló', e); }
    }

    // cargar script principal de proyectos si está presente
    if(location.pathname.endsWith('diseños1.0.html')){
      await loadScript('./diseños1.0.js');
    }

    // finalmente registrar helper SW (script clásico)
    // En desarrollo en localhost el service worker puede causar errores IndexedDB/Storage en Chromium embebido.
    // Saltar registro del SW cuando se ejecuta en localhost para evitar errores ruidosos durante dev.
    try{
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if(!isLocal){
        await loadScript('./register-sw.js');
      }else{
        console.info('Modo desarrollo: saltando registro de service worker');
      }
    }catch(err){
      console.warn('register-sw.js falló (no fatal):', err && err.message);
    }
    console.log('Todos los scripts cargados vía main-loader');
    // Si hay un actualizador común de UI de usuario disponible, invocarlo para poblar avatares/nombres en todas las páginas
    try{
      if(window.LFUTURE && typeof window.LFUTURE.updateUserUI === 'function'){
        window.LFUTURE.updateUserUI();
      }
    }catch(e){ /* no fatal */ }
  }catch(err){
    console.error(err);
    window.Toast?.error('Error cargando recursos: ' + err.message);
  }
}

loadAll();
