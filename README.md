# L-FUTURE

Editor web de prendas con vista 2D/3D, proyectos guardados y API FastAPI v1. El editor, perfil, inicio y biblioteca usan el mismo estado de proyecto.

## Desarrollo local

Requisitos: Node.js 20.19+ (o 22.12+) y Python 3.10+.

```bash
npm ci
python -m pip install -r backend/requirements-api-v1.txt
JWT_SECRET_KEY=local-dev-secret uvicorn backend.api_v1.main:app --host 127.0.0.1 --port 8000
```

En otra terminal, ejecutar `npm run dev`. Vite sirve las páginas y envía `/api/v1` a FastAPI. La base local se crea en `backend/lfuture.db`; los assets se guardan en `backend/uploads/`.

## Desplegar en Vercel

Vercel sirve el frontend y ejecuta FastAPI desde `api/index.py`. SQLite y el disco local son solo para desarrollo; configura persistencia externa antes de desplegar.

1. Crea una base PostgreSQL gestionada y un bucket S3-compatible (por ejemplo, Cloudflare R2) con acceso público de lectura para las imágenes.
2. Importa el repositorio en Vercel. Conserva `vercel.json`, usa la raíz del proyecto y deja que Vercel ejecute `npm run build`.
3. En **Settings → Environment Variables**, configura para Production y Preview:

   - `APP_ENV=production`
   - `DATABASE_URL=postgresql+psycopg://...` (incluye SSL según el proveedor). También se aceptan `POSTGRES_URL`, `POSTGRES_PRISMA_URL` y `POSTGRES_URL_NON_POOLING`.
   - `JWT_SECRET_KEY` con un valor aleatorio de al menos 32 bytes (obligatorio también en Preview)
   - `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
   - `S3_ENDPOINT_URL` y `S3_REGION` (para R2, región `auto`)
   - `ASSET_PUBLIC_BASE_URL=https://...` con el dominio público del bucket
   - `ALLOWED_ORIGINS=https://tu-dominio.vercel.app` si el frontend y API no comparten origen

4. Vuelve a desplegar y comprueba `https://tu-dominio/api/v1/health`, registro/login, guardado y reapertura de un proyecto, perfil y subida de imagen.

No copies SQLite ni las carpetas `uploads` al deploy: las funciones serverless no conservan archivos entre invocaciones. Los trabajos de eliminación de fondo y preparación DTF quedan en estado `queued` (`POST /api/v1/assets/{id}/jobs`); requieren un worker externo para procesarlos.

## API v1

- Auth: `/api/v1/auth/register`, `/login`, `/logout`
- Perfil y panel: `/api/v1/users/profile`, `/password`, `/dashboard`
- Proyectos: `/api/v1/projects` y `/api/v1/projects/{id}`
- Plantillas y assets: `/api/v1/templates`, `/api/v1/assets`
- Marketplace y órdenes: `/api/v1/projects/marketplace`, `/api/v1/orders`

Validación: `python -m unittest backend.test_api_v1`; frontend: `npm run build`.