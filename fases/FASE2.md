# FASE 2 - Frontend Modular y claridad de código

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: separar el frontend en módulos reutilizables y documentar flujo de datos.

- Reestructurar `frontend/api.js`, `frontend/auth.js`, `frontend/mis-proyectos.js`, `frontend/proyectos-globales.js`, `editor-3d.html`.

- Crear `frontend/modules/` con estos archivos:

  - `frontend/modules/api-client.js` (manejador central de fetch, retries, token)

  - `frontend/modules/auth-service.js` (login, register, logout, refreshToken)

  - `frontend/modules/project-service.js` (CRUD proyectos + elementos)

  - `frontend/modules/ui-notifications.js` (toasts y errores)

- Añadir comentarios en español a todas las funciones, especialmente de estado y request.

- Garantizar que el backend sea consumido vía `fetch` en módulo `api` con `getAuthHeaders()`.

- Implementar separación de vista/lógica (MVC ligero): `renderer.js` no contiene llamadas API.

- Añadir sanitización de input en frontend antes de enviar (escape, max chars).

- Añadir tests de acceso y flujo en Playwright: login, crear proyecto, guardar elementos, render 3D.

Entregables:

- `frontend/README.md` con uso de API y ejemplo de flujo registro→login→crear proyecto.

- tests de frontend con Vitest o Playwright mínimo.

- informes de cobertura con `vitest --coverage`.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
