/**
 * inicio.js - Gestión completa de la página de inicio de L-FUTURE
 *
 * Este archivo maneja:
 * - Carga de proyectos del usuario desde la API
 * - Renderizado de galería de proyectos con preview
 * - Navegación a páginas de creación y edición
 * - Gestión de estado cuando no hay proyectos
 * - Interfaz de usuario responsive
 */

// ============================================================================
// CARGAR PROYECTOS PREVIEW (MÁXIMO 2 PROYECTOS RECIENTES)
// ============================================================================

/**
 * Carga y muestra una preview de los proyectos del usuario en la página de inicio
 * Solo muestra los 2 proyectos más recientes para mantener la interfaz limpia
 * Si no hay proyectos, muestra un mensaje motivacional con botón de creación
 */
async function cargarProyectosPreview() {
    // Obtener contenedor donde se mostrarán los proyectos
    const contenedor = document.querySelector('.galeria-scroll');
    if (!contenedor) return;

    // Limpiar contenido anterior
    contenedor.innerHTML = '';

    try {
        // Obtener proyectos del usuario desde la API
        const response = await getProyectos();
        let proyectos = [];

        // Extraer lista de proyectos de la respuesta
        if (response.success && response.data && response.data.success) {
            proyectos = response.data.proyectos || [];
        }

        // Si no hay proyectos, mostrar mensaje de bienvenida
        if (proyectos.length === 0) {
            // Sin proyectos: solo botón crear
            const div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.padding = '60px 20px';
            div.style.color = '#999';
            div.innerHTML = `
                <i class="fas fa-paint-brush" style="font-size: 64px; color: #FFD700; margin-bottom: 20px;"></i>
                <h3 style="color: #FFD700; margin-bottom: 10px;">¡Comienza a diseñar!</h3>
                <p>Aún no tienes proyectos guardados.</p>
                <button id="btn-crear-proyecto" style="margin-top: 24px; padding: 16px 32px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem; cursor: pointer;">
                    <i class="fas fa-pen-fancy"></i> Crear Nuevo Proyecto
                </button>
            `;
            contenedor.appendChild(div);
            document.getElementById('btn-crear-proyecto').onclick = () => {
                window.location.href = 'diseños-3d.html';
            };
            return;
        }

        // Renderizar proyectos del usuario (máximo 2 para preview)
        proyectos.forEach(proyecto => {
            const badge = proyecto.estado === 'Completado' ? 'badge-completado' : 'badge-progreso';
            const estadoTexto = proyecto.estado || 'En Progreso';
            const div = document.createElement('div');
            div.className = 'proyecto-scroll';
            div.innerHTML = `
                <div class="imagen-proyecto">
                    <img loading="lazy" src="${proyecto.imagen || 'https://placehold.co/300x400/1a1a1a/FFD700?text=Proyecto'}" alt="${proyecto.nombre}">
                    <div class="estado-proyecto-galeria">
                        <span class="badge ${badge}">${estadoTexto}</span>
                    </div>
                </div>
                <h4>${proyecto.nombre}</h4>
                <p class="descripcion-proyecto">${proyecto.descripcion || 'Sin descripción'}</p>
            `;
            div.style.cursor = 'pointer';
            div.onclick = () => {
                window.location.href = `diseños-3d.html?proyecto=${encodeURIComponent(proyecto.id)}`;
            };
            contenedor.appendChild(div);
        });

        // Botón grande para crear nuevo proyecto
        const btnCrear = document.createElement('div');
        btnCrear.className = 'proyecto-scroll';
        btnCrear.style.display = 'flex';
        btnCrear.style.alignItems = 'center';
        btnCrear.style.justifyContent = 'center';
        btnCrear.style.background = 'linear-gradient(90deg, #FFD700 60%, #DAA520 100%)';
        btnCrear.style.cursor = 'pointer';
        btnCrear.innerHTML = `<button style="font-size:1.2rem;padding:30px 40px;border-radius:12px;background:#FFD700;color:#222;font-weight:bold;border:none;box-shadow:0 2px 12px #FFD700;cursor:pointer;">+ CREAR NUEVO PROYECTO</button>`;
        btnCrear.onclick = () => {
            window.location.href = 'diseños-3d.html';
        };
        contenedor.appendChild(btnCrear);
    } catch (error) {
        contenedor.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Error al cargar proyectos.</p>';
    }
}

// ============================================================================
// BOTÓN VER TODOS LOS PROYECTOS
// ============================================================================




// Usa la función robusta de auth.js para actualizar nombre/iniciales
function actualizarNombreYAvatar() {
    if (typeof updateUserUI === 'function') {
        updateUserUI();
    } else {
        // Fallback mínimo
        const user = getUser && typeof getUser === 'function' ? getUser() : null;
        let nombre = user ? (user.nombre_completo || user.username || 'Usuario') : 'Usuario';
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = nombre;
        });
        // Actualizar nombre en el encabezado si existe
        const headerNameEl = document.querySelector('.encabezado-username');
        if (headerNameEl) headerNameEl.textContent = nombre;
        let iniciales = 'US';
        if (typeof getInitialsAvatar === 'function') {
            iniciales = getInitialsAvatar(nombre);
        } else {
            iniciales = nombre.trim().split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase();
        }
        document.querySelectorAll('.avatar-iniciales').forEach(el => {
            el.textContent = iniciales;
            el.setAttribute('aria-label', `Avatar de ${nombre}`);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    cargarProyectosPreview();
    actualizarNombreYAvatar();
    // Botón Ver Todos
    const btnVerTodos = document.querySelector('.btn-ver-todos');
    if (btnVerTodos) {
        btnVerTodos.addEventListener('click', function() {
            window.location.href = 'diseños1.0.html';
        });
    }
    // Botón Diseñar en 3D
    const btnDisenar = document.querySelectorAll('.btn-diseñar');
    btnDisenar.forEach(btn => {
        btn.addEventListener('click', function() {
            window.location.href = 'diseños-3d.html';
        });
    });
});
