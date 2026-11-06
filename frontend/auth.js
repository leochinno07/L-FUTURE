(function(){
  const API_V1_BASE = (window.LF_CONFIG && window.LF_CONFIG.API_V1_URL)
    ? window.LF_CONFIG.API_V1_URL.replace(/\/$/, '')
    : (location.origin + '/api/v1');

  const DEMO_MODE = true;

  function setDemoUser(user) {
    try {
      localStorage.setItem('auth_token', 'demo-token');
      localStorage.setItem('user', JSON.stringify(user));
      document.cookie = 'lf_token=demo-token; path=/';
      localStorage.setItem('lf_demo_mode', '1');
      window.LF_DEMO_MODE = true;
    } catch (e) {
      console.warn('No se pudo guardar usuario demo', e);
    }
  }

  window.login = window.login || (async function(username, password){
    if(!username || !password) return { success: false, message: 'Faltan credenciales' };
    if (DEMO_MODE || window.LF_DEMO_MODE) {
      const user = { username, nombre_completo: username, id: 'demo-user' };
      setDemoUser(user);
      return { success: true, token: 'demo-token', user };
    }
    try{
      const res = await fetch(`${API_V1_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin'
      });
      const data = await res.json().catch(()=>null);
      if(res.ok && data && data.success){
        try{ localStorage.setItem('auth_token', data.token); }catch(e){}
        try{ localStorage.setItem('user', JSON.stringify(data.user)); }catch(e){}
        try{ document.cookie = 'lf_token=' + data.token + '; path=/'; }catch(e){}
        return data;
      }
      return { success: false, message: (data && data.message) ? data.message : ('HTTP ' + res.status) };
    }catch(e){ console.error('Login request failed', e); return { success: false, message: 'Error de conexión' }; }
  });

  window.register = window.register || (async function(username, password, confirm_password){
    if(!username || !password) return { success: false, message: 'Faltan datos' };
    if (DEMO_MODE || window.LF_DEMO_MODE) {
      const user = { username, nombre_completo: username, id: 'demo-user' };
      setDemoUser(user);
      return { success: true, user };
    }
    try{
      const res = await fetch(`${API_V1_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin'
      });
      const data = await res.json().catch(()=>null);
      if(res.ok && data && data.success) return data;
      return { success: false, message: (data && data.message) ? data.message : ('HTTP ' + res.status) };
    }catch(e){ console.error('Register request failed', e); return { success: false, message: 'Error de conexión' }; }
  });

  window.logout = window.logout || (async function(){
    try {
      const token = localStorage.getItem('auth_token');
      if (token && !token.startsWith('demo')) {
        await fetch(`${API_V1_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': token ? ('Bearer ' + token) : '' },
          credentials: 'same-origin'
        });
      }
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    try{
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('lf_demo_mode');
      document.cookie = 'lf_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }catch(e){ console.warn('Failed clearing local auth state', e); }
    try{ window.location.href = '/login.html'; }catch(e){ /* ignore */ }
    return { success: true };
  });

  window.requireAuth = window.requireAuth || (function(){
    try {
      const demoMode = localStorage.getItem('lf_demo_mode') === '1' || window.LF_DEMO_MODE === true;
      const token = localStorage.getItem('auth_token');
      if (demoMode || token) return true;
      return true;
    } catch (e) {
      return true;
    }
  });

  window.getUser = window.getUser || (function(){
    try{ return JSON.parse(localStorage.getItem('user')); }catch(e){ return { username: 'Usuario demo', nombre_completo: 'Usuario demo' }; }
  });

  window.getToken = window.getToken || (function(){
    try { return localStorage.getItem('auth_token') || 'demo-token'; } catch(e) { return 'demo-token'; }
  });

  window.updateUserNameGlobal = window.updateUserNameGlobal || (function(name){
    try {
      const user = window.getUser() || {};
      user.nombre_completo = name;
      localStorage.setItem('user', JSON.stringify(user));
      window.LFUTURE?.updateUserUI?.();
    } catch(e) { /* local profile cache is optional */ }
  });

  window.getAuthHeaders = window.getAuthHeaders || (function(extra = {}) {
    const token = localStorage.getItem('auth_token') || 'demo-token';
    return Object.assign({}, extra, token ? { 'Authorization': `Bearer ${token}` } : {});
  });

  window.LF_DEMO_MODE = true;
  console.log('Auth shim loaded (frontend demo mode)');
})();

document.addEventListener('DOMContentLoaded', function(){
  try{
    document.querySelectorAll('.btn-signout, [data-action="logout"]').forEach(el => {
      if (!el.__logout_bound) {
        el.addEventListener('click', function(ev){
          ev.preventDefault();
          try{ window.logout(); }catch(e){ console.error('Logout handler failed', e); }
        });
        el.__logout_bound = true;
      }
    });
  }catch(e){ /* non-fatal */ }
});
