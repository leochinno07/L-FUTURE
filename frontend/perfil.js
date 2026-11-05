/**
 * perfil.js - Gestión del perfil de usuario
 * Carga datos, actualiza información y cambia contraseña
 */

// ============================================================================
// CARGA DE DATOS DEL USUARIO
// ============================================================================

async function cargarDatosUsuario() {
    let user = getUser();
    try {
        const response = await fetch(`${window.API_V1_URL || (location.origin + '/api/v1')}/users/profile`, {
            headers: getAuthHeaders(),
            credentials: 'same-origin'
        });
        if (response.ok) {
            user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
            window.LFUTURE?.updateUserUI?.();
        }
    } catch (error) {
        console.warn('Se mostrarán los datos de perfil guardados localmente:', error);
    }
    
    if (user) {
        // Actualizar campos del perfil
        document.getElementById('nombre-completo-value').textContent = user.nombre_completo || user.username;
        document.getElementById('username-value').textContent = user.username;
        document.getElementById('tipo-usuario-value').textContent = user.tipo_usuario || 'Usuario';
        // Avatar lazy loading y fallback
        const avatarImg = document.querySelectorAll('.user-avatar');
        avatarImg.forEach(img => {
            img.setAttribute('loading', 'lazy');
            img.src = user.foto_perfil || user.avatar_url || '';
            img.onerror = function() {
                img.style.display = 'none';
                const initials = document.getElementById('avatar-user');
                if (initials) initials.style.display = 'flex';
            };
        });
        // Pre-llenar formulario de edición
        if (document.getElementById('edit-nombre-completo')) {
            document.getElementById('edit-nombre-completo').value = user.nombre_completo || '';
        }
    }
}

// ============================================================================
// CAMBIAR CONTRASEÑA
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Spinner helpers
    function showSpinner() {
        const spinner = document.getElementById('spinner-overlay');
        if (spinner) spinner.style.display = 'flex';
    }
    function hideSpinner() {
        const spinner = document.getElementById('spinner-overlay');
        if (spinner) spinner.style.display = 'none';
    }
    // Toast helpers (assume Toast global from toast.js)
    window.Toast = window.Toast || {
        success: msg => iziToast.success({ message: msg, position: 'topRight', timeout: 3000 }),
        error: msg => iziToast.error({ message: msg, position: 'topRight', timeout: 4000 }),
        info: msg => iziToast.info({ message: msg, position: 'topRight', timeout: 2500 })
    };
    // Inicializar selector de tema con tooltip
    if (window.Temas && Temas.init) {
        Temas.init();
        const selectorTema = document.getElementById('selectorTema');
        if (selectorTema) {
            selectorTema.value = Temas.actual;
            selectorTema.setAttribute('title', 'Selecciona el tema de color');
            selectorTema.addEventListener('change', function(e) {
                Temas.aplicar(e.target.value);
            });
        }
    }
    // Tooltips para botones principales
    document.querySelectorAll('button, select, input').forEach(el => {
        if (el.title) return;
        if (el.classList.contains('btn-guardar')) el.setAttribute('title', 'Guardar cambios');
        if (el.classList.contains('btn-cancelar')) el.setAttribute('title', 'Cancelar edición');
        if (el.classList.contains('btn-editar-perfil')) el.setAttribute('title', 'Editar tu nombre de usuario');
        if (el.classList.contains('btn-signout')) el.setAttribute('title', 'Cerrar sesión');
    });
    const formPassword = document.getElementById('formCambiarPassword');
    if (formPassword) {
        formPassword.addEventListener('submit', async function(e) {
            e.preventDefault();
            const passwordActual = document.getElementById('passwordActual').value;
            const passwordNueva = document.getElementById('passwordNueva').value;
            const passwordConfirmar = document.getElementById('passwordConfirmar').value;
            // Validar que las contraseñas nuevas coincidan
            if (passwordNueva !== passwordConfirmar) {
                Toast.error('Las contraseñas nuevas no coinciden');
                return;
            }
            // Validar longitud mínima
            if (passwordNueva.length < 8) {
                Toast.error('La contraseña debe tener al menos 8 caracteres');
                return;
            }
            showSpinner();
            try {
                const token = getToken();
                const API_URL = window.API_V1_URL || (location.origin + '/api/v1');
                const response = await fetch(`${API_URL}/users/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        password_actual: passwordActual,
                        password_nueva: passwordNueva
                    })
                });
                const data = await response.json();
                if (data.success) {
                    Toast.success('Contraseña actualizada exitosamente');
                    formPassword.reset();
                } else {
                    Toast.error(data.message || 'Error al cambiar contraseña');
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Error de conexión al cambiar contraseña');
            }
            hideSpinner();
        });
    }

    // Traducción centralizada usando idiomas.js
    function traducirInterfaz(idioma) {
        function setTextById(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
        function setTextBySelector(sel, txt) { const el = document.querySelector(sel); if (el) el.textContent = txt; }
        setTextById('tituloPerfil', LFUTURE_getTraduccion(idioma, 'tituloPerfil'));
        setTextById('btnGuardarPerfil', LFUTURE_getTraduccion(idioma, 'guardar'));
        setTextById('btnCancelarPerfil', LFUTURE_getTraduccion(idioma, 'cancelar'));
        setTextById('tituloModalConfig', LFUTURE_getTraduccion(idioma, 'config'));
        setTextBySelector('label[for="configIdioma"]', LFUTURE_getTraduccion(idioma, 'idioma'));
        setTextBySelector('label[for="configTema"]', LFUTURE_getTraduccion(idioma, 'temaLabel'));
        // ...otros textos clave...
    }

    const btnEditarPerfil = document.getElementById('btnEditarPerfil');
    const modalEditar = document.getElementById('modalEditarPerfil');
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const formEditarPerfil = document.getElementById('formEditarPerfil');

    if (btnEditarPerfil && modalEditar) {
        btnEditarPerfil.addEventListener('click', function() {
            modalEditar.style.display = 'flex';
        });
    }

    if (btnCancelarEditar && modalEditar) {
        btnCancelarEditar.addEventListener('click', function() {
            modalEditar.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera
    if (modalEditar) {
        modalEditar.addEventListener('click', function(e) {
            if (e.target === modalEditar) {
                modalEditar.style.display = 'none';
            }
        });
    }

    // Guardar cambios de perfil
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nuevoNombre = document.getElementById('edit-nombre-completo').value.trim();
            if (!nuevoNombre) {
                Toast.error('El nombre no puede estar vacío');
                return;
            }
            showSpinner();
            try {
                const token = getToken();
                const API_URL = window.API_V1_URL || (location.origin + '/api/v1');
                const response = await fetch(`${API_URL}/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nombre_completo: nuevoNombre
                    })
                });
                const data = await response.json();
                if (response.ok && data.id) {
                    // Actualizar nombre globalmente
                    updateUserNameGlobal(nuevoNombre);
                    localStorage.setItem('user', JSON.stringify(data));
                    // Actualizar en la vista
                    document.getElementById('nombre-completo-value').textContent = nuevoNombre;
                    Toast.success('Perfil actualizado exitosamente');
                    modalEditar.style.display = 'none';
                } else {
                    Toast.error(data.message || 'Error al actualizar perfil');
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Error de conexión al actualizar perfil');
            }
            hideSpinner();
        });
    }

    // Cargar datos iniciales
    cargarDatosUsuario();
});
