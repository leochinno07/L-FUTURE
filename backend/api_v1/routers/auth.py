from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SessionRecord, User
from ..schemas import LoginRequest, UserPublic, UserRegister
from ..security import create_access_token, hash_password, oauth2_scheme, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    conditions = [User.username == payload.username]
    if payload.email:
        conditions.append(User.email == payload.email)
    if db.scalar(select(User.id).where(or_(*conditions))):
        raise HTTPException(status_code=409, detail='El usuario o email ya está registrado')

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        nombre_completo=payload.nombre_completo,
        apellido=payload.apellido,
        nacionalidad=payload.nacionalidad,
        edad=payload.edad
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {'success': True, 'user': UserPublic.model_validate(user).model_dump()}


@router.post('/login')
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(or_(User.username == payload.username, User.email == payload.username)))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Usuario o contraseña incorrectos', headers={'WWW-Authenticate': 'Bearer'})

    token, expires_at = create_access_token(user.id)
    db.add(SessionRecord(usuario_id=user.id, token=token, fecha_expiracion=expires_at, activa=True))
    db.commit()
    return {
        'success': True,
        'access_token': token,
        'token': token,
        'token_type': 'bearer',
        'expires_at': expires_at.replace(tzinfo=timezone.utc).isoformat(),
        'user': UserPublic.model_validate(user).model_dump()
    }


@router.post('/logout')
def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    session = db.scalar(select(SessionRecord).where(SessionRecord.token == token, SessionRecord.activa.is_(True)))
    if not session:
        raise HTTPException(status_code=401, detail='Sesión no válida')
    session.activa = False
    db.commit()
    return {'success': True, 'message': 'Sesión cerrada'}
