#!/usr/bin/env python3
"""
Servidor Flask minimal para L-FUTURE (desarrollo)
Proporciona endpoints de autenticación (registro/login) y proyectos usados por el frontend.

Este es un servidor ligero, solo para desarrollo, que usa la clase Database existente
en `backend/database.py` para persistir datos en SQLite.

Endpoints implementados (subconjunto):
- POST /api/register
- POST /api/login
- POST /api/logout
- GET  /api/health
- GET  /api/proyectos
- POST /api/proyectos
- PUT  /api/proyectos/<id>
- DELETE /api/proyectos/<id>
- GET  /api/proyectos/<id>/elementos
- POST /api/proyectos/<id>/elementos
- PUT  /api/proyectos/<id>/elementos  (reemplazar lista completa)

Ejecutar:
    python backend/server_simple.py

Nota: este servidor está destinado solo para desarrollo y testing local.
"""

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Importaciones necesarias para el funcionamiento del servidor
from flask_cors import CORS  # Para manejar CORS (Cross-Origin Resource Sharing)  # type: ignore
import bcrypt  # Para hashear contraseñas de forma segura  # type: ignore
from flask import Flask, request, jsonify, send_from_directory, make_response, g, redirect  # type: ignore
import os  # Para operaciones del sistema de archivos
import secrets  # Para generar tokens seguros
from datetime import datetime, timedelta  # Para manejo de fechas y tiempos
from database import Database  # Clase para interactuar con la base de datos SQLite
import uploads  # Módulo para manejar subidas de archivos
import base64  # Para codificación/decodificación base64
import hashlib  # Para funciones hash
import uuid  # Para generar IDs únicos

# Configuración del servidor
from config import get_config  # Importar función de configuración centralizada  # type: ignore

# Obtener configuración basada en el entorno (desarrollo/producción/testing)
config = get_config()

# Ruta completa a la base de datos SQLite, usando el nombre definido en la configuración
DB_PATH = os.path.join(os.path.dirname(__file__), config.DATABASE_NAME)
Database.default_db_name = DB_PATH

# Ruta a los archivos estáticos del frontend (carpeta 'frontend' hermana)
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

# Crear aplicación Flask
APP = Flask(__name__)
# Aplicar configuración a la aplicación Flask desde el objeto de configuración
APP.config.from_object(config)

# Durante desarrollo permitir todos los orígenes para la API para simplificar testing local (frontend servido desde mismo servidor)
# Para producción se pueden restringir orígenes vía variable ALLOWED_ORIGINS o una lista más estricta.
CORS(APP, supports_credentials=True, origins=config.ALLOWED_ORIGINS.split(',') if config.ALLOWED_ORIGINS != '*' else ['*'])

# Forzar HTTPS en producción
@APP.before_request
def enforce_https():
    """Redirigir HTTP a HTTPS en producción"""
    if config.FORCE_HTTPS and request.headers.get('X-Forwarded-Proto', 'http') != 'https':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Headers de seguridad aplicados a todas las respuestas
@APP.after_request
def add_security_headers(response):
    """Añadir headers de seguridad a todas las respuestas"""
    # Prevenir clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # Prevenir sniffing de tipo MIME
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # Habilitar protección XSS
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Política de referrer
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Content Security Policy (básica) - solo en producción
    if not config.DEV_MODE:
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "  # Permitir scripts inline por ahora (Three.js puede necesitar esto)
            "style-src 'self' 'unsafe-inline'; "   # Permitir estilos inline
            "img-src 'self' data: https:; "        # Permitir URLs de datos e imágenes HTTPS
            "font-src 'self'; "
            "connect-src 'self'; "                 # Permitir llamadas API al mismo origen
            "frame-ancestors 'none';"              # Prevenir embedding
        )

    # HSTS (HTTP Strict Transport Security) - solo en producción con HTTPS
    if config.FORCE_HTTPS and not config.DEV_MODE:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response

# Modo desarrollo: menor estrictness de auth cuando DEV_MODE=1 (por defecto '1' para dev local)
DEV_MODE = config.DEV_MODE

# ============ UTILIDADES BCRYPT ============
def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt con 12 rounds de salt.

    Args:
        password: Contraseña en texto plano

    Returns:
        Hash de la contraseña en formato bcrypt (bytes decodificados a string)
    """
    salt = bcrypt.gensalt(rounds=12)  # Generar salt con 12 rounds para buena seguridad
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)  # Hashear la contraseña
    return hashed.decode('utf-8')  # Decodificar bytes a string para almacenamiento

def verify_password(password: str, password_hash: str) -> bool:
    """
    Verifica una contraseña contra su hash bcrypt.

    Args:
        password: Contraseña en texto plano a verificar
        password_hash: Hash bcrypt almacenado en la base de datos

    Returns:
        True si la contraseña coincide, False en caso contrario
    """
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except (ValueError, TypeError):
        # Si el hash está corrupto o el formato es inválido, retornar False
        return False

# ============ VALIDACIÓN DE CONTRASEÑA ============
def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Valida la fortaleza de la contraseña basada en la configuración

    Returns:
        (is_valid: bool, error_message: str)
    """
    if len(password) < config.PASSWORD_MIN_LENGTH:
        return False, f'La contraseña debe tener al menos {config.PASSWORD_MIN_LENGTH} caracteres'

    if config.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False, 'La contraseña debe contener al menos una letra mayúscula'

    if config.PASSWORD_REQUIRE_NUMBERS and not any(c.isdigit() for c in password):
        return False, 'La contraseña debe contener al menos un número'

    if config.PASSWORD_REQUIRE_SPECIAL and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        return False, 'La contraseña debe contener al menos un carácter especial'

    return True, ''  # Contraseña válida

# ============ UTILIDADES DE TOKEN ============
def verify_token(auth_header):
    """
    Verifica un token de autenticación desde header Authorization o cookie.

    Primero intenta obtener el token del header Authorization.
    Si no existe, intenta obtenerlo de la cookie 'lf_token' (para navegación del browser).

    Args:
        auth_header: Header Authorization (opcional)

    Returns:
        usuario_id si el token es válido, None si es inválido/expirado
    """
    if not auth_header:
        # Intentar token basado en cookie para navegación del browser (frontend setea cookie 'lf_token')
        try:
            cookie_token = request.cookies.get('lf_token')
            if cookie_token:
                auth_header = 'Bearer ' + cookie_token
            else:
                return None
        except Exception:
            return None

    # Extraer el token del header (remover 'Bearer ' si existe)
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        return None

    # Verificar token en la base de datos
    with Database() as db:
        cur = db.cursor
        cur.execute("SELECT usuario_id, fecha_expiracion, activa FROM sesiones WHERE token = ?", (token,))
        row = cur.fetchone()
        if not row:
            return None

        usuario_id = row[0]
        fecha_exp = row[1]
        activa = row[2]

        if not activa:
            return None

        # Verificar expiración si existe fecha de expiración
        try:
            if fecha_exp:
                exp_dt = datetime.fromisoformat(fecha_exp)
                if datetime.now() > exp_dt:
                    # Invalidar token expirado
                    cur.execute('UPDATE sesiones SET activa = 0 WHERE token = ?', (token,))
                    db.connection.commit()
                    print("[INFO] Token expirado para usuario_id: {}".format(usuario_id))
                    return None
        except Exception:
            # Ignorar errores de parseo, pero ser conservador
            return None

        return usuario_id

def token_required(f):
    """
    Decorador para proteger rutas que requieren autenticación.
    Verifica token en header Authorization: Bearer <token>
    """
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        # Obtener token del header Authorization
        auth_header = request.headers.get('Authorization', '')
        usuario_id = verify_token(auth_header)

        if not usuario_id:
            return jsonify({
                'success': False,
                'message': 'Token requerido o inválido'
            }), 401

        # Pasar usuario_id a la función protegida vía request object
        request.usuario_id = usuario_id
        return f(*args, **kwargs)

    return decorated

# ============ RUTAS DE LA API ============

@APP.route('/api/health', methods=['GET'])
def health():
    """Endpoint de health check - verifica que el servidor esté funcionando"""
    return jsonify({'success': True, 'message': 'Servidor L-FUTURE funcionando', 'version': 'dev-flask-1.0'})

@APP.route('/api/auth/verify', methods=['GET'])
@token_required
def verify():
    """
    Endpoint para verificar que el token es válido.
    Usado por el frontend para confirmar autenticación.
    """
    return jsonify({
        'success': True,
        'message': 'Token válido',
        'usuario_id': request.usuario_id
    }), 200

