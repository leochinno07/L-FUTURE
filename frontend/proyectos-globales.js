/**
 * proyectos-globales.js - Gestión de proyectos L-FUTURE (globales)
 * Incluye vista previa mejorada (Fase Fuego)
 */

let proyectosGlobales = [];

/**
 * Cargar proyectos globales
 */
async function cargarProyectosGlobales() {
    const contenedor = document.getElementById('galeria-proyectos-globales');
    const mensajeCargando = document.getElementById('mensaje-cargando-global');

    if (mensajeCargando) mensajeCargando.style.display = 'block';

    try {
        // Llamar al endpoint sin autenticación
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/proyectos/globales`);
        const resultado = await response.json();

        if (resultado.success) {
            // Limitar a los dos proyectos oficiales y añadir specs/precio
            proyectosGlobales = (resultado.data.proyectos || []).filter((p, i) => i < 2).map((p, idx) => ({
                ...p,
                especificaciones: idx === 0 ? [
                    'Diseño Oversize',
                    'Gramaje premium 250g',
                    '50% algodón / 50% poliéster',
                    'Tecnología Flex 24/1',
                    'Talla única (M-L-XL)'
                ] : [
                    'Edición Limitada',
                    'Estampado digital',
                    'Material ecológico',
                    'Incluye NFT de autenticidad',
                    'Talla única (M-L)'
                ],
                precio: idx === 0 ? '$29.99 USD' : '$49.99 USD'
            }));
            if (mensajeCargando) mensajeCargando.style.display = 'none';
            if (proyectosGlobales.length === 0) {
                mostrarMensajeVacioGlobal();
                return;
            }
            mostrarProyectosGlobales(proyectosGlobales);
        }
    } catch (error) {
        console.error('Error:', error);
        if (mensajeCargando) mensajeCargando.style.display = 'none';
    }
}

function mostrarProyectosGlobales(proyectos) {
    const contenedor = document.getElementById('galeria-proyectos-globales');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    proyectos.forEach(proyecto => {
        const card = crearTarjetaProyectoGlobal(proyecto);
        contenedor.appendChild(card);
    });
}

function crearTarjetaProyectoGlobal(proyecto) {
    const card = document.createElement('div');
    card.className = 'tarjeta-proyecto';
    card.dataset.estado = 'disponible';

        const idioma = window.LFUTURE_idioma || 'es';
        const fecha = new Date(proyecto.fecha_creacion).toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US');

    const thumbStyle = proyecto.thumbnail_url ? `background-image: url('${proyecto.thumbnail_url}'); background-size: cover; background-position: center;` : `background: ${proyecto.color_prenda};`;
    const thumbInner = proyecto.thumbnail_url ? '' : proyecto.nombre;
    card.innerHTML = `
            <div class="imagen-proyecto">
                <div style="width: 100%; height: 300px; ${thumbStyle} display: flex; align-items: center; justify-content: center; color: #FFD700; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                    ${thumbInner}
                </div>
                <div class="estado-proyecto disponible">
                    <i class="fas fa-star"></i> ${LFUTURE_getTraduccion(idioma, 'diseñoOficial')}
                </div>
            </div>
            <div class="contenido-proyecto">
                <h3 class="titulo-proyecto">${proyecto.nombre}</h3>
                <p class="descripcion-proyecto">${proyecto.descripcion || LFUTURE_getTraduccion(idioma, 'descripcionOficial')}</p>
                <ul class="especificaciones-lista">
                    ${proyecto.especificaciones.map(spec => `<li><i class='fas fa-check'></i> ${spec}</li>`).join('')}
                </ul>
                <div class="precio-proyecto" style="font-size:20px;color:#FFD700;font-weight:bold;margin:10px 0;">${proyecto.precio}</div>
                <div class="progreso-proyecto">
                    <div class="info-progreso">
                        <span>${LFUTURE_getTraduccion(idioma, 'lanzadoEl')} ${fecha}</span>
                        <span>100%</span>
                    </div>
                    <div class="barra-progreso">
                        <div class="progreso-llenado" style="width: 100%"></div>
                    </div>
                </div>
                <div class="acciones-proyecto">
                    <button class="btn btn-comprar" onclick="alert('${LFUTURE_getTraduccion(idioma, 'proximamenteCompra')}')">${LFUTURE_getTraduccion(idioma, 'comprarAhora')}</button>
                    <button class="btn btn-detalles" onclick="verDetallesGlobal(${proyecto.id})">${LFUTURE_getTraduccion(idioma, 'verDetalles')}</button>
                    <button class="btn btn-personalizar" onclick="personalizarProyectoGlobal(${proyecto.id}, '${proyecto.nombre}')" title="Crear una copia editable de este diseño">
                        <i class="fas fa-copy"></i> Personalizar
                    </button>
                </div>
            </div>
        `;

    return card;
}

async function verDetallesGlobal(proyectoId) {
    let idx = proyectosGlobales.findIndex(p => p.id === proyectoId);
    if (idx === -1) return;
    let proyecto = proyectosGlobales[idx];
    const modal = document.getElementById('modal-detalles');
    const contenidoModal = document.getElementById('contenido-modal');
    const previewTitle = document.getElementById('modal-preview-title');
    const previewImage = document.getElementById('modal-preview-image');
    const btnPrev = document.getElementById('btn-prev-proyecto');
    const btnNext = document.getElementById('btn-next-proyecto');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    let zoom = 1;
    if (!modal || !contenidoModal || !previewTitle || !previewImage) return;
    modal.style.display = 'flex';
    async function renderModal(idx) {
        proyecto = proyectosGlobales[idx];
        previewTitle.textContent = proyecto.nombre;
        // Imagen/diseño grande (simulación: color y nombre)
        const modalThumbStyle = proyecto.thumbnail_url ? `background-image: url('${proyecto.thumbnail_url}'); background-size: cover; background-position: center;` : `background: ${proyecto.color_prenda};`;
        const modalThumbInner = proyecto.thumbnail_url ? '' : proyecto.nombre;
        previewImage.innerHTML = `<div id="preview-img" style="width:${300*zoom}px;height:${300*zoom}px;${modalThumbStyle}display:flex;align-items:center;justify-content:center;color:#FFD700;font-size:${28*zoom}px;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.7);margin:auto;transition:all 0.2s;">${modalThumbInner}</div>`;
        contenidoModal.innerHTML = '<div class="spinner-loader"></div><p>Cargando detalles...</p>';
        try {
            const resElementos = await getElementos(proyecto.id);
            const elementos = resElementos.success ? resElementos.data.elementos : [];
            const elementosHtml = elementos.map(el => `
                <div class="elemento-item">
                    <i class="fas fa-${el.tipo === 'texto' ? 'font' : 'image'}"></i>
                    <span><strong>${el.tipo}:</strong> ${el.contenido}</span>
                    <div style="width: 20px; height: 20px; background-color: ${el.color}; border-radius: 50%; border: 1px solid #555;"></div>
                </div>
            `).join('');
            contenidoModal.innerHTML = `
                <h2>${proyecto.nombre}</h2>
                <p class="descripcion-modal">${proyecto.descripcion || 'Diseño oficial de L-FUTURE.'}</p>
                <ul class="especificaciones-lista">
                    ${proyecto.especificaciones.map(spec => `<li><i class='fas fa-check'></i> ${spec}</li>`).join('')}
                </ul>
                <div class="precio-proyecto" style="font-size:22px;color:#FFD700;font-weight:bold;margin:10px 0;">${proyecto.precio}</div>
                <div class="detalles-grid">
                    <div class="detalle-item">
                        <strong>Color de Prenda:</strong>
                        <span class="color-preview" style="background-color: ${proyecto.color_prenda};"></span>
                        ${proyecto.color_prenda}
                    </div>
                </div>
                <h3>Elementos del Diseño</h3>
                <div class="elementos-lista">
                    ${elementosHtml || '<p>Este diseño no tiene elementos detallados.</p>'}
                </div>
            `;
        } catch (error) {
            contenidoModal.innerHTML = '<p style="color: #ff6b6b;">Error al cargar los detalles del proyecto.</p>';
        }
    }
    // Navegación
    if (btnPrev) btnPrev.onclick = () => { if (idx > 0) { idx--; zoom=1; renderModal(idx); } };
    if (btnNext) btnNext.onclick = () => { if (idx < proyectosGlobales.length-1) { idx++; zoom=1; renderModal(idx); } };
    if (btnZoomIn) btnZoomIn.onclick = () => { zoom = Math.min(zoom+0.2,2); renderModal(idx); };
    if (btnZoomOut) btnZoomOut.onclick = () => { zoom = Math.max(zoom-0.2,0.5); renderModal(idx); };
    renderModal(idx);
}

/**
 * Duplica un proyecto global como una copia personal para el usuario.
 * @param {number} proyectoId - El ID del proyecto global a duplicar.
 * @param {string} nombreOriginal - El nombre original del proyecto.
 */
async function personalizarProyectoGlobal(proyectoId, nombreOriginal) {
    if (!confirm(`¿Quieres crear una copia editable de "${nombreOriginal}" en "Mis Proyectos"?`)) {
        return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Necesitas iniciar sesión para personalizar un proyecto.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/proyectos/${proyectoId}/duplicar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (resultado.success) {
            alert('¡Proyecto copiado a "Mis Proyectos" exitosamente! Serás redirigido para que puedas editarlo.');
            window.location.href = 'diseños1.0.html';
        }
    } catch (error) {
        console.error('Error al personalizar el proyecto:', error);
        alert('Hubo un error al intentar personalizar el proyecto. Por favor, inténtalo de nuevo.');
    }
}

function mostrarMensajeVacioGlobal() {
    const contenedor = document.getElementById('galeria-proyectos-globales');
    if (!contenedor) return;

        const idioma = window.LFUTURE_idioma || 'es';
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-star" style="font-size: 48px; color: #FFD700; margin-bottom: 15px;"></i>
                <h3 style="color: #FFD700;">${LFUTURE_getTraduccion(idioma, 'proximamente')}</h3>
                <p style="color: #888;">${LFUTURE_getTraduccion(idioma, 'nuevosOficialesPronto')}</p>
            </div>
        `;
}

/**
 * Verificar si el usuario es admin
 */
function esAdmin() {
    const user = getUser();
    return user && user.tipo_usuario === 'administrador';
}

/**
 * Mostrar panel de admin si es administrador
 */
function mostrarPanelAdmin() {
    if (!esAdmin()) return;

    const contenedor = document.querySelector('.contenido-principal');
    if (!contenedor) return;

    const panelAdmin = document.createElement('section');
    panelAdmin.innerHTML = `
        <div style="background: #2a2a2a; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #FFD700;">
            <h3 style="color: #FFD700; margin-bottom: 15px;">
                <i class="fas fa-crown"></i> Panel de Administrador
            </h3>
            <button onclick="abrirFormularioProyectoGlobal()" style="background: #FFD700; color: #000; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-plus"></i> Crear Proyecto Global
            </button>
        </div>
    `;

    contenedor.insertBefore(panelAdmin, contenedor.firstChild.nextSibling);
}

/**
 * Abrir formulario para crear proyecto global
 */
function abrirFormularioProyectoGlobal() {
    const nombre = prompt('Nombre del proyecto global:');
    if (!nombre) return;

    const descripcion = prompt('Descripción:');
    const color = prompt('Color de prenda (hexadecimal):', '#000000');

    crearProyectoGlobal(nombre, descripcion, color);
}

/**
 * Crear proyecto global (solo admin)
 */
async function crearProyectoGlobal(nombre, descripcion, color) {
    try {
        const API = (window.CONFIG && window.CONFIG.API_URL) ? window.CONFIG.API_URL : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : 'https://api.l-future.com/api');
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API}/proyectos`, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {}),
            body: JSON.stringify({ nombre, descripcion, color_prenda: color, talla: 'M', tipo: 'global' })
        });
        const resultado = await res.json();

        if (resultado.success) {
            alert('Proyecto global creado exitosamente');
            // Ofrecer al admin subir thumbnail inmediatamente
            try {
                const pid = resultado.proyecto_id || (resultado.data && resultado.data.proyecto_id);
                if (pid) promptToUploadThumbnail(pid);
            } catch(e){ /* ignore */ }
            cargarProyectosGlobales();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear proyecto global');
    }
}

/**
 * Prompt admin to choose an image file and upload it as project thumbnail
 */
function promptToUploadThumbnail(proyectoId){
    const token = localStorage.getItem('auth_token');
    if(!token) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e){
        const f = e.target.files[0];
        if(!f) return;
        const form = new FormData();
        form.append('thumbnail', f);
        const API = (window.CONFIG && window.CONFIG.API_URL) ? window.CONFIG.API_URL : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : 'https://api.l-future.com/api');
        try{
            const res = await fetch(`${API}/proyectos/${proyectoId}/thumbnail`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });
            const json = await res.json();
            if(json && json.success){
                (window.Toast && window.Toast.success) ? window.Toast.success('Thumbnail cargado') : console.log('Thumbnail cargado');
                cargarProyectosGlobales();
            } else {
                (window.Toast && window.Toast.error) ? window.Toast.error('No se pudo subir thumbnail') : console.error('No se pudo subir thumbnail');
            }
        }catch(err){
            console.error('Upload error', err);
            (window.Toast && window.Toast.error) ? window.Toast.error('Error subiendo thumbnail') : console.error('Error subiendo thumbnail');
        }
    };
    // Trigger file dialog
    input.click();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarProyectosGlobales();

    // Mostrar panel admin si corresponde
    setTimeout(() => {
        mostrarPanelAdmin();
    }, 500);
});
