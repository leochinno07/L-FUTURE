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
  const baseUrl = (window.LF_CONFIG && window.LF_CONFIG.API_V1_URL) ? window.LF_CONFIG.API_V1_URL : (window.location.origin + '/api/v1');
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

const API_V1_BASE = (
  (window.LF_CONFIG && window.LF_CONFIG.API_V1_URL) ||
  (location.origin + '/api/v1')
).replace(/\/+$/, '');

async function getProyectos() {
  const projects = [];
  let page = 1;
  while (true) {
    const response = await fetchWithTimeout(`${API_V1_BASE}/projects?page=${page}&limit=50`, {
      headers: getAuthHeaders(),
      credentials: 'same-origin'
    });
    const result = await parseJsonResponse(response);
    if (!response.ok || !result.success) {
      return { success: false, data: { message: result.message || 'No se pudieron cargar los proyectos' } };
    }
    projects.push(...(result.projects || []));
    if ((result.projects || []).length < 50) break;
    page += 1;
  }
  const proyectos = projects.map(project => ({
    id: project.id,
    nombre: project.name,
    descripcion: project.description,
    tags: project.tags || '',
    estado: project.status,
    tipo: project.type,
    tipo_prenda: project.clothing_type,
    color_prenda: project.garment_color,
    thumbnail_url: project.preview_url,
    fecha_creacion: project.created_at,
    fecha_modificacion: project.updated_at,
    talla: project.talla,
    tags: ''
  }));
  return { success: true, data: { success: true, proyectos } };
}

async function getElementos(projectId) {
  let response = await fetchWithTimeout(`${API_V1_BASE}/projects/${projectId}`, {
    headers: getAuthHeaders(),
    credentials: 'same-origin'
  });
  let projectResult = await parseJsonResponse(response);
  if (!response.ok) {
    response = await fetchWithTimeout(`${API_V1_BASE}/projects/marketplace/${projectId}`, {
      credentials: 'same-origin'
    });
    projectResult = await parseJsonResponse(response);
  }
  if (!response.ok || !projectResult.success) {
    return { success: false, data: { success: false, message: projectResult.message || 'No se pudo cargar el diseño' } };
  }
  const scenes = projectResult.project?.design_state?.escenas || [];
  const elementos = scenes.flatMap((scene, sceneIndex) => (scene.elementos || []).map(element => ({
    ...element,
    escena: sceneIndex,
    posicion_x: element.x,
    posicion_y: element.y,
    tamano_fuente: element.tamano
  })));
  return { success: true, data: { success: true, elementos, design_state: projectResult.project.design_state } };
}

async function createProyecto(nombre, descripcion = '', color = '#FFFFFF', talla = 'M') {
  const result = await apiRequest('/projects', {
    method: 'POST',
    body: { nombre, descripcion, color_prenda: color, talla, clothing_type: 'tshirt' },
    headers: getAuthHeaders()
  });
  return { success: result.success, data: { ...result, proyecto_id: result.project?.id } };
}

async function updateProyecto(projectId, payload = {}) {
  const update = {};
  if (payload.nombre !== undefined) update.nombre = payload.nombre;
  if (payload.descripcion !== undefined) update.descripcion = payload.descripcion;
  if (payload.tags !== undefined) update.tags = payload.tags;
  if (payload.estado !== undefined) update.estado = payload.estado;
  if (payload.color_prenda !== undefined) update.color_prenda = payload.color_prenda;
  if (payload.talla !== undefined) update.talla = payload.talla;
  if (payload.tipo_prenda !== undefined) update.clothing_type = payload.tipo_prenda;
  if (payload.preview_url !== undefined) update.preview_url = payload.preview_url;
  const result = await apiRequest(`/projects/${projectId}`, {
    method: 'PUT', body: update, headers: getAuthHeaders()
  });
  return { success: result.success, data: { ...result, success: result.success } };
}

async function deleteProyecto(projectId) {
  const result = await apiRequest(`/projects/${projectId}`, { method: 'DELETE', headers: getAuthHeaders() });
  return { success: result.success, data: { ...result, success: result.success } };
}

async function duplicarProyectoV1(projectId, nombre) {
  const result = await apiRequest(`/projects/${projectId}/duplicate`, {
    method: 'POST',
    body: nombre ? { nombre } : {},
    headers: getAuthHeaders()
  });
  return { success: result.success, data: { ...result, proyecto_id: result.project?.id } };
}

window.getProyectos = window.getProyectos || getProyectos;
window.getElementos = window.getElementos || getElementos;
window.createProyecto = window.createProyecto || createProyecto;
window.updateProyecto = window.updateProyecto || updateProyecto;
window.deleteProyecto = window.deleteProyecto || deleteProyecto;
window.duplicarProyectoV1 = window.duplicarProyectoV1 || duplicarProyectoV1;

window.getAuthToken = window.getAuthToken || getAuthToken;
window.getAuthHeaders = window.getAuthHeaders || getAuthHeaders;
window.apiRequest = window.apiRequest || apiRequest;
window.fetchWithTimeout = window.fetchWithTimeout || fetchWithTimeout;

window.API = window.API || {
  postProyecto: (data) => apiRequest('/projects', { method: 'POST', body: data, headers: getAuthHeaders() }),
  logError: data => {
    console.error('L-FUTURE frontend:', data);
    return Promise.resolve({ success: true });
  },
  getAuthHeaders,
  getAuthToken,
  apiRequest,
  request: apiRequest,
  fetchJson: (path, options = {}) => apiRequest(path, options)
};

window.LF_API = window.LF_API || window.API;

// Nota: no usamos export default aquí para que `main-loader.js` pueda inyectar
// este archivo como un script clásico sin provocar errores de sintaxis.