@APP.route('/api/register', methods=['POST'])
def register():
    """
    Endpoint para registrar un nuevo usuario.
    Acepta datos JSON o form-encoded.
    En modo desarrollo permite registro simplificado.
    """
    # Debug: log de la request entrante para troubleshooting más fácil durante dev
    try:
        raw = request.get_data(as_text=True)
        print('[DEBUG] /api/register raw body:', raw)
    except Exception:
        pass

    # Aceptar datos JSON o form-encoded para simplicidad
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    username = data.get('username')
    password = data.get('password')
    confirm = data.get('confirm_password')

    # Validación mínima de datos requeridos (simplificada en modo dev)
    if not username or not password:
        return jsonify({'success': False, 'message': 'Faltan datos requeridos'}), 400

    # En modo desarrollo no requerimos confirm_password estrictamente
    if not DEV_MODE and password != confirm:
        return jsonify({'success': False, 'message': 'Las contraseñas no coinciden'}), 400

    # Validación de fortaleza de contraseña (solo en producción)
    if not DEV_MODE:
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            return jsonify({'success': False, 'message': error_msg}), 400

    # Validación de username (mínimo 3 caracteres)
    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Username debe tener mínimo 3 caracteres'}), 400

    # Hash seguro con bcrypt
    password_hash = hash_password(password)

    # Intentar insertar usuario en la base de datos
    with Database() as db:
        uid = db.insertar_usuario(username, password_hash)
        if uid:
            return jsonify({
                'success': True,
                'user_id': uid,
                'message': 'Usuario registrado exitosamente'
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'El usuario ya existe o error interno'
            }), 409

@APP.route('/api/login', methods=['POST'])
def login():
    """
    Endpoint para autenticar usuario y generar token de sesión.
    Acepta datos JSON o form-encoded.
    En modo desarrollo permite auto-registro por conveniencia.
    """
    # Debug: log de la request entrante para troubleshooting más fácil durante dev
    try:
        raw = request.get_data(as_text=True)
        print('[DEBUG] /api/login raw body:', raw)
    except Exception:
        pass

    # Aceptar datos JSON o form-encoded
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Faltan datos'}), 400

    with Database() as db:
        user = db.obtener_usuario_por_username(username)

        # Si el usuario no existe y estamos en DEV_MODE, auto-crear el usuario por conveniencia
        if not user and DEV_MODE:
            try:
                ph = hash_password(password)
                uid = db.insertar_usuario(username, ph)
                if uid:
                    print('[DEV] Auto-registered user:', username)
                    user = db.obtener_usuario_por_username(username)
            except Exception as e:
                print('[DEV ERROR] could not auto-register user:', e)

        # Validar que existe el usuario
        if not user:
            return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos'}), 401

        # Verificar contraseña con bcrypt (si existe password_hash)
        if not user.get('password_hash') or not verify_password(password, user.get('password_hash')):
            # En DEV_MODE permitir login sin contraseña si el usuario fue auto-creado (conveniencia) -- aún requiere contraseña proporcionada
            return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos'}), 401

        # Generar token de sesión seguro
        token = secrets.token_hex(32)  # 256 bits de entropía
        fecha_exp = (datetime.now() + timedelta(days=7)).isoformat()  # Expira en 7 días

        try:
            cur = db.cursor
            # Insertar nueva sesión en la base de datos
            cur.execute(
                'INSERT INTO sesiones (usuario_id, token, fecha_expiracion, activa) VALUES (?, ?, ?, 1)',
                (user['id'], token, fecha_exp)
            )
            db.connection.commit()
        except db.connection.IntegrityError as e:
            print("[WARN] No se pudo insertar sesión: {}".format(e))
            return jsonify({'success': False, 'message': 'Error interno al iniciar sesión'}), 500
        except Exception as e:  # Captura otras posibles excepciones de DB
            print("[ERROR] Error inesperado al insertar sesión: {}".format(e))
            return jsonify({'success': False, 'message': 'Error inesperado al iniciar sesión'}), 500

        # Preparar respuesta con datos del usuario
        resp_body = {
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'nombre_completo': user.get('nombre_completo'),
                'tipo_usuario': user.get('tipo_usuario')
            }
        }

        # Retornar respuesta y setear cookie server-side para asegurar que domain/path coincidan con el origin
        response = jsonify(resp_body)
        try:
            # No setear HttpOnly en dev para que frontend pueda leerlo; producción debería usar HttpOnly + Secure
            response.set_cookie('lf_token', token, path='/', samesite='Lax')
        except Exception:
            pass
        return response, 200

