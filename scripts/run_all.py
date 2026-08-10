#!/usr/bin/env python3
"""
run_all.py - Lanzador completo para configuración de L-FUTURE

Lanzador que realiza las mismas acciones que `scripts/run_all.ps1` pero usando Python.
Esto evita problemas de ExecutionPolicy de PowerShell y puede ejecutarse con el Python del sistema.

Uso:
  python scripts/run_all.py

Realizará:
 - Crear un entorno virtual en .venv si no existe
 - Instalar dependencias pip desde backend/requirements.txt si está presente
 - Ejecutar backend/init_db.py si está presente
 - Iniciar backend/server_simple.py usando el python del venv (bloqueante)

Ejecutar desde la raíz del repositorio.
"""
from __future__ import annotations
import os
import sys
import subprocess
from pathlib import Path

# Definir rutas importantes del proyecto
ROOT = Path.cwd()  # Directorio raíz del proyecto
VENV_DIR = ROOT / '.venv'  # Directorio del entorno virtual
BACKEND = ROOT / 'backend'  # Directorio del backend
REQUIREMENTS = BACKEND / 'requirements.txt'  # Archivo de dependencias
INIT_DB = BACKEND / 'init_db.py'  # Script de inicialización de BD
SERVER = BACKEND / 'server_simple.py'  # Servidor principal

def run(cmd, check=True, **kwargs):
    """
    Ejecuta un comando y muestra su salida.
    Args:
        cmd: Lista de argumentos del comando
        check: Si debe lanzar excepción en caso de error
        **kwargs: Argumentos adicionales para subprocess.run
    """
    print('>', ' '.join(map(str, cmd)))
    return subprocess.run(list(map(str, cmd)), check=check, **kwargs)

def ensure_venv():
    """Asegura que existe un entorno virtual en .venv"""
    if not VENV_DIR.exists():
        print('Creando entorno virtual en', VENV_DIR)
        run([sys.executable, '-m', 'venv', str(VENV_DIR)])
    else:
        print('Entorno virtual existe:', VENV_DIR)

def venv_python() -> Path:
    """
    Retorna la ruta al ejecutable de Python del entorno virtual
    Maneja tanto Windows como sistemas Unix-like
    """
    if os.name == 'nt':
        return VENV_DIR / 'Scripts' / 'python.exe'
    else:
        return VENV_DIR / 'bin' / 'python'

def install_requirements(pyexe: Path):
    """Instala las dependencias desde requirements.txt usando el Python del venv"""
    if REQUIREMENTS.exists():
        print('Instalando dependencias desde', REQUIREMENTS)
        run([str(pyexe), '-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'])
        run([str(pyexe), '-m', 'pip', 'install', '-r', str(REQUIREMENTS)])
    else:
        print('No se encontró requirements.txt, omitiendo instalación de pip')

def init_db(pyexe: Path):
    """Inicializa la base de datos ejecutando init_db.py"""
    if INIT_DB.exists():
        print('Ejecutando init_db.py')
        run([str(pyexe), str(INIT_DB)])
    else:
        print('No se encontró init_db.py; omitiendo inicialización de BD')

def start_server(pyexe: Path):
    """Inicia el servidor backend usando el Python del entorno virtual"""
    if not SERVER.exists():
        print('Error: server_simple.py no encontrado en', SERVER)
        sys.exit(1)
    print('Iniciando backend (bloqueante). Presiona Ctrl+C para detener.')
    run([str(pyexe), str(SERVER)])

def main():
    """Función principal que ejecuta todo el proceso de configuración"""
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('SECRET_KEY', 'lfuture-dev-secret-key')
    os.environ.setdefault('JWT_SECRET_KEY', 'lfuture-dev-jwt-secret-key')
    os.environ.setdefault('FORCE_HTTPS', 'false')
    os.environ.setdefault('ALLOWED_ORIGINS', '*')
    os.environ.setdefault('PORT', '5000')
    os.environ.setdefault('HOST', '127.0.0.1')

    ensure_venv()  # Asegurar que existe el entorno virtual
    pyexe = venv_python()  # Obtener ruta al Python del venv

    # Verificar que el ejecutable de Python existe
    if not pyexe.exists():
        print('Ejecutable de Python esperado en venv no encontrado en', pyexe)
        sys.exit(1)

    # Ejecutar pasos de configuración en orden
    install_requirements(pyexe)  # Instalar dependencias
    init_db(pyexe)  # Inicializar base de datos
    start_server(pyexe)  # Iniciar servidor

if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as e:
        print('Comando falló:', e)
        sys.exit(e.returncode)