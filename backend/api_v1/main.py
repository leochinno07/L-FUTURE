import os
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import inspect, text

from .database import engine
from .models import Base
from .routers import assets, auth, orders, projects, templates, users

app = FastAPI(title='L-FUTURE API', version='1.0.0')
origins = [origin.strip() for origin in os.environ.get(
    'ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:4173'
).split(',') if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials='*' not in origins,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'Accept'],
    expose_headers=['X-Request-ID']
)

app.include_router(auth.router, prefix='/api/v1')
app.include_router(users.router, prefix='/api/v1')
app.include_router(projects.router, prefix='/api/v1')
app.include_router(templates.router, prefix='/api/v1')
app.include_router(assets.router, prefix='/api/v1')
app.include_router(orders.router, prefix='/api/v1')


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, error: RequestValidationError):
    errors = [{key: value for key, value in item.items() if key != 'input'} for item in error.errors()]
    return JSONResponse(
        status_code=422,
        content={'success': False, 'message': 'Datos de entrada inválidos', 'errors': jsonable_encoder(errors)}
    )


@app.exception_handler(HTTPException)
async def http_error_handler(_request: Request, error: HTTPException):
    message = error.detail if isinstance(error.detail, str) else 'Solicitud rechazada'
    return JSONResponse(
        status_code=error.status_code,
        content={'success': False, 'message': message, 'detail': jsonable_encoder(error.detail)},
        headers=error.headers
    )


@app.on_event('startup')
def initialize_schema() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    migrations = {
        'usuarios': {
            'email': 'VARCHAR(254)',
            'apellido': 'VARCHAR(80)',
            'nacionalidad': 'VARCHAR(80)',
            'edad': 'INTEGER'
        },
        'proyectos': {
            'estado_diseno_json': 'TEXT',
            'tipo_prenda': 'VARCHAR(24)',
            'base_template_id': 'INTEGER REFERENCES plantillas_v1(id) ON DELETE SET NULL'
        }
    }
    with engine.begin() as connection:
        for table_name, columns in migrations.items():
            if not inspector.has_table(table_name):
                continue
            existing = {column['name'] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}'))
        connection.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios(email)'))


@app.get('/api/v1/health')
def health() -> dict[str, Any]:
    return {'success': True, 'service': 'lfuture-api', 'version': app.version}
