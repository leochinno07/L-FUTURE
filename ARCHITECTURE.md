# Arquitectura de L-FUTURE

> Nota: El roadmap maestro de fases está en `ROADMAP.md`. Este documento complementa la planificación con detalles de arquitectura.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


## Visión General

L-FUTURE es una aplicación de diseño 3D basada en un patrón de capas: Frontend (UI + Three.js), Backend (Flask API), Persistencia (SQLite / PostgreSQL) y Servicios auxiliares (uploads, IA, mensajería).  El objetivo es mantener acoplamiento bajo y pruebas automatizadas.

## Componentes

- frontend/

  - UI pages (`index.html`, `editor-3d.html`, etc.)

  - módulos JS (`api.js`, `auth.js`, `mis-proyectos.js`)

  - servicios (fetch, login, proyectos)

- backend/

  - `server_simple.py` (punto de entrada compatible)

  - `app.py` (a futuro, modular)

  - `routes/` (auth, proyectos, elementos, uploads, ai)

  - `database.py` (adaptador, repository pattern)

  - `uploads.py` (validación, almacenamiento, cleanup)

  - `validators.py` (jsonschema, reglas de seguridad)

- engines/ (3D engine)

  - gestores Scene, controls, material presets

- scripts/

  - `run_all.py`, `validate_security.py` (devops y CI)

- .github/workflows

  - `ci.yml`, `e2e-playwright.yml`

## Flujos de Datos

1. Usuario realiza acción en UI
2. `api-client.js` añade auth headers y llama a `/api/v2/...`
3. Flask recibe request, valida al usuario con JWT
4. Logica de negocio usa `Database` y `uploads`
5. Respuesta JSON con estado y payload.

## Seguridad

- Autenticación: JWT con expiración y refresh.

- Autorización: `token_required`, comprobación de propiedad de recursos.

- Input: validación `jsonschema`, sanitización.

- Rate limiting: login/register.

- Content security headers: CSP, X-Frame-Options, etc.

## Escalabilidad

- DB swappable: SQLite en local, PostgreSQL en producción.

- Servidor independiente: Docker + Compose + opcional K8s.

- Caching: Redis para sesiones y rate limit.

- Async: Celery/RQ para tareas pesadas (previsualizado, IA).

## Observabilidad

- Logs estructurados JSON.

- Health check `/api/health` y `/metrics`.

- Monitoreo (Prometheus/Grafana opcional).

## Integración IA

- Adaptador en `backend/ai_adapter.py` con proveedores (OpenAI, local)

- Evitar bloqueo del request principal con cola asíncrona.

- Endpoint `/api/v2/ai/...`, validación, trottling.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
