import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import is_managed_deployment
from .database import get_db
from .models import SessionRecord, User

JWT_SECRET = (
    os.environ.get('JWT_SECRET_KEY')
    or os.environ.get('JWT_SECRET')
    or os.environ.get('AUTH_SECRET')
    or os.environ.get('SECRET_KEY')
)
if not JWT_SECRET:
    if is_managed_deployment():
        raise RuntimeError('JWT_SECRET_KEY debe configurarse en producción')
    JWT_SECRET = 'local-only-change-before-deploy'
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_MINUTES = int(os.environ.get('ACCESS_TOKEN_MINUTES', '60'))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/login')


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    token = jwt.encode(
        {'sub': str(user_id), 'iat': datetime.now(timezone.utc), 'exp': expires_at, 'typ': 'access'},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    return token, expires_at.replace(tzinfo=None)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Token ausente, inválido o expirado',
        headers={'WWW-Authenticate': 'Bearer'}
    )
    session_record = db.scalar(select(SessionRecord).where(SessionRecord.token == token, SessionRecord.activa.is_(True)))
    if not session_record:
        raise unauthorized

    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={'require': ['exp', 'sub']})
        user_id = int(claims['sub'])
        if claims.get('typ') != 'access' or user_id != session_record.usuario_id:
            raise unauthorized
    except jwt.InvalidTokenError:
        # Legacy Flask tokens are opaque, high-entropy values stored in the same sessions table.
        if '.' in token:
            raise unauthorized
        user_id = session_record.usuario_id

    if session_record.fecha_expiracion and session_record.fecha_expiracion <= datetime.now(timezone.utc).replace(tzinfo=None):
        session_record.activa = False
        db.commit()
        raise unauthorized

    user = db.get(User, user_id)
    if not user:
        raise unauthorized
    return user
