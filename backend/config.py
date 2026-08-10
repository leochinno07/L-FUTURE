"""
Gestión de configuración para aplicación L-FUTURE
Configuración basada en entorno con perfiles de desarrollo, producción y testing
"""

import os
from typing import Optional


def _load_dotenv():
    """Cargar variables desde `.env` si existen, sin depender de dependencias externas."""
    candidates = [
        os.path.join(os.path.dirname(__file__), '.env'),
        os.path.join(os.path.dirname(__file__), '..', '.env'),
    ]

    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, 'r', encoding='utf-8') as fh:
                for raw_line in fh:
                    line = raw_line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    os.environ.setdefault(key, value)
        except OSError:
            continue


_load_dotenv()

# Por defecto, el entorno local debe arrancar en desarrollo
os.environ.setdefault('FLASK_ENV', 'development')


class Config:
    """Clase base de configuración"""

    # Flask - Configuración básica del framework
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    DEBUG = False
    TESTING = False

    # Servidor - Configuración del servidor web
    HOST = os.environ.get('HOST', '127.0.0.1')
    PORT = int(os.environ.get('PORT', '5000'))

    # Base de datos - Configuración de SQLite
    DATABASE_NAME = os.environ.get('DATABASE_NAME', 'lfuture.db')

    # Subidas de archivos - Configuración para uploads
    UPLOADS_DIR = os.environ.get('UPLOADS_DIR', os.path.join(os.path.dirname(__file__), 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # CORS - Configuración de Cross-Origin Resource Sharing
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*')

    # Modo desarrollo - Flag para habilitar características de desarrollo
    DEV_MODE = os.environ.get('DEV_MODE', 'false').lower() == 'true'

    # Logging - Configuración de logs
    LOG_FILE = os.environ.get('LOG_FILE', 'lfuture_backend.log')
    LOG_LEVEL = 'INFO'

    # Rate limiting - Configuración para limitar requests (implementación futura)
    RATE_LIMIT_LOGIN_MAX = int(os.environ.get('RATE_LIMIT_LOGIN_MAX', '5'))
    RATE_LIMIT_LOGIN_WINDOW = int(os.environ.get('RATE_LIMIT_LOGIN_WINDOW', '900'))
    RATE_LIMIT_REGISTER_MAX = int(os.environ.get('RATE_LIMIT_REGISTER_MAX', '3'))
    RATE_LIMIT_REGISTER_WINDOW = int(os.environ.get('RATE_LIMIT_REGISTER_WINDOW', '3600'))

    # Seguridad - Configuración de seguridad adicional
    SESSION_TIMEOUT = int(os.environ.get('SESSION_TIMEOUT', '3600'))
    PASSWORD_MIN_LENGTH = int(os.environ.get('PASSWORD_MIN_LENGTH', '8'))
    PASSWORD_REQUIRE_UPPERCASE = os.environ.get('PASSWORD_REQUIRE_UPPERCASE', 'true').lower() == 'true'
    PASSWORD_REQUIRE_NUMBERS = os.environ.get('PASSWORD_REQUIRE_NUMBERS', 'true').lower() == 'true'
    PASSWORD_REQUIRE_SPECIAL = os.environ.get('PASSWORD_REQUIRE_SPECIAL', 'false').lower() == 'true'

    # Forzar HTTPS - configuración para redirigir HTTP a HTTPS en producción
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'false').lower() == 'true'


class DevelopmentConfig(Config):
    """Configuración para desarrollo - más permisiva para facilitar debugging"""

    DEBUG = True
    DEV_MODE = True
    LOG_LEVEL = 'DEBUG'
    ALLOWED_ORIGINS = '*'
    FORCE_HTTPS = False


class ProductionConfig(Config):
    """Configuración para producción - máxima seguridad y rendimiento"""

    DEBUG = False
    DEV_MODE = False
    LOG_LEVEL = 'WARNING'
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'https://yourdomain.com')
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'true').lower() == 'true'


class TestingConfig(Config):
    """Configuración para testing - optimizada para ejecución de tests"""

    TESTING = True
    DEBUG = True
    DEV_MODE = True
    DATABASE_NAME = ':memory:'
    LOG_LEVEL = 'CRITICAL'
    FORCE_HTTPS = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}


def _validate_production_settings():
    """Validar secretos obligatorios solo en producción."""
    secret = os.environ.get('SECRET_KEY')
    jwt_secret = os.environ.get('JWT_SECRET_KEY')

    if not secret or secret == 'default-secret-key-change-in-production':
        raise ValueError('SECRET_KEY debe estar configurada en entorno de producción')

    if not jwt_secret:
        raise ValueError('JWT_SECRET_KEY debe estar configurada en entorno de producción')


def get_config(config_name: Optional[str] = None) -> Config:
    """
    Obtener clase de configuración basada en el entorno

    Args:
        config_name: Nombre del entorno ('development', 'production', 'testing').
                    Si no se proporciona, usa la variable FLASK_ENV.

    Returns:
        Instancia de la clase de configuración apropiada
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    config_name = (config_name or 'development').lower()

    if config_name == 'production':
        _validate_production_settings()

    return config.get(config_name, config['default'])