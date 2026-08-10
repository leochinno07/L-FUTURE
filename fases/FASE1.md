# FASE 1 - Base del Backend y APIs REST

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: crear una base sólida de servicio, con endpoints claros, validación y seguridad.

- Extraer `backend/server_simple.py` en capas: `app.py`, `routes.py`, `auth.py`, `proyectos.py`, `elementos.py`.

- Centralizar configuración en `backend/config.py`.

- Mantener compatibilidad con rutas existentes `/api/*` y versión nueva `/api/v2/*`.

- Añadir validación de entrada con `jsonschema` en `backend/validators.py`.

- Añadir comentarios en español en cada función.

- Documentar el flujo de entrada -> validación -> base de datos -> respuesta.

- Definir un `Database` interface con métodos:

  - `create_user`, `get_user_by_id`/`get_user_by_username`

  - `create_project`, `get_projects_by_user`, `update_project`, `delete_project`

  - `create_element`, `get_elements_by_project`, `replace_elements`

- Agregar manejo de excepciones de base de datos y retorno 500 con `error_code`.

- Registrar métricas de peticiones (latencia, cantidad) a `logs/requests.log`.

Entregables:

- Documentación de endpoints en `backend/openapi.md` (esquema simple).

- Pruebas unitarias iniciales en `backend/test_server.py`.

- Script de inicialización `backend/init_db.py` validado.

- `backend/database_adapter.py` con implementación SQLite y stub para pruebas.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