@APP.route('/api/logout', methods=['POST'])
def logout():
    """
    Endpoint para cerrar sesión del usuario.
    Invalida el token y limpia la cookie.
    """
    # Obtener token del header o cookie
    auth = request.headers.get('Authorization', '')
    token = auth.replace('Bearer ', '').strip()
    # Si no hay header Authorization, intentar token basado en cookie
    if not token:
        token = (request.cookies.get('lf_token') or '').strip()

    # Invalidar token en la base de datos (best-effort)
    if token:
        with Database() as db:
            try:
                cur = db.cursor
                cur.execute('UPDATE sesiones SET activa = 0 WHERE token = ?', (token,))
                db.connection.commit()
            except Exception:
                pass

    # Limpiar cookie client-side seteando cookie expirada en la respuesta
    response = jsonify({'success': True, 'message': 'Sesión cerrada'})
    try:
        response.set_cookie('lf_token', '', path='/', expires=0)
    except Exception:
        pass
    return response

@APP.route('/api/logs', methods=['POST'])
def receive_logs():
    """Endpoint simple para aceptar logs del frontend (solo desarrollo)."""
    try:
        data = request.get_json(silent=True) or request.form.to_dict() or {}
        print('[FRONTEND LOG]', data)
    except Exception as e:
        print('[FRONTEND LOG] error parsing log:', e)
    return jsonify({'success': True}), 200

@APP.route('/api/proyectos', methods=['GET', 'POST'])
def proyectos_collection():
    """
    Endpoint para colección de proyectos del usuario.
    GET: Lista proyectos del usuario autenticado
    POST: Crea nuevo proyecto
    """
    # Verificar autenticación
    auth = request.headers.get('Authorization', '')
    usuario_id = verify_token(auth)
    if not usuario_id:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    if request.method == 'GET':
        # Obtener proyectos del usuario
        with Database() as db:
            proyectos = db.obtener_proyectos_usuario(usuario_id)
        # Mapear thumbnail -> thumbnail_url
        for p in proyectos:
            if p.get('thumbnail'):
                p['thumbnail_url'] = "/uploads/{}".format(p.get('thumbnail'))
            else:
                p['thumbnail_url'] = None
        return jsonify({'success': True, 'proyectos': proyectos})

    # POST -> create proyecto
    data = request.get_json() or {}
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'success': False, 'message': 'Nombre requerido'}), 400
    descripcion = data.get('descripcion')
    color_prenda = data.get('color_prenda', '#FFFFFF')
    talla = data.get('talla')
    # Allow 'tipo' for admin users to create global projects
    tipo = data.get('tipo', 'personal')
    if tipo == 'global':
        # verify admin
        with Database() as db:
            usuario = db.obtener_usuario_por_id(usuario_id)
            if not usuario or usuario.get('tipo_usuario') != 'administrador':
                return jsonify({'success': False, 'message': 'Requiere permisos de administrador para crear proyecto global'}), 403

    with Database() as db:
        pid = db.insertar_proyecto(usuario_id, nombre, descripcion, color_prenda, talla, tipo)
        if pid:
            return jsonify({'success': True, 'proyecto_id': pid}), 201
        else:
            return jsonify({'success': False, 'message': 'Error al crear proyecto'}), 500

@APP.route('/api/proyectos/<int:proyecto_id>', methods=['PUT', 'DELETE'])
def proyecto_item(proyecto_id):
    auth = request.headers.get('Authorization', '')
    usuario_id = verify_token(auth)
    if not usuario_id:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    if request.method == 'DELETE':
        with Database() as db:
            if not db.existe_proyecto_de_usuario(proyecto_id, usuario_id):
                return jsonify({'success': False, 'message': 'Proyecto no encontrado o no autorizado'}), 404
            ok = db.eliminar_proyecto(proyecto_id)
            if ok:
                return jsonify({'success': True, 'message': 'Proyecto eliminado'})
            else:
                return jsonify({'success': False, 'message': 'Error al eliminar proyecto'}), 500

    # PUT -> metadata update (whitelist)
    data = request.get_json() or {}
    with Database() as db:
        resultado = db.actualizar_proyecto_seguro(proyecto_id, usuario_id, **data)
        if resultado:
            return jsonify({'success': True, 'message': 'Proyecto actualizado'})
        else:
            return jsonify({'success': False, 'message': 'Proyecto no encontrado o no autorizado'}), 404

