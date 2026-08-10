// auth.module.js - ESM shim that exposes auth functions delegating to legacy globals
export function login(credentials){ return window.login ? window.login(credentials) : Promise.reject(new Error('No login available')); }
export function logout(){ return window.logout ? window.logout() : null; }
export function requireAuth(){ return window.requireAuth ? window.requireAuth() : false; }
export default { login, logout, requireAuth };
