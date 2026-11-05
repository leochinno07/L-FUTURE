# L-FUTURE API v1

This FastAPI surface is additive: it shares the existing SQLite tables with the Flask compatibility server and stores JWTs in `sesiones`, so either API can validate active sessions.

Install and run from the repository root:

```bash
python -m pip install -r backend/requirements-api-v1.txt
uvicorn backend.api_v1.main:app --host 127.0.0.1 --port 8000
```

The default database is `backend/lfuture.db`. Set `DATABASE_URL` to the same SQLite database used by Flask when running both processes. For local Vite development, `/api/v1` is proxied to port 8000 while legacy `/api` requests continue to target Flask on port 5000.

Asset-processing routes create durable `queued` jobs in `asset_jobs_v1`; a worker must claim and complete these jobs before background removal or DTF preparation is automatic.
