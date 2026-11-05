/**
 * config.js - Configuración central de la aplicación L-FUTURE
 * 
 * Para producción, cambia API_BASE_URL a la URL de tu servidor desplegado
 */

// ============================================================================
// CONFIGURACIÓN DE API
// ============================================================================

/**
 * URL base del backend API
 * 
 * Por defecto la API comparte origen con el frontend. Para despliegues separados,
 * define window.LF_API_BASE_URL antes de cargar este archivo.
 */
const API_BASE_URL = (
    window.LF_API_BASE_URL ||
    window.API_BASE_URL ||
    `${window.location.origin}/api`
).replace(/\/+$/, '');

/**
 * Detecta automáticamente si estamos en producción
 */
const IS_PRODUCTION = window.location.protocol === 'https:' && 
                      !window.location.hostname.includes('localhost') &&
                      !window.location.hostname.includes('127.0.0.1');

/**
 * Configuración adicional
 */
const CONFIG = {
    // URL base de la API
    API_URL: API_BASE_URL,
    
    // Modo de ejecución
    IS_PRODUCTION: IS_PRODUCTION,
    IS_DEVELOPMENT: !IS_PRODUCTION,
    
    // Timeout para peticiones (ms)
    REQUEST_TIMEOUT: 30000,
    
    // Duración del token (días)
    TOKEN_DURATION_DAYS: 7,
    
    // Versión de la app
    VERSION: '2.0.0',
    
    // Logs en consola (solo en desarrollo)
    ENABLE_LOGS: !IS_PRODUCTION
};

// Exportar configuración
window.CONFIG = CONFIG;
window.LF_CONFIG = CONFIG;
window.API_BASE_URL = API_BASE_URL;

// Función para obtener la URL de la API
window.getApiUrl = function(path = '') {
    const base = (CONFIG.API_URL || window.location.origin + '/api').replace(/\/$/, '');
    return path ? `${base}${path.startsWith('/') ? path : '/' + path}` : base;
};

// Log de configuración (solo en desarrollo)
if (CONFIG.ENABLE_LOGS) {
    console.log('🔧 Configuración L-FUTURE:', {
        API_URL: CONFIG.API_URL,
        Modo: CONFIG.IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO',
        Version: CONFIG.VERSION
    });
}
