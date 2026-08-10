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
 * DESARROLLO: 'http://localhost:5000/api'
 * PRODUCCIÓN: Cambiar a la URL de tu servidor (ej: 'https://api.l-future.com/api')
 */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/health'
    : 'https://api.l-future.com/api'; // ⚡️ PRODUCCIÓN: URL REAL

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
    VERSION: '1.0.0',
    
    // Logs en consola (solo en desarrollo)
    ENABLE_LOGS: !IS_PRODUCTION
};

// Exportar configuración
window.CONFIG = CONFIG;

// Log de configuración (solo en desarrollo)
if (CONFIG.ENABLE_LOGS) {
    console.log('🔧 Configuración L-FUTURE:', {
        API_URL: CONFIG.API_URL,
        Modo: CONFIG.IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO',
        Version: CONFIG.VERSION
    });
}
if (CONFIG.IS_PRODUCTION && CONFIG.API_URL.includes('tu-backend-en-produccion')) {
    console.warn('⚠️ [L-FUTURE] La URL de producción no está configurada correctamente. Actualiza config.js con la URL real de tu backend.');
}
