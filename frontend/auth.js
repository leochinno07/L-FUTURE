// auth.js - Shim simple de autenticación: proporciona registro/login/logout/requireAuth/getUser básico
// Este archivo intencionalmente evita importar `auth.module.js` para mantener el comportamiento determinístico en desarrollo.
// Proporciona funciones globales para manejar autenticación de usuario usando localStorage y cookies como respaldo.

(function(){
  const API_BASE = (window.LF_CONFIG && window.LF_CONFIG.API_URL)
    ? window.LF_CONFIG.API_URL.replace(/\/$/, '')
    : (location.origin + '/api');

  window.login = window.login || (async function(username, password){
    if(!username || !password) return { success: false, message: 'Faltan credenciales' };
    try{
      const res = await fetch(`${API_BASE}/login`, {
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
    try{
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirm_password }),
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
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Authorization': token ? ('Bearer ' + token) : '' },
        credentials: 'same-origin'
      });
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    try{
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      document.cookie = 'lf_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }catch(e){ console.warn('Failed clearing local auth state', e); }
    try{ window.location.href = '/login.html'; }catch(e){ /* ignore */ }
    return { success: true };
  });

  window.requireAuth = window.requireAuth || (function(){
    try {
      const token = localStorage.getItem('auth_token');
      return !!token;
    } catch (e) {
      return false;
    }
  });

  window.getUser = window.getUser || (function(){
    try{ return JSON.parse(localStorage.getItem('user')); }catch(e){ return null; }
  });

  window.getAuthHeaders = window.getAuthHeaders || (function(extra = {}) {
    const token = localStorage.getItem('auth_token');
    return Object.assign({}, extra, token ? { 'Authorization': `Bearer ${token}` } : {});
  });

  console.log('Auth shim loaded (fallback)');
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
