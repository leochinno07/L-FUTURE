"""
Utilidades de subida de archivos extraídas de server_simple.py.
Proporciona generación segura de nombres de archivo, validación de bytes mágicos de imágenes y helper de almacenamiento.
"""
import os  # Para operaciones del sistema de archivos
import hashlib  # Para generar hashes seguros
import time  # Para timestamps
import logging  # Para logging de operaciones

# Configurar logger para este módulo
logger = logging.getLogger(__name__)

# Extensiones de archivo permitidas para imágenes
ALLOWED_EXT = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
# Tamaño máximo de archivo (5 MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


def safe_name(user_id: int, original_name: str) -> str:
    """
    Genera un nombre de archivo seguro: user_<id>_<timestamp>_<hash>.<ext>

    Esta función crea nombres únicos y seguros para evitar conflictos y ataques de path traversal.

    Args:
        user_id: ID del usuario que sube el archivo
        original_name: Nombre original del archivo

    Returns:
        Nombre de archivo seguro con formato: user_{user_id}_{timestamp}_{hash}{ext}
    """
    # Obtener solo el nombre base del archivo (sin path)
    name = os.path.basename(original_name)
    # Reemplazar espacios con guiones bajos para compatibilidad
    name = name.replace(' ', '_')
    # Separar nombre base y extensión
    base, ext = os.path.splitext(name)
    # Convertir extensión a minúsculas
    ext = ext.lower() if ext else ''
    # Generar timestamp actual
    timestamp = int(time.time())
    # Crear hash único basado en user_id, nombre y timestamp
    h = hashlib.sha1("{}:{}:{}".format(user_id, name, timestamp).encode('utf-8')).hexdigest()[:10]
    # Retornar nombre seguro
    return "user_{}_{}_{}{}".format(user_id, timestamp, h, ext)


def is_valid_image_bytes(data: bytes) -> bool:
    """
    Verificación rápida de bytes mágicos para formatos de imagen comunes.

    Esta función valida que los bytes del archivo correspondan a una imagen válida
    verificando los "magic bytes" al inicio del archivo.

    Args:
        data: Bytes del archivo a validar

    Returns:
        True si es una imagen válida, False en caso contrario
    """
    # Verificar que hay datos y son suficientes para contener magic bytes
    if not data or len(data) < 8:
        return False

    # Verificar PNG (empieza con \x89PNG\r\n\x1a\n)
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return True

    # Verificar JPEG (empieza con \xff\xd8 y termina con \xff\xd9)
    if data.startswith(b'\xff\xd8') and data.rstrip().endswith(b'\xff\xd9'):
        return True

    # Verificar GIF (primeros 6 bytes son GIF87a o GIF89a)
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return True

    # Verificar WebP (RIFF....WEBP)
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return True

    # Si no coincide con ningún formato conocido, retornar False
    return False


def save_upload(upload_dir: str, filename: str, data: bytes) -> str:
    """
    Guarda bytes en disco asegurando que el directorio existe y retornando la ruta.

    Args:
        upload_dir: Directorio donde guardar el archivo
        filename: Nombre del archivo
        data: Bytes del archivo a guardar

    Returns:
        Ruta completa del archivo guardado

    Raises:
        ValueError: Si el archivo excede el tamaño máximo permitido
    """
    # Verificar tamaño del archivo antes de guardarlo
    if len(data) > MAX_FILE_SIZE:
        raise ValueError("El tamaño del archivo excede el límite máximo de 5MB.")

    # Crear directorio si no existe
    os.makedirs(upload_dir, exist_ok=True)
    # Construir ruta completa del archivo destino
    dest = os.path.join(upload_dir, filename)
    # Evitar ataques de path traversal convirtiendo a ruta absoluta
    dest = os.path.abspath(dest)
    # Verificar que la ruta destino esté dentro del directorio de uploads
    if not dest.startswith(os.path.abspath(upload_dir)):
        raise ValueError("Ruta de subida inválida")
    # Escribir los bytes del archivo en disco
    with open(dest, 'wb') as f:
        f.write(data)
    # Loggear la operación exitosa
    logger.debug("Archivo guardado en %s", dest)
    # Retornar la ruta completa del archivo guardado
    return dest
