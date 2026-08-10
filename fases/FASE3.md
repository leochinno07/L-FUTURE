# FASE 3 - Seguridad y control de acceso

> Nota: Este archivo de fase está respaldado por `ROADMAP.md`, que centraliza la planificación de fases.

## Contexto

Resumen del problema y motivación de esta fase.



## Criterios de éxito

- KPI 1
- KPI 2


Objetivo: fortalecer seguridad y saneamiento del backend.

- Implementar rate limit en login/register y endpoint crítico con contador en memoria o Redis.

- Añadir protección CSRF / CORS robusta.

- Encriptación de contraseñas bcrypt con salt.

- Expiración e invalidación de tokens JWT, login refresh si aplica.

- Implementar bloqueos temporales en IP tras N intentos fallidos (altos intentos en login).

- Configurar cabeceras de seguridad: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.

- Logs estructurados a `backend/lfuture_backend.log` incluyendo `request_id`, usuario, endpoint, código HTTP.

- Añadir prueba automática de inyección SQL y XSS para endpoints de texto.

Entregables:

- Validación de contraseña fuerte en el registro.

- Prueba de 'reintentos' en tests.

- Documentar en `fases/FASE3.md` los vectores mitigados.

-

## Siguientes pasos

- Revisar con el equipo.
- Integrar en el siguiente sprint.
