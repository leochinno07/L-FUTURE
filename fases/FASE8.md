
# FASE 8 - Migración a app Android / PWA

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.

## Criterios de éxito

- KPI 1
- KPI 2

Objetivo: convertir el frontend en app móvil híbrida nativa.

- Asegurar PWA completa con `manifest.json` y `service-worker.js`.

- Agregar checks de compatibilidad para `Add to Home Screen`.

- Scaffold con Capacitor:

  - `npm install @capacitor/core @capacitor/cli`

  - `npx cap init lfuture com.lfuture.app`

  - `npx cap add android`

  - `npx cap copy` y `npx cap open android`

- Ajustar rutas de API a `[https://api.example.com`](https://api.example.com`) en configuración prod.

- Implementar modo offline-first con almacenamiento local (IndexedDB / LocalStorage) y sincronización.

- Mapeo de permisos móviles (cámara, almacenamiento), si hay importación de fotos de la galería.

- Añadir `MIGRATION_ANDROID.md` y pasos en `fases/FASE8.md`.

- Documentar estrategia de actualizaciones OTA con Capacitor.

Entregables:

- Android apk generado (instrucciones).

- Testing en emulador.

- Checklist de compatibilidad cross-device (Android 10/11/12/13).

- Documentación de performance (memoria, FPS) en móvil.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
