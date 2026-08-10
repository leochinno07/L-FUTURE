"""
Validadores centralizados para L-FUTURE

Proporciona funciones de validación reutilizables para:
- Nombres de usuario
- Contraseñas
- Emails
- Nombres de proyectos
- Textos en diseños
- URLs de imágenes

Uso:
    from validators import Validator

    is_valid, message = Validator.validate_username(username)
    if not is_valid:
        return error_response(message)
"""

import re
from typing import Tuple, Optional


class Validator:
    """Sistema centralizado de validación de entrada del usuario"""

    # Expresiones regulares
    USERNAME_PATTERN = r'^[a-zA-Z0-9_-]+$'
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    PROJECT_NAME_PATTERN = r'^[a-zA-Z0-9\s_-]+$'
    URL_PATTERN = r'^https?://[^\s/$.?#].[^\s]*$'
    HEX_COLOR_PATTERN = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'

    # Límites
    MIN_USERNAME_LENGTH = 3
    MAX_USERNAME_LENGTH = 20
    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 128
    MAX_EMAIL_LENGTH = 255
    MAX_PROJECT_NAME_LENGTH = 100
    MAX_TEXT_LENGTH = 500
    MAX_URL_LENGTH = 2048

    @staticmethod
    def validate_username(username: str) -> Tuple[bool, str]:
        """
        Valida nombre de usuario.

        Reglas:
        - Mínimo 3 caracteres
        - Máximo 20 caracteres
        - Solo letras, números, guiones y guiones bajos
        - No espacios en blanco

        Args:
            username: Nombre de usuario a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not username:
            return False, "El nombre de usuario es requerido"

        username = username.strip()

        if len(username) < Validator.MIN_USERNAME_LENGTH:
            return False, f"Username debe tener mínimo {Validator.MIN_USERNAME_LENGTH} caracteres"

        if len(username) > Validator.MAX_USERNAME_LENGTH:
            return False, f"Username debe tener máximo {Validator.MAX_USERNAME_LENGTH} caracteres"

        if not re.match(Validator.USERNAME_PATTERN, username):
            return False, "Username solo puede contener letras, números, guiones y guiones bajos (sin espacios)"

        return True, ""

    @staticmethod
    def validate_password(password: str) -> Tuple[bool, str]:
        """
        Valida contraseñas con reglas de fuerza.

        Reglas:
        - Mínimo 6 caracteres
        - Al menos una mayúscula
        - Al menos un número
        - Al menos un carácter especial

        Args:
            password: Contraseña a validar

        Returns:
            Tupla (es_válido, mensaje)
        """
        if not password:
            return False, "La contraseña es requerida"

        if len(password) < Validator.MIN_PASSWORD_LENGTH:
            return False, f"Password debe tener mínimo {Validator.MIN_PASSWORD_LENGTH} caracteres"

        if len(password) > Validator.MAX_PASSWORD_LENGTH:
            return False, f"Password debe tener máximo {Validator.MAX_PASSWORD_LENGTH} caracteres"

        # Validaciones de fortaleza
        if not any(char.isupper() for char in password):
            return False, "Password debe incluir al menos una letra mayúscula."
        if not any(char.isdigit() for char in password):
            return False, "Password debe incluir al menos un número."
        if not any(char in "!@#$%^&*()-_=+[]{}|;:'\",.<>?/" for char in password):
            return False, "Password debe incluir al menos un carácter especial."
        return True, "Password válida."

    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """
        Valida formato de email.

        Reglas:
        - Formato válido RFC 5322 (simplificado)
        - Máximo 255 caracteres

        Args:
            email: Email a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not email:
            return False, "El email es requerido"

        email = email.strip().lower()

        if len(email) > Validator.MAX_EMAIL_LENGTH:
            return False, f"Email muy largo (máximo {Validator.MAX_EMAIL_LENGTH} caracteres)"

        if not re.match(Validator.EMAIL_PATTERN, email):
            return False, "Formato de email inválido"

        return True, ""

    @staticmethod
    def validate_project_name(name: str) -> Tuple[bool, str]:
        """
        Valida nombre de proyecto.

        Reglas:
        - Mínimo 1 carácter
        - Máximo 100 caracteres
        - Solo letras, números, espacios, guiones y guiones bajos

        Args:
            name: Nombre de proyecto a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not name:
            return False, "El nombre del proyecto es requerido"

        name = name.strip()

        if len(name) > Validator.MAX_PROJECT_NAME_LENGTH:
            return False, f"Nombre muy largo (máximo {Validator.MAX_PROJECT_NAME_LENGTH} caracteres)"

        if not re.match(Validator.PROJECT_NAME_PATTERN, name):
            return False, "El nombre del proyecto solo puede contener letras, números, espacios, guiones y guiones bajos"

        return True, ""

    @staticmethod
    def validate_text_element(text: str, max_length: Optional[int] = None) -> Tuple[bool, str]:
        """
        Valida texto a añadir a un diseño.

        Reglas:
        - No vacío
        - Máximo 500 caracteres (configurable)
        - Puede contener espacios, puntuación, caracteres especiales

        Args:
            text: Texto a validar
            max_length: Longitud máxima (default: 500)

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if max_length is None:
            max_length = Validator.MAX_TEXT_LENGTH

        if not text:
            return False, "El texto no puede estar vacío"

        text = text.strip()

        if len(text) > max_length:
            return False, f"Texto muy largo (máximo {max_length} caracteres). Actual: {len(text)}"

        return True, ""

    @staticmethod
    def validate_hex_color(color: str) -> Tuple[bool, str]:
        """
        Valida código de color hexadecimal.

        Reglas:
        - Formato #RRGGBB o #RGB
        - Letras mayúsculas o minúsculas permitidas

        Args:
            color: Código de color a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not color:
            return False, "El color es requerido"

        color = color.strip()

        if not re.match(Validator.HEX_COLOR_PATTERN, color):
            return False, "Formato de color hexadecimal inválido. Use #RRGGBB o #RGB"

        return True, ""

    @staticmethod
    def validate_url(url: str) -> Tuple[bool, str]:
        """
        Valida URL.

        Reglas:
        - Debe comenzar con http:// o https://
        - Máximo 2048 caracteres

        Args:
            url: URL a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not url:
            return False, "La URL es requerida"

        url = url.strip()

        if len(url) > Validator.MAX_URL_LENGTH:
            return False, f"URL muy larga (máximo {Validator.MAX_URL_LENGTH} caracteres)"

        if not re.match(Validator.URL_PATTERN, url):
            return False, "URL inválida. Debe comenzar con http:// o https://"

        return True, ""

    @staticmethod
    def validate_font_size(size: int) -> Tuple[bool, str]:
        """
        Valida tamaño de fuente.

        Reglas:
        - Mínimo 8px
        - Máximo 200px

        Args:
            size: Tamaño a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not isinstance(size, (int, float)):
            return False, "El tamaño debe ser un número"

        if size < 8:
            return False, "El tamaño mínimo es 8px"

        if size > 200:
            return False, "El tamaño máximo es 200px"

        return True, ""

    @staticmethod
    def validate_opacity(opacity: float) -> Tuple[bool, str]:
        """
        Valida opacidad (alpha).

        Reglas:
        - Debe estar entre 0 y 1

        Args:
            opacity: Opacidad a validar (0.0 - 1.0)

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not isinstance(opacity, (int, float)):
            return False, "La opacidad debe ser un número"

        if opacity < 0 or opacity > 1:
            return False, f"La opacidad debe estar entre 0 y 1. Recibido: {opacity}"

        return True, ""

    @staticmethod
    def validate_rotation(degrees: float) -> Tuple[bool, str]:
        """
        Valida ángulo de rotación.

        Reglas:
        - Debe estar entre -360 y 360

        Args:
            degrees: Ángulo a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not isinstance(degrees, (int, float)):
            return False, "La rotación debe ser un número"

        if degrees < -360 or degrees > 360:
            return False, f"La rotación debe estar entre -360° y 360°. Recibido: {degrees}"

        return True, ""

    @staticmethod
    def validate_dimensions(width: float, height: float) -> Tuple[bool, str]:
        """
        Valida dimensiones de elemento.

        Reglas:
        - Mínimo 1px
        - Máximo 2000px
        - Ambos deben ser números positivos

        Args:
            width: Ancho a validar
            height: Alto a validar

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not isinstance(width, (int, float)) or not isinstance(height, (int, float)):
            return False, "Las dimensiones deben ser números"

        if width < 1 or height < 1:
            return False, "Las dimensiones mínimas son 1px"

        if width > 2000 or height > 2000:
            return False, "Las dimensiones máximas son 2000px"

        return True, ""

    @staticmethod
    def validate_position(x: float, y: float, canvas_width: int = 1000, canvas_height: int = 1000) -> Tuple[bool, str]:
        """
        Valida posición de elemento en canvas.

        Reglas:
        - Las coordenadas deben estar dentro del canvas
        - Valores negativos permitidos (fuera de canvas parcialmente)

        Args:
            x: Posición X a validar
            y: Posición Y a validar
            canvas_width: Ancho del canvas
            canvas_height: Alto del canvas

        Returns:
            Tupla (es_válido, mensaje_error)
        """
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            return False, "Las posiciones deben ser números"

        # Permitir valores ligeramente fuera del canvas (overflow)
        if x < -500 or x > canvas_width + 500:
            return False, f"Posición X fuera de rango: {x}"

        if y < -500 or y > canvas_height + 500:
            return False, f"Posición Y fuera de rango: {y}"

        return True, ""


