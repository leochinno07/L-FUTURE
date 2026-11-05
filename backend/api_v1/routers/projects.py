import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Template, User
from ..schemas import ProjectCreate, ProjectDuplicate, ProjectUpdate
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
        'tags': project.tags,
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
    if payload.tipo == 'global' and user.tipo_usuario != 'administrador':
        raise HTTPException(status_code=403, detail='Se requieren permisos de administrador')
    if payload.base_template_id and not db.scalar(select(Template.id).where(Template.id == payload.base_template_id, Template.active.is_(True))):
        raise HTTPException(status_code=404, detail='Plantilla base no encontrada')
    project = Project(
        usuario_id=user.id,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        tags=payload.tags,
        color_prenda=payload.color_prenda,
        talla=payload.talla,
        tipo=payload.tipo,
        es_publico=payload.tipo == 'global',
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
    return {'success': True, 'projects': [serialize_project(project) for project in projects], 'page': page, 'limit': limit}


@router.get('/marketplace/{project_id}')
def get_marketplace_project(project_id: int, db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(
        Project.id == project_id,
        Project.es_publico.is_(True),
        Project.tipo == 'global'
    ))
    if not project:
        raise HTTPException(status_code=404, detail='Diseño público no encontrado')
    return {'success': True, 'project': serialize_project(project)}


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
        column = {
            'nombre': 'nombre',
            'descripcion': 'descripcion',
            'tags': 'tags',
            'estado': 'estado',
            'color_prenda': 'color_prenda',
            'talla': 'talla',
            'clothing_type': 'tipo_prenda',
            'preview_url': 'thumbnail',
            'base_template_id': 'base_template_id'
        }[key]
        setattr(project, column, value)
    project.fecha_modificacion = datetime.now()
    db.commit()
    db.refresh(project)
    return {'success': True, 'project': serialize_project(project)}


@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_project(db, project_id, user.id)
    if project.es_publico and user.tipo_usuario != 'administrador':
        raise HTTPException(status_code=403, detail='No se puede eliminar un diseño público')
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post('/{project_id}/duplicate', status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project_id: int,
    payload: ProjectDuplicate | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    source = db.scalar(select(Project).where(
        Project.id == project_id,
        or_(Project.usuario_id == user.id, Project.es_publico.is_(True))
    ))
    if not source:
        raise HTTPException(status_code=404, detail='Proyecto no encontrado')
    duplicate = Project(
        usuario_id=user.id,
        nombre=(payload.nombre if payload and payload.nombre else source.nombre + ' (Copia)')[:100],
        descripcion=source.descripcion,
        tags=source.tags,
        estado='en_progreso',
        tipo='personal',
        color_prenda=source.color_prenda,
        thumbnail=source.thumbnail,
        estado_diseno_json=source.estado_diseno_json,
        tipo_prenda=source.tipo_prenda,
        base_template_id=source.base_template_id,
        talla=source.talla,
        es_publico=False
    )
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    return {'success': True, 'project': serialize_project(duplicate)}


@router.post('/{project_id}/publish')
def publish_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_project(db, project_id, user.id)
    project.es_publico = True
    project.tipo = 'global'
    db.commit()
    return {'success': True, 'project': serialize_project(project, include_state=False)}
