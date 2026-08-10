# Roadmap Maestro de Fases — L-FUTURE

> Este documento es la fuente de verdad para el roadmap del proyecto. Los archivos de soporte como `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `App_lanzamiento.md`, `MIGRATION_ANDROID.md`, `MIGRATION_AI.md` y `fases/*.md` contienen contexto, detalles de diseño y referencias técnicas, pero la planificación de fases se centraliza aquí.

## Propósito

Centralizar todos los planes, entregables y pasos de implementación en un único roadmap de fases. Esta guía organiza el trabajo en etapas, muestra los objetivos de cada fase y enlaza los documentos de soporte existentes.

## Contexto general

L-FUTURE es una app web para diseñar camisetas 3D con un frontend en HTML/CSS/JS y Three.js, y un backend en Python Flask con SQLite. Los usuarios pueden registrarse, crear proyectos, añadir elementos gráficos, guardar diseños y exportar resultados.

## Criterios de éxito

- Backend estable y testable con endpoints REST.
- Frontend modular y mantenible con flujo de datos claro.
- Editor 3D funcional y compatible con la aplicación.
- Documentación centralizada y transparente.
- Ruta de despliegue reproducible para GitHub.

## Fase 1: Base del backend y APIs REST

Objetivo: crear una base sólida de servicio con endpoints claros, validación y seguridad.

Entregables:

- Modularizar `backend/server_simple.py` y centralizar configuración en `backend/config.py`.
- Definir validaciones en `backend/validators.py`.
- Mantener compatibilidad con `/api/*` y bosquejar `/api/v2/*`.
- Implementar endpoints de auth, proyectos, elementos y uploads.
- Agregar pruebas básicas en `backend/test_server.py`.
- Validar el esquema de datos con `backend/init_db.py`.

Estado actual: implementado parcialmente, con tests de salud, registro/login y manejo de proyectos.

Referencias: `fases/FASE1.md`

## Fase 2: Frontend modular y separación de responsabilidades

Objetivo: separar el frontend en módulos reutilizables, clarificar el flujo de datos y mejorar la mantenibilidad.

Entregables:

- Módulos de cliente API, auth y proyectos.
- Separación de UI / lógica en el editor y páginas de usuario.
- Manejador de estado y tokens en un solo lugar.
- Tests de flujo con Playwright/Vitest.
- Documentación de uso frontend en `frontend/README.md` o nota en `README.md`.

Estado actual: la estructura está iniciada, hay un `main-loader.js` y nuevos archivos `frontend/engines/*` para el editor 3D.

Referencias: `fases/FASE2.md`

## Fase 3: Seguridad, validación y hardening

Objetivo: reforzar la seguridad del backend y frontend, con validaciones estrictas y políticas de despliegue.

Entregables:

- Políticas de CORS y HTTPS en producción.
- Validación de entradas y sanitización de datos.
- Reglas de contraseñas robustas y hashing seguro.
- Rate limiting básico para login/register.
- Logs estructurados y manejo consistente de errores.

Estado actual: funciones de configuración y control de seguridad documentadas, con notas en `App_lanzamiento.md`.

## Fase 4: Documentación, pruebas y calidad de desarrollo

Objetivo: consolidar la documentación del proyecto, normalizar convenciones y crear un pipeline de pruebas.

Entregables:

- `README.md` claro para instalación y uso.
- `CONTRIBUTING.md` con normas de commits y desarrollo.
- `ARCHITECTURE.md` con la arquitectura del sistema.
- Pruebas automáticas de backend y frontend.
- Checklist de lanzamiento en `App_lanzamiento.md`.

Estado actual: buena base documental, requiere una sola fuente de verdad para el roadmap.

## Fase 5: Infraestructura y despliegue reproducible

Objetivo: preparar la aplicación para deployment estable y reproducible desde GitHub.

Entregables:

- `.gitignore` limpio y sin artefactos.
- Scripts de inicio y builds repetibles.
- Ruta de despliegue clara para GitHub y/o servicios hosting.
- Variables de entorno documentadas: `SECRET_KEY`, `JWT_SECRET_KEY`, `PORT`, `ALLOWED_ORIGINS`, `UPLOADS_DIR`.

Estado actual: el proyecto tiene scripts de backend y frontend; falta una guía de deploy consolidada.

## Fase 6: Producción y operaciones

Objetivo: cerrar la fase de lanzamiento con monitoreo básico, health checks, backups y prácticas de operación.

Entregables:

- Health check en `/api/health`.
- Logs de aplicación y request_id.
- Backup de datos y plan de restauración.
- Deploy minimalista en ambiente real.

Referencias: `App_lanzamiento.md`, `backend/server_simple.py`.

## Fase 7: Escalado y experiencia móvil

Objetivo: preparar el proyecto para uso móvil y escalado horizontal.

Entregables:

- App híbrida / PWA con `manifest.json` y `service-worker.js`.
- Migración a Android si se decide mobile wrapping.
- Ajustes de UI y detección de dispositivos.

Referencias: `MIGRATION_ANDROID.md`.

## Fase 8: Integración de IA y asistencias avanzadas

Objetivo: añadir funciones de inteligencia artificial para sugerencias de diseño y optimización.

Entregables:

- Servicio `backend/ai_adapter.py` o equivalente.
- Endpoints AI seguros y throttleados.
- UI para prompts de diseño y generación de ideas.
- Modo fallback local para heurísticas.

Referencias: `MIGRATION_AI.md`.

## Fase 9: Optimización del motor 3D y UX avanzado

Objetivo: mejorar la experiencia del editor 3D con rendimiento y usabilidad.

Entregables:

- Optimización de Three.js, LOD y culling.
- Mejoras de editor modular y controles.
- Exportación y guardado más robustos.
- Soporte para presets, templates y capas.

## Fase 10: Mejora continua y roadmap extendido

Objetivo: mantener el proyecto vivo con nuevas características, marketplace y mejoras operativas.

Entregables:

- Marketplace básico y colaboración.
- Comentarios, likes y búsqueda avanzada.
- Roadmap ops: backups, recuperación y seguridad continua.

## Documentos de soporte

- `README.md`: introducción y guía de uso.
- `ARCHITECTURE.md`: arquitectura del sistema y diagrama.
- `CONTRIBUTING.md`: normas de commits, pruebas y estilo.
- `App_lanzamiento.md`: checklist de lanzamiento.
- `MIGRATION_ANDROID.md`: plan de migración móvil / PWA.
- `MIGRATION_AI.md`: plan de integración IA.
- `fases/FASE*.md`: detalles técnicos por fase.

## Cómo usar este roadmap

1. Leer la fase actual y sus entregables.
2. Revisar el documento de soporte asociado.
3. Marcar el estado de cada fase en el repositorio.
4. Actualizar `ROADMAP.md` cuando cambie el alcance.

## Notas finales

Este documento consolida la estrategia del proyecto. Para cualquier cambio estructural, actualice primero `ROADMAP.md` y luego refleje la modificación en los archivos de soporte.
"""

Path('ROADMAP.md').write_text(content, encoding='utf-8')