@APP.route('/api/proyectos/<int:proyecto_id>/elementos', methods=['GET', 'POST', 'PUT'])
def elementos_proyecto(proyecto_id):
    auth = request.headers.get('Authorization', '')
    usuario_id = verify_token(auth)
    if not usuario_id:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401
    with Database() as db:
        if not db.existe_proyecto_de_usuario(proyecto_id, usuario_id):
            return jsonify({'success': False, 'message': 'Proyecto no encontrado o no autorizado'}), 404

        if request.method == 'GET':
            elementos = db.obtener_elementos_proyecto(proyecto_id)
            return jsonify({'success': True, 'elementos': elementos})

        if request.method == 'POST':
            data = request.get_json() or {}
            tipo = data.get('tipo') or 'detalle'
            contenido = data.get('contenido') or ''
            posicion_x = data.get('posicion_x', 0)
            posicion_y = data.get('posicion_y', 0)
            rotacion = data.get('rotacion', 0)
            escala = data.get('escala', 100)
            color = data.get('color', '#000000')
            eid = db.insertar_elemento_diseno(proyecto_id, tipo, contenido, posicion_x, posicion_y, rotacion, escala, color)
            if eid:
                return jsonify({'success': True, 'elemento_id': eid}), 201
            else:
                return jsonify({'success': False, 'message': 'Error al agregar elemento'}), 500

        # PUT -> replace full elementos list
        data = request.get_json() or {}
        elementos = None
        if isinstance(data, dict) and 'elementos' in data:
            elementos = data['elementos']
        elif isinstance(data, list):
            elementos = data
        else:
            return jsonify({'success': False, 'message': 'Formato inválido, se espera lista de elementos o {elementos:[...]}' }), 400

        # Server-side validation: sanitize and validate elements before calling DB
        def validate_element(el):
            # Required type
            if not isinstance(el, dict):
                return False, 'Elemento debe ser un objeto'
            tipo = (el.get('tipo') or el.get('type') or '').lower()
            if tipo not in ('texto', 'logo', 'imagen', 'detalle', 'insignia', ''):
                return False, "Tipo inválido: {}".format(tipo)
            # content length limits
            contenido = el.get('contenido') or el.get('content') or el.get('url') or ''
            if contenido and len(str(contenido)) > 2000:
                return False, 'Contenido demasiado largo'
            # numeric bounds
            try:
                x = float(el.get('posicion_x', el.get('x', 0)))
                y = float(el.get('posicion_y', el.get('y', 0) or 0))
                rot = float(el.get('rotacion', el.get('rotation', 0) or 0))
                escala = float(el.get('escala', el.get('scale', 100) or 100))
            except (TypeError, ValueError):
                return False, 'Posiciones/rotacion/escala deben ser numericos'
            # sensible ranges
            if not (-2000 <= x <= 2000 and -2000 <= y <= 2000):
                return False, 'Posicion fuera de rango'
            if not (-360 <= rot <= 360):
                return False, 'Rotacion fuera de rango'
            if not (1 <= escala <= 10000):
                return False, 'Escala fuera de rango'
            # font size
            try:
                tam = int(el.get('tamano_fuente', el.get('size', 30) or 30))
            except (TypeError, ValueError):
                return False, 'Tamano de fuente invalido'
            if not (1 <= tam <= 500):
                return False, 'Tamano de fuente fuera de rango'
            return True, None

        # Validate all elements
        for idx, el in enumerate(elementos or []):
            ok, msg = validate_element(el)
            if not ok:
                return jsonify({'success': False, 'message': 'Elemento[{}] invalido: {}'.format(idx, msg)}), 400

        if hasattr(db, 'reemplazar_elementos_proyecto'):
            try:
                ok = db.reemplazar_elementos_proyecto(proyecto_id, elementos)
            except Exception as e:
                return jsonify({'success': False, 'message': 'Error al reemplazar elementos', 'detail': str(e)}), 500
            if ok:
                return jsonify({'success': True, 'message': 'Elementos reemplazados'})
            else:
                return jsonify({'success': False, 'message': 'Error al reemplazar elementos'}), 500
        else:
            return jsonify({'success': False, 'message': 'Operación no soportada en DB'}), 500


