import sqlite3
import os
import json
from datetime import datetime
import logging

class Database:
    """Clase para manejar todas las operaciones de la base de datos SQLite3"""

    default_db_name = os.environ.get('DATABASE_NAME', 'lfuture.db')

    def __init__(self, db_name=None):
        """
        Inicializa la conexión a la base de datos
        Args:
            db_name: Nombre del archivo de base de datos
        """
        db_name = db_name or self.default_db_name
        if os.path.isabs(db_name):
            self.db_path = db_name
        else:
            self.db_path = os.path.join(os.path.dirname(__file__), db_name)
        self.connection = None
        self.cursor = None

    def __enter__(self):
        """Context manager: establece la conexión al entrar"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager: cierra la conexión al salir"""
        self.close()
        return False

    def connect(self):
        """Establece la conexión con la base de datos"""
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row  # Para obtener resultados como diccionarios
            self.cursor = self.connection.cursor()
            # Habilitar foreign keys en SQLite (importante para CASCADE DELETE)
            self.cursor.execute("PRAGMA foreign_keys = ON")
            print("[OK] Conexion exitosa a la base de datos: " + self.db_path)
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al conectar con la base de datos: " + str(e))
            return False

    def close(self):
        """Cierra la conexión con la base de datos"""
        if self.connection:
            self.connection.close()
            print("[OK] Conexion cerrada")

    def create_tables(self):
        """Crea todas las tablas necesarias para la aplicación L-FUTURE"""

        # TABLA 1: USUARIOS
        tabla_usuarios = """
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nombre_completo TEXT,
            genero TEXT CHECK(genero IN ('masculino', 'femenino', 'otro')),
            talla_preferida TEXT CHECK(talla_preferida IN ('S', 'M', 'L', 'XL', 'XXL')),
            foto_perfil TEXT,
            tipo_usuario TEXT DEFAULT 'normal' CHECK(tipo_usuario IN ('normal', 'premium', 'administrador')),
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            idioma TEXT DEFAULT 'es' CHECK(idioma IN ('es', 'en', 'fr', 'pt')),
            privacidad TEXT DEFAULT 'publico' CHECK(privacidad IN ('publico', 'privado', 'amigos')),
            notificaciones_activas BOOLEAN DEFAULT 1,
            modo_oscuro BOOLEAN DEFAULT 1
        );
        """

        # TABLA 2: PROYECTOS
        tabla_proyectos = """
        CREATE TABLE IF NOT EXISTS proyectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'en_progreso' CHECK(estado IN ('en_progreso', 'completado')),
            tipo TEXT DEFAULT 'personal' CHECK(tipo IN ('personal', 'global')),
            color_prenda TEXT DEFAULT '#FFFFFF',
            thumbnail TEXT,
            estado_diseno_json TEXT,
            talla TEXT CHECK(talla IN ('S', 'M', 'L', 'XL', 'XXL')),
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            es_publico BOOLEAN DEFAULT 0,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        """

        # TABLA 3: ELEMENTOS DE DISEÑO
        tabla_elementos = """
        CREATE TABLE IF NOT EXISTS elementos_diseno (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proyecto_id INTEGER NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('texto', 'logo', 'imagen', 'detalle', 'insignia')),
            contenido TEXT,
            posicion_x REAL DEFAULT 0,
            posicion_y REAL DEFAULT 0,
            rotacion REAL DEFAULT 0,
            escala REAL DEFAULT 100,
            color TEXT DEFAULT '#FFFFFF',
            fuente TEXT,
            tamano_fuente INTEGER,
            negrita BOOLEAN DEFAULT 0,
            cursiva BOOLEAN DEFAULT 0,
            material_tipo TEXT DEFAULT 'standard' CHECK(material_tipo IN ('standard', 'metal', 'brillante', 'textura')),
            material_color TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
        );
        """

        # TABLA 4: SESIONES (para control de login)
        tabla_sesiones = """
        CREATE TABLE IF NOT EXISTS sesiones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_expiracion TIMESTAMP,
            activa BOOLEAN DEFAULT 1,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        """

        # TABLA 5: ARCHIVOS SUBIDOS
        tabla_archivos = """
        CREATE TABLE IF NOT EXISTS archivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            proyecto_id INTEGER,
            filename TEXT NOT NULL,
            tipo TEXT,
            tamano INTEGER,
            hash TEXT,
            fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'eliminado', 'pendiente')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
        );
        """

        try:
            # Ejecutar creacion de tablas
            self.cursor.execute(tabla_usuarios)
            print("[OK] Tabla 'usuarios' creada exitosamente")

            self.cursor.execute(tabla_proyectos)
            print("[OK] Tabla 'proyectos' creada exitosamente")

            self.cursor.execute(tabla_elementos)
            print("[OK] Tabla 'elementos_diseno' creada exitosamente")

            self.cursor.execute(tabla_sesiones)
            print("[OK] Tabla 'sesiones' creada exitosamente")

            self.cursor.execute(tabla_archivos)
            print("[OK] Tabla 'archivos' creada exitosamente")

            self.connection.commit()
            print("\n[OK] Todas las tablas fueron creadas correctamente!")
            # Ensure 'thumbnail' column exists on proyectos (migration friendly)
            try:
                self.cursor.execute("PRAGMA table_info('proyectos')")
                cols = [row['name'] for row in self.cursor.fetchall()]
                if 'thumbnail' not in cols:
                    self.cursor.execute("ALTER TABLE proyectos ADD COLUMN thumbnail TEXT")
                    self.connection.commit()
                    print("[OK] Columna 'thumbnail' añadida a proyectos")
                if 'estado_diseno_json' not in cols:
                    self.cursor.execute("ALTER TABLE proyectos ADD COLUMN estado_diseno_json TEXT")
                    self.connection.commit()
                    print("[OK] Columna 'estado_diseno_json' añadida a proyectos")
            except Exception:
                pass
            return True

        except sqlite3.Error as e:
            print("[ERROR] Error al crear las tablas: " + str(e))
            return False

    def insertar_usuario(self, username, password_hash, nombre_completo=None, genero=None, talla_preferida=None):
        """
        Inserta un nuevo usuario en la base de datos

        Args:
            username: Nombre de usuario único
            password_hash: Contraseña encriptada
            nombre_completo: Nombre completo del usuario
            genero: Género del usuario
            talla_preferida: Talla preferida del usuario

        Returns:
            ID del usuario creado o None si hubo error
        """
        try:
            query = """
            INSERT INTO usuarios (username, password_hash, nombre_completo, genero, talla_preferida)
            VALUES (?, ?, ?, ?, ?)
            """
            self.cursor.execute(query, (username, password_hash, nombre_completo, genero, talla_preferida))
            self.connection.commit()
            print("[OK] Usuario '" + username + "' creado exitosamente con ID: " + str(self.cursor.lastrowid))
            return self.cursor.lastrowid
        except sqlite3.IntegrityError:
            print("[ERROR] El usuario '" + username + "' ya existe")
            return None
        except sqlite3.Error as e:
            print("[ERROR] Error al insertar usuario: " + str(e))
            return None

    def obtener_usuario_por_username(self, username):
        """
        Busca un usuario por su nombre de usuario

        Args:
            username: Nombre de usuario a buscar

        Returns:
            Diccionario con datos del usuario o None si no existe
        """
        try:
            query = "SELECT * FROM usuarios WHERE username = ?"
            self.cursor.execute(query, (username,))
            resultado = self.cursor.fetchone()

            if resultado:
                return dict(resultado)
            return None
        except sqlite3.Error as e:
            print("[ERROR] Error al buscar usuario: " + str(e))
            return None

    def insertar_proyecto(self, usuario_id, nombre, descripcion=None, color_prenda='#FFFFFF', talla=None, tipo='personal', thumbnail=None):
        """
        Crea un nuevo proyecto de diseño

        Args:
            usuario_id: ID del usuario que crea el proyecto
            nombre: Nombre del proyecto
            descripcion: Descripción del proyecto
            color_prenda: Color de la prenda en hexadecimal
            talla: Talla de la prenda

        Returns:
            ID del proyecto creado o None si hubo error
        """
        try:
            query = """
            INSERT INTO proyectos (usuario_id, nombre, descripcion, color_prenda, talla, tipo, thumbnail)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            self.cursor.execute(query, (usuario_id, nombre, descripcion, color_prenda, talla, tipo, thumbnail))
            self.connection.commit()
            print("[OK] Proyecto '" + nombre + "' creado exitosamente con ID: " + str(self.cursor.lastrowid))
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            print("[ERROR] Error al crear proyecto: " + str(e))
            return None

    def obtener_proyectos_usuario(self, usuario_id, sort_by='fecha_modificacion', sort_order='DESC'):
        """
        Obtiene todos los proyectos PERSONALES de un usuario (excluye globales)

        Args:
            usuario_id: ID del usuario
            sort_by (str): Columna por la cual ordenar.
            sort_order (str): 'ASC' o 'DESC'.

        Returns:
            Lista de proyectos personales del usuario
        """
        # Whitelist para evitar inyección SQL en los parámetros de ordenamiento
        allowed_sort_by = ['nombre', 'fecha_creacion', 'fecha_modificacion', 'estado']
        if sort_by not in allowed_sort_by:
            sort_by = 'fecha_modificacion'

        if sort_order.upper() not in ['ASC', 'DESC']:
            sort_order = 'DESC'

        query = "SELECT * FROM proyectos WHERE usuario_id = ? AND tipo = 'personal' ORDER BY {} {}".format(sort_by, sort_order)

        try:
            self.cursor.execute(query, (usuario_id,))
            resultados = self.cursor.fetchall()
            return [dict(row) for row in resultados]
        except sqlite3.Error as e:
            print("[ERROR] Error al obtener proyectos: " + str(e))
            return []

    def obtener_proyectos_globales(self):
        """
        Obtiene proyectos globales (tipo='global')

        Returns:
            Lista de proyectos globales
        """
        try:
            query = "SELECT * FROM proyectos WHERE tipo = 'global' ORDER BY fecha_creacion DESC"
            self.cursor.execute(query)
            resultados = self.cursor.fetchall()
            return [dict(row) for row in resultados]
        except sqlite3.Error as e:
            print("[ERROR] Error al obtener proyectos globales: " + str(e))
            return []

    def insertar_elemento_diseno(self, proyecto_id, tipo, contenido, posicion_x=0, posicion_y=0,
                                 rotacion=0, escala=100, color='#FFFFFF'):
        """
        Agrega un elemento de diseño a un proyecto

        Args:
            proyecto_id: ID del proyecto
            tipo: Tipo de elemento (texto, logo, imagen)
            contenido: Contenido del elemento
            posicion_x: Posición horizontal
            posicion_y: Posición vertical
            rotacion: Grados de rotación
            escala: Escala del elemento (%)
            color: Color del elemento

        Returns:
            ID del elemento creado o None si hubo error
        """
        try:
            query = """
            INSERT INTO elementos_diseno (proyecto_id, tipo, contenido, posicion_x, posicion_y,
                                         rotacion, escala, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            self.cursor.execute(query, (proyecto_id, tipo, contenido, posicion_x, posicion_y,
                                       rotacion, escala, color))
            self.connection.commit()
            print("[OK] Elemento de diseno agregado exitosamente con ID: " + str(self.cursor.lastrowid))
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            print("[ERROR] Error al agregar elemento de diseno: " + str(e))
            return None

    def obtener_elementos_proyecto(self, proyecto_id):
        """
        Obtiene todos los elementos de diseño de un proyecto

        Args:
            proyecto_id: ID del proyecto

        Returns:
            Lista de elementos del proyecto
        """
        try:
            query = "SELECT * FROM elementos_diseno WHERE proyecto_id = ? ORDER BY fecha_creacion ASC"
            self.cursor.execute(query, (proyecto_id,))
            resultados = self.cursor.fetchall()
            return [dict(row) for row in resultados]
        except sqlite3.Error as e:
            print("[ERROR] Error al obtener elementos del proyecto: " + str(e))
            return []

    def reemplazar_elementos_proyecto(self, proyecto_id, elementos):
        """
        Reemplaza todos los elementos de un proyecto por una nueva lista.

        Args:
            proyecto_id: ID del proyecto
            elementos: lista de diccionarios con keys aceptadas (tipo, contenido, posicion_x, posicion_y, rotacion, escala, color, fuente, tamano_fuente)

        Returns:
            True si la operación fue exitosa, False en caso contrario
        """
        try:
            # Borrar elementos existentes
            self.cursor.execute("DELETE FROM elementos_diseno WHERE proyecto_id = ?", (proyecto_id,))

            # Insertar los nuevos elementos (usar los campos permitidos)
            insert_query = (
                "INSERT INTO elementos_diseno (proyecto_id, tipo, contenido, posicion_x, posicion_y, rotacion, escala, color, fuente, tamano_fuente) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            for el in elementos:
                tipo = el.get('tipo') or el.get('type') or 'detalle'
                contenido = el.get('contenido') or el.get('content') or el.get('url') or ''
                posicion_x = float(el.get('posicion_x', el.get('x', 0) or 0))
                posicion_y = float(el.get('posicion_y', el.get('y', 0) or 0))
                rotacion = float(el.get('rotacion', el.get('rotation', 0) or 0))
                escala = float(el.get('escala', el.get('scale', 100) or 100))
                color = el.get('color', '#FFFFFF')
                fuente = el.get('fuente') or el.get('font')
                tamano = int(el.get('tamano_fuente', el.get('size', el.get('tamano', 30)) or 30))
                self.cursor.execute(insert_query, (proyecto_id, tipo, contenido, posicion_x, posicion_y, rotacion, escala, color, fuente, tamano))

            self.connection.commit()
            print("[OK] Elementos del proyecto {} reemplazados exitosamente ({} elementos)".format(proyecto_id, len(elementos)))
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error reemplazando elementos del proyecto: " + str(e))
            return False

    def obtener_estado_diseno_proyecto(self, proyecto_id, usuario_id):
        """Devuelve el estado JSON del personalizador para un proyecto propio."""
        try:
            self.cursor.execute(
                "SELECT estado_diseno_json FROM proyectos WHERE id = ? AND usuario_id = ?",
                (proyecto_id, usuario_id)
            )
            row = self.cursor.fetchone()
            if not row or not row['estado_diseno_json']:
                return None
            return json.loads(row['estado_diseno_json'])
        except (sqlite3.Error, json.JSONDecodeError) as e:
            print("[ERROR] Error al leer el estado del diseño: " + str(e))
            return None

    def guardar_estado_diseno_proyecto(self, proyecto_id, usuario_id, estado_diseno):
        """Guarda el estado completo del personalizador solo en un proyecto propio."""
        try:
            serialized_state = json.dumps(
                estado_diseno,
                ensure_ascii=False,
                separators=(',', ':'),
                allow_nan=False
            )
            self.cursor.execute(
                "UPDATE proyectos SET estado_diseno_json = ?, fecha_modificacion = ? WHERE id = ? AND usuario_id = ?",
                (serialized_state, datetime.now().isoformat(), proyecto_id, usuario_id)
            )
            self.connection.commit()
            return self.cursor.rowcount == 1
        except (sqlite3.Error, TypeError, ValueError) as e:
            print("[ERROR] Error al guardar el estado del diseño: " + str(e))
            self.connection.rollback()
            return False

    def actualizar_proyecto(self, proyecto_id, **campos):
        """
        Actualiza los campos de un proyecto

        Args:
            proyecto_id: ID del proyecto a actualizar
            **campos: Campos a actualizar (nombre, descripcion, estado, etc.)

        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        if not campos:
            return False

        try:
            campos['fecha_modificacion'] = datetime.now().isoformat()
            set_clause = ', '.join([key + " = ?" for key in campos.keys()])
            valores = list(campos.values())
            valores.append(proyecto_id)

            query = "UPDATE proyectos SET " + set_clause + " WHERE id = ?"
            self.cursor.execute(query, valores)
            self.connection.commit()
            print("[OK] Proyecto " + str(proyecto_id) + " actualizado exitosamente")
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al actualizar proyecto: " + str(e))
            return False

    def eliminar_proyecto(self, proyecto_id):
        """
        Elimina un proyecto y todos sus elementos (NO PERMITE eliminar proyectos globales)

        Args:
            proyecto_id: ID del proyecto a eliminar

        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        try:
            # Verificar que NO sea un proyecto global (protección)
            self.cursor.execute("SELECT tipo FROM proyectos WHERE id = ?", (proyecto_id,))
            resultado = self.cursor.fetchone()

            if resultado and resultado[0] == 'global':
                print("[ERROR] No se pueden eliminar proyectos globales")
                return False

            query = "DELETE FROM proyectos WHERE id = ?"
            self.cursor.execute(query, (proyecto_id,))
            self.connection.commit()
            print("[OK] Proyecto " + str(proyecto_id) + " eliminado exitosamente")
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al eliminar proyecto: " + str(e))
            return False

    def actualizar_usuario(self, usuario_id, **campos):
        """
        Actualiza los campos de un usuario

        Args:
            usuario_id: ID del usuario a actualizar
            **campos: Campos a actualizar

        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        if not campos:
            return False

        try:
            set_clause = ', '.join([key + " = ?" for key in campos.keys()])
            valores = list(campos.values())
            valores.append(usuario_id)

            query = "UPDATE usuarios SET " + set_clause + " WHERE id = ?"
            self.cursor.execute(query, valores)
            self.connection.commit()
            print("[OK] Usuario " + str(usuario_id) + " actualizado exitosamente")
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al actualizar usuario: " + str(e))
            return False

    def obtener_usuario_por_id(self, usuario_id):
        """
        Busca un usuario por su ID

        Args:
            usuario_id: ID del usuario a buscar

        Returns:
            Diccionario con datos del usuario o None si no existe
        """
        try:
            query = "SELECT * FROM usuarios WHERE id = ?"
            self.cursor.execute(query, (usuario_id,))
            resultado = self.cursor.fetchone()

            if resultado:
                return dict(resultado)
            return None
        except sqlite3.Error as e:
            print("[ERROR] Error al buscar usuario: " + str(e))
            return None

    def existe_proyecto_de_usuario(self, proyecto_id, usuario_id):
        """
        Verifica si un proyecto pertenece a un usuario específico

        Args:
            proyecto_id: ID del proyecto
            usuario_id: ID del usuario

        Returns:
            True si el proyecto pertenece al usuario, False en caso contrario
        """
        try:
            query = "SELECT 1 FROM proyectos WHERE id = ? AND usuario_id = ?"
            self.cursor.execute(query, (proyecto_id, usuario_id))
            return self.cursor.fetchone() is not None
        except sqlite3.Error as e:
            print("[ERROR] Error al verificar pertenencia del proyecto: " + str(e))
            return False

    def actualizar_usuario_perfil(self, usuario_id, **campos):
        """
        Actualiza campos seguros del perfil de usuario (whitelist)

        Args:
            usuario_id: ID del usuario a actualizar
            **campos: Solo campos permitidos: nombre_completo, genero, talla_preferida, foto_perfil

        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        # Whitelist de campos permitidos
        campos_permitidos = {'nombre_completo', 'genero', 'talla_preferida', 'foto_perfil'}
        campos_seguros = {k: v for k, v in campos.items() if k in campos_permitidos}

        if not campos_seguros:
            return False

        return self.actualizar_usuario(usuario_id, **campos_seguros)

    def actualizar_usuario_config(self, usuario_id, **campos):
        """
        Actualiza campos seguros de configuración de usuario (whitelist)

        Args:
            usuario_id: ID del usuario a actualizar
            **campos: Solo campos permitidos: idioma, privacidad, notificaciones_activas, modo_oscuro

        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        # Whitelist de campos permitidos
        campos_permitidos = {'idioma', 'privacidad', 'notificaciones_activas', 'modo_oscuro'}
        campos_seguros = {k: v for k, v in campos.items() if k in campos_permitidos}

        if not campos_seguros:
            return False

        return self.actualizar_usuario(usuario_id, **campos_seguros)

    def actualizar_proyecto_seguro(self, proyecto_id, usuario_id, **campos):
        """
        Actualiza campos seguros de un proyecto (whitelist) verificando pertenencia
        NO PERMITE actualizar proyectos globales

        Args:
            proyecto_id: ID del proyecto a actualizar
            usuario_id: ID del usuario que intenta actualizar
            **campos: Solo campos permitidos

        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        # Verificar que NO sea un proyecto global (protección)
        self.cursor.execute("SELECT tipo FROM proyectos WHERE id = ?", (proyecto_id,))
        resultado = self.cursor.fetchone()

        if resultado and resultado[0] == 'global':
            print("[ERROR] No se pueden modificar proyectos globales")
            return False

        # Verificar pertenencia
        if not self.existe_proyecto_de_usuario(proyecto_id, usuario_id):
            print("[ERROR] Proyecto no pertenece al usuario o no existe")
            return False

        # Whitelist de campos permitidos
        campos_permitidos = {'nombre', 'descripcion', 'estado', 'color_prenda', 'talla', 'es_publico', 'thumbnail'}
        campos_seguros = {k: v for k, v in campos.items() if k in campos_permitidos}

        if not campos_seguros:
            return False

        return self.actualizar_proyecto(proyecto_id, **campos_seguros)

    def crear_indices(self):
        """
        Crea índices para mejorar el rendimiento de las consultas
        """
        try:
            # Índice para consultas de proyectos por usuario
            self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_proyectos_usuario_id
                ON proyectos(usuario_id)
            """)

            # Índice para consultas de elementos por proyecto
            self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_elementos_proyecto_id
                ON elementos_diseno(proyecto_id)
            """)

            # Índice para búsqueda de sesiones por token
            self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_sesiones_token
                ON sesiones(token)
            """)

            # Índice para sesiones activas por usuario
            self.cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_activa
                ON sesiones(usuario_id, activa)
            """)

            self.connection.commit()
            print("[OK] Índices creados exitosamente")
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al crear índices: " + str(e))
            return False

    def actualizar_proyecto_thumbnail(self, proyecto_id, filename):
        """Actualiza el thumbnail de un proyecto con un filename"""
        try:
            query = "UPDATE proyectos SET thumbnail = ?, fecha_modificacion = ? WHERE id = ?"
            self.cursor.execute(query, (filename, datetime.now().isoformat(), proyecto_id))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            print("[ERROR] Error al actualizar thumbnail del proyecto: " + str(e))
            return False

    def asociar_archivo_usuario(self, usuario_id, filename):
        """Asocia un archivo subido al usuario (puedes crear una tabla archivos si lo deseas)"""
        try:
            query = "UPDATE usuarios SET foto_perfil = ? WHERE id = ?"
            self.cursor.execute(query, (filename, usuario_id))
            self.connection.commit()
            logging.info("Archivo {} asociado a usuario {}".format(filename, usuario_id))
            return True
        except Exception as e:
            logging.error("Error asociando archivo: {}".format(str(e)))
            return False

    def insertar_archivo(self, usuario_id, filename, tipo, tamano, hash, proyecto_id=None):
        """Registra un archivo subido en la tabla avanzada"""
        try:
            query = """
            INSERT INTO archivos (usuario_id, proyecto_id, filename, tipo, tamano, hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """
            self.cursor.execute(query, (usuario_id, proyecto_id, filename, tipo, tamano, hash))
            self.connection.commit()
            logging.info("Archivo registrado: {} usuario {}".format(filename, usuario_id))
            return self.cursor.lastrowid
        except Exception as e:
            logging.error("Error insertando archivo: {}".format(str(e)))
            return None

    def insertar_archivo(self, usuario_id, filename, tipo, tamano, hash, proyecto_id=None):
        """Registra un archivo subido en la tabla avanzada"""
        try:
            query = """
            INSERT INTO archivos (usuario_id, proyecto_id, filename, tipo, tamano, hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """
            self.cursor.execute(query, (usuario_id, proyecto_id, filename, tipo, tamano, hash))
            self.connection.commit()
            logging.info("Archivo registrado: {} usuario {}".format(filename, usuario_id))
            return self.cursor.lastrowid
        except Exception as e:
            logging.error("Error insertando archivo: {}".format(str(e)))
            return None

    def validar_archivo_hash(self, hash):
        """Verifica si el hash de archivo ya existe (para evitar duplicados/virus)"""
        try:
            query = "SELECT id FROM archivos WHERE hash = ?"
            self.cursor.execute(query, (hash,))
            return self.cursor.fetchone() is not None
        except Exception as e:
            logging.error("Error validando hash: {}".format(str(e)))
            return False

    def obtener_archivos_activos_por_usuario(self, usuario_id, pagina=1, limite=10):
        """
        Obtiene una lista paginada de archivos activos subidos por un usuario.

        Args:
            usuario_id: ID del usuario cuyas archivos se desean obtener.
            pagina: Número de página para la paginación.
            limite: Número de archivos por página.

        Returns:
            Lista de archivos activos del usuario.
        """
        offset = (pagina - 1) * limite
        query = "SELECT * FROM archivos WHERE usuario_id = ? AND estado = 'activo' ORDER BY fecha_subida DESC, id DESC LIMIT ? OFFSET ?"
        try:
            self.cursor.execute(query, (usuario_id, limite, offset))
            resultados = self.cursor.fetchall()
            return [dict(row) for row in resultados]
        except sqlite3.Error as e:
            logging.error("[ERROR] Error al obtener archivos activos: " + str(e))
            return []
    def duplicar_proyecto_para_usuario(self, proyecto_original_id, nuevo_usuario_id, nuevo_nombre):
        """
        Duplica un proyecto existente para un usuario específico.
        Copia el proyecto y todos sus elementos de diseño.

        Args:
            proyecto_original_id (int): ID del proyecto a duplicar.
            nuevo_usuario_id (int): ID del usuario que recibirá la copia.
            nuevo_nombre (str): Nombre para el nuevo proyecto.

        Returns:
            int: El ID del nuevo proyecto creado, o None si hay un error.
        """
        try:
            # 1. Obtener datos del proyecto original
            self.cursor.execute("SELECT * FROM proyectos WHERE id = ?", (proyecto_original_id,))
            proyecto_original = self.cursor.fetchone()
            if not proyecto_original:
                print("[ERROR] No se encontró el proyecto original con ID {}".format(proyecto_original_id))
                return None
                return None

            # 2. Crear el nuevo proyecto para el usuario, marcándolo como 'personal'
            nuevo_proyecto_id = self.insertar_proyecto(
                usuario_id=nuevo_usuario_id,
                nombre=nuevo_nombre,
                descripcion=proyecto_original['descripcion'],
                color_prenda=proyecto_original['color_prenda'],
                talla=proyecto_original['talla'],
                tipo='personal', # La copia siempre es personal
                thumbnail=proyecto_original['thumbnail']
            )

            # 3. Copiar todos los elementos de diseño
            elementos_originales = self.obtener_elementos_proyecto(proyecto_original_id)
            self.reemplazar_elementos_proyecto(nuevo_proyecto_id, elementos_originales)
            if proyecto_original['estado_diseno_json']:
                self.cursor.execute(
                    "UPDATE proyectos SET estado_diseno_json = ? WHERE id = ?",
                    (proyecto_original['estado_diseno_json'], nuevo_proyecto_id)
                )
                self.connection.commit()

            return nuevo_proyecto_id
        except sqlite3.Error as e:
            print("[ERROR] Error al duplicar proyecto: {}".format(e))
            self.connection.rollback() # Revertir cambios en caso de error
            return None

    def execute_query(self, query: str, params: tuple = ()):
        """Execute a query with detailed logging."""
        try:
            self.cursor.execute(query, params)
            self.connection.commit()
            logging.info(f"Query executed successfully: {query}")
        except sqlite3.Error as e:
            logging.error(f"Error executing query: {query}, Error: {e}")
            raise
