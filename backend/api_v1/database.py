import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    database_name = os.environ.get('DATABASE_NAME', 'lfuture.db')
    database_path = Path(database_name)
    if not database_path.is_absolute():
        database_path = BACKEND_DIR / database_path
    DATABASE_URL = 'sqlite:///' + database_path.as_posix()

_engine_options = {'pool_pre_ping': True}
if DATABASE_URL.startswith('sqlite:'):
    _engine_options['connect_args'] = {'check_same_thread': False}

engine = create_engine(DATABASE_URL, **_engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


if DATABASE_URL.startswith('sqlite:'):
    @event.listens_for(engine, 'connect')
    def enable_sqlite_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute('PRAGMA foreign_keys=ON')
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