@APP.route('/api/proyectos/<int:proyecto_id>/thumbnail', methods=['POST'])
@token_required
def proyecto_thumbnail(proyecto_id):
    auth = request.headers.get('Authorization', '')
    usuario_id = verify_token(auth)
    if not usuario_id:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    data = request.get_json() or {}
    thumbnail = data.get('thumbnail')
    metadata = data.get('metadata') or {}
    if not thumbnail or not isinstance(thumbnail, str) or not thumbnail.startswith('data:image/'):
        return jsonify({'success': False, 'message': 'Thumbnail inválido'}), 400

    # Verify project ownership
    with Database() as db:
        if not db.existe_proyecto_de_usuario(proyecto_id, usuario_id):
            return jsonify({'success': False, 'message': 'Proyecto no encontrado o no autorizado'}), 404

    # Extract base64 part
    try:
        header, b64 = thumbnail.split(',', 1)
        mime = header.split(':')[1].split(';')[0]
        ext = '.png' if 'png' in mime else ('.jpg' if 'jpeg' in mime or 'jpg' in mime else '.bin')
        img_bytes = base64.b64decode(b64)
    except Exception as e:
        return jsonify({'success': False, 'message': 'Formato de thumbnail inválido', 'detail': str(e)}), 400

    # Validate image bytes
    if not uploads.is_valid_image_bytes(img_bytes):
        return jsonify({'success': False, 'message': 'Thumbnail no es una imagen válida'}), 400

    # Save file
    filename = uploads.safe_name(usuario_id, 'proyecto_{}_thumb{}'.format(proyecto_id, ext))
    upload_dir = config.UPLOADS_DIR
    try:
        saved_path = uploads.save_upload(upload_dir, filename, img_bytes)
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al guardar thumbnail', 'detail': str(e)}), 500

    # Register file in DB
    try:
        with Database() as db:
            db.insertar_archivo(usuario_id, filename, mime, len(img_bytes), hashlib.sha256(img_bytes).hexdigest(), proyecto_id=proyecto_id) # Corregido: hashlib ya está importado
            # update proyecto entry to point thumbnail
            db.actualizar_proyecto_thumbnail(proyecto_id, filename)
    except Exception:
        # non-fatal
        pass

    return jsonify({'success': True, 'message': 'Thumbnail guardado', 'filename': filename, 'file_url': '/uploads/{}'.format(filename)})


@APP.route('/api/proyectos/globales', methods=['GET'])
def proyectos_globales_collection():
    """Return public/global projects (no authentication required)"""
    try:
        with Database() as db:
            proyectos = db.obtener_proyectos_globales()
        for p in proyectos:
            if p.get('thumbnail'):
                p['thumbnail_url'] = "/uploads/{}".format(p.get('thumbnail'))
            else:
                p['thumbnail_url'] = None
        return jsonify({'success': True, 'data': {'proyectos': proyectos}})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener proyectos globales', 'detail': str(e)}), 500


@APP.route('/uploads/<path:filename>')
def serve_uploads(filename):
    """Serve static uploaded files from backend/uploads directory"""
    upload_dir = config.UPLOADS_DIR
    try:
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        return jsonify({'success': False, 'message': 'Archivo no encontrado', 'detail': str(e)}), 404


