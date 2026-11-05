from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'usuarios'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    nombre_completo: Mapped[Optional[str]] = mapped_column(String(100))
    apellido: Mapped[Optional[str]] = mapped_column(String(80))
    nacionalidad: Mapped[Optional[str]] = mapped_column(String(80))
    edad: Mapped[Optional[int]] = mapped_column(Integer)
    genero: Mapped[Optional[str]] = mapped_column(String(20))
    talla_preferida: Mapped[Optional[str]] = mapped_column(String(8))
    foto_perfil: Mapped[Optional[str]] = mapped_column(String(512))
    tipo_usuario: Mapped[str] = mapped_column(String(24), default='normal', server_default='normal')
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    idioma: Mapped[str] = mapped_column(String(8), default='es', server_default='es')
    privacidad: Mapped[str] = mapped_column(String(16), default='publico', server_default='publico')
    notificaciones_activas: Mapped[bool] = mapped_column(Boolean, default=True, server_default='1')
    modo_oscuro: Mapped[bool] = mapped_column(Boolean, default=True, server_default='1')

    proyectos: Mapped[list['Project']] = relationship(back_populates='owner', foreign_keys='Project.usuario_id')


class Template(Base):
    __tablename__ = 'plantillas_v1'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    clothing_type: Mapped[str] = mapped_column(String(24), nullable=False)
    preview_url: Mapped[Optional[str]] = mapped_column(String(512))
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default='1')
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())


class Project(Base):
    __tablename__ = 'proyectos'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[str]] = mapped_column(String(500))
    estado: Mapped[str] = mapped_column(String(24), default='en_progreso', server_default='en_progreso')
    tipo: Mapped[str] = mapped_column(String(16), default='personal', server_default='personal')
    color_prenda: Mapped[str] = mapped_column(String(7), default='#FFFFFF', server_default='#FFFFFF')
    thumbnail: Mapped[Optional[str]] = mapped_column(String(512))
    estado_diseno_json: Mapped[Optional[str]] = mapped_column(Text)
    tipo_prenda: Mapped[Optional[str]] = mapped_column(String(24))
    base_template_id: Mapped[Optional[int]] = mapped_column(ForeignKey('plantillas_v1.id', ondelete='SET NULL'))
    talla: Mapped[Optional[str]] = mapped_column(String(8))
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    fecha_modificacion: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    es_publico: Mapped[bool] = mapped_column(Boolean, default=False, server_default='0')

    owner: Mapped[User] = relationship(back_populates='proyectos', foreign_keys=[usuario_id])


class SessionRecord(Base):
    __tablename__ = 'sesiones'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    fecha_expiracion: Mapped[Optional[datetime]] = mapped_column(DateTime)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, server_default='1')


class Asset(Base):
    __tablename__ = 'archivos'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    proyecto_id: Mapped[Optional[int]] = mapped_column(ForeignKey('proyectos.id', ondelete='CASCADE'), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[Optional[str]] = mapped_column(String(64))
    tamano: Mapped[Optional[int]] = mapped_column(Integer)
    hash: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    estado: Mapped[str] = mapped_column(String(16), default='activo', server_default='activo')


class Order(Base):
    __tablename__ = 'ordenes_v1'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete='RESTRICT'), nullable=False, index=True)
    proyecto_id: Mapped[int] = mapped_column(ForeignKey('proyectos.id', ondelete='RESTRICT'), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default='USD', server_default='USD')
    status: Mapped[str] = mapped_column(String(24), default='pending', server_default='pending')
    shipping_address: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())


class ProcessingJob(Base):
    __tablename__ = 'asset_jobs_v1'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey('archivos.id', ondelete='CASCADE'), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default='queued', server_default='queued')
    options: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    result: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
