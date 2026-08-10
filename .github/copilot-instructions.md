
# Instrucciones para Copilot — L-FUTURE / tshirt-3d-move-app

## Contexto

Resumen del problema y motivación de esta fase.

## Criterios de éxito

- KPI 1
- KPI 2

Este archivo proporciona orientación concisa y específica del proyecto para agentes de IA de escritura de código (estilo Copilot) para que puedas ser productivo al editar, ejecutar o extender este repositorio.

## Prerrequisitos y lista de verificación de configuración rápida

Antes de editar o ejecutar el proyecto, asegúrate de que la máquina de desarrollo tenga instalado y configurado lo siguiente:

- Node.js 18+ (para frontend Vite). Verificar con `node -v`.

- Python 3.8+ recomendado (el servidor simple es compatible con versiones anteriores pero algunas herramientas y dependencias asumen Python moderno). Verificar con `python --version`.

- Git y un shell utilizable (PowerShell en Windows). Muchas rutas contienen espacios así que envuélvelas en comillas al hacer scripting.

- Opcional: Editor de imágenes y recursos de muestra para pruebas del frontend (logo.png etc.)

Lista de verificación rápida (copiar/pegar en PowerShell desde la raíz del repo):

```powershell

# Clonar (si es necesario) y entrar al repo

# git clone <repo> my-project; cd my-project

# Instalar dependencias del frontend e iniciar servidor de desarrollo

npm install
npm run dev

# Backend Python: crear venv, instalar dependencias e inicializar BD

# Iniciar servidor backend (secuencia recomendada)

python -m venv .venv; .\.venv\Scripts\Activate
pip install -r backend\requirements.txt
python backend\init_db.py   # crea las tablas si es la primera vez
python backend\server_simple.py

```text
Nota: Si planeas ejecutar frontend y backend simultáneamente, inicia `npm run dev` (puerto Vite por defecto 5173) y configura `BASE_URL` cuando uses la herramienta collector o cuando el frontend obtenga datos de un puerto no por defecto.

## Referencia Rápida: Archivos Clave

### Puntos de Entrada del Frontend

- frontend/index.html — Página de inicio

- frontend/login.html — Inicio de sesión de usuario

- frontend/register.html — Registro de usuario

- frontend/inicio.html — Panel de control del usuario

- frontend/editor-3d.html — Editor 3D principal

- frontend/perfil.html — Perfil de usuario

- frontend/diseños1.0.html — Galería de proyectos

### Archivos Core del Backend

- backend/server_simple.py — Servidor Flask principal

- backend/database.py — Wrapper de base de datos SQLite

- backend/init_db.py — Inicialización de base de datos

- backend/uploads.py — Manejo de subida de archivos

- backend/requirements.txt — Dependencias Python

### Archivos de Configuración

- package.json — Scripts y dependencias de Node.js

- backend/.env.example — Plantilla de variables de entorno

- .eslintrc.json — Reglas de linting de JavaScript

- .prettierrc — Configuración de formato de código

### Documentación

- README.md — Documentación principal del proyecto

- CONTRIBUTING.md — Directrices de contribución

- .github/copilot-instructions.md — Este archivo

1) Panorama general (lo que importa)

- El frontend vive en `frontend/` como archivos HTML/JS estáticos servidos por el backend Flask. Archivos clave: `frontend/main-loader.js`, `frontend/api.js`, `frontend/auth.js`.

- El código del motor 3D está en `engines/` (si existe) o integrado en archivos frontend. Funcionalidad 3D core en `frontend/editor-3d.html` y JS relacionado.

- El backend es Python-based en `backend/`. Servidor principal es `backend/server_simple.py` con operaciones de base de datos en `backend/database.py`.

2) How to run & common developer workflows

- Frontend (dev):

  - Install Node (v18+ recommended) then run at repo root:
    npm install
    npm run dev

  - Build and preview:
    npm run build
    npm run preview  # serves built assets on port 4173 by default

  - Tests / lint / format:
    npm run test     # runs vitest
    npm run lint
    npm run format

2) How to run & common developer workflows

