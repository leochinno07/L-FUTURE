/**
 * temas.js - Sistema de Temas de Color
 * Optimización Básica #9
 */

const Temas = {
    actual: localStorage.getItem('tema') || 'oscuro',
    
    temas: {
        oscuro: {
            '--bg-principal': '#1a1a1a',
            '--bg-secundario': '#222',
            '--bg-tarjeta': '#252525',
            '--color-texto': '#e0e0e0',
            '--color-texto-secundario': '#999',
            '--color-acento': '#FFD700',
            '--color-borde': '#333',
            '--bg-sidebar': '#1f1f1f'
        },
        claro: {
            '--bg-principal': '#f5f5f5',
            '--bg-secundario': '#ffffff',
            '--bg-tarjeta': '#fff',
            '--color-texto': '#1a1a1a',
            '--color-texto-secundario': '#666',
            '--color-acento': '#FFD700',
            '--color-borde': '#ddd',
            '--bg-sidebar': '#fafafa'
        },
        azul: {
            '--bg-principal': '#0a1929',
            '--bg-secundario': '#132f4c',
            '--bg-tarjeta': '#1e3a5f',
            '--color-texto': '#e3f2fd',
            '--color-texto-secundario': '#90caf9',
            '--color-acento': '#64b5f6',
            '--color-borde': '#1976d2',
            '--bg-sidebar': '#001e3c'
        },
        verde: {
            '--bg-principal': '#1a2e1a',
            '--bg-secundario': '#2d4a2d',
            '--bg-tarjeta': '#3d5a3d',
            '--color-texto': '#e8f5e9',
            '--color-texto-secundario': '#81c784',
            '--color-acento': '#66bb6a',
            '--color-borde': '#388e3c',
            '--bg-sidebar': '#0d1f0d'
        }
    },
    
    aplicar(nombreTema) {
        const tema = this.temas[nombreTema];
        if (!tema) return;
        
        const root = document.documentElement;
        Object.entries(tema).forEach(([propiedad, valor]) => {
            root.style.setProperty(propiedad, valor);
        });
        
        this.actual = nombreTema;
        localStorage.setItem('tema', nombreTema);
        
        // Actualizar selector si existe
        const selector = document.getElementById('selectorTema');
        if (selector) {
            selector.value = nombreTema;
        }
        
        Toast.success(`Tema ${nombreTema} aplicado`);
    },
    
    toggle() {
        const temas = Object.keys(this.temas);
        const indiceActual = temas.indexOf(this.actual);
        const siguienteIndice = (indiceActual + 1) % temas.length;
        this.aplicar(temas[siguienteIndice]);
    },
    
    init() {
        // Aplicar tema guardado
        this.aplicar(this.actual);
        
        // Configurar selector si existe
        const selector = document.getElementById('selectorTema');
        if (selector) {
            selector.value = this.actual;
            selector.addEventListener('change', (e) => {
                this.aplicar(e.target.value);
            });
        }
        
        // Atajo: Ctrl+T para cambiar tema
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    Temas.init();
});
