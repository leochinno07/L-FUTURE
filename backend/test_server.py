import os
import unittest
import tempfile
import json

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
