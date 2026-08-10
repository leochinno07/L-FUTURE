// api.js - Wrapper pequeño de fetch con timeout y reintentos
const API_DEFAULT_TIMEOUT = 8000;

function getAuthToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch (e) {
    return '';
  }
}

function getAuthHeaders(extra = {}) {
  const token = getAuthToken();
  return Object.assign({}, extra, token ? { 'Authorization': `Bearer ${token}` } : {});
}

async function fetchWithTimeout(url, opts = {}, timeout = API_DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, Object.assign({}, opts, { signal: controller.signal, credentials: opts.credentials || 'same-origin' }));
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return response.ok ? { success: true } : { success: false, message: 'Respuesta sin JSON' };
  }
  try {
    return await response.json();
  } catch (e) {
    return { success: response.ok };
  }
}

async function apiRequest(path, options = {}) {
  const baseUrl = (window.LF_CONFIG && window.LF_CONFIG.API_URL) ? window.LF_CONFIG.API_URL : (window.location.origin + '/api');
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = Object.assign({
    'Content-Type': 'application/json'
  }, options.headers || {});

  if (method !== 'GET' && method !== 'HEAD' && options.body && typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetchWithTimeout(url, {
    method,
    headers,
    body: options.body,
    credentials: options.credentials || 'same-origin'
  }, options.timeout || API_DEFAULT_TIMEOUT);

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw Object.assign(new Error(data && data.message ? data.message : 'Request failed'), {
      status: response.status,
      data
    });
  }
  return data;
}

async function postJson(url, body, retries = 1) {
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin'
    });
    return res.json ? await res.json() : { success: res.ok };
  } catch (err) {
    if (retries > 0) return postJson(url, body, retries - 1);
    throw err;
  }
}

const API_BASE = (window.LF_CONFIG && window.LF_CONFIG.API_URL)
  ? window.LF_CONFIG.API_URL.replace(/\/$/, '')
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? (location.origin + '/api')
    : 'https://api.l-future.com/api';

window.getAuthToken = window.getAuthToken || getAuthToken;
window.getAuthHeaders = window.getAuthHeaders || getAuthHeaders;
window.apiRequest = window.apiRequest || apiRequest;
window.fetchWithTimeout = window.fetchWithTimeout || fetchWithTimeout;

window.API = window.API || {
  postProyecto: (data) => apiRequest('/proyectos', { method: 'POST', body: data, headers: getAuthHeaders() }),
  logError: (data) => postJson(`${API_BASE}/logs`, data, 0),
  getAuthHeaders,
  getAuthToken,
  apiRequest,
  request: apiRequest,
  fetchJson: (path, options = {}) => apiRequest(path, options)
};

window.LF_API = window.LF_API || window.API;

// Nota: no usamos export default aquí para que `main-loader.js` pueda inyectar
// este archivo como un script clásico sin provocar errores de sintaxis.