# Serve frontend static files for all non-API routes.
# This makes the backend the single entrypoint: visit http://127.0.0.1:5000 to open the app.
@APP.route('/', defaults={'path': ''})
@APP.route('/<path:path>')
def serve_frontend(path):
    # Prevent accidental overlap with API routes.
    # Only treat requests that are exactly 'api' or start with 'api/' as API calls.
    # This avoids blocking static filenames like 'api.js' or 'api.css'.
    if path == 'api' or path.startswith('api/'):
        return jsonify({'success': False, 'message': 'API endpoint not found'}), 404

    # Ensure frontend folder exists
    if not os.path.isdir(FRONTEND_DIR):
        return jsonify({'success': False, 'message': 'Frontend files not found on server'}), 500

    # Detect mobile user agents for desktop-only editor access
    def is_mobile_request():
        user_agent = request.headers.get('User-Agent', '').lower()
        return any(token in user_agent for token in ['android', 'iphone', 'ipad', 'ipod', 'mobile'])

    try:
        requested = os.path.join(FRONTEND_DIR, path)
        if path.lower().endswith('editor-3d.html'):
            auth_header = request.headers.get('Authorization', '')
            usuario_id = verify_token(auth_header)
            if not usuario_id:
                # unauthenticated users should get the login page
                return send_from_directory(FRONTEND_DIR, 'login.html')
            # Instead of serving a generic index.html, serve the editor as the primary entry
            return send_from_directory(FRONTEND_DIR, 'editor-3d.html')

        # If a specific HTML file is requested (other than public login/register), optionally protect it
        if path.lower().endswith('.html'):
            # Allow public pages without auth
            public_pages = ('login.html', 'register.html', 'politica de privacidad.html', 'sobre nosotros.html')
            if os.path.basename(path).lower() not in public_pages:
                auth_header = request.headers.get('Authorization', '')
                usuario_id = verify_token(auth_header)
                if not usuario_id:
                    return send_from_directory(FRONTEND_DIR, 'login.html')

        # Serve the requested file (CSS, JS, images, html)
        return send_from_directory(FRONTEND_DIR, path)
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al servir frontend', 'detail': str(e)}), 500

