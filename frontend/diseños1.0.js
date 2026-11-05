// --- Exportar Proyecto (PNG/JSON) ---
function exportarProyecto(proyectoId, tipo) {
    const proyecto = todosLosProyectos.find(p => p.id === proyectoId);
    if (!proyecto) return Toast.error('Proyecto no encontrado');
    if (tipo === 'json') {
        const dataStr = JSON.stringify(proyecto, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyecto_${proyecto.nombre}.json`;
        a.click();
        Toast.success('Proyecto exportado como JSON');
    } else if (tipo === 'png') {
        // Simulación: exporta la tarjeta como imagen
        const card = document.querySelector(`[data-proyecto-id='${proyectoId}']`);
        if (!card) return Toast.error('No se encontró la tarjeta');
        html2canvas(card).then(canvas => {
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `proyecto_${proyecto.nombre}.png`;
            a.click();
            Toast.success('Proyecto exportado como PNG');
        });
    }
};

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let todosLosProyectos = [];
let proyectosFiltrados = [];
let paginaActual = 1;

const filtros = {
    termino: '',
    estado: 'todos',
    tag: 'todos',
    orden: 'fecha_modificacion-desc'
};

const proyectosPorPagina = 10;
let todasLasEtiquetas = new Set();
let ordenActual = 'fecha-desc';

// Helper seguro para obtener elementos del DOM
function getEl(id) {
    return document.getElementById(id) || null;
}

// ============================================================================
// #6 INDICADORES DE CARGA
// ============================================================================

function mostrarCargando() {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (contenedor) {
        let skeletonHTML = '';
        for (let i = 0; i < proyectosPorPagina; i++) {
            skeletonHTML += `
                <div class="tarjeta-proyecto-skeleton">
                    <div class="skeleton-img"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>`;
        }
        contenedor.innerHTML = skeletonHTML;
    }
}

// ============================================================================
// #1 SISTEMA DE BÚSQUEDA
// ============================================================================

// Debounce para búsqueda
let debounceTimeout;
document.addEventListener('DOMContentLoaded', function() {

    // --- Load/apply user config on page load ---
    const userConfig = JSON.parse(localStorage.getItem('user_config') || '{}');
    if (userConfig.tema) {
        Temas?.aplicar(userConfig.tema);
        const selectorTema = document.getElementById('selectorTema');
        if (selectorTema) selectorTema.value = userConfig.tema;
    }
    if (userConfig.idioma) {
        // For demo: show toast, in real app switch language
        Toast.info('Idioma preferido: ' + userConfig.idioma);
        const configIdioma = document.getElementById('configIdioma');
        if (configIdioma) configIdioma.value = userConfig.idioma;
    }
    // --- Tag management UI logic ---
    const editTagsInput = document.getElementById('editTagsProyecto');
    const tagsListDiv = document.getElementById('tagsList');
    const btnAddTag = document.getElementById('btnAddTag');
    function renderTagsList() {
        if (!tagsListDiv || !editTagsInput) return;
        tagsListDiv.innerHTML = '';
        const tags = editTagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-proyecto tag-edit';
            span.textContent = tag;
            span.title = 'Haz clic para eliminar';
            span.style = 'background:#FFD700;color:#222;padding:4px 10px;border-radius:12px;cursor:pointer;font-weight:bold;margin-bottom:4px;';
            span.onclick = function() {
                const newTags = tags.filter(t => t !== tag);
                editTagsInput.value = newTags.join(', ');
                renderTagsList();
                Toast.info('Etiqueta eliminada: ' + tag);
            };
            tagsListDiv.appendChild(span);
        });
        if (tags.length === 0) {
            tagsListDiv.innerHTML = '<span style="color:#999;font-size:13px;">Sin etiquetas</span>';
        }
    }
    if (editTagsInput) {
        editTagsInput.addEventListener('input', renderTagsList);
    }
    if (btnAddTag) {
        btnAddTag.onclick = function() {
            if (!editTagsInput) return;
            let val = editTagsInput.value;
            const newTag = prompt('Nueva etiqueta:');
            if (newTag && newTag.trim()) {
                const tags = val.split(',').map(t => t.trim()).filter(t => t);
                if (!tags.includes(newTag.trim())) {
                    tags.push(newTag.trim());
                    editTagsInput.value = tags.join(', ');
                    renderTagsList();
                    Toast.success('Etiqueta agregada: ' + newTag.trim());
                } else {
                    Toast.info('La etiqueta ya existe.');
                }
            }
        };
    }
    renderTagsList();
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.setAttribute('title', 'Buscar proyectos por nombre o descripción');
        inputBusqueda.addEventListener('input', function(e) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                filtros.termino = e.target.value;
                renderizarProyectos();
            }, 350);
        });
    }

    // Tooltips para controles
    document.getElementById('selectEstado')?.setAttribute('title', 'Filtrar por estado del proyecto');
    document.getElementById('selectTag')?.setAttribute('title', 'Filtrar por etiqueta');
    document.getElementById('selectOrdenar')?.setAttribute('title', 'Ordenar proyectos');
    document.getElementById('btnRefrescar')?.setAttribute('title', 'Recargar proyectos (R)');
    document.getElementById('btnNuevoProyecto')?.setAttribute('title', 'Crear nuevo proyecto (Ctrl+N)');
});

// ============================================================================
// #2 PAGINACIÓN
// ============================================================================

function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(proyectosFiltrados.length / proyectosPorPagina);

    if (direccion === 'anterior' && paginaActual > 1) {
        paginaActual--;
    } else if (direccion === 'siguiente' && paginaActual < totalPaginas) {
        paginaActual++;
    }

    renderizarProyectos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irAPagina(pagina) {
    const totalPaginas = Math.ceil(proyectosFiltrados.length / proyectosPorPagina);
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActual = pagina;
        renderizarProyectos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderizarPaginacion() {
    const totalPaginas = Math.ceil(proyectosFiltrados.length / proyectosPorPagina);
    const contenedorPaginacion = document.getElementById('paginacion');

    if (!contenedorPaginacion || totalPaginas <= 1) {
        if (contenedorPaginacion) contenedorPaginacion.innerHTML = '';
        return;
    }

    let html = '<div class="controles-paginacion">';

    // Botón anterior
    const idioma = (JSON.parse(localStorage.getItem('user_config')||'{}').idioma)||'es';
    html += `<button onclick="cambiarPagina('anterior')" class="btn-paginacion" ${paginaActual === 1 ? 'disabled' : ''} title="${LFUTURE_getTraduccion(idioma,'paginaAnterior')}">
        <i class="fas fa-chevron-left"></i> ${LFUTURE_getTraduccion(idioma,'anterior')}
    </button>`;

    // Números de página
    html += '<div class="numeros-pagina">';

    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
            html += `<button onclick="irAPagina(${i})" class="btn-numero-pagina ${i === paginaActual ? 'activo' : ''}" title="${LFUTURE_getTraduccion(idioma,'irAPagina')} ${i}">${i}</button>`;
        } else if (i === paginaActual - 2 || i === paginaActual + 2) {
            html += '<span class="puntos-paginacion">...</span>';
        }
    }

    html += '</div>';

    // Botón siguiente
    html += `<button onclick="cambiarPagina('siguiente')" class="btn-paginacion" ${paginaActual === totalPaginas ? 'disabled' : ''} title="${LFUTURE_getTraduccion(idioma,'paginaSiguiente')}">
        ${LFUTURE_getTraduccion(idioma,'siguiente')} <i class="fas fa-chevron-right"></i>
    </button>`;

    html += `<span class="info-paginacion">${LFUTURE_getTraduccion(idioma,'pagina')} ${paginaActual} ${LFUTURE_getTraduccion(idioma,'de')} ${totalPaginas}</span>`;
    html += '</div>';

    contenedorPaginacion.innerHTML = html;
}

// ============================================================================
// CARGAR PROYECTOS DESDE API
// ============================================================================

async function cargarTodosLosProyectos() {
    const contenedorProyectos = document.getElementById('contenedor-proyectos');

    if (!contenedorProyectos) return;

    mostrarCargando();

    const [sortBy, sortOrder] = filtros.orden.split('-');

    try {
        const response = await getProyectos(sortBy, sortOrder);

        if (response.success && response.data.success) {
            todosLosProyectos = response.data.proyectos || [];
            actualizarListaDeTags();

            if (todosLosProyectos.length === 0) {
                mostrarMensajeSinProyectos(contenedorProyectos);
            } else {
                renderizarVista(); // Usar la nueva función centralizada
                Toast.success(`${todosLosProyectos.length} proyecto${todosLosProyectos.length !== 1 ? 's' : ''} cargado${todosLosProyectos.length !== 1 ? 's' : ''}`);
            }

            actualizarContador();
        } else {
            mostrarMensajeSinProyectos(contenedorProyectos);
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        Toast.error('Error al cargar proyectos. Verifica tu conexión.');
        contenedorProyectos.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff6b6b;"><i class="fas fa-exclamation-circle" style="font-size: 48px;"></i><p style="margin-top: 20px;">Error al cargar proyectos</p></div>';
    }
}

function actualizarListaDeTags() {
    todasLasEtiquetas.clear();
    todosLosProyectos.forEach(proyecto => {
        if (proyecto.tags) {
            proyecto.tags.split(',').forEach(tag => {
                if (tag.trim()) todasLasEtiquetas.add(tag.trim());
            });
        }
    });

    const selectTag = document.getElementById('selectTag');
    if (selectTag) {
        // Guardar la opción "Todas" y limpiar
        const primeraOpcion = selectTag.options[0];
        selectTag.innerHTML = '';
        selectTag.appendChild(primeraOpcion);
        todasLasEtiquetas.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            selectTag.appendChild(option);
        });
    }
}
// ============================================================================
// RENDERIZAR PROYECTOS CON PAGINACIÓN
// ============================================================================

/**
 * Aplica todos los filtros y ordenamientos, y renderiza el resultado.
 * Esta función centraliza la lógica de renderizado.
 */
function renderizarVista() {
    let resultado = [...todosLosProyectos];

    // 1. Filtrar por término de búsqueda
    if (filtros.termino) {
        const terminoLower = filtros.termino.toLowerCase();
        resultado = resultado.filter(p =>
            (p.nombre || '').toLowerCase().includes(terminoLower) ||
            (p.descripcion || '').toLowerCase().includes(terminoLower)
        );
    }

    // 2. Filtrar por estado
    if (filtros.estado !== 'todos') {
        resultado = resultado.filter(p => p.estado === filtros.estado);
    }

    // 3. Filtrar por tag
    if (filtros.tag !== 'todos') {
        resultado = resultado.filter(p => (p.tags || '').split(',').map(t => t.trim()).includes(filtros.tag));
    }

    proyectosFiltrados = resultado;
    paginaActual = 1;
    renderizarProyectos();
}

function renderizarProyectos() {
    const contenedor = document.getElementById('contenedor-proyectos');

    if (!contenedor) return;

    // Calcular índices de paginación
    const inicio = (paginaActual - 1) * proyectosPorPagina;
    const fin = inicio + proyectosPorPagina;
    const proyectosPagina = proyectosFiltrados.slice(inicio, fin);

    contenedor.innerHTML = '';

    if (proyectosPagina.length === 0) {
        const idioma = (JSON.parse(localStorage.getItem('user_config')||'{}').idioma)||'es';
        contenedor.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: #999;"><i class="fas fa-search" style="font-size: 48px; color: #FFD700; opacity: 0.5;"></i><p style="margin-top: 20px;">${LFUTURE_getTraduccion(idioma,'noProyectos')}</p></div>`;
        renderizarPaginacion();
        return;
    }

    proyectosPagina.forEach(proyecto => {
        const div = document.createElement('div');
        div.className = 'tarjeta-proyecto';
        div.setAttribute('data-proyecto-id', proyecto.id);
        div.innerHTML = crearTarjetaProyectoHTML(proyecto);

        contenedor.appendChild(div);
    });

    renderizarPaginacion();
    actualizarContador();
}

/**
 * Genera el HTML para una única tarjeta de proyecto.
 * @param {object} proyecto - El objeto del proyecto.
 * @returns {string} - El string HTML de la tarjeta.
 */
function crearTarjetaProyectoHTML(proyecto) {
    const idioma = (JSON.parse(localStorage.getItem('user_config') || '{}').idioma) || 'es';
    const badge = proyecto.estado === 'completado' ? 'badge-completado' : 'badge-progreso';
    const estadoTexto = proyecto.estado === 'completado' ? 'Completado' : 'En Progreso';
    const colorPrenda = proyecto.color_prenda || '#1a1a1a';
    const fecha = new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const tagsHtml = (proyecto.tags || '')
        .split(',')
        .filter(tag => tag.trim() !== '')
        .map(tag => `<span class="tag-proyecto">${tag.trim()}</span>`)
        .join('');

    const imgHtml = proyecto.thumbnail_url ? `<img src="${proyecto.thumbnail_url}" alt="${escapeHtml(proyecto.nombre)}" style="display:block;width:100%;height:300px;object-fit:cover;border-radius:6px;" />` : `<svg viewBox="0 0 200 220" width="100%" height="300" preserveAspectRatio="xMidYMid meet" style="display:block;">
                <path d="M30 40 C30 20, 70 20, 75 40 L85 40 C90 20, 130 20, 130 40 L170 40 C170 80, 160 80, 150 100 L150 170 C150 190, 120 200, 100 200 C80 200, 50 190, 50 170 L50 100 C40 80, 30 80, 30 40 Z"
                      fill="${colorPrenda}" stroke="#222" stroke-width="2" rx="6" />
                <text x="50%" y="62%" text-anchor="middle" fill="#FFD700" font-size="14" font-weight="700" style="pointer-events:none;">${escapeHtml(proyecto.nombre)}</text>
            </svg>`;

    return `
        <div class="imagen-proyecto" role="button" tabindex="0" aria-label="Vista previa de ${proyecto.nombre}" onclick="abrirVistaPrevia(${proyecto.id}, ${JSON.stringify(proyecto.nombre)}, '${colorPrenda}')">
            ${imgHtml}
            <div class="estado-badge" aria-hidden="true">
                <span class="badge ${badge}">${estadoTexto}</span>
            </div>
        </div>
        <div class="contenido-proyecto">
            <h3>${proyecto.nombre}</h3>
            <p class="descripcion">${proyecto.descripcion || LFUTURE_getTraduccion(idioma, 'sinDescripcion')}</p>
            <div class="info-adicional">
                <span title="Fecha de creación"><i class="fas fa-calendar"></i> ${fecha}</span>
                <span title="Talla de la prenda"><i class="fas fa-tshirt"></i> ${proyecto.talla || LFUTURE_getTraduccion(idioma, 'na')}</span>
                <span title="Color de la prenda" style="display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-palette"></i>
                    <div style="width: 20px; height: 20px; background: ${colorPrenda}; border-radius: 50%; border: 2px solid #666;"></div>
                </span>
            </div>
            <div class="tags-container">
                ${tagsHtml || `<span class="no-tags">${LFUTURE_getTraduccion(idioma, 'sinEtiquetas')}</span>`}
            </div>
            <div class="acciones-proyecto">
                <button class="btn-accion btn-editar" onclick="abrirModalEditar(${proyecto.id})" title="${LFUTURE_getTraduccion(idioma, 'editarNombreEtiquetas')}"><i class="fas fa-edit"></i> ${LFUTURE_getTraduccion(idioma, 'editar')}</button>
                <button class="btn-accion btn-abrir" onclick="abrirEnDisenador(${proyecto.id})" title="${LFUTURE_getTraduccion(idioma, 'abrirEnDisenador')}"><i class="fas fa-paint-brush"></i> ${LFUTURE_getTraduccion(idioma, 'abrir')}</button>
                <button class="btn-accion btn-exportar" onclick="exportarProyecto(${proyecto.id}, 'png')" title="${LFUTURE_getTraduccion(idioma, 'exportarPNG')}"><i class="fas fa-file-image"></i> PNG</button>
                <button class="btn-accion btn-exportar" onclick="exportarProyecto(${proyecto.id}, 'json')" title="${LFUTURE_getTraduccion(idioma, 'exportarJSON')}"><i class="fas fa-file-code"></i> JSON</button>
                <button class="btn-accion btn-duplicar" onclick="duplicarProyecto(${proyecto.id})" title="${LFUTURE_getTraduccion(idioma, 'duplicarProyecto')}"><i class="fas fa-copy"></i> ${LFUTURE_getTraduccion(idioma, 'duplicar')}</button>
                <div class="dropdown-acciones">
                    <button class="btn-accion btn-mas" title="${LFUTURE_getTraduccion(idioma, 'masAcciones')}"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-contenido">
                        <a href="#" onclick="duplicarProyecto(${proyecto.id})"><i class="fas fa-copy"></i> ${LFUTURE_getTraduccion(idioma, 'duplicar')}</a>
                        <a href="#" onclick="exportarProyecto(${proyecto.id}, 'png')"><i class="fas fa-file-image"></i> ${LFUTURE_getTraduccion(idioma, 'exportarPNG')}</a>
                        <a href="#" onclick="exportarProyecto(${proyecto.id}, 'json')"><i class="fas fa-file-code"></i> ${LFUTURE_getTraduccion(idioma, 'exportarJSON')}</a>
                    </div>
                </div>
                 <button class="btn-accion btn-eliminar" onclick="eliminarProyecto(${proyecto.id}, '${proyecto.nombre}')" title="${LFUTURE_getTraduccion(idioma, 'eliminarProyecto')}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function actualizarContador() {
    const contadorElement = document.getElementById('contador-proyectos');
    if (contadorElement) {
        const total = proyectosFiltrados.length;
        contadorElement.textContent = `(${total} proyecto${total !== 1 ? 's' : ''})`;
    }
}

function mostrarMensajeSinProyectos(contenedor) {
    const idioma = (JSON.parse(localStorage.getItem('user_config')||'{}').idioma)||'es';
    contenedor.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: #999;">
            <i class="fas fa-paint-brush" style="font-size: 80px; color: #FFD700; margin-bottom: 30px; opacity: 0.5;"></i>
            <h2 style="color: #FFD700; margin-bottom: 15px; font-size: 28px;">${LFUTURE_getTraduccion(idioma,'comienzaViaje')}</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">${LFUTURE_getTraduccion(idioma,'noGuardados')}</p>
            <p style="margin-bottom: 30px;">${LFUTURE_getTraduccion(idioma,'creaUnicos')}</p>
            <a href="diseños-3d.html" class="btn-ir-diseños">
                <i class="fas fa-pen-fancy"></i> ${LFUTURE_getTraduccion(idioma,'crearPrimerDiseno')}
            </a>
        </div>
    `;
}

// ============================================================================
// #4 VISTA PREVIA MEJORADA CON ZOOM
// ============================================================================

let nivelZoom = 1;
let indiceVistaPreviaActual = -1;

function abrirVistaPrevia(proyectoId, nombre, color) {
    const modal = document.getElementById('modalVistaPrevia');
    const imagen = document.getElementById('imagenVistaPrevia');
    const titulo = document.getElementById('tituloVistaPrevia');

    if (modal && imagen && titulo) {
        // Encontrar el índice del proyecto en la página actual
        const proyectosPagina = proyectosFiltrados.slice((paginaActual - 1) * proyectosPorPagina, paginaActual * proyectosPorPagina);
        indiceVistaPreviaActual = proyectosPagina.findIndex(p => p.id === proyectoId);

        titulo.textContent = nombre;
        imagen.style.background = color;
        imagen.textContent = nombre;
        nivelZoom = 1;
        imagen.style.transform = 'scale(1)';
        modal.style.display = 'flex';
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('role', 'dialog');
        Toast.info('Vista previa abierta: ' + nombre);
    }

    actualizarBotonesNavegacionModal();
}

function cerrarVistaPrevia() {
    const modal = document.getElementById('modalVistaPrevia');
    if (modal) {
        modal.style.display = 'none';
        Toast.info('Vista previa cerrada');
    }
}

function zoomIn() {
    nivelZoom = Math.min(nivelZoom + 0.2, 3);
    const img = getEl('imagenVistaPrevia');
    if (img) img.style.transform = `scale(${nivelZoom})`;
    Toast.info('Zoom: ' + Math.round(nivelZoom * 100) + '%');
}

function zoomOut() {
    nivelZoom = Math.max(nivelZoom - 0.2, 0.5);
    const img = getEl('imagenVistaPrevia');
    if (img) img.style.transform = `scale(${nivelZoom})`;
    Toast.info('Zoom: ' + Math.round(nivelZoom * 100) + '%');
}

function navegarVistaPrevia(direccion) {
    const proyectosPagina = proyectosFiltrados.slice((paginaActual - 1) * proyectosPorPagina, paginaActual * proyectosPorPagina);
    const nuevoIndice = indiceVistaPreviaActual + direccion;

    if (nuevoIndice >= 0 && nuevoIndice < proyectosPagina.length) {
        indiceVistaPreviaActual = nuevoIndice;
        const proyecto = proyectosPagina[indiceVistaPreviaActual];

        const imagen = document.getElementById('imagenVistaPrevia');
        const titulo = document.getElementById('tituloVistaPrevia');

        titulo.textContent = proyecto.nombre;
        imagen.style.background = proyecto.color_prenda || '#1a1a1a';
        imagen.textContent = proyecto.nombre;
        nivelZoom = 1;
        imagen.style.transform = 'scale(1)';

        Toast.info('Vista previa: ' + proyecto.nombre);
        actualizarBotonesNavegacionModal();
    }
}

function actualizarBotonesNavegacionModal() {
    const proyectosPagina = proyectosFiltrados.slice((paginaActual - 1) * proyectosPorPagina, paginaActual * proyectosPorPagina);
    const btnAnterior = getEl('btnModalAnterior');
    const btnSiguiente = getEl('btnModalSiguiente');

    if (btnAnterior) {
        btnAnterior.style.display = (indiceVistaPreviaActual <= 0) ? 'none' : 'block';
    }
    if (btnSiguiente) {
        btnSiguiente.style.display = (indiceVistaPreviaActual >= proyectosPagina.length - 1) ? 'none' : 'block';
    }
}

// ============================================================================
// #11, #18 - MODAL EDITAR, DUPLICAR
// ============================================================================

function abrirModalEditar(proyectoId) {
    const proyecto = todosLosProyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const elId = getEl('editProyectoId');
    const elNombre = getEl('editNombreProyecto');
    const elDesc = getEl('editDescripcionProyecto');
    const elTags = getEl('editTagsProyecto');
    const modal = getEl('modalEditarProyecto');

    if (elId) elId.value = proyecto.id;
    if (elNombre) elNombre.value = proyecto.nombre;
    if (elDesc) elDesc.value = proyecto.descripcion || '';
    if (elTags) elTags.value = proyecto.tags || '';

    if (modal) modal.style.display = 'flex';
}

function cerrarModalEditar() {
    const modal = getEl('modalEditarProyecto');
    if (modal) modal.style.display = 'none';
}

async function guardarCambiosProyecto(event) {
    event.preventDefault();
    const proyectoIdEl = getEl('editProyectoId');
    const nombreEl = getEl('editNombreProyecto');
    const descripcionEl = getEl('editDescripcionProyecto');
    const tagsEl = getEl('editTagsProyecto');

    if (!proyectoIdEl || !nombreEl) {
        Toast.error('Formulario de edición incompleto (elementos faltantes).');
        return;
    }

    const proyectoId = proyectoIdEl.value;
    const nombre = nombreEl.value;
    const descripcion = descripcionEl ? descripcionEl.value : '';
    const tags = tagsEl ? tagsEl.value : '';

    if (!nombre.trim()) {
        Toast.error('El nombre del proyecto no puede estar vacío.');
        return;
    }

    try {
        const response = await updateProyecto(proyectoId, { nombre, descripcion, tags });
        if (response.success && response.data.success) {
            Toast.success('Proyecto actualizado.');
            cerrarModalEditar();
            // Recargar para ver los cambios
            cargarTodosLosProyectos();
        } else {
            Toast.error(response.data.message || 'Error al actualizar.');
        }
    } catch (error) {
        Toast.error('Error de conexión al actualizar.');
    }
}

async function duplicarProyecto(proyectoId) {
    const proyecto = todosLosProyectos.find(p => p.id === proyectoId);
    if (!proyecto) {
        return Toast.error('Proyecto no encontrado para duplicar.');
    }

    if (!confirm(`¿Quieres crear una copia de "${proyecto.nombre}"?`)) {
        return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
        return Toast.error('Necesitas iniciar sesión para duplicar un proyecto.');
    }

    Toast.info('Duplicando proyecto...');

    try {
        const API_BASE_URL = window.API_BASE_URL || (location.origin + '/api');
        const response = await fetch(`${API_BASE_URL}/proyectos/${proyectoId}/duplicar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const resultado = await response.json();

        if (resultado.success) {
            Toast.success('¡Proyecto duplicado con éxito!');
            cargarTodosLosProyectos(); // Recargar la lista para ver la copia
        } else {
            throw new Error(resultado.message || 'Error desconocido del servidor.');
        }
    } catch (error) {
        console.error('Error al duplicar:', error);
        Toast.error(`Error al duplicar: ${error.message}`);
    }
}

// ============================================================================
// #12 EXPORTACIÓN
// ============================================================================

async function exportarProyecto(proyectoId, formato) {
    if (formato === 'png') {
        Toast.info('La exportación a PNG es una simulación y no representará el modelo 3D exacto.');
        // Aquí iría la lógica de exportación a PNG, similar a la de mis-proyectos.js
        alert(`Simulación: Exportando proyecto ${proyectoId} a PNG.`);
    } else if (formato === 'json') {
        Toast.info('Preparando exportación JSON...');
        const proyectoBase = todosLosProyectos.find(p => p.id === proyectoId);
        if (!proyectoBase) {
            Toast.error('No se encontró el proyecto para exportar.');
            return;
        }

        try {
            // Obtener los elementos del proyecto para una exportación completa
            const resElementos = await getElementos(proyectoId);
            const elementos = resElementos.success ? resElementos.data.elementos : [];

            const proyectoCompleto = { ...proyectoBase, elementos };

            const dataStr = JSON.stringify(proyectoCompleto, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `${proyectoCompleto.nombre.replace(/\s/g, '_')}.json`;

            let linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            Toast.success('Proyecto exportado a JSON.');
        } catch (error) {
            Toast.error('Error al obtener los elementos para la exportación.');
            console.error("Error exportando a JSON:", error);
        }
    }
}

// ============================================================================
// ACCIONES DE PROYECTOS
// ============================================================================

async function eliminarProyecto(proyectoId, nombreProyecto) {
    if (!confirm(`¿Estás seguro de eliminar "${nombreProyecto}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await deleteProyecto(proyectoId);

        if (response.success && response.data.success) {
            Toast.success('Proyecto eliminado exitosamente');

            // Remover de las listas
            todosLosProyectos = todosLosProyectos.filter(p => p.id !== proyectoId);
            proyectosFiltrados = proyectosFiltrados.filter(p => p.id !== proyectoId);

            // Re-renderizar
            renderizarProyectos();
        } else {
            Toast.error(response.data.message || 'Error al eliminar proyecto');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.error('Error de conexión al eliminar proyecto');
    }
}

function abrirEnDisenador(proyectoId) {
    // Abrir el editor 3D oficial
    window.location.href = `editor-3d.html?proyecto=${proyectoId}`;
}

// ============================================================================
// #8 ATAJOS DE TECLADO
// ============================================================================

document.addEventListener('keydown', function(e) {
    // Ctrl+N - Nuevo proyecto
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        window.location.href = 'diseños-3d.html';
    }

    // ESC - Cerrar modal
    if (e.key === 'Escape') {
        cerrarVistaPrevia();
    }

    // Flechas para navegar paginación
    if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        cambiarPagina('anterior');
    }

    if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        cambiarPagina('siguiente');
    }

    if (e.key && typeof e.key === 'string' && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const btnRefrescar = getEl('btnRefrescar');
        if (btnRefrescar) btnRefrescar.click();
    }
});

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- Banner de idioma visible ---
    function renderIdiomaBanner() {
        const idioma = (JSON.parse(localStorage.getItem('user_config')||'{}').idioma)||'es';
        let flag = idioma === 'es' ? '🇪🇸' : '🇺🇸';
        let texto = idioma === 'es' ? 'Idioma actual: Español' : 'Current language: English';
        let banner = document.getElementById('idioma-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'idioma-banner';
            banner.style = 'width:100%;background:#FFD700;color:#222;padding:12px 0;text-align:center;font-size:20px;font-weight:bold;box-shadow:0 2px 8px #0002;position:sticky;top:0;z-index:1000;transition:background 0.3s;';
            document.body.prepend(banner);
        }
        banner.innerHTML = `${flag} <span style='margin-left:8px;'>${texto}</span>`;
    }
    window.addEventListener('storage', function(e) {
        if (e.key === 'user_config') renderIdiomaBanner();
    });
    document.getElementById('configIdioma')?.addEventListener('change', renderIdiomaBanner);
    renderIdiomaBanner();
    // Cargar proyectos
    cargarTodosLosProyectos();

    // #1 Búsqueda
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function(e) {
            filtros.termino = e.target.value.trim();
            renderizarProyectos();
        });
    }

    // Filtro por estado
    const selectEstado = document.getElementById('selectEstado');
    if (selectEstado) {
        selectEstado.addEventListener('change', function(e) {
            filtros.estado = e.target.value;
            renderizarProyectos();
        });
    }

    // Filtro por tag
    const selectTag = document.getElementById('selectTag');
    if (selectTag) {
        selectTag.addEventListener('change', function(e) {
            filtros.tag = e.target.value;
            renderizarProyectos();
        });
    }

    // #3 Ordenamiento
    const selectOrdenar = document.getElementById('selectOrdenar');
    if (selectOrdenar) {
        selectOrdenar.addEventListener('change', function(e) {
            filtros.orden = e.target.value;
            cargarTodosLosProyectos(); // Recargar desde el backend con el nuevo orden
        });
    }

    // Botón crear nuevo
    const btnNuevoProyecto = document.getElementById('btnNuevoProyecto');
    if (btnNuevoProyecto) {
        btnNuevoProyecto.addEventListener('click', function() {
            window.location.href = 'editor-3d.html';
        });
    }

    // Botón refrescar
    const btnRefrescar = document.getElementById('btnRefrescar');
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', function() {
            Toast.info('Recargando proyectos...');
            cargarTodosLosProyectos();
        });
    }

    // Formulario de edición
    const formEditar = document.getElementById('formEditarProyecto');
    if (formEditar) {
        formEditar.addEventListener('submit', guardarCambiosProyecto);
    }

    // #10 Inicializar tooltips
    inicializarTooltips();
    // Listen for saves from the editor and refresh list
    window.addEventListener('storage', function(e){
        if(e.key === 'lf_project_saved'){
            Toast.info('Nuevo proyecto guardado, actualizando lista...');
            cargarTodosLosProyectos();
        }
    });
    // Also refresh when tab becomes visible (in case save happened in same tab flow)
    document.addEventListener('visibilitychange', function(){
        if(document.visibilityState === 'visible'){
            try{ const v = localStorage.getItem('lf_project_saved'); if(v) cargarTodosLosProyectos(); }catch(e){}
        }
    });
});

// ============================================================================
// #10 TOOLTIPS INFORMATIVOS
// ============================================================================

function inicializarTooltips() {
    // Los tooltips ya están en los atributos title de los elementos
    // Agregar estilo mejorado con CSS puro (ya incluido en diseños1.0.html)

    // Mostrar tooltip de atajos
    setTimeout(() => {
        Toast.info('💡 Tip: Usa Ctrl+N para nuevo proyecto, Ctrl+← → para navegar páginas', 5000);
    }, 1000);
}

// Small helper to escape HTML inside template literal (avoid XSS when inserting proyecto.nombre)
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