- Frontend (dev):

  - Install Node (v18+ recommended) then run at repo root:
    npm install
    npm run dev

  - Build and preview:
    npm run build
    npm run preview  # serves built assets on port 4173 by default

  - Tests / lint / format:
    npm run test     # runs vitest
    npm run lint
    npm run format

- Backend (quick local dev):

  - Create a Python venv and install backend deps:
    python -m venv .venv; .\.venv\Scripts\Activate; pip install -r backend/requirements.txt

  - Initialize DB (creates sqlite DB used by server):
    python backend/init_db.py

  - Start the simple server for local testing:
    python backend/server_simple.py

  - There are lightweight tests and utilities under `backend/` (e.g. `test_server.py`, `test_api.py`, `probar_servidor.py`). They are runnable scripts (not pytest-based).

- Useful tools:
  Note: The frontend designer now supports saving projects to the backend when the user is authenticated. The flow uses `POST /api/proyectos` to create a project and `POST /api/proyectos/<id>/elementos` to add each design element. When adding features that touch project persistence prefer to reuse the existing handlers in `server_simple.py` and helper methods in `backend/database.py`.

Note: New (2025) additions

- The server now supports an atomic replace endpoint: `PUT /api/proyectos/<id>/elementos` which accepts a JSON list or {elementos:[...]} and replaces the project's elementos in a single operation (validated server-side). Use this for saving edited projects to avoid duplicate entries.

- An integration test script was added at `tools/integration_test.py` that covers health → register → login → create proyecto → PUT elementos → GET elementos.

  - `tools/collect_frontend_logs.js` (Node18+): polls the dev server and saves important frontend files for debugging. To run: start dev server, then `node tools/collect_frontend_logs.js`. Set PowerShell env var if needed: `$env:BASE_URL='[http://localhost:4173'`.](http://localhost:4173'`.)

3) Important environment variables and runtime knobs

- Frontend tooling: no special envs required beyond Vite.

- Backend server_simple.py honors:

  - `UPLOADS_DIR` (default: `uploads/` inside backend), `ALLOWED_ORIGINS` (comma-separated), `PORT` (default 5000).

  - Rate limit and per-user upload caps: `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW`, `RATE_LIMIT_REGISTER_*`, `MAX_FILES_PER_USER`, `MAX_TOTAL_SIZE_PER_USER`.

  - When invoking `tools/collect_frontend_logs.js` set `BASE_URL` to point at the dev server if it runs on a non-default port.

4) Project-specific conventions & gotchas

- Several directories and filenames contain spaces and non-ASCII characters (e.g. `inicio, perfil y diseños/`, `3D- enginner(proceso)/`). Always quote or escape paths when scripting (PowerShell or CI may choke on unescaped spaces).

- The 3D/engine code is organized as small ES modules that mutate shared scene state; prefer reading `editor-3d-core.js` and `three-engine.js` to understand how new features should plug in.

- Backend mixes a lightweight, no-dependencies server (`server_simple.py`) with optional modules that expect `Flask`/other libs. When in doubt run `server_simple.py` for local dev—it's the canonical dev entrypoint.

- Database interactions are abstracted behind `database.py` and `database_stub.py`. Tests and dev scripts often prefer the stub for portability; check `init_db.py` for exact DB initialization steps.

5) Key files to inspect when implementing features

- Frontend entry / loader: `frontend/inicio, perfil y diseños/main-loader.js` and `3D- enginner(proceso)/utils/main-loader.js`

- 3D engine & editor core: `engines/editor-3d-core.js`, `engines/three-engine.js`, `3D- enginner(proceso)/3d-engine/advanced-3d-engine.js`

- UI components: `components/*` and `styles/*` (project uses plain CSS files alongside JS modules)

- Backend main: `backend/server_simple.py` (start here for API behaviour), `backend/database.py`, `backend/uploads.py`, `backend/init_db.py`

- Tools: `tools/collect_frontend_logs.js`, `tools/README.md`

6) How to propose changes (PR hints)

- Prefer small, focused PRs: changes to engine files can easily produce visual regressions. Include a short video/gif or screenshot when modifying rendering/controls.

- For backend changes that modify DB schema, update `backend/init_db.py` and include migration notes. Tests here are mostly manual scripts—add simple runnable scripts under `backend/` to validate behavior.

7) Quick examples for Copilot-style code edits

- To add a new scene: copy an existing `scenes/disenador-avanzado.js` pattern and register it in the frontend entrypoint used by that UI page.

- To add a backend endpoint: follow `server_simple.py` patterns—use `with Database() as db:` and prefer whitelist-updates patterns already used (see `handle_update_proyecto`). Add logging via `logger` and structured JSON responses.

If anything here is unclear or you want more detail in a specific area (3D engine internals, DB schema, or frontend build/deploy), tell me which part to expand or link to example files and I'll iterate.

---
Generated/merged on: 2025-11-13

## Practical edit & run snippets (PowerShell)

When editing, remember many paths contain spaces — use quotes in PowerShell. Example dev commands you can run from the repo root:

```powershell

# Install frontend deps and start dev server

npm install
npm run dev

# Initialize Python virtualenv, install backend deps and initialize DB

python -m venv .venv; .\.venv\Scripts\Activate; pip install -r backend/requirements.txt
python backend/init_db.py

# Run the simple backend server (recommended for local dev)

python backend/server_simple.py

# Collect frontend logs (Node 18+). If your dev server uses a custom port:

$env:BASE_URL = '[http://localhost:4173'](http://localhost:4173')
node tools/collect_frontend_logs.js

```text

## Ejemplos de uso de API (curl / PowerShell)

Aquí hay ejemplos rápidos que puedes usar para testear el backend durante desarrollo. Reemplaza <token> y nombres de archivo según sea necesario.

1) Health check

curl:

```bash

curl -i [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

```text
PowerShell (Invoke-RestMethod):

```powershell

Invoke-RestMethod -Uri '[http://127.0.0.1:5000/api/health'](http://127.0.0.1:5000/api/health') -Method Get

```text
2) Login (obtener token)

curl:

```bash

curl -i -X POST [http://127.0.0.1:5000/api/login](http://127.0.0.1:5000/api/login) \
  -H "Content-Type: application/json" \
  -d '{"username": "devuser", "password": "Password123!"}'

```text
PowerShell:

```powershell

Invoke-RestMethod -Uri '[http://127.0.0.1:5000/api/login'](http://127.0.0.1:5000/api/login') -Method Post -Body (@{username='devuser';password='Password123!'} | ConvertTo-Json) -ContentType 'application/json'

```text
3) Crear proyecto (autenticado)

curl:

```bash

curl -i -X POST [http://127.0.0.1:5000/api/proyectos](http://127.0.0.1:5000/api/proyectos) \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nombre":"Mi proyecto","descripcion":"Prueba desde curl"}'

```text
PowerShell:

```powershell

$body = @{ nombre = 'Mi proyecto'; descripcion = 'Prueba desde PowerShell' } | ConvertTo-Json
Invoke-RestMethod -Uri '[http://127.0.0.1:5000/api/proyectos'](http://127.0.0.1:5000/api/proyectos') -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = 'Bearer <token>' }

```text
4) Subir imagen raw (autenticado) — servidor espera bytes raw con Content-Type

curl (subida binaria):

```bash

curl -i -X POST [http://127.0.0.1:5000/api/upload](http://127.0.0.1:5000/api/upload) \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: image/png" \
  --data-binary @logo.png

```text
PowerShell (usando alias curl) — preferir el binario curl en Windows para subidas binarias, de lo contrario usar un pequeño script Python para POST de datos binarios.

Notas:

- El endpoint de subida enforcea un límite de 5MB por archivo y valida magic-bytes del archivo. Usar `Content-Type: image/png` o `image/jpeg`.

- Al testear cross-origin desde el frontend, setear `ALLOWED_ORIGINS` o ejecutar frontend desde `localhost`.

## Patrones rápidos y notas para edits de código

- Motor 3D: ver primero `engines/editor-3d-core.js` y `3D- enginner(proceso)/3d-engine/advanced-3d-engine.js` — muestran los patrones de mutación de estado de escena compartido y cómo están wired los TransformControls.

- Entradas frontend viven bajo `frontend/` y `frontend/inicio, perfil y diseños/` — si añades una nueva página UI o escena, mirror el naming existente y registra el loader en el `main-loader.js` matching.

- Endpoints backend: preferir añadir funciones handler a `backend/server_simple.py` siguiendo patrones existentes (respuestas JSON estructuradas, uso de `with Database() as db:`, updates de campos whitelist). Para cambios DB, actualizar `backend/init_db.py` accordingly.

- Subidas de imagen: `backend/uploads.py` provee helpers (safe_name, is_valid_image_bytes, save_upload). `server_simple.py` performs content-sniffing y enforcea límites por usuario — seguir ese patrón al añadir nuevos endpoints de subida.

## Logging y debugging

- Los logs del servidor son líneas JSON escritas a `backend/lfuture_backend.log` por defecto. El `RequestContextFilter` injecta `request_id`, `path`, y `client` en los logs — preservar uso de `_THREAD_CTX` si añades nuevos puntos de log.

- Para captura rápida de estado frontend, ejecutar el script `tools/collect_frontend_logs.js` mientras el servidor dev está corriendo; guarda un snapshot en `tools/logs/<timestamp>/`.

Si esta actualización se ve bien marcaré la tarea de instrucciones como completa. De lo contrario dime qué más añadir (CI, deploy, convenciones de código específicas), y iteraré.

## Próximas innovaciones y enfoque recomendado

Estas son sugerencias prácticas y acotadas que un agente o desarrollador puede implementar próximamente. Cada ítem es intencionalmente pequeño y concreto para que los cambios permanezcan reversibles.

- Adaptar el pipeline de modelos 3D (pasos pequeños):
  1. Centralizar carga de modelos/assets en `utils/asset-loader.js` y hacer que retorne una Promise que resuelve con geometría normalizada + metadata (tamaño, pivot).
  2. Añadir un script conversor ligero que lee OBJ/GLTF subidos y produce un GLTF normalizado con escala consistente (ej. `tools/prepare_3d_asset.js`). Usar Three.js GLTFExporter/Loader o node-based `gltf-pipeline`.
  3. Mantener el runtime engine (en `engines/` y `3D- enginner(proceso)/3d-engine/`) agnostic a formatos de modelo — solo aceptar la estructura GLTF normalizada. Esto mantiene el código de escena simple.

- Mantener consistencia de auth a través de páginas:

  - Exponer un pequeño módulo auth client-side `frontend/auth.js` (ya presente bajo `frontend/`) que centraliza almacenamiento de token (localStorage) y expone helper `getAuthHeaders()` usado por `utils/api.js`.

  - Asegurar que todas las llamadas fetch usen `utils/api.js` para que manejo de token y error handling (401 → redirect a login) sucedan en un lugar.

  - Para páginas SSR/preview o testing file://, el servidor ya acepta origen file 'null' — pero preferir orígenes `localhost` en dev local y setear `ALLOWED_ORIGINS` accordingly.

- Mantener el proyecto simple (principios a seguir):

  - Favorecer un solo servidor dev para backend (`server_simple.py`) para iteraciones rápidas; solo introducir frameworks Flask/production si se necesita después.

  - Evitar estado global cross-cutting en motor 3D; preferir objetos escena explícitos pasados a funciones. Añadir pequeñas funciones adapter si un módulo necesita mutar escena global.

  - Mantener pipeline de uploads explícito y bien testeado: content-sniff bytes → validar hash → guardar → registrar entrada DB. Reutilizar helpers de `backend/uploads.py`.

- Ideas de features pequeñas (seguras, incrementales):

  - UI de deduplicación de assets: mostrar uploads existentes para un usuario y permitir reuse.

  - Presets ligeros para templates de camisetas (presets de scale/position guardados como JSON).

  - Añadir un script de test de integración que bootea server_simple.py y realiza algunos requests API (health, register, login, create proyecto) — esto ayuda con checks automatizados durante PR review.

Si quieres, puedo scaffold `tools/prepare_3d_asset.js`, un wrapper básico `frontend/auth.js`, y un script de test de integración — dime cuál scaffold primero y lo implementaré y testearé.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
