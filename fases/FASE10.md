# FASE 10 - Optimización de motor 3D y UX final

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: mejorar rendimiento, experiencia y preparación para producción.

- Mover lógica 3D a `engines/` y usar módulos:

  - `engines/scene-manager.js`

  - `engines/object-controls.js`

- Implementar LOD y culling en Three.js.

- Guardado automático con debounce de 1.5s.

- Soporte de preseteado de estilos (monocromo, degradado, neón).

- Implementar modo ‘turbo’ para device de baja potencia.

- Añadir una pantalla de diagnóstico de rendimiento (FPS, CPU/GPU, memoria JS).

- Optimizar canvas/renderer con `requestAnimationFrame` y render por render a bajos fps.

- Forzar `dispose()` en objetos geometry/materials cuando se eliminan para evitar fugas de memoria.

- Validar con tests de UI/UX en Playwright: edición, deshacer, restaura.

- Medir tiempos de carga del editor (`TTI`, `FP`, `LCP`) y optimizar.

Entregables:

- `fases/FASE10.md`.

- Dashboard de métricas en frontend (FPS + uso memoria).

- Documentación de optimizaciones de Three.js y recomendaciones de hardware compatibles.

- Plan de POC para generación de thumbnails con worker thread para no bloquear UI.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
