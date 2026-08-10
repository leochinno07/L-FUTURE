# Migración a Android / PWA

> Nota: El roadmap maestro de fases está en `ROADMAP.md`. Este documento describe una expansión móvil alineada con la fase correspondiente.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


## Objetivo

Convertir L-FUTURE a aplicación móvil híbrida nativa con capás de offline, actualizaciones y rendimiento.

## Requisitos

- Node 18+, npm, Java JDK (Android), Android Studio

- Capacitor CLI

## Pasos

1. Verificar 3D URL y rutas API configurables.
2. Asegurar PWA:

   - `manifest.json` con `display: standalone`, `scope` y `start_url`.

   - `service-worker.js` caching `offline`.
3. Init Capacitor:

   - npm i @capacitor/core @capacitor/cli

   - npx cap init lfuture com.lfuture.app
4. Añadir Android:

   - npx cap add android

   - npx cap copy

   - npx cap open android
5. Ajustar `frontend/config.js` para base URL configurable.
6. Pruebas en emulador y dispositivos físicos.
7. Build release APK/AAB y verificar con Play Console.

## Buenas prácticas

- Usa WebView `setWebContentsDebuggingEnabled(true)` únicamente en dev.

- Cache online/offline con IndexedDB e inyección de eventos network.

- Permisos: cámara, galería solo si el usuario lo solicita.

## Entregables

- `android/app/build/outputs/apk/release/app-release.apk`

- Documento de QA móvil.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
