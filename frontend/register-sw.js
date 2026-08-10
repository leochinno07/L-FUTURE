// register-sw.js - simple SW registration helper
if('serviceWorker' in navigator){
  // Avoid registering service worker in local development (localhost/127.0.0.1)
  // which can interfere with frequent file changes and IndexedDB during testing.
  const host = location.hostname;
  if(host === 'localhost' || host === '127.0.0.1'){
    console.debug('Skipping service worker registration on local host:', host);
  } else {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./sw-unified.js').then(reg => {
      console.log('ServiceWorker registered: ', reg.scope);
      // listen for updates
      reg.onupdatefound = () => {
        const installing = reg.installing;
        installing.onstatechange = () => {
          if(installing.state === 'installed'){
            if(navigator.serviceWorker.controller){
              // new update available
              window.Toast?.info('Nueva versión disponible. Recarga para actualizar.');
            }
          }
        };
      };
    }).catch(err => console.warn('SW registration failed:', err));
    });
  }
}
