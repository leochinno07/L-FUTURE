# L-FUTURE

Editor web de prendas con diseño 2D/3D y API FastAPI v1. Para que el inicio de sesión funcione en desarrollo deben estar activos **FastAPI (8000)** y **Vite (5173)**. Si FastAPI está detenido, Vite devuelve `502 Bad Gateway` al llamar a `/api/v1`.

## Desarrollo local

Requisitos: Node.js 20.19+ (o 22.12+) y Python 3.10+.

1. Desde la raíz, instala las dependencias:

   ```bash
   npm ci
   python -m pip install -r backend/requirements-api-v1.txt
   ```

2. Abre una terminal y arranca la API:

   ```bash
   JWT_SECRET_KEY=local-dev-secret uvicorn backend.api_v1.main:app --host 0.0.0.0 --port 8000
   ```

   Para usar Supabase en lugar de la base SQLite local, copia la URI de **Project Settings → Database → Connect → Session pooler** y pégala cuando Bash la solicite; no queda en el historial:

   ```bash
   read -rsp 'Supabase DATABASE_URL: ' DATABASE_URL; printf '\n'; export DATABASE_URL
   ```

   Luego arranca la API con el comando anterior en esa misma terminal. No guardes esa URI en Git ni la envíes al frontend.

3. En otra terminal, desde la raíz, arranca el frontend:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

4. Abre la URL que imprime Vite, normalmente `http://localhost:5173`. Comprueba primero `http://localhost:8000/api/v1/health`; debe devolver `success: true`. Vite reenvía `/api/v1` al puerto 8000. La base local se crea en `backend/lfuture.db` y los assets locales en `backend/uploads/`.

Para verificar la API: `python -m unittest backend.test_api_v1`. Para crear una cuenta local, usa el formulario de registro; luego inicia sesión con esa cuenta.

## Publicar en Vercel

El proyecto declara dos servicios en `vercel.json`: `app` (Vite) y `backend` (FastAPI). El frontend queda público en `/`; las solicitudes `/api/*` se reescriben al backend, conservando el prefijo `/api/v1` de sus rutas. En `vercel dev`, Vite usa la binding `BACKEND_URL` para su proxy local; en producción el navegador usa el rewrite público y esa URL interna no se incluye en el bundle. **No uses SQLite ni el disco local en Vercel**: las funciones son efímeras. Necesitas PostgreSQL y almacenamiento S3-compatible para que cuentas, diseños e imágenes persistan.

**Si Vercel se configuró seleccionando solo `frontend` y aparece un 500**, ve a **Project → Settings → Build and Deployment** y cambia **Root Directory** a `./` (la raíz del repositorio, donde vive este `vercel.json`); guarda y vuelve a desplegar. La raíz `frontend` por sí sola no incluye la función FastAPI ni los rewrites del multi-servicio.

1. Crea un proyecto en Supabase. En **Project Settings → Database → Connect**, copia la URI de **Session pooler** para `DATABASE_URL` (es la opción adecuada para funciones de Vercel y redes IPv4). Reemplaza el marcador de contraseña; codifica caracteres reservados de la contraseña para URL y conserva `sslmode=require` si aparece en la URI.
2. Crea un bucket S3-compatible (por ejemplo, Cloudflare R2), habilita lectura pública de objetos y crea credenciales con permiso de escritura. Guarda el bucket, endpoint, región y URL pública del bucket.
3. Sube el repositorio a GitHub: crea un repositorio vacío, y desde la raíz ejecuta:

   ```bash
   git add .
   git commit -m "Prepare L-FUTURE for Vercel"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

   Si ya existe un remoto, omite `git remote add origin` y usa `git push`.
4. En Vercel, selecciona **Add New → Project**, importa el repositorio de GitHub y deja **Root Directory** en `./`. Mantén `vercel.json` en la raíz: Vercel construye `app` con `npm run build` y `frontend/dist`, y ejecuta `backend/api/index.py` con las dependencias de `backend/requirements.txt`.
5. Antes del primer deploy, abre **Project → Settings → Environment Variables** y agrega estas variables. Asígnalas tanto a **Production** como a **Preview**:

   - `APP_ENV` = `production`
   - `DATABASE_URL` = URI PostgreSQL de Supabase Session pooler (también se aceptan `POSTGRES_URL`, `POSTGRES_PRISMA_URL` o `POSTGRES_URL_NON_POOLING`)
   - `JWT_SECRET_KEY` = secreto aleatorio largo, distinto para cada ambiente
   - `S3_BUCKET` = nombre del bucket
   - `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY` = credenciales del bucket
   - `S3_ENDPOINT_URL` = endpoint S3 del proveedor
   - `S3_REGION` = región del proveedor (Cloudflare R2 usa `auto`)
   - `ASSET_PUBLIC_BASE_URL` = URL HTTPS pública del bucket o dominio CDN
   - `ALLOWED_ORIGINS` = origen del sitio Vercel, por ejemplo `https://tu-proyecto.vercel.app`

   No incluyas comillas en los valores. Si la contraseña PostgreSQL contiene caracteres reservados (`@`, `:`, `/`), codifícala para URL.
6. Pulsa **Deploy**. En cada cambio posterior, haz push a GitHub para iniciar un nuevo deploy. Si acabas de cambiar variables, usa **Redeploy** para que se apliquen.
7. Verifica `https://tu-proyecto.vercel.app/api/v1/health`. Después prueba registro, login, crear/guardar/reabrir un diseño y subir una imagen. Si el health responde 502, revisa **Deployments → Functions → Logs**: las causas más comunes son una variable ausente o una URL/credencial de PostgreSQL inválida.

Para probar el enrutamiento de servicios antes del deploy, instala el CLI de Vercel e inicia sesión; desde la raíz ejecuta `vercel dev`. Esto arranca los servicios según `vercel.json` y sus rewrites locales.

El backend crea las tablas al iniciar. Una base PostgreSQL nueva no contiene los usuarios ni diseños guardados en el SQLite local; exporta e importa esos datos por separado si necesitas conservarlos. Los trabajos de eliminación de fondo y preparación DTF se encolan como `queued` y requieren un worker externo para procesarse.

La conexión a Supabase usa PostgreSQL mediante SQLAlchemy y `psycopg`; no requiere un SDK de Supabase en el frontend. Esto configura la base de datos solamente: el inicio de sesión sigue usando la API del proyecto y las imágenes siguen necesitando la configuración S3 indicada arriba.

## Rutas principales

- Auth: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/logout`
- Perfil/panel: `/api/v1/users/profile`, `/api/v1/users/password`, `/api/v1/users/dashboard`
- Proyectos: `/api/v1/projects`, `/api/v1/projects/{id}`
- Plantillas/assets: `/api/v1/templates`, `/api/v1/assets`
- Marketplace/órdenes: `/api/v1/projects/marketplace`, `/api/v1/orders`

Validación local: `python -m unittest backend.test_api_v1` y `npm run build`.

El frontend publicado se construye desde `frontend/` y sus pantallas activas usan `/api/v1/*`. Las copias antiguas bajo `backend/frontend/` pertenecen al servidor Flask de desarrollo y no se publican con el servicio `app` de Vercel.