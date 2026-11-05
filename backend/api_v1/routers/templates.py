from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Template, User
from ..schemas import TemplateCreate
from ..security import get_current_user

router = APIRouter(prefix='/templates', tags=['templates'])


@router.get('')
def list_templates(
    clothing_type: str | None = Query(default=None, pattern=r'^(tshirt|sweater|polo|crop-top)$'),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=50),
    db: Session = Depends(get_db)
):
    statement = select(Template).where(Template.active.is_(True))
    if clothing_type:
        statement = statement.where(Template.clothing_type == clothing_type)
    templates = db.scalars(statement.order_by(Template.id.desc()).offset((page - 1) * limit).limit(limit)).all()
    return {'success': True, 'templates': [
        {'id': item.id, 'name': item.name, 'clothing_type': item.clothing_type, 'preview_url': item.preview_url, 'payload': item.payload}
        for item in templates
    ], 'page': page, 'limit': limit}


@router.post('', status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.tipo_usuario != 'administrador':
        raise HTTPException(status_code=403, detail='Se requieren permisos de administrador')
    template = Template(
        name=payload.name,
        clothing_type=payload.clothing_type,
        preview_url=payload.preview_url,
        payload=payload.payload.model_dump(mode='json')
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return {'success': True, 'template': {'id': template.id, 'name': template.name, 'clothing_type': template.clothing_type}}