# Ejemplo de uso en servidor Flask
def validate_register_input(data: dict) -> Tuple[bool, dict]:
    """
    Valida todos los campos de un registro de usuario.

    Args:
        data: Dict con 'username', 'password', 'confirm_password'

    Returns:
        Tupla (es_válido, dict_de_errores)
    """
    errors = {}

    # Validar username
    username = data.get('username', '').strip()
    is_valid, msg = Validator.validate_username(username)
    if not is_valid:
        errors['username'] = msg

    # Validar password
    password = data.get('password', '')
    is_valid, msg = Validator.validate_password(password)
    if not is_valid:
        errors['password'] = msg

    # Validar coincidencia
    confirm = data.get('confirm_password', '')
    if password and confirm and password != confirm:
        errors['confirm_password'] = "Las contraseñas no coinciden"

    return len(errors) == 0, errors


def validate_project_input(data: dict) -> Tuple[bool, dict]:
    """
    Valida campos de creación de proyecto.

    Args:
        data: Dict con 'nombre', 'descripcion', etc

    Returns:
        Tupla (es_válido, dict_de_errores)
    """
    errors = {}

    # Validar nombre
    name = data.get('nombre', '').strip()
    is_valid, msg = Validator.validate_project_name(name)
    if not is_valid:
        errors['nombre'] = msg

    # Validar descripción si existe
    if 'descripcion' in data:
        desc = data.get('descripcion', '').strip()
        if desc and len(desc) > 500:
            errors['descripcion'] = "Descripción muy larga (máximo 500 caracteres)"

    return len(errors) == 0, errors


