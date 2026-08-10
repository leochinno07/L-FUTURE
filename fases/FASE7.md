# FASE 7 - Escalabilidad e infraestructura

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: diseñar transición de monolito a arquitectura escalable.

- Introducir adaptador de DB em `backend/database.py` para soportar SQLite/PostgreSQL.

- Añadir script de migración `backend/migrate_db.py`.

- Documentar opciones de despliegue: Docker, Docker Compose, Kubernetes.

- Evaluar cuellos de botella actuales:

  - Locks de SQLite en concurrencia

  - throughput de `PUT /api/proyectos/<id>/elementos`

  - CPU/GPU en 3D rendering (mobile)

  - Uploads grandes / memoria

- Añadir métricas en logs y endpoint `/api/health` mejorado (estado DB, uso de memoria, request_latency).

- Implementar middleware de trazabilidad con IDs de solicitud para correlación (X-Request-ID).

- Introducir async tasks (RQ o Celery) para procesos pesados (generación de vista previa, optimización de imagen).

- Diseñar un plan de escalado horizontal con API gateway y Nginx + SSL terminator.

- Crear modelo de datos normalizado y plan de índice para Postgres.

Entregables:

- Documentos en `fases/FASE7.md`

- Inicialización de infraestructura en `infra/docker-compose.yml`.

- `backend/migrate_db.py` y `backend/database_adapter.py` con swapping.

- Matrix de riesgos, cuellos de botella y propuesta de mitigación.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
