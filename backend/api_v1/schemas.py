import re
import os
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=20, pattern=r'^[A-Za-z0-9_-]+$')]
ImageUrl = Annotated[str, StringConstraints(max_length=8 * 1024 * 1024)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class UserRegister(StrictModel):
    username: Username
    password: str = Field(min_length=8, max_length=72)
    email: str | None = Field(default=None, max_length=254)
    nombre_completo: str | None = Field(default=None, max_length=100)
    apellido: str | None = Field(default=None, max_length=80)
    nacionalidad: str | None = Field(default=None, max_length=80)
    edad: int | None = Field(default=None, ge=13, le=120)

    @field_validator('password')
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        if len(value.encode('utf-8')) > 72:
            raise ValueError('La contraseña excede 72 bytes')
        return value

    @field_validator('email')
    @classmethod
    def valid_email(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError('Email inválido')
        return value.lower() if value else value


class LoginRequest(StrictModel):
    username: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=72)


class PasswordUpdate(StrictModel):
    password_actual: str = Field(min_length=1, max_length=72)
    password_nueva: str = Field(min_length=8, max_length=72)

    @field_validator('password_nueva')
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        if len(value.encode('utf-8')) > 72:
            raise ValueError('La contraseña excede 72 bytes')
        return value


class UserProfileUpdate(StrictModel):
    nombre_completo: str | None = Field(default=None, max_length=100)
    apellido: str | None = Field(default=None, max_length=80)
    nacionalidad: str | None = Field(default=None, max_length=80)
    edad: int | None = Field(default=None, ge=13, le=120)
    foto_perfil: str | None = Field(default=None, max_length=512)
    talla_preferida: Literal['S', 'M', 'L', 'XL', 'XXL'] | None = None
    idioma: Literal['es', 'en', 'fr', 'pt'] | None = None
    privacidad: Literal['publico', 'privado', 'amigos'] | None = None
    modo_oscuro: bool = True
    notificaciones_activas: bool = True

    @model_validator(mode='after')
    def at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError('Se requiere al menos un campo')
        return self


class ElementPoint(StrictModel):
    x: float = Field(ge=-2000, le=2000)
    y: float = Field(ge=-2000, le=2000)


class DesignElement(BaseModel):
    model_config = ConfigDict(extra='allow', str_strip_whitespace=True)
    tipo: Literal['texto', 'logo', 'img', 'imagen', 'detalle', 'insignia', 'forma', 'stroke']
    contenido: str = Field(default='', max_length=2000)
    x: float = Field(default=0, ge=-2000, le=2000)
    y: float = Field(default=0, ge=-2000, le=2000)
    rotacion: float = Field(default=0, ge=-360, le=360)
    escala: float = Field(default=1, gt=0, le=10000)
    opacidad: float = Field(default=100, ge=0, le=100)
    tamano: float | None = Field(default=None, ge=1, le=500)
    color: str | None = Field(default=None, pattern=r'^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$')
    fuente: str | None = Field(default=None, max_length=80)
    espaciado: float = Field(default=0, ge=-5, le=20)
    lineHeight: float = Field(default=1.2, ge=0.5, le=3)
    cornerRadius: float = Field(default=0, ge=0, le=55)
    forma: Literal['circle', 'triangle', 'star', 'diamond'] | None = None
    points: list[ElementPoint] | None = Field(default=None, min_length=2, max_length=2000)

    @model_validator(mode='after')
    def valid_shape_or_stroke(self):
        if self.tipo == 'forma' and self.forma is None:
            raise ValueError('La forma no está admitida')
        if self.tipo == 'stroke' and not self.points:
            raise ValueError('El trazo requiere puntos')
        return self


class ShirtState(StrictModel):
    color: str = Field(pattern=r'^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$')
    type: Literal['tshirt', 'sweater', 'polo', 'crop-top']
    view: Literal['front', 'back']


class DesignImage(StrictModel):
    id: int | str | None = None
    url: ImageUrl
    name: str | None = Field(default=None, max_length=255)
    size: int | None = Field(default=None, ge=0, le=5 * 1024 * 1024)

    @field_validator('url')
    @classmethod
    def image_must_be_owned(cls, value: str) -> str:
        inline = value.startswith(('data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,', 'data:image/gif;base64,'))
        local = value.startswith('/uploads/') and '..' not in value.split('/')
        public_base = os.environ.get('ASSET_PUBLIC_BASE_URL', '').rstrip('/')
        image_url = urlsplit(value)
        allowed_base = urlsplit(public_base) if public_base else None
        remote_asset = bool(
            allowed_base
            and allowed_base.scheme == 'https'
            and image_url.scheme == 'https'
            and image_url.netloc == allowed_base.netloc
            and image_url.path.startswith(allowed_base.path.rstrip('/') + '/')
            and '..' not in image_url.path.split('/')
        )
        if not (inline or local or remote_asset):
            raise ValueError('La imagen debe ser propia o una data URL de imagen')
        return value


class DesignScene(StrictModel):
    name: str = Field(min_length=1, max_length=32)
    shirt: ShirtState
    elementos: list[DesignElement] = Field(max_length=500)
    imglist: list[DesignImage] = Field(max_length=100)


class DesignState(StrictModel):
    version: Literal[1]
    escenas: list[DesignScene] = Field(min_length=2, max_length=2)

    @model_validator(mode='after')
    def ensure_front_back(self):
        names = {scene.shirt.view for scene in self.escenas}
        if names != {'front', 'back'}:
            raise ValueError('El diseño requiere una escena frontal y otra trasera')
        return self


class ProjectCreate(StrictModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str | None = Field(default=None, max_length=2000)
    color_prenda: str = Field(default='#FFFFFF', pattern=r'^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$')
    talla: Literal['S', 'M', 'L', 'XL', 'XXL'] | None = None
    clothing_type: Literal['tshirt', 'sweater', 'polo', 'crop-top'] = 'tshirt'
    base_template_id: int | None = Field(default=None, ge=1)
    estado_diseno: DesignState | None = None


class ProjectUpdate(StrictModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    descripcion: str | None = Field(default=None, max_length=2000)
    color_prenda: str | None = Field(default=None, pattern=r'^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$')
    talla: Literal['S', 'M', 'L', 'XL', 'XXL'] | None = None
    clothing_type: Literal['tshirt', 'sweater', 'polo', 'crop-top'] | None = None
    base_template_id: int | None = Field(default=None, ge=1)
    estado_diseno: DesignState | None = None

    @model_validator(mode='after')
    def at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError('Se requiere al menos un campo')
        return self


class TemplateCreate(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    clothing_type: Literal['tshirt', 'sweater', 'polo', 'crop-top']
    preview_url: str | None = Field(default=None, max_length=512)
    payload: DesignState


class OrderCreate(StrictModel):
    project_id: int = Field(ge=1)
    quantity: int = Field(ge=1, le=20)
    unit_price_cents: int = Field(ge=0, le=10_000_000)
    currency: Literal['USD', 'EUR', 'MXN', 'COP', 'ARS', 'VES'] = 'USD'
    shipping_address: dict[str, str]

    @field_validator('shipping_address')
    @classmethod
    def valid_address(cls, value: dict[str, str]) -> dict[str, str]:
        allowed = {'name', 'line1', 'line2', 'city', 'region', 'postal_code', 'country'}
        if not value or set(value) - allowed or any(not item.strip() for item in value.values()):
            raise ValueError('Dirección de envío inválida')
        return value


class ProcessingJobCreate(StrictModel):
    kind: Literal['background_removal', 'dtf_preparation']
    options: dict[str, str | int | float | bool] = Field(default_factory=dict)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str | None
    nombre_completo: str | None
    apellido: str | None
    nacionalidad: str | None
    edad: int | None
    foto_perfil: str | None
    tipo_usuario: str
    talla_preferida: str | None
    idioma: str
    privacidad: str
    modo_oscuro: bool
    notificaciones_activas: bool


class DashboardResponse(BaseModel):
    active_projects_count: int
    recent_designs: list[dict]
    saved_preferences: dict