if __name__ == "__main__":
    # Tests básicos
    print("=== VALIDADORES L-FUTURE ===\n")

    # Test username
    test_cases = [
        ("test_user", True),
        ("ab", False),
        ("valid-user_123", True),
        ("invalid user", False),
        ("a" * 21, False),
    ]

    print("Username tests:")
    for username, expected in test_cases:
        is_valid, msg = Validator.validate_username(username)
        status = "✓" if is_valid == expected else "✗"
        print(f"  {status} '{username}': {is_valid} - {msg}")

    # Test password
    print("\nPassword tests:")
    is_valid, msg = Validator.validate_password("weak")
    print(f"  'weak' (too short): {is_valid} - {msg}")

    is_valid, msg = Validator.validate_password("GoodPass123!")
    print(f"  'GoodPass123!': {is_valid} - {msg}")

    # Test email
    print("\nEmail tests:")
    emails = [
        "valid@example.com",
        "invalid.email@",
        "test@domain.co.uk",
        "no-at-sign.com",
    ]
    for email in emails:
        is_valid, msg = Validator.validate_email(email)
        print(f"  '{email}': {is_valid} - {msg}")

    # Test color
    print("\nColor tests:")
    colors = ["#FFFFFF", "#fff", "#GGGGGG", "red", "#12345"]
    for color in colors:
        is_valid, msg = Validator.validate_hex_color(color)
        print(f"  '{color}': {is_valid} - {msg}")
