import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, User
from ..schemas import DashboardResponse, PasswordUpdate, UserProfileUpdate, UserPublic
from ..security import get_current_user, hash_password, verify_password

router = APIRouter(prefix='/users', tags=['users'])


@router.put('/password')
def update_password(payload: PasswordUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.password_actual, user.password_hash):
        raise HTTPException(status_code=400, detail='La contraseña actual es incorrecta')
    user.password_hash = hash_password(payload.password_nueva)
    db.commit()
    return {'success': True, 'message': 'Contraseña actualizada'}


@router.get('/profile', response_model=UserPublic)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put('/profile', response_model=UserPublic)
def update_profile(payload: UserProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.get('/dashboard', response_model=DashboardResponse)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_count = db.scalar(
        select(func.count(Project.id)).where(Project.usuario_id == user.id, Project.estado != 'completado')
    ) or 0
    projects = db.scalars(
        select(Project).where(Project.usuario_id == user.id)
        .order_by(Project.fecha_modificacion.desc(), Project.id.desc()).limit(8)
    ).all()
    recent = []
    for project in projects:
        try:
            state = json.loads(project.estado_diseno_json) if project.estado_diseno_json else None
        except (TypeError, json.JSONDecodeError):
            state = None
        recent.append({
            'id': project.id,
            'name': project.nombre,
            'nombre': project.nombre,
            'descripcion': project.descripcion,
            'preview_url': project.thumbnail,
            'clothing_type': project.tipo_prenda,
            'garment_color': project.color_prenda,
            'color_prenda': project.color_prenda,
            'updated_at': project.fecha_modificacion.isoformat() if isinstance(project.fecha_modificacion, datetime) else project.fecha_modificacion,
            'design_state': state,
            'estado_diseno': state
        })
    return {
        'active_projects_count': active_count,
        'recent_designs': recent,
        'saved_preferences': {
            'idioma': user.idioma,
            'privacidad': user.privacidad,
            'modo_oscuro': user.modo_oscuro,
            'talla_preferida': user.talla_preferida
        }
    }
