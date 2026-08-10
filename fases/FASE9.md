# FASE 9 - Integración de Inteligencia Artificial

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: añadir funciones IA para diseño asistido.

- Crear servicio `backend/ai_adapter.py` con interface:

  - `generate_design_prompt(user_input)`

  - `suggest_colors(project_data)`

  - `optimize_layout(elementos)`

- API endpoint: `POST /api/v2/ai/sugerir-diseno`.

- Integrar proveedor (OpenAI o local) usando variables de entorno `AI_PROVIDER`, `AI_KEY`.

- Frontend: componente IA en `frontend/ai-panel.js`.

- Introducir un modo "IA offline limitado" que use heurísticas locales cuando no haya API key.

- Diseñar un pipeline para manejar errores y timeouts del proveedor IA (retry + fallback a SOBRECAPA).

- Añadir tests de contrato con stubs de IA en `backend/tests/test_ai_adapter.py`.

- Crear un documento `fases/FASE9-impacto.md` de métricas (tasa de uso, satisfaction).

Entregables:

- Documentación en `fases/FASE9.md`.

- Ejemplo de request/response.

- Prototipo de interface de usuario con prompt + resultados.

- Validación de costos por petición AI y límites de request.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
