import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Template, User
from ..schemas import DesignState, ProjectCreate, ProjectUpdate
from ..security import get_current_user

router = APIRouter(prefix='/projects', tags=['projects'])


def serialize_project(project: Project, include_state: bool = True) -> dict:
    try:
        state = json.loads(project.estado_diseno_json) if project.estado_diseno_json else None
    except (TypeError, json.JSONDecodeError):
        state = None
    result = {
        'id': project.id,
        'user_id': project.usuario_id,
        'name': project.nombre,
        'description': project.descripcion,
        'status': project.estado,
        'type': project.tipo,
        'clothing_type': project.tipo_prenda,
        'base_template_id': project.base_template_id,
        'garment_color': project.color_prenda,
        'talla': project.talla,
        'preview_url': project.thumbnail,
        'created_at': project.fecha_creacion,
        'updated_at': project.fecha_modificacion,
        'is_public': bool(project.es_publico)
    }
    if include_state:
        result['design_state'] = state
    return result


def owned_project(db: Session, project_id: int, user_id: int) -> Project:
    project = db.scalar(select(Project).where(Project.id == project_id, Project.usuario_id == user_id))
    if not project:
        raise HTTPException(status_code=404, detail='Proyecto no encontrado')
    return project


@router.get('')
def list_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.scalars(
        select(Project).where(Project.usuario_id == user.id)
        .order_by(Project.fecha_modificacion.desc(), Project.id.desc())
        .offset((page - 1) * limit).limit(limit)
    ).all()
    return {'success': True, 'projects': [serialize_project(project) for project in projects], 'page': page, 'limit': limit}


@router.post('', status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.base_template_id and not db.scalar(select(Template.id).where(Template.id == payload.base_template_id, Template.active.is_(True))):
        raise HTTPException(status_code=404, detail='Plantilla base no encontrada')
    project = Project(
        usuario_id=user.id,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        color_prenda=payload.color_prenda,
        talla=payload.talla,
        tipo_prenda=payload.clothing_type,
        base_template_id=payload.base_template_id,
        estado_diseno_json=json.dumps(payload.estado_diseno.model_dump(mode='json', exclude_unset=True)) if payload.estado_diseno else None
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {'success': True, 'project': serialize_project(project)}


@router.get('/marketplace')
def marketplace_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=50),
    db: Session = Depends(get_db)
):
    projects = db.scalars(
        select(Project).where(Project.es_publico.is_(True), Project.tipo == 'global')
        .order_by(Project.fecha_modificacion.desc(), Project.id.desc())
        .offset((page - 1) * limit).limit(limit)
    ).all()
    return {'success': True, 'projects': [serialize_project(project, include_state=False) for project in projects], 'page': page, 'limit': limit}


@router.get('/{project_id}')
def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {'success': True, 'project': serialize_project(owned_project(db, project_id, user.id))}


@router.put('/{project_id}')
def update_project(project_id: int, payload: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_project(db, project_id, user.id)
    values = payload.model_dump(exclude_unset=True)
    state = values.pop('estado_diseno', None)
    template_id = values.get('base_template_id')
    if template_id and not db.scalar(select(Template.id).where(Template.id == template_id, Template.active.is_(True))):
        raise HTTPException(status_code=404, detail='Plantilla base no encontrada')
    if 'estado_diseno' in payload.model_fields_set:
        project.estado_diseno_json = json.dumps(state, ensure_ascii=False, separators=(',', ':')) if state is not None else None
    for key, value in values.items():
        column = {'nombre': 'nombre', 'descripcion': 'descripcion', 'color_prenda': 'color_prenda', 'talla': 'talla', 'clothing_type': 'tipo_prenda', 'base_template_id': 'base_template_id'}[key]
        setattr(project, column, value)
    project.fecha_modificacion = datetime.now()
    db.commit()
    db.refresh(project)
    return {'success': True, 'project': serialize_project(project)}


@router.post('/{project_id}/publish')
def publish_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_project(db, project_id, user.id)
    project.es_publico = True
    project.tipo = 'global'
    db.commit()
    return {'success': True, 'project': serialize_project(project, include_state=False)}
