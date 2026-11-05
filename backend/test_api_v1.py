import io
import shutil
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.api_v1 import main as api_main
from backend.api_v1.database import get_db
from backend.api_v1.models import Base
from backend.api_v1.routers import assets as assets_router


class FastAPIV1Tests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            'sqlite://',
            connect_args={'check_same_thread': False},
            poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)
        self.original_engine = api_main.engine
        self.original_upload_dir = assets_router.UPLOADS_DIR
        api_main.engine = self.engine
        self.upload_dir = Path(tempfile.mkdtemp(prefix='lfuture_api_v1_uploads_'))
        assets_router.UPLOADS_DIR = self.upload_dir

        def override_get_db():
            db = self.session_factory()
            try:
                yield db
            finally:
                db.close()

        api_main.app.dependency_overrides[get_db] = override_get_db
        self.client_context = TestClient(api_main.app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        api_main.app.dependency_overrides.clear()
        api_main.engine = self.original_engine
        assets_router.UPLOADS_DIR = self.original_upload_dir
        self.engine.dispose()
        shutil.rmtree(self.upload_dir, ignore_errors=True)

    def test_auth_dashboard_projects_assets_and_orders_share_state(self):
        registration = self.client.post('/api/v1/auth/register', json={
            'username': 'api_user',
            'password': 'ApiPassword123',
            'email': 'api@example.com',
            'nombre_completo': 'API User',
            'apellido': 'Future',
            'nacionalidad': 'Venezuela',
            'edad': 25
        })
        self.assertEqual(registration.status_code, 201)

        login = self.client.post('/api/v1/auth/login', json={
            'username': 'api@example.com',
            'password': 'ApiPassword123'
        })
        self.assertEqual(login.status_code, 200)
        token = login.json()['access_token']
        headers = {'Authorization': 'Bearer ' + token}

        profile = self.client.get('/api/v1/users/profile', headers=headers)
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.json()['apellido'], 'Future')
        updated_profile = self.client.put('/api/v1/users/profile', headers=headers, json={
            'talla_preferida': 'M',
            'modo_oscuro': False
        })
        self.assertEqual(updated_profile.status_code, 200)
        self.assertEqual(updated_profile.json()['talla_preferida'], 'M')
        self.assertFalse(updated_profile.json()['modo_oscuro'])

        state = {
            'version': 1,
            'escenas': [
                {
                    'name': 'Frente',
                    'shirt': {'color': '#f1eee5', 'type': 'tshirt', 'view': 'front'},
                    'elementos': [{'tipo': 'forma', 'forma': 'star', 'contenido': 'star', 'color': '#62e2dc'}],
                    'imglist': []
                },
                {
                    'name': 'Trasera',
                    'shirt': {'color': '#111519', 'type': 'crop-top', 'view': 'back'},
                    'elementos': [{'tipo': 'stroke', 'contenido': 'Dibujo', 'points': [{'x': 0, 'y': 0}, {'x': 10, 'y': 10}]}],
                    'imglist': []
                }
            ]
        }
        created = self.client.post('/api/v1/projects', headers=headers, json={
            'nombre': 'Diseño API',
            'tags': 'street,limited',
            'clothing_type': 'tshirt',
            'estado_diseno': state
        })
        self.assertEqual(created.status_code, 201)
        project_id = created.json()['project']['id']

        dashboard = self.client.get('/api/v1/users/dashboard', headers=headers)
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.json()['active_projects_count'], 1)
        self.assertEqual(dashboard.json()['recent_designs'][0]['estado_diseno'], state)

        project = self.client.get('/api/v1/projects/{}'.format(project_id), headers=headers)
        self.assertEqual(project.status_code, 200)
        self.assertEqual(project.json()['project']['design_state'], state)
        self.assertEqual(project.json()['project']['tags'], 'street,limited')

        original_updated_at = project.json()['project']['updated_at']
        updated_state = project.json()['project']['design_state']
        updated_state['escenas'][0]['elementos'][0]['contenido'] = 'Diseño sincronizado'
        update = self.client.put('/api/v1/projects/{}'.format(project_id), headers=headers, json={
            'estado_diseno': updated_state,
            'preview_url': '/uploads/preview.png'
        })
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.json()['project']['design_state'], updated_state)
        self.assertEqual(update.json()['project']['preview_url'], '/uploads/preview.png')
        self.assertNotEqual(update.json()['project']['updated_at'], original_updated_at)

        dashboard = self.client.get('/api/v1/users/dashboard', headers=headers)
        self.assertEqual(dashboard.json()['recent_designs'][0]['design_state'], updated_state)

        published = self.client.post('/api/v1/projects/{}/publish'.format(project_id), headers=headers)
        self.assertEqual(published.status_code, 200)
        marketplace = self.client.get('/api/v1/projects/marketplace')
        self.assertEqual(marketplace.status_code, 200)
        self.assertEqual(marketplace.json()['projects'][0]['id'], project_id)
        public_detail = self.client.get('/api/v1/projects/marketplace/{}'.format(project_id))
        self.assertEqual(public_detail.status_code, 200)
        self.assertEqual(public_detail.json()['project']['design_state'], updated_state)

        duplicate = self.client.post('/api/v1/projects/{}/duplicate'.format(project_id), headers=headers, json={
            'nombre': 'Copia para editar'
        })
        self.assertEqual(duplicate.status_code, 201)
        self.assertEqual(duplicate.json()['project']['name'], 'Copia para editar')
        self.assertEqual(duplicate.json()['project']['design_state'], updated_state)

        removed = self.client.delete('/api/v1/projects/{}'.format(duplicate.json()['project']['id']), headers=headers)
        self.assertEqual(removed.status_code, 204)

        image_bytes = b'\x89PNG\r\n\x1a\n' + b'asset-data'
        upload = self.client.post(
            '/api/v1/assets/upload',
            headers=headers,
            data={'project_id': str(project_id)},
            files={'file': ('asset.png', io.BytesIO(image_bytes), 'image/png')}
        )
        self.assertEqual(upload.status_code, 201)
        asset_id = upload.json()['asset']['id']
        asset_list = self.client.get('/api/v1/assets', headers=headers)
        self.assertEqual(asset_list.status_code, 200)
        self.assertEqual(asset_list.json()['assets'][0]['id'], asset_id)

        order = self.client.post('/api/v1/orders', headers=headers, json={
            'project_id': project_id,
            'quantity': 2,
            'unit_price_cents': 2500,
            'currency': 'USD',
            'shipping_address': {'name': 'API User', 'line1': '1 Future Way', 'city': 'Caracas', 'country': 'VE'}
        })
        self.assertEqual(order.status_code, 201)
        self.assertEqual(order.json()['order']['total_cents'], 5000)

        job = self.client.post('/api/v1/assets/{}/jobs'.format(asset_id), headers=headers, json={
            'kind': 'dtf_preparation',
            'options': {'dpi': 300, 'transparent_background': True}
        })
        self.assertEqual(job.status_code, 202)
        self.assertEqual(job.json()['job']['status'], 'queued')

        logout = self.client.post('/api/v1/auth/logout', headers=headers)
        self.assertEqual(logout.status_code, 200)
        self.assertEqual(self.client.get('/api/v1/users/profile', headers=headers).status_code, 401)

    def test_password_change_requires_current_password(self):
        self.client.post('/api/v1/auth/register', json={
            'username': 'password_user',
            'password': 'OldPassword123'
        })
        login = self.client.post('/api/v1/auth/login', json={
            'username': 'password_user',
            'password': 'OldPassword123'
        })
        headers = {'Authorization': 'Bearer ' + login.json()['access_token']}

        invalid = self.client.put('/api/v1/users/password', headers=headers, json={
            'password_actual': 'wrong-password',
            'password_nueva': 'NewPassword123'
        })
        self.assertEqual(invalid.status_code, 400)
        changed = self.client.put('/api/v1/users/password', headers=headers, json={
            'password_actual': 'OldPassword123',
            'password_nueva': 'NewPassword123'
        })
        self.assertEqual(changed.status_code, 200)
        relogin = self.client.post('/api/v1/auth/login', json={
            'username': 'password_user',
            'password': 'NewPassword123'
        })
        self.assertEqual(relogin.status_code, 200)

    def test_invalid_project_state_is_rejected(self):
        response = self.client.post('/api/v1/auth/register', json={
            'username': 'strict_user',
            'password': 'StrictPassword123'
        })
        self.assertEqual(response.status_code, 201)
        login = self.client.post('/api/v1/auth/login', json={
            'username': 'strict_user',
            'password': 'StrictPassword123'
        })
        headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
        response = self.client.post('/api/v1/projects', headers=headers, json={
            'nombre': 'Bad design',
            'estado_diseno': {'version': 1, 'escenas': []}
        })
        self.assertEqual(response.status_code, 422)
        self.assertNotIn('input', str(response.json()))


if __name__ == '__main__':
    unittest.main()
