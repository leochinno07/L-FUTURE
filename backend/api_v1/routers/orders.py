from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, Project, User
from ..schemas import OrderCreate
from ..security import get_current_user

router = APIRouter(prefix='/orders', tags=['orders'])


@router.post('', status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(Project.id == payload.project_id, Project.usuario_id == user.id))
    if not project:
        raise HTTPException(status_code=404, detail='Proyecto no encontrado')
    order = Order(
        usuario_id=user.id,
        proyecto_id=project.id,
        quantity=payload.quantity,
        unit_price_cents=payload.unit_price_cents,
        currency=payload.currency,
        shipping_address=payload.shipping_address,
        status='pending'
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {'success': True, 'order': {'id': order.id, 'status': order.status, 'total_cents': order.quantity * order.unit_price_cents, 'currency': order.currency}}


@router.get('')
def list_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.scalars(
        select(Order).where(Order.usuario_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * limit).limit(limit)
    ).all()
    return {'success': True, 'orders': [
        {'id': order.id, 'project_id': order.proyecto_id, 'quantity': order.quantity,
         'unit_price_cents': order.unit_price_cents, 'total_cents': order.quantity * order.unit_price_cents,
         'currency': order.currency, 'status': order.status, 'created_at': order.created_at}
        for order in orders
    ], 'page': page, 'limit': limit}
