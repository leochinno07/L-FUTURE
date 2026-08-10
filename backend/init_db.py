"""
Script para inicializar la base de datos de L-FUTURE
Ejecuta este archivo para crear todas las tablas necesarias
"""

from database import Database

def main():
    print("=" * 60)
    print(">>> INICIALIZANDO BASE DE DATOS L-FUTURE <<<")
    print("=" * 60)
    print()
    
    # Crear instancia de la base de datos
    db = Database('lfuture.db')
    
    # Conectar a la base de datos
    if not db.connect():
        print("[ERROR] No se pudo conectar a la base de datos. Abortando...")
        return
    
    print()
    print("Creando tablas...")
    print("-" * 60)
    
    # Crear todas las tablas
    if db.create_tables():
        print()
        print("=" * 60)
        print("[OK] BASE DE DATOS INICIALIZADA CORRECTAMENTE")
        print("=" * 60)
        print()
        print("Tablas creadas:")
        print("   1. usuarios - Para gestionar cuentas de usuario")
        print("   2. proyectos - Para almacenar disenos de prendas")
        print("   3. elementos_diseno - Para elementos graficos de cada proyecto")
        print("   4. sesiones - Para control de autenticacion")
        print()
        print("La base de datos esta lista para usar en:")
        print("   Archivo: " + db.db_path)
        print()
    else:
        print()
        print("=" * 60)
        print("[ERROR] HUBO ERRORES AL CREAR LAS TABLAS")
        print("=" * 60)
    
    # Cerrar conexion
    db.close()
    print()
    print("Proceso completado")
    print()

if __name__ == "__main__":
    main()
