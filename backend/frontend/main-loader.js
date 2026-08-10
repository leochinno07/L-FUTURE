// main-loader.js - module entry that injects classic scripts in order
const SCRIPTS = [
  // Engine modules from consolidated frontend/engines/ directory
  './engines/three-engine.js?module',
  './engines/viewport-controls.js?module',
  './engines/render-manager.js?module',
  './engines/scene-manager.js?module',
  './engines/editor-3d-core.js?module',
  './engines/editor-3d-ui-bridge.js?module',
  './engines/editor-3d-transform.js?module',
  './assets/three-editor-adapter.js',
  './assets/config.js',
  './assets/auth.module.js',
  './assets/diseños-3d.js',
  './assets/disenador-avanzado.js',
  './assets/api.js',
  './assets/monitoring.js'
];

function loadScript(src, attrs = {}){
  return new Promise(async (resolve, reject) => {
    try{
      // If src looks like an absolute external URL, load as-is
      const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
      // Determine if it's a module by extension or by explicit ?module query
      const isModule = typeof src === 'string' && (src.endsWith('.module.js') || src.endsWith('.mjs') || src.includes('?module'));

      if(!isExternal){
        // Resolve relative to this module so Vite can map the path in dev mode
        try{
          src = new URL(src, import.meta.url).href;
        }catch(e){
          // fallback: leave src unchanged
        }
      }

      if(isModule){
        // Use dynamic import so Vite resolves module graph correctly in dev
        await import(src);
        return resolve(src);
      }

      // Classic script injection
      const s = document.createElement('script');
      s.src = src;
      Object.keys(attrs).forEach(k => s.setAttribute(k, attrs[k]));
      s.onload = () => resolve(src);
      s.onerror = (e) => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    }catch(err){
      reject(err);
    }
  });
}

async function loadAll(){
  try{
    // If browser supports modules, import the ESM shim first (safe no-op fallback)
    try {
      // Try importing the ESM shim; ignore failures (older browsers)
      await import('./editor-shim.mjs');
    } catch(e){
      // ignore - not critical
    }
    for(const src of SCRIPTS){
      await loadScript(src);
    }
    // If the asset loader exposes an init() we await it so pages can prefer local assets
    if(window.AssetLoader && typeof window.AssetLoader.init === 'function'){
      try{
        await window.AssetLoader.init();
        console.log('AssetLoader initialized, default model:', window.DEFAULT_TSHIRT_MODEL);
      }catch(e){ console.warn('AssetLoader init failed', e); }
    }

    // load main projects script if present
    if(location.pathname.endsWith('diseños1.0.html')){
      await loadScript('./diseños1.0.js');
    }

    // finally register SW helper (classic script)
    await loadScript('./register-sw.js');
    console.log('All scripts loaded via main-loader');
  }catch(err){
    console.error(err);
    window.Toast?.error('Error cargando recursos: ' + err.message);
  }
}

loadAll();
