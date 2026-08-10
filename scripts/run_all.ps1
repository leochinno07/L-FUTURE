<#
run_all.ps1 - Script de configuración completa para L-FUTURE

Script único de entrada que crea/actualiza el entorno virtual, instala dependencias
de Python (si existe `backend\requirements.txt`), ejecuta `backend/init_db.py`
si está presente, e inicia el backend Flask.

Uso (PowerShell):
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\scripts\run_all.ps1

Este script automatiza todo el proceso de configuración para desarrollo local.
#>

$ErrorActionPreference = 'Stop'

# Cambiar al directorio raíz del repositorio (padre del directorio del script)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location (Join-Path $ScriptDir '..')

Write-Host 'Iniciando configuración: asegurar venv, instalar dependencias, inicializar BD (si existe)'

# Verificar que Python esté instalado y disponible en PATH
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error 'Python no está instalado o no está en PATH.'
    exit 1
}

# Obtener ruta del directorio raíz del proyecto
$Root = Get-Location
$venvPath = Join-Path $Root '.venv'

# Crear entorno virtual si no existe
if (-not (Test-Path $venvPath)) {
    Write-Host "Creando entorno virtual en: $venvPath"
    python -m venv $venvPath
} else {
    Write-Host "Entorno virtual ya existe: $venvPath"
}

# Verificar que el ejecutable de Python existe en el venv
$pythonExe = Join-Path $venvPath 'Scripts\python.exe'
if (-not (Test-Path $pythonExe)) {
    Write-Error "Ejecutable de Python no encontrado en venv: $pythonExe"
    exit 1
}

# Actualizar pip y herramientas básicas
Write-Host 'Actualizando pip e instalando wheel/setuptools...'
& $pythonExe -m pip install --upgrade pip setuptools wheel

# Instalar dependencias desde requirements.txt si existe
$reqFile = Join-Path $Root 'backend\requirements.txt'
if (Test-Path $reqFile) {
    Write-Host "Instalando dependencias Python desde: $reqFile"
    & $pythonExe -m pip install -r $reqFile
} else {
    Write-Host "Archivo de requirements no encontrado; omitiendo instalación de pip."
}

# Ejecutar inicializador de base de datos si existe
$initDb = Join-Path $Root 'backend\init_db.py'
if (Test-Path $initDb) {
    Write-Host 'Ejecutando inicializador de base de datos: backend/init_db.py'
    & $pythonExe $initDb
} else {
    Write-Host 'Inicializador de base de datos no encontrado; omitiendo.'
}

# Iniciar el backend (bloqueante) - ver logs abajo
Write-Host 'Iniciando backend (bloqueante) — ver logs abajo'
& $pythonExe backend/server_simple.py