# ========== FASE 4: ENDPOINT PARA UPLOAD DE IMÁGENES ==========
@APP.route('/api/proyectos/<int:proyecto_id>/upload-image', methods=['POST'])
@token_required
def upload_image(proyecto_id):
    """
    Endpoint para cargar imágenes a un proyecto.

    Acepta:
    - multipart/form-data con campo 'image' (archivo)

    Valida:
    - Tipo de archivo (PNG, JPG, GIF, WEBP)
    - Tamaño máximo 5MB
    - Pertenencia del proyecto al usuario autenticado

    Retorna:
    - {success, file_id, file_url, size, dimensions}
    """
    try:
        # Verificar que el proyecto pertenece al usuario
        with Database() as db:
            if not db.existe_proyecto_de_usuario(proyecto_id, request.usuario_id):
                return jsonify({
                    'success': False,
                    'message': 'Proyecto no encontrado o no autorizado'
                }), 404

        # Validar que hay archivo en la petición
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No se envió archivo. Use campo "image" en multipart/form-data'
            }), 400

        file = request.files['image']

        # Validar que el archivo tiene nombre
        if not file or file.filename == '':
            return jsonify({
                'success': False,
                'message': 'Archivo vacío o sin nombre'
            }), 400

        # Validar tipo MIME
        tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in tipos_permitidos:
            return jsonify({
                'success': False,
                'message': 'Tipo de archivo no permitido. Permitidos: PNG, JPG, GIF, WEBP. Recibido: {}'.format(file.content_type)
            }), 400

        # Leer contenido del archivo
        file_content = file.read()

        # Validar tamaño (máximo 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if len(file_content) > max_size:
            return jsonify({
                'success': False,
                'message': 'Archivo excede tamaño máximo de 5MB. Tamaño actual: {:.2f}MB'.format(len(file_content) / (1024*1024))
            }), 413

        # Procesar imagen con Pillow (redimensionar, comprimir)
        try:
            from PIL import Image  # type: ignore
            import io

            # Abrir imagen
            img = Image.open(io.BytesIO(file_content))

            # Obtener dimensiones originales
            original_width, original_height = img.size

            # Redimensionar si es mayor a 2000px en cualquier dimensión
            max_dimension = 2000
            if original_width > max_dimension or original_height > max_dimension:
                ratio = min(max_dimension / original_width, max_dimension / original_height)
                new_size = (int(original_width * ratio), int(original_height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Determinar formato para guardar
            if file.content_type == 'image/png':
                save_format = 'PNG'
                extension = '.png'
            elif file.content_type == 'image/gif':
                save_format = 'GIF'
                extension = '.gif'
            elif file.content_type == 'image/webp':
                save_format = 'WEBP'
                extension = '.webp'
            else:  # JPG por defecto
                save_format = 'JPEG'
                extension = '.jpg'

            # Comprimir y guardar a bytes
            output_buffer = io.BytesIO()
            if save_format == 'JPEG':
                img = img.convert('RGB')  # JPEG no soporta transparencia
                img.save(output_buffer, format=save_format, quality=85, optimize=True)
            else:
                img.save(output_buffer, format=save_format, optimize=True)

            processed_content = output_buffer.getvalue()
            final_width, final_height = img.size

        except ImportError:
            print('[WARN] Pillow no está instalado. Se guardará la imagen sin procesar.')
            processed_content = file_content
            final_width, final_height = 'desconocido', 'desconocido'
            extension = '.' + file.content_type.split('/')[-1]
        except Exception as e:
            print('[ERROR] Error procesando imagen: {}'.format(e))
            return jsonify({
                'success': False,
                'message': 'Error procesando imagen: {}'.format(str(e))
            }), 500

        # Crear nombre de archivo seguro
        import hashlib
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_hash = hashlib.md5(processed_content).hexdigest()[:8]
        safe_filename = 'proyecto_{}_img_{}_{}{}'.format(proyecto_id, timestamp, file_hash, extension)

        # Crear directorio de uploads si no existe
        upload_dir = os.environ.get('UPLOADS_DIR', os.path.join(os.path.dirname(__file__), 'uploads'))
        user_upload_dir = os.path.join(upload_dir, 'user_{}'.format(request.usuario_id))

        try:
            os.makedirs(user_upload_dir, exist_ok=True)
        except OSError as e:
            print('[ERROR] No se pudo crear directorio de uploads: {}'.format(e))
            return jsonify({
                'success': False,
                'message': 'Error al crear directorio de uploads'
            }), 500

        # Guardar archivo
        file_path = os.path.join(user_upload_dir, safe_filename)
        try:
            with open(file_path, 'wb') as f:
                f.write(processed_content)
        except OSError as e:
            print('[ERROR] No se pudo guardar archivo: {}'.format(e))
            return jsonify({
                'success': False,
                'message': 'Error al guardar archivo'
            }), 500

        # Guardar registro en base de datos
        try:
            with Database() as db:
                file_id = db.insertar_archivo(
                    usuario_id=request.usuario_id,
                    proyecto_id=proyecto_id,
                    filename=safe_filename,
                    tipo=file.content_type,
                    tamano=len(processed_content),
                    hash=file_hash
                )
        except Exception as e:
            print('[ERROR] Error al registrar archivo en BD: {}'.format(e))
            # No es fatal, el archivo está guardado
            file_id = None

        # Retornar respuesta exitosa
        file_url = '/uploads/user_{}/{}'.format(request.usuario_id, safe_filename)

        return jsonify({
            'success': True,
            'message': 'Imagen cargada exitosamente',
            'file_id': file_id,
            'file_url': file_url,
            'size': len(processed_content),
            'dimensions': [final_width, final_height] if isinstance(final_width, int) else None,
            'original_name': file.filename
        }), 201

    except Exception as e:
        print('[ERROR] Error inesperado en upload_image: {}'.format(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error inesperado: {}'.format(str(e))
        }), 500

if __name__ == '__main__':
    # Ensure the database exists and tables are created before starting the server
    try:
        print('Verificando base de datos...')
        if not os.path.exists(DB_PATH):
            print('Base de datos no encontrada en ' + DB_PATH + ', creando tablas...')
            with Database() as db:
                db.create_tables()
                try:
                    db.crear_indices()
                except Exception:
                    pass
            print('Base de datos inicializada.')
        else:
            # Attempt a quick connect and ensure tables exist (no-op if already present)
            try:
                with Database() as db:
                    db.create_tables()
            except Exception as e:
                print('Advertencia: no se pudo verificar/crear tablas:', e)

        HOST = config.HOST
        PORT = config.PORT
        print('Starting L-FUTURE dev server (Flask) on http://{}:{} (health: /api/health)'.format(HOST, PORT))
        # Allow overriding host/port via environment for dev flexibility
        APP.run(host=HOST, port=PORT, debug=True)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        print('\n[ERROR] El servidor no pudo iniciarse. Revise las dependencias (pip install -r backend/requirements.txt) y permisos de archivo.')
        raise
