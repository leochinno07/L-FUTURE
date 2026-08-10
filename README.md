
# L-FUTURE — Diseñador de Camisetas 3D

> Nota: El roadmap maestro de fases está en `ROADMAP.md`. Este archivo centraliza la planificación del proyecto; el resto de la documentación es soporte.

## Contexto

Resumen del problema y motivación de esta fase.

## Criterios de éxito

- KPI 1
- KPI 2

Una aplicación web moderna para diseñar y personalizar camisetas en tiempo real utilizando un motor de gráficos 3D interactivo. Esta versión demo permite a los usuarios registrarse, crear proyectos, añadir elementos gráficos (texto, logos), ver cambios en tiempo real en un visor 3D, guardar/cargar proyectos y exportar diseños como imágenes.

[Video Demo]([https://youtu.be/7J8de-nYAac?feature=shared)](https://youtu.be/7J8de-nYAac?feature=shared))

## TL;DR Inicio Rápido

```bash
# Inicialización de git (si no existe aún)
git init
# Opcional: crear remote en GitHub
# git remote add origin https://github.com/<usuario>/<repo>.git

# Configuración y ejecución con un solo comando
python scripts/run_all.py

# O pasos manuales:
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
pip install -r backend/requirements.txt
python backend/init_db.py
python backend/server_simple.py

# Abrir http://127.0.0.1:5000/
```

## Tabla de Contenidos

- [Resumen](#resumen)

- [Características](#características)

- [Arquitectura](#arquitectura)

- [Inicio Rápido](#inicio-rápido)

- [Configuración Manual](#configuración-manual)

- [Documentación API](#documentación-api)

- [Esquema de Base de Datos](#esquema-de-base-de-datos)

- [Pruebas](#pruebas)

- [Despliegue](#despliegue)

- [Solución de Problemas](#solución-de-problemas)

- [Contribución](#contribución)

- [Hoja de Ruta](#hoja-de-ruta)

- [Fases de implementación](#fases-de-implementación)

- [Agente del proyecto](#agente-del-proyecto)

- [Licencia](#licencia)

## Resumen

L-FUTURE es un diseñador de camisetas 3D basado en web que cierra la brecha entre herramientas profesionales de diseño gráfico y personalización fácil de usar. La aplicación sirve archivos frontend estáticos a través de un backend Python Flask, con SQLite para persistencia de datos y Three.js para renderizado 3D.

### Pila Tecnológica

- **Frontend**: JavaScript Vanilla, HTML5, CSS3, Three.js

- **Backend**: Python Flask + SQLite

- **Motor 3D**: Three.js con arquitectura modular

- **Autenticación**: Tokens JWT

- **Herramientas de Construcción**: Vite (disponible para desarrollo, pero producción usa servicio de archivos estáticos)

**Nota sobre el Sistema de Construcción**: La configuración actual sirve archivos frontend estáticamente a través de Flask. Vite está incluido para posibles flujos de trabajo de desarrollo futuros pero no es requerido para operación básica. El frontend consiste en archivos HTML/JS/CSS planos que funcionan sin empaquetado.

## Características

- Registro y autenticación segura de usuarios

- Creación y gestión de proyectos

- Visualización de camisetas 3D en tiempo real

- Añadir texto, logos y elementos gráficos

- Guardar y cargar proyectos de diseño

- Exportar diseños como imágenes

- Interfaz de usuario responsiva en todos los dispositivos

## Arquitectura

### Estructura del Proyecto

```text

project/
├── frontend/                    # Recursos frontend estáticos
│   ├── editor-3d.html          # Editor 3D principal
│   ├── index.html              # Página de inicio
│   ├── login.html              # Autenticación
│   ├── register.html
│   ├── inicio.html             # Panel de control
│   ├── perfil.html             # Perfil de usuario
│   ├── diseños1.0.html         # Galería de proyectos
│   └── components/             # Componentes UI reutilizables
├── backend/                    # Servidor Python Flask
│   ├── server_simple.py        # Servidor principal
│   ├── database.py             # Wrapper SQLite
│   ├── init_db.py              # Inicialización BD
│   ├── uploads.py              # Manejo de archivos
│   ├── requirements.txt        # Dependencias Python
│   └── .env                    # Configuración de entorno
├── engines/                    # Módulos del motor 3D
├── scripts/                    # Scripts de configuración y ejecución
└── .github/workflows/          # Pipelines CI/CD

```text

### System Architecture

```text

┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Browser       │◄────────────────►│   Flask Server  │
│                 │                  │  (server_simple.py)
│ ┌─────────────┐ │                  │                 │
│ │  Frontend   │ │                  │ ┌─────────────┐ │
│ │  (HTML/JS)  │ │                  │ │   API       │ │
│ └─────────────┘ │                  │ │ /api/*      │ │
└─────────────────┘                  └─────────────────┘
                                     │
                                     │ SQLite
                                     ▼
                             ┌────────────────  ─┐
                             │   Database        │
                             │  (lfuture.db)     │
                             │                   │
                             │ • usuarios        │
                             │ • proyectos       │
                             │ • elementos_diseno│
                             │ • sesiones        │
                             │ • archivos        │
                             └────────────────  ─┘

```text

### Flujo de Datos

1. **Interacción del Usuario** → JavaScript Frontend
2. **Llamadas API** → Rutas Flask con autenticación
3. **Lógica de Negocio** → Operaciones de base de datos
4. **Renderizado 3D** → Actualizaciones del motor Three.js
5. **Persistencia** → Almacenamiento SQLite

### Arquitectura del Motor 3D

El renderizado 3D está manejado por Three.js integrado en el frontend:

- **Editor Principal**: `frontend/editor-3d.html` - Contiene el canvas 3D y controles

- **Gestión de Escena**: JavaScript inline maneja la configuración de escena, cámara y renderizador de Three.js

- **Manipulación de Objetos**: Controles de transformación para mover, rotar y escalar elementos 3D

- **Sistema de Materiales**: Soporte para diferentes tipos de materiales (estándar, metal, textura)

- **Actualizaciones en Tiempo Real**: Los cambios se reflejan inmediatamente en el visor 3D

**Componentes Clave:**

- Escena Three.js con cámara, luces y renderizador

- Malla de camiseta como modelo 3D base

- Elementos de texto e imagen como objetos 3D

- Controles orbitales para manipulación de cámara

- Funcionalidad de exportación para guardar renders

### Esquema de Base de Datos

La aplicación usa SQLite con las siguientes tablas:

#### usuarios (Users)

```sql

CREATE TABLE usuarios (
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

```text

#### proyectos (Projects)

```sql

CREATE TABLE proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT DEFAULT 'en_progreso' CHECK(estado IN ('en_progreso', 'completado')),
    tipo TEXT DEFAULT 'personal' CHECK(tipo IN ('personal', 'global')),
    color_prenda TEXT DEFAULT '#FFFFFF',
    thumbnail TEXT,
    talla TEXT CHECK(talla IN ('S', 'M', 'L', 'XL', 'XXL')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    es_publico BOOLEAN DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

```text

#### elementos_diseno (Design Elements)

```sql

CREATE TABLE elementos_diseno (
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

```text

#### sesiones (Sessions)

```sql

CREATE TABLE sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    activa BOOLEAN DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

```text

#### archivos (Files)

```sql

CREATE TABLE archivos (
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

```text
**Relaciones:**

- `usuarios` 1:N `proyectos` (un usuario puede tener muchos proyectos)

- `proyectos` 1:N `elementos_diseno` (un proyecto puede tener muchos elementos de diseño)

- `usuarios` 1:N `sesiones` (un usuario puede tener múltiples sesiones activas)

- `usuarios` 1:N `archivos` (un usuario puede subir muchos archivos)

- `proyectos` 1:N `archivos` (un proyecto puede tener múltiples archivos asociados)

## Inicio Rápido

### Prerrequisitos

- Python 3.8+ (disponible como `python`)

- Git (opcional)

- Node.js 18+ (opcional, para desarrollo con Vite)

### Configuración Automática (Recomendada)

**Multiplataforma:**

```bash

python scripts/run_all.py

```text
**Windows PowerShell:**

```powershell

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\run_all.ps1

```text
Este lanzador:

- Crea `.venv/` si no existe

- Instala dependencias desde `backend/requirements.txt`

- Ejecuta `backend/init_db.py` para crear/actualizar la base de datos

- Inicia `backend/server_simple.py` en `[http://127.0.0.1:5000`](http://127.0.0.1:5000`)

### Verificar Instalación

Abrir `[http://127.0.0.1:5000/`](http://127.0.0.1:5000/`) en el navegador.

Probar la API:

```bash

curl [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

```text

## Configuración Manual

1. **Crear entorno virtual:**

   ```bash

   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac

   # o

   .venv\Scripts\Activate.ps1  # Windows

   ```text
2. **Instalar dependencias:**

   ```bash

   pip install -r backend/requirements.txt

   ```text
3. **Inicializar base de datos:**

   ```bash

   python backend/init_db.py

   ```text
4. **Iniciar servidor:**

   ```bash

   python backend/server_simple.py

   ```text
5. **Abrir navegador:** `[http://127.0.0.1:5000/`](http://127.0.0.1:5000/`)

## Documentación API

### Autenticación

#### POST /api/login

```bash

curl -X POST [http://127.0.0.1:5000/api/login](http://127.0.0.1:5000/api/login) \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario", "password": "contraseña"}'

```text
```powershell

Invoke-RestMethod -Uri '[http://127.0.0.1:5000/api/login'](http://127.0.0.1:5000/api/login') -Method Post `
  -Body (@{username='usuario';password='contraseña'} | ConvertTo-Json) `
  -ContentType 'application/json'

```text

#### POST /api/register

```bash

curl -X POST [http://127.0.0.1:5000/api/register](http://127.0.0.1:5000/api/register) \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario", "email": "usuario@example.com", "password": "contraseña"}'

```text
```powershell

Invoke-RestMethod -Uri '[http://127.0.0.1:5000/api/register'](http://127.0.0.1:5000/api/register') -Method Post `
  -Body (@{username='usuario';email='usuario@example.com';password='contraseña'} | ConvertTo-Json) `
  -ContentType 'application/json'

```text

### Proyectos

**GET /api/proyectos** - Listar proyectos del usuario

```bash

curl -H "Authorization: Bearer <token>" [http://127.0.0.1:5000/api/proyectos](http://127.0.0.1:5000/api/proyectos)

```text
**POST /api/proyectos** - Crear proyecto

```bash

curl -X POST [http://127.0.0.1:5000/api/proyectos](http://127.0.0.1:5000/api/proyectos) \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Mi Diseño", "descripcion": "Descripción"}'

```text
**PUT /api/proyectos/{id}/elementos** - Actualizar elementos del proyecto (atómico)

```bash

curl -X PUT [http://127.0.0.1:5000/api/proyectos/1/elementos](http://127.0.0.1:5000/api/proyectos/1/elementos) \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"elementos": [...]}'

```text

### Subidas

**POST /api/upload** - Subir archivo de imagen

```bash

curl -X POST [http://127.0.0.1:5000/api/upload](http://127.0.0.1:5000/api/upload) \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: image/png" \
  --data-binary @imagen.png

```text

## Pruebas

### Pruebas del Backend

Ejecutar pruebas unitarias:

```bash

python -m unittest discover backend/

```text

### Pruebas de Integración

Ejecutar pruebas de integración (requiere backend ejecutándose):

```bash

python tools/integration_test.py

```text

### Pruebas del Frontend

Ejecutar pruebas unitarias:

```bash

npm run test

```text

### Pruebas E2E

Ejecutar pruebas de extremo a extremo:

```bash

npm run test:e2e

```text

### Lista de Verificación de Pruebas Manuales

- [ ] Registro e inicio de sesión de usuario

- [ ] Creación y edición de proyectos

- [ ] Añadir elementos de texto e imagen

- [ ] Actualizaciones de visualización 3D

- [ ] Guardado y carga de proyectos

- [ ] Funcionalidad de exportación

- [ ] Diseño responsivo en móvil

- [ ] Compatibilidad entre navegadores

## Despliegue

### Docker (Recomendado para Producción)

1. **Construir imagen:**

   ```bash
   docker build -t lfuture .
   ```
2. **Ejecutar contenedor:**

   ```bash
   docker run -p 5000:5000 lfuture
   ```
3. **Con variables de entorno:**

   ```bash
   docker run -p 5000:5000 \
     -e SECRET_KEY="tu-secreto-de-produccion" \
     -e DEV_MODE=false \
     -e HOST=0.0.0.0 \
     lfuture
   ```

> Nota: El repositorio ahora incluye `.dockerignore` para excluir archivos grandes y temporales durante el build.

### Docker Compose

Crear `docker-compose.yml`:

```yaml

version: '3.8'
services:
  lfuture:
    build: .
    ports:
      - "5000:5000"
    environment:
      - SECRET_KEY=tu-secreto-de-produccion
      - DEV_MODE=false
      - HOST=0.0.0.0
    volumes:
      - ./backend/uploads:/app/backend/uploads
      - ./backend/lfuture.db:/app/backend/lfuture.db

```text
Ejecutar con:

```bash

docker-compose up -d

```text

### Opciones de Despliegue en la Nube

#### Heroku

1. Crear aplicación Heroku
2. Configurar variables de entorno en el dashboard de Heroku
3. Desplegar con git push o Docker

#### DigitalOcean App Platform

1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Establecer comando de construcción: `pip install -r backend/requirements.txt`
4. Establecer comando de ejecución: `python backend/server_simple.py`

#### AWS/GCP/Azure

1. Containerizar con Docker
2. Desplegar al servicio de contenedores (ECS, Cloud Run, AKS)
3. Configurar balanceador de carga y dominio
4. Configurar certificado SSL

### Lista de Verificación para Producción

- [ ] Establecer `SECRET_KEY` fuerte

- [ ] Deshabilitar `DEV_MODE`

- [ ] Configurar `ALLOWED_ORIGINS` para tu dominio

- [ ] Configurar HTTPS/SSL

- [ ] Configurar logging a servicio externo

- [ ] Configurar respaldos de base de datos

- [ ] Configurar monitoreo/alertas

- [ ] Configurar pipeline CI/CD

## Solución de Problemas

### Problemas Comunes

**Puerto ya en uso:**

- Cambiar PORT en `backend/.env` o matar el proceso en el puerto 5000

- Windows: `netstat -ano | findstr :5000` luego `taskkill /PID <PID> /F`

- Linux/Mac: `lsof -ti:5000 | xargs kill -9`

**Errores de base de datos:**

- Eliminar `backend/lfuture.db` y re-ejecutar `python backend/init_db.py`

- Verificar permisos de archivo en el archivo de base de datos

**Problemas de caché del Service Worker:**

- Actualización forzada (Ctrl+F5) o limpiar caché del navegador

- Abrir DevTools (F12) → Application → Storage → Clear site data

- Abrir DevTools (F12) → Application → Storage → Clear site data

- Dar de baja service worker: Application → Service Workers → Unregister

**Renderizado 3D no funciona:**

- Asegurar que WebGL esté habilitado en la configuración del navegador

- Verificar consola del navegador para errores de Three.js

- Actualizar controladores gráficos

**Errores CORS:**

- Para desarrollo, asegurar `ALLOWED_ORIGINS=*` en `.env`

- Para producción, configurar a tu dominio: `ALLOWED_ORIGINS=[https://tudominio.com`](https://tudominio.com`)

**Fallos en subida:**

- Verificar que el directorio `backend/uploads/` existe y es escribible

- Verificar que el tamaño del archivo esté bajo los límites

- Verificar logs del servidor en `backend/lfuture_backend.log`

**Problemas de autenticación:**

- Limpiar localStorage/cookies del navegador

- Verificar expiración del token JWT

- Verificar `SECRET_KEY` en `.env`

### Logs

Logs del servidor: `backend/lfuture_backend.log`

Logs del frontend: Consola del navegador (F12 → Console)

### Obtener Ayuda

- Verificar issues existentes en GitHub

- Incluir extractos relevantes de logs al reportar bugs

- Mencionar tu OS, navegador y versiones de Python/Node

## Contribución

1. Hacer fork del repositorio
2. Crear una rama de feature
3. Hacer cambios con pruebas
4. Enviar un pull request

### Estilo de Código

- Python: PEP 8

- JavaScript: Reglas ESLint en `.eslintrc.json`

- Usar Prettier para formateo

## Notas de Rendimiento

### Optimización de Renderizado 3D

- **Objetivo de FPS**: 60 FPS para interacción 3D suave

- **Complejidad de Geometría**: Mantener malla de camiseta bajo 10k vértices

- **Tamaños de Textura**: Limitar a 1024x1024px para compatibilidad WebGL

- **Cantidad de Materiales**: Minimizar cambios de material por frame

### Rendimiento del Backend

- **Consultas de Base de Datos**: Usar índices en columnas consultadas frecuentemente

- **Subidas de Archivos**: Limitar subidas concurrentes para prevenir problemas de memoria

- **Gestión de Sesiones**: Implementar limpieza de sesiones para tokens expirados

### Optimización del Frontend

- **Tamaño del Bundle**: Los archivos estáticos actuales se sirven tal cual; monitorear tamaño total

- **Carga de Imágenes**: Carga lazy para miniaturas de proyectos

- **Llamadas API**: Implementar caché para datos estáticos

- **Contexto WebGL**: Asegurar limpieza apropiada en navegación de páginas

### Monitoreo

- Rastrear rendimiento de renderizado 3D con `stats.js`

- Monitorear tiempos de respuesta de API

- Registrar rendimiento de consultas de base de datos

- Configurar alertas para alto uso de memoria

## Decisiones Técnicas

### ¿Por qué Flask en lugar de Django?

- **Simplicidad**: Flask proporciona justo lo que necesitamos sin la estructura pesada de Django

- **Flexibilidad**: Más fácil de personalizar para nuestros requerimientos específicos de API

- **Rendimiento**: Más ligero para una aplicación enfocada

- **Curva de Aprendizaje**: Más simple para que los contribuidores entiendan

### ¿Por qué SQLite en lugar de PostgreSQL?

- **Simplicidad**: No hay servidor de base de datos separado que gestionar

- **Despliegue**: Base de datos de archivo único simplifica el hosting

- **Rendimiento**: Suficiente para la carga de usuarios esperada (<10k usuarios)

- **Ruta de Migración**: Se puede actualizar a PostgreSQL después si es necesario

### ¿Por qué Servicio de Archivos Estáticos en lugar de Vite en Producción?

- **Estado Actual**: Los archivos frontend funcionan como HTML/JS/CSS plano

- **Simplicidad**: No se requiere paso de construcción para funcionalidad básica

- **Rendimiento**: El servicio directo de archivos es más rápido que el empaquetado

- **Opción Futura**: Vite disponible para desarrollo frontend complejo

### ¿Por qué Three.js en lugar de Otras Librerías 3D?

- **Madurez**: Librería WebGL bien establecida

- **Comunidad**: Gran ecosistema y documentación

- **Flexibilidad**: Control de bajo nivel sobre renderizado 3D

- **Estándares Web**: Construido sobre WebGL, funciona en todos los navegadores modernos

### ¿Por qué JWT en lugar de Cookies de Sesión?

- **Escalabilidad**: Autenticación sin estado funciona con múltiples servidores

- **API-First**: Mejor para potencial integración de apps móviles

- **Seguridad**: Tokens de corta duración reducen riesgo de secuestro de sesión

- **Estándares**: Estándar de autenticación ampliamente adoptado

## Hoja de Ruta

### Fase 1: Mejora del Núcleo (Próximos 3 meses)

- [ ] Completar funcionalidad de exportación (salida PNG/PDF)

- [ ] Añadir deshacer/rehacer para cambios de diseño

- [ ] Implementar selector de color para elementos

- [ ] Añadir plantillas preset y temas

## Fases de implementación

El proyecto ahora usa archivos faseados en `fases/FASE*.md`. Cada archivo describe objetivos, entregables y pasos de verificación.

- FASE1: Backend y API REST

- FASE2: Frontend modular y limpieza de código

- FASE3: Seguridad y acceso

- FASE4: Documentación y roadmap

- FASE5: Reducción de `node_modules` en runtime

- FASE6: Tests y CI

- FASE7: Escalabilidad e infraestructura

- FASE8: Android / PWA

- FASE9: Integración IA

- FASE10: Optimización 3D y UX

## Agente del proyecto

Se agregó `agent.md` para definir responsabilidades del agente de dirección:

- Coordinar fases

- Implementar chequeos de calidad

- Controlar documentación estratégica

- Gestionar riesgos y cuellos de botella

Revisar ese archivo para la definición de «comando de proyecto» y la ruta de ejecución.

### Fase 2: Características Avanzadas (3-6 meses)

- [ ] Integración AR para escaneo de ropa en tiempo real

- [ ] Integración de compra (compra con un clic)

- [ ] Soporte avanzado de modelos 3D (importación OBJ/GLTF)

- [ ] Soporte multi-idioma (i18n)

- [ ] Versión de app móvil

### Fase 3: Escala y Rendimiento (6-12 meses)

- [ ] Migración de base de datos a PostgreSQL

- [ ] Capa de caché Redis

- [ ] Soporte de escalado horizontal

- [ ] Analíticas avanzadas y seguimiento de usuarios

- [ ] Protección contra abuso y limitación de tasa API

### Fase 4: Ecosistema (1+ año)

- [ ] Sistema de plugins para elementos personalizados

- [ ] Integraciones de terceros (servicios de impresión)

- [ ] Características de colaboración (proyectos compartidos)

- [ ] Sugerencias de diseño impulsadas por IA

- [ ] Características empresariales (equipos, branding)

## Licencia

Proyecto educativo/demo. Contacto: rojaschinnoleandro@gmail.com

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
