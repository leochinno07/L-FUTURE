(async function(){
  try{
    const mod = await import('./auth.module.js');
    // map module exports to global functions expected by legacy pages
    if(mod.login) window.login = mod.login;
    if(mod.logout) window.logout = mod.logout;
    if(mod.requireAuth) window.requireAuth = mod.requireAuth;
    if(mod.getUser) window.getUser = mod.getUser;
    window.AUTH = mod.default || mod;
    console.log('Auth shim loaded');
  }catch(err){
    console.warn('Auth shim failed to load auth.module.js', err);
    // provide safe fallbacks
    window.requireAuth = window.requireAuth || function(){ return false; };
    window.login = window.login || function(){ return Promise.reject(new Error('No auth available')); };
    window.logout = window.logout || function(){ return null; };
  }
})();
