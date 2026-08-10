# FASE 6 - Tests y CI configurado

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: automatizar calidad con pipeline de pruebas y lint.

- Configurar `.github/workflows/ci.yml` para ejecutar:

  - `python -m unittest discover backend/`

  - `npm run lint`

  - `npm run test`

  - `npm run test:e2e` (opcional con etiqueta `e2e`).

- Añadir `flake8` en `requirements.txt` y `pip install flake8`.

- Crear pruebas de integración en `tools/integration_test.py`.

- Documentar en `fases/FASE6.md` comandos y expectativas.

- Configurar `pytest` o `unittest` para que fallen cuando la cobertura es menor al 80%.

- Integrar `pytest-cov`, `coverage`, `codecov` (si se usa CI externo).

Entregables:

- CI verde con checks.

- Reporte de cobertura por comando `coverage run -m unittest`.

- Guía para desarrolladores en `CONTRIBUTING.md`.

- `tools/integration_test.py` ampliado con login->crear proyecto->reemplazar elementos->fetch resultados.

- Documentos de proceso de revert (hotfix) en caso de CI roto.

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
