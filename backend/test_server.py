import os
import unittest
import tempfile
import json
import io

from backend.server_simple import APP, DB_PATH
from backend.database import Database


class BackendServerTests(unittest.TestCase):
    def setUp(self):
        # Create temporary DB file and point server to use it
        fd, tmp = tempfile.mkstemp(prefix="lfuture_test_", suffix='.db')
        os.close(fd)
        self.tmp_db = tmp
        # Ensure server uses this DB path
        from importlib import reload
        # Adjust DB_PATH in server_simple
        import backend.server_simple as server_mod
        server_mod.DB_PATH = self.tmp_db
        server_mod.Database.default_db_name = self.tmp_db
        self.app = server_mod.APP.test_client()

        # Initialize schema
        with Database(db_name=self.tmp_db) as db:
            db.create_tables()

    def tearDown(self):
        try:
            os.unlink(self.tmp_db)
        except Exception:
            pass

    def test_auth_rejects_invalid_payload_shapes_and_password_lengths(self):
        response = self.app.post('/api/register', json=['not', 'an', 'object'])
        self.assertEqual(response.status_code, 400)

        response = self.app.post('/api/login', json=['not', 'an', 'object'])
        self.assertEqual(response.status_code, 400)

        response = self.app.post('/api/register', json={'username': 'tester', 'password': 'x' * 73})
        self.assertEqual(response.status_code, 400)

        response = self.app.post('/api/login', json={'username': 'tester', 'password': 'x' * 73})
        self.assertEqual(response.status_code, 401)

        response = self.app.post('/api/login', json={'username': 'unknown_user', 'password': 'ValidPass123'})
        self.assertEqual(response.status_code, 401)

    def test_profile_password_and_project_duplicate_routes(self):
        username = 'routes_user'
        password = 'CurrentPass123'
        response = self.app.post('/api/register', json={'username': username, 'password': password})
        self.assertEqual(response.status_code, 201)

        response = self.app.post('/api/login', json={'username': username, 'password': password})
        self.assertEqual(response.status_code, 200)
        token = response.get_json()['token']
        headers = {'Authorization': 'Bearer ' + token}

        response = self.app.post(
            '/api/proyectos',
            json={'nombre': 'Proyecto origen'},
            headers=headers
        )
        self.assertEqual(response.status_code, 201)
        proyecto_id = response.get_json()['proyecto_id']

        response = self.app.post('/api/proyectos/{}/duplicar'.format(proyecto_id), headers=headers)
        self.assertEqual(response.status_code, 201)
        self.assertNotEqual(response.get_json()['proyecto_id'], proyecto_id)

        response = self.app.put(
            '/api/usuario/perfil',
            json={'nombre_completo': 'Usuario de prueba'},
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

        response = self.app.put(
            '/api/usuario/password',
            json={'password_actual': password, 'password_nueva': 'UpdatedPass123'},
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.app.post('/api/login', json={'username': username, 'password': password}).status_code, 401)
        self.assertEqual(self.app.post('/api/login', json={'username': username, 'password': 'UpdatedPass123'}).status_code, 200)

    def test_customizer_state_round_trips_both_scenes(self):
        username = 'customizer_user'
        password = 'CustomizerPass123'
        self.app.post('/api/register', json={'username': username, 'password': password})
        login = self.app.post('/api/login', json={'username': username, 'password': password})
        headers = {'Authorization': 'Bearer ' + login.get_json()['token']}
        project = self.app.post('/api/proyectos', json={'nombre': 'Diseño completo'}, headers=headers)
        proyecto_id = project.get_json()['proyecto_id']
        state = {
            'version': 1,
            'escenas': [
                {
                    'name': 'Frente',
                    'shirt': {'color': '#ffffff', 'type': 'tshirt', 'view': 'front'},
                    'elementos': [
                        {'tipo': 'texto', 'contenido': 'Frente', 'x': 12, 'y': -8},
                        {'tipo': 'forma', 'forma': 'star', 'contenido': 'star', 'color': '#62e2dc', 'tamano': 74}
                    ],
                    'imglist': []
                },
                {
                    'name': 'Trasera',
                    'shirt': {'color': '#101010', 'type': 'sweater', 'view': 'back'},
                    'elementos': [
                        {'tipo': 'logo', 'contenido': 'L-FUTURE', 'x': 0, 'y': 10},
                        {'tipo': 'stroke', 'contenido': 'Dibujo', 'points': [{'x': 0, 'y': 0}, {'x': 10, 'y': 10}], 'color': '#ff9a57', 'tamano': 5}
                    ],
                    'imglist': []
                }
            ]
        }

        response = self.app.put(
            '/api/proyectos/{}/estado-diseno'.format(proyecto_id),
            json=state,
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        response = self.app.get('/api/proyectos/{}/estado-diseno'.format(proyecto_id), headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['estado_diseno'], state)

        invalid_state = json.loads(json.dumps(state))
        invalid_state['escenas'][0]['shirt']['color'] = 'red'
        response = self.app.put(
            '/api/proyectos/{}/estado-diseno'.format(proyecto_id),
            json=invalid_state,
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        response = self.app.get('/api/proyectos/{}/estado-diseno'.format(proyecto_id), headers=headers)
        self.assertEqual(response.get_json()['estado_diseno'], state)

        invalid_state = json.loads(json.dumps(state))
        invalid_state['escenas'][0]['elementos'][0]['escala'] = 0
        response = self.app.put(
            '/api/proyectos/{}/estado-diseno'.format(proyecto_id),
            json=invalid_state,
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        response = self.app.get('/api/proyectos/{}/estado-diseno'.format(proyecto_id), headers=headers)
        self.assertEqual(response.get_json()['estado_diseno'], state)

        response = self.app.post('/api/proyectos/{}/duplicar'.format(proyecto_id), headers=headers)
        self.assertEqual(response.status_code, 201)
        duplicated_id = response.get_json()['proyecto_id']
        response = self.app.get('/api/proyectos/{}/estado-diseno'.format(duplicated_id), headers=headers)
        self.assertEqual(response.get_json()['estado_diseno'], state)

    def test_project_upload_rejects_mime_spoofed_file(self):
        username = 'upload_user'
        password = 'UploadPass123'
        self.app.post('/api/register', json={'username': username, 'password': password})
        login = self.app.post('/api/login', json={'username': username, 'password': password})
        headers = {'Authorization': 'Bearer ' + login.get_json()['token']}
        project = self.app.post('/api/proyectos', json={'nombre': 'Upload test'}, headers=headers)
        proyecto_id = project.get_json()['proyecto_id']

        response = self.app.post(
            '/api/proyectos/{}/upload-image'.format(proyecto_id),
            data={'image': (io.BytesIO(b'not-an-image'), 'fake.png')},
            headers=headers,
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('contenido', response.get_json()['message'])

    def test_upload_library_is_scoped_to_authenticated_user(self):
        users = [('library_one', 'LibraryPass123'), ('library_two', 'LibraryPass456')]
        tokens = []
        for username, password in users:
            self.app.post('/api/register', json={'username': username, 'password': password})
            login = self.app.post('/api/login', json={'username': username, 'password': password})
            tokens.append(login.get_json()['token'])

        with Database(db_name=self.tmp_db) as db:
            db.insertar_archivo(1, 'user_one.png', 'image/png', 12, 'private-hash-one')
            db.insertar_archivo(2, 'user_two.png', 'image/png', 24, 'private-hash-two')

        response = self.app.get('/api/uploads?limit=10', headers={'Authorization': 'Bearer ' + tokens[0]})
        self.assertEqual(response.status_code, 200)
        files = response.get_json()['archivos']
        self.assertEqual([item['filename'] for item in files], ['user_one.png'])
        self.assertEqual(files[0]['file_url'], '/uploads/user_one.png')
        self.assertNotIn('hash', files[0])
        self.assertEqual(self.app.get('/api/uploads?limit=500', headers={'Authorization': 'Bearer ' + tokens[0]}).status_code, 400)

    def test_health_and_register_login(self):
        r = self.app.get('/api/health')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data.get('success'))

        # Register
        payload = {'username': 'test_user_integration', 'password': 'Aa1!testpwd', 'confirm_password': 'Aa1!testpwd'}
        r = self.app.post('/api/register', json=payload)
        self.assertIn(r.status_code, (200, 201))

        # Login
        r = self.app.post('/api/login', json={'username': payload['username'], 'password': payload['password']})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('token'))
        token = data.get('token')

        # Create project
        project_payload = {'nombre': 'Integration Test Project', 'descripcion': 'Prueba', 'color_prenda': '#FF00FF', 'talla': 'M'}
        r = self.app.post('/api/proyectos', json=project_payload, headers={'Authorization': f'Bearer {token}'})
        self.assertIn(r.status_code, (200, 201))
        data = r.get_json()
        self.assertTrue(data.get('success'))
        pid = data.get('proyecto_id')
        self.assertIsNotNone(pid)

        # Make user admin and create a global project
        with Database(db_name=self.tmp_db) as db:
            db.actualizar_usuario(1, tipo_usuario='administrador')
        # create a global project
        project_global = {'nombre': 'Global Test', 'descripcion': 'Global', 'color_prenda': '#00FF00', 'talla': 'M', 'tipo': 'global'}
        r = self.app.post('/api/proyectos', json=project_global, headers={'Authorization': f'Bearer {token}'})
        self.assertIn(r.status_code, (200, 201))
        data = r.get_json()
        self.assertTrue(data.get('success'))
        global_id = data.get('proyecto_id')
        self.assertIsNotNone(global_id)

        # Upload base64 thumbnail via POST /api/proyectos/<id>/thumbnail
        tiny_png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAgsB9z7zXkwAAAAASUVORK5CYII='
        data_thumb = {'thumbnail': 'data:image/png;base64,' + tiny_png}
        r = self.app.post(f'/api/proyectos/{global_id}/thumbnail', json=data_thumb, headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(r.status_code, 200)
        tj = r.get_json()
        self.assertTrue(tj.get('success'))

        # Verify list shows the project
        r = self.app.get('/api/proyectos', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data.get('success'))
        proyectos = data.get('proyectos', [])
        names = [p['nombre'] for p in proyectos]
        self.assertIn(project_payload['nombre'], names)

        # Verify global projects endpoint includes the created global with thumbnail
        r = self.app.get('/api/proyectos/globales')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data.get('success'))
        proyectos = data.get('data', {}).get('proyectos', [])
        self.assertTrue(any(p.get('id') == global_id and p.get('thumbnail') for p in proyectos))

        # Replace elementos
        elementos = [
            {'tipo': 'texto', 'contenido': 'Hola', 'posicion_x': 0, 'posicion_y': 0, 'rotacion': 0, 'escala': 100, 'color': '#FFFFFF', 'tamano_fuente': 24}
        ]
        r = self.app.put(f'/api/proyectos/{pid}/elementos', json={'elementos': elementos}, headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(r.status_code, 200)

        r = self.app.get(f'/api/proyectos/{pid}/elementos', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(len(data.get('elementos', [])), 1)


if __name__ == '__main__':
    unittest.main()
