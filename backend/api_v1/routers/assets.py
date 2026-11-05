import hashlib
import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import BACKEND_DIR, get_db
from ..models import Asset, ProcessingJob, Project, User
from ..schemas import ProcessingJobCreate
from ..security import get_current_user
from backend.uploads import is_valid_image_bytes, safe_name

router = APIRouter(prefix='/assets', tags=['assets'])
MAX_UPLOAD_SIZE = 5 * 1024 * 1024
UPLOADS_DIR = Path(os.environ.get('UPLOADS_DIR', BACKEND_DIR / 'uploads')).resolve()
ALLOWED_MIME = {'image/png', 'image/jpeg', 'image/webp', 'image/gif'}


def sniff_image_mime(content: bytes) -> str | None:
    if content.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if content.startswith(b'\xff\xd8') and content.rstrip().endswith(b'\xff\xd9'):
        return 'image/jpeg'
    if content[:6] in (b'GIF87a', b'GIF89a'):
        return 'image/gif'
    if content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        return 'image/webp'
    return None


@router.get('')
def list_assets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assets = db.scalars(
        select(Asset).where(Asset.usuario_id == user.id, Asset.estado == 'activo')
        .order_by(Asset.fecha_subida.desc(), Asset.id.desc()).limit(100)
    ).all()
    return {'success': True, 'assets': [
        {'id': asset.id, 'filename': asset.filename, 'mime_type': asset.tipo, 'size': asset.tamano,
         'project_id': asset.proyecto_id, 'file_url': '/uploads/' + asset.filename,
         'created_at': asset.fecha_subida}
        for asset in assets
    ]}


@router.post('/upload', status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: int | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail='Formato de imagen no admitido')
    if project_id is not None and not db.scalar(select(Project.id).where(Project.id == project_id, Project.usuario_id == user.id)):
        raise HTTPException(status_code=404, detail='Proyecto no encontrado')

    content = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail='La imagen excede 5 MB')
    actual_mime = sniff_image_mime(content)
    if not actual_mime or actual_mime != file.content_type or not is_valid_image_bytes(content):
        raise HTTPException(status_code=400, detail='El contenido no coincide con el tipo de imagen declarado')

    filename = safe_name(user.id, file.filename or 'asset.png')
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    final_path = (UPLOADS_DIR / filename).resolve()
    if final_path.parent != UPLOADS_DIR:
        raise HTTPException(status_code=400, detail='Ruta de archivo inválida')

    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(dir=UPLOADS_DIR, prefix='.upload-', delete=False) as temporary_file:
            temporary_path = Path(temporary_file.name)
            temporary_file.write(content)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_path, final_path)
        asset = Asset(
            usuario_id=user.id,
            proyecto_id=project_id,
            filename=filename,
            tipo=actual_mime,
            tamano=len(content),
            hash=hashlib.sha256(content).hexdigest(),
            estado='activo'
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
    except Exception:
        db.rollback()
        if final_path.exists():
            final_path.unlink(missing_ok=True)
        raise
    finally:
        if temporary_path:
            temporary_path.unlink(missing_ok=True)

    return {'success': True, 'asset': {'id': asset.id, 'filename': filename, 'mime_type': actual_mime,
            'size': len(content), 'file_url': '/uploads/' + filename}}


@router.post('/{asset_id}/jobs', status_code=status.HTTP_202_ACCEPTED)
def queue_asset_job(
    asset_id: int,
    payload: ProcessingJobCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.scalar(select(Asset).where(Asset.id == asset_id, Asset.usuario_id == user.id, Asset.estado == 'activo'))
    if not asset:
        raise HTTPException(status_code=404, detail='Asset no encontrado')
    job = ProcessingJob(asset_id=asset.id, usuario_id=user.id, kind=payload.kind, options=payload.options, status='queued')
    db.add(job)
    db.commit()
    db.refresh(job)
    return {'success': True, 'job': {'id': job.id, 'asset_id': job.asset_id, 'kind': job.kind, 'status': job.status}}


@router.get('/jobs/{job_id}')
def get_asset_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.scalar(select(ProcessingJob).where(ProcessingJob.id == job_id, ProcessingJob.usuario_id == user.id))
    if not job:
        raise HTTPException(status_code=404, detail='Trabajo no encontrado')
    return {'success': True, 'job': {'id': job.id, 'asset_id': job.asset_id, 'kind': job.kind, 'status': job.status, 'result': job.result}}
