// config.module.js - ESM shim that exports functions delegating to global legacy config
export function requireAuth(){ return window.requireAuth ? window.requireAuth() : false; }
export function getUser(){ return window.getUser ? window.getUser() : null; }
export function setLanguage(lang){ if(window.LFUTURE_setLanguage) return window.LFUTURE_setLanguage(lang); if(window.localStorage) localStorage.setItem('LFUTURE_lang', lang); }
export default { requireAuth, getUser, setLanguage };
