// api.js - small fetch wrapper with timeout and retry
const API_DEFAULT_TIMEOUT = 8000;
async function fetchWithTimeout(url, opts = {}, timeout = API_DEFAULT_TIMEOUT){
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try{
    const res = await fetch(url, Object.assign({}, opts, {signal: controller.signal}));
    clearTimeout(id);
    return res;
  }catch(err){
    clearTimeout(id);
    throw err;
  }
}

async function postJson(url, body, retries = 1){
  try{
    const res = await fetchWithTimeout(url, { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return res.json ? await res.json() : { success: res.ok };
  }catch(err){
    if(retries>0) return postJson(url, body, retries-1);
    throw err;
  }
}

// Construir la URL base de la API usando CONFIG si está disponible
const API_BASE = (window.CONFIG && window.CONFIG.API_URL)
  ? window.CONFIG.API_URL.replace(/\/$/, '')
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://api.l-future.com/api';

window.API = window.API || {
  postProyecto: (data)=> postJson(API_BASE + '/proyectos', data, 1),
  logError: (data)=> postJson(API_BASE + '/logs', data, 0)
};

// Nota: no usamos export default aquí para que `main-loader.js` pueda inyectar
// este archivo como un script clásico sin provocar errores de sintaxis.
