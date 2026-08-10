# FASE 5 - Eliminar dependencia de node_modules en runtime

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: mantener `node_modules` solo para desarrollo, tests y CI, y reducir código 3rd-party.

- Ejecutar `npm install` en local solo para `vitest` / `playwright` / `eslint`.

- Garantizar que el deployed app funciona en producción sin `npm run build` neto.

- En frontend, reemplazar (cuando sea posible) dependencias no críticas por JS vanilla.

- Crear script `scripts/clean_node_modules.ps1` y documentación `deprecate-node_modules.md`.

- Añadir en README sección "Dependencias en producción".

- Establecer `package.json` con devDependencies sólo para builder/test, y mover dependencias runtime a `frontend/` sin npm.

- Agregar `scripts/predeploy.sh` para limpiar node_modules y validación previa.

Entregables:

- `fases/FASE5.md` con pasos de ejecución y verificación.

- Mensaje claro de no desplegar `node_modules` completo.

- `scripts/clean_node_modules.ps1` y `scripts/predeploy.sh` creados y probados.

- Documentación de bundle de frontend mínimo con la ruta `public/`.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
