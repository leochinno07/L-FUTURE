# Migración y guía de integración de IA

> Nota: El roadmap maestro de fases está en `ROADMAP.md`. Este documento amplía la planificación con detalles de IA.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


## Objetivo

Integrar capacidades de IA generativa para sugerencias de diseño y optimización de elementos 3D.

## Arquitectura

- Servicio `backend/ai_adapter.py` con interfaz `IAProvider`.

- Endpoints:

  - `POST /api/v2/ai/sugerir-diseno`

  - `POST /api/v2/ai/auto-layout`

- Modo fallback local con heurísticas en `frontend/ai-heuristics.js`.

## Proveedores soportados

- `openai` (GPT-4.1, GPT-4, etc.)

- `local` (LLaMA, llamacpp)

## Variables de entorno

- `AI_PROVIDER= openai|local`

- `AI_KEY` (para openai)

- `AI_ENDPOINT` (custom)

## Pasos

1. Crear `backend/ai_adapter.py` con clases `OpenAIProvider` y `LocalProvider`.
2. Crear `backend/validators.py` con esquema `ai_request_schema`.
3. Añadir tests unitarios y de integración de IA.
4. Crear UI: `frontend/ai-panel.js` con prompt y suggestions.
5. Crear métricas de petición + coste (latencia, tokens consumidos).
6. Establecer límites: 3 req/min por usuario, 100 req/hora con rate limit central.

## Entregables

- Endpoint funcional y documentado.

- Panel IA en el editor.

- Logs y dashboard de rendimiento/cost.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
