# Contribuyendo a L-FUTURE

> Nota: El roadmap maestro de fases está en `ROADMAP.md`. Sigue ese documento para el plan general de fases; este documento describe cómo contribuir.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


¡Gracias por tu interés en contribuir a L-FUTURE! Este documento proporciona directrices para contribuir al proyecto.

## Configuración de Desarrollo

Sigue la [guía de Inicio Rápido](README.md#inicio-rápido) en el README principal para configurar tu entorno de desarrollo.

## Estrategia de Ramificación

Usamos un modelo simple de ramificación:

- `main`: Código listo para producción

- `develop`: Últimos cambios de desarrollo

- Ramas de características: `feature/descripcion-de-caracteristica`

- Corrección de bugs: `fix/descripcion-del-bug`

- Hotfixes: `hotfix/correccion-critica`

### Flujo de Trabajo

1. Crear una rama de característica desde `main`:

   ```bash

   git checkout -b feature/tu-nombre-de-caracteristica

   ```text
2. Hacer tus cambios con commits apropiados

3. Probar exhaustivamente (ver sección de Pruebas)

4. Crear un pull request a `main`

## Proceso de Pull Request

1. **Título**: Usar títulos claros y descriptivos
2. **Descripción**: Explicar qué cambios y por qué
3. **Pruebas**: Describir cómo probaste los cambios
4. **Capturas de Pantalla**: Incluir capturas antes/después para cambios de UI
5. **Cambios Disruptivos**: Marcar claramente cualquier cambio disruptivo

### Lista de Verificación de PR

- [ ] El código sigue las directrices de estilo

- [ ] Las pruebas pasan localmente

- [ ] Documentación actualizada si es necesario

- [ ] No hay errores o advertencias en consola

- [ ] Diseño responsivo probado

- [ ] Probado en múltiples navegadores (Chrome, Firefox, Safari)

## Estilo de Código

### Python (Backend)

- Seguir PEP 8

- Usar type hints donde sea posible

- Longitud máxima de línea: 88 caracteres

- Usar `black` para formateo

- Usar `flake8` para linting

### JavaScript (Frontend)

- Seguir reglas ESLint en `.eslintrc.json`

- Usar Prettier para formateo

- Usar `const`/`let` en lugar de `var`

- Preferir funciones flecha para callbacks

- Usar nombres de variables significativos

### CSS

- Seguir configuración `.prettierrc`

- Usar propiedades personalizadas CSS para temas

- Diseño responsivo mobile-first

- Metodología BEM para nombrado de clases

## Agente Autónomo (Reglas Operativas)

- Cada PR debe incluir referencia a la fase (`[FASEx]`) y checklist de tareas relevantes.

- El pipeline de CI debe ejecutarse automáticamente en cada push: lint, tests unitarios, tests de integración y tests e2e.

- Mantener comentarios en español para funciones técnicas clave. Este documento y `agent.md` guían la ejecución.

- El agente debe ser capaz de generar tickets de acción desde fallos de tests y cuellos de botella detectados.

- Scripts de setup deben ser ejecutables desde la raíz con un solo comando (`python scripts/run_all.py`).

## Pruebas

### Pruebas del Backend

Ejecutar pruebas unitarias:

```bash

python -m unittest discover backend/

```text

### Pruebas del Frontend

Ejecutar pruebas unitarias:

```bash

npm run test

```text

### Pruebas E2E

Ejecutar pruebas de extremo a extremo:

```bash

npm run test:e2e

```text

### Pruebas Manuales

- Probar todos los flujos de usuario: registro → login → crear proyecto → añadir elementos → guardar → exportar

- Probar en diferentes tamaños de pantalla

- Probar con diferentes navegadores

## Mensajes de Commit

Usar mensajes de commit claros y descriptivos:

```text
feat: añadir página de perfil de usuario
fix: resolver problema de renderizado 3D en Firefox
docs: actualizar documentación API
style: formatear código con Prettier
refactor: simplificar lógica de autenticación
test: añadir pruebas unitarias para registro de usuario

```text

## Reporte de Problemas

Al reportar bugs:

1. Usar un título claro y descriptivo
2. Incluir pasos para reproducir
3. Mencionar tu entorno (OS, navegador, versiones Python/Node)
4. Incluir capturas de pantalla o mensajes de error
5. Verificar si el problema ya existe

## Solicitudes de Características

Para nuevas características:

1. Verificar si ya está planeada en la hoja de ruta
2. Describir el problema que resuelve
3. Proporcionar mockups o ejemplos si es posible
4. Considerar complejidad de implementación

## Código de Conducta

- Ser respetuoso e inclusivo

- Enfocarse en retroalimentación constructiva

- Ayudar a los recién llegados a aprender

- Mantener comunicación profesional

## Obtener Ayuda

- Revisar la sección de [Solución de Problemas](README.md#solución-de-problemas)

- Buscar en issues y discusiones existentes

- Preguntar en discusiones para obtener ayuda

¡Gracias por contribuir a L-FUTURE! 🎨

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
