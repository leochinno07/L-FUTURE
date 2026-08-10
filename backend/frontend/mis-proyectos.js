/**
 * mis-proyectos.js - Gestión de proyectos guardados
 * Cargar, visualizar, exportar y eliminar proyectos
 */

// Variable global para almacenar proyectos
let proyectosCargados = [];

/**
 * Cargar todos los proyectos del usuario
 */
async function cargarProyectos() {
    const contenedor = document.getElementById('galeria-proyectos');
    const mensajeCargando = document.getElementById('mensaje-cargando');
    const mensajeVacio = document.getElementById('mensaje-vacio');

    if (mensajeCargando) mensajeCargando.style.display = 'block';
    if (mensajeVacio) mensajeVacio.style.display = 'none';

    try {
        const resultado = await getProyectos();

        if (resultado.success) {
            proyectosCargados = resultado.data.proyectos;

            if (mensajeCargando) mensajeCargando.style.display = 'none';

            if (proyectosCargados.length === 0) {
                if (mensajeVacio) mensajeVacio.style.display = 'block';
                if (contenedor) contenedor.innerHTML = '';
                return;
            }

            mostrarProyectos(proyectosCargados);
        } else {
            throw new Error(resultado.data.message || 'Error al cargar proyectos');
        }
    } catch (error) {
        console.error('Error:', error);
        if (mensajeCargando) mensajeCargando.style.display = 'none';
        if (contenedor) {
            contenedor.innerHTML = '<div class="error-message">Error al cargar los proyectos. Verifica que el servidor esté corriendo.</div>';
        }
    }
}

/**
 * Mostrar proyectos en la galería
 */
function mostrarProyectos(proyectos) {
    const contenedor = document.getElementById('galeria-proyectos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    proyectos.forEach(proyecto => {
        const card = crearTarjetaProyecto(proyecto);
        contenedor.appendChild(card);
    });
}

/**
 * Crear tarjeta de proyecto
 */
function crearTarjetaProyecto(proyecto) {
    const card = document.createElement('div');
    card.className = 'proyecto-card';
    card.dataset.id = proyecto.id;

    const fecha = new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES');
    const estado = proyecto.estado === 'completado' ? 'Completado' : 'En Progreso';
    const badgeClass = proyecto.estado === 'completado' ? 'badge-completado' : 'badge-progreso';

    const imgHtml = proyecto.thumbnail_url ? `<img src="${proyecto.thumbnail_url}" alt="${proyecto.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"/>` : `<div style="background-color: ${proyecto.color_prenda || '#3498db'}; width:100%;height:100%; display:flex;align-items:center;justify-content:center;">${proyecto.nombre}</div>`;
    card.innerHTML = `
        <div class="proyecto-preview">${imgHtml}
            <div class="proyecto-color-badge">
                <span>${proyecto.color_prenda || '#3498db'}</span>
            </div>
        </div>
        <div class="proyecto-info">
            <h3 class="proyecto-nombre">${proyecto.nombre}</h3>
            <p class="proyecto-descripcion">${proyecto.descripcion || 'Sin descripción'}</p>
            <div class="proyecto-meta">
                <span class="proyecto-fecha">
                    <i class="fas fa-calendar"></i> ${fecha}
                </span>
                <span class="proyecto-talla">
                    <i class="fas fa-tshirt"></i> Talla ${proyecto.talla || 'M'}
                </span>
                <span class="badge ${badgeClass}">${estado}</span>
            </div>
        </div>
        <div class="proyecto-acciones">
            <button class="btn-accion btn-ver" onclick="verProyecto(${proyecto.id})" title="Ver detalles">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-accion btn-editar" onclick="editarProyecto(${proyecto.id})" title="Editar diseño" style="background: #f39c12;">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-accion btn-duplicar" onclick="duplicarProyecto(${proyecto.id})" title="Duplicar" style="background: #9b59b6;">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn-accion btn-estado" onclick="cambiarEstado(${proyecto.id})" title="Cambiar estado" style="background: #3498db;">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="btn-accion btn-exportar" onclick="exportarProyecto(${proyecto.id})" title="Exportar">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn-accion btn-eliminar" onclick="confirmarEliminar(${proyecto.id})" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return card;
}

/**
 * Ver detalles del proyecto
 */
async function verProyecto(proyectoId) {
    const proyecto = proyectosCargados.find(p => p.id === proyectoId);
    if (!proyecto) return;

    // Cargar elementos del proyecto
    try {
        const resultado = await getElementos(proyectoId);

        if (resultado.success) {
            const elementos = resultado.data.elementos;
            mostrarModalDetalles(proyecto, elementos);
        }
    } catch (error) {
        console.error('Error al cargar elementos:', error);
        alert('Error al cargar los detalles del proyecto');
    }
}

/**
 * Mostrar modal con detalles del proyecto
 */
function mostrarModalDetalles(proyecto, elementos) {
    const modal = document.getElementById('modal-detalles');
    if (!modal) return;

    const detallesContenido = document.getElementById('detalles-contenido');
    const elementosLista = elementos.map(elem => `
        <div class="elemento-item">
            <i class="fas fa-${elem.tipo === 'texto' ? 'font' : 'image'}"></i>
            <span><strong>${elem.tipo}:</strong> ${elem.contenido}</span>
            <small style="color: ${elem.color}">${elem.color}</small>
        </div>
    `).join('');

    detallesContenido.innerHTML = `
        <h2>${proyecto.nombre}</h2>
        <p class="descripcion">${proyecto.descripcion || 'Sin descripción'}</p>
        <div class="detalles-grid">
            <div class="detalle-item">
                <strong>Color de prenda:</strong>
                <span style="background: ${proyecto.color_prenda}; padding: 5px 15px; border-radius: 5px; color: white;">
                    ${proyecto.color_prenda}
                </span>
            </div>
            <div class="detalle-item">
                <strong>Talla:</strong> ${proyecto.talla || 'M'}
            </div>
            <div class="detalle-item">
                <strong>Estado:</strong> ${proyecto.estado === 'completado' ? 'Completado' : 'En Progreso'}
            </div>
            <div class="detalle-item">
                <strong>Fecha de creación:</strong> ${new Date(proyecto.fecha_creacion).toLocaleString('es-ES')}
            </div>
        </div>
        <h3>Elementos del diseño (${elementos.length}):</h3>
        <div class="elementos-lista">
            ${elementosLista || '<p>No hay elementos en este diseño</p>'}
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * Exportar proyecto como imagen
 */
async function exportarProyecto(proyectoId) {
    const proyecto = proyectosCargados.find(p => p.id === proyectoId);
    if (!proyecto) return;

    try {
        // Cargar elementos
        const resultado = await getElementos(proyectoId);

        if (!resultado.success) {
            throw new Error('No se pudieron cargar los elementos');
        }

        const elementos = resultado.data.elementos;

        // Crear canvas para exportar
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        // Fondo con color de prenda
        ctx.fillStyle = proyecto.color_prenda || '#3498db';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar elementos
        elementos.forEach(elem => {
            ctx.save();

            const x = (parseFloat(elem.posicion_x) / 100) * canvas.width;
            const y = (parseFloat(elem.posicion_y) / 100) * canvas.height;
            const escala = parseFloat(elem.escala) / 100;

            ctx.translate(x, y);
            ctx.rotate((parseFloat(elem.rotacion) * Math.PI) / 180);
            ctx.scale(escala, escala);

            if (elem.tipo === 'texto') {
                ctx.fillStyle = elem.color || '#FFFFFF';
                ctx.font = (elem.tamano_fuente || 30) + 'px ' + (elem.fuente || 'Arial');
                ctx.textAlign = 'center';
                ctx.fillText(elem.contenido, 0, 0);
            }

            ctx.restore();
        });

        // Agregar marca de agua
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('L-FUTURE', canvas.width - 20, canvas.height - 20);

        // Descargar
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = proyecto.nombre.replace(/[^a-z0-9]/gi, '_') + '.png';
            a.click();
            URL.revokeObjectURL(url);
        });

        alert('Imagen exportada exitosamente');

    } catch (error) {
        console.error('Error al exportar:', error);
        alert('Error al exportar el proyecto');
    }
}

/**
 * Confirmar eliminación de proyecto
 */
function confirmarEliminar(proyectoId) {
    const proyecto = proyectosCargados.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const confirmacion = confirm(
        '¿Estás seguro de que quieres eliminar el proyecto "' + proyecto.nombre + '"?\n\n' +
        'Esta acción no se puede deshacer y se eliminarán todos los elementos del diseño.'
    );

    if (confirmacion) {
        eliminarProyecto(proyectoId);
    }
}

/**
 * Eliminar proyecto
 */
async function eliminarProyecto(proyectoId) {
    try {
        const resultado = await deleteProyecto(proyectoId);

        if (resultado.success) {
            // Eliminar de la lista local
            proyectosCargados = proyectosCargados.filter(p => p.id !== proyectoId);

            // Eliminar del DOM
            const card = document.querySelector(`.proyecto-card[data-id="${proyectoId}"]`);
            if (card) {
                card.style.animation = 'fadeOut 0.3s';
                setTimeout(() => {
                    card.remove();

                    // Mostrar mensaje si no quedan proyectos
                    if (proyectosCargados.length === 0) {
                        const mensajeVacio = document.getElementById('mensaje-vacio');
                        if (mensajeVacio) mensajeVacio.style.display = 'block';
                    }
                }, 300);
            }

            alert('Proyecto eliminado exitosamente');
        } else {
            throw new Error(resultado.data.message || 'Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el proyecto');
    }
}

/**
 * Filtrar proyectos
 */
function filtrarProyectos(termino) {
    const terminoLower = termino.toLowerCase();
    const proyectosFiltrados = proyectosCargados.filter(p =>
        p.nombre.toLowerCase().includes(terminoLower) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(terminoLower))
    );

    mostrarProyectos(proyectosFiltrados);
}

/**
 * Ordenar proyectos
 */
function ordenarProyectos(criterio) {
    let proyectosOrdenados = [...proyectosCargados];

    switch(criterio) {
        case 'recientes':
            proyectosOrdenados.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
            break;
        case 'antiguos':
            proyectosOrdenados.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
            break;
        case 'nombre':
            proyectosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'estado':
            proyectosOrdenados.sort((a, b) => a.estado.localeCompare(b.estado));
            break;
    }

    mostrarProyectos(proyectosOrdenados);
}

/**
 * Cerrar modales
 */
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar proyectos
    cargarProyectos();

    // Configurar buscador
    const buscador = document.getElementById('buscador-proyectos');
    if (buscador) {
        buscador.addEventListener('input', (e) => filtrarProyectos(e.target.value));
    }

    // Configurar ordenamiento
    const ordenar = document.getElementById('ordenar-proyectos');
    if (ordenar) {
        ordenar.addEventListener('change', (e) => ordenarProyectos(e.target.value));
    }

    // Configurar cierre de modales
    const botonesCerrar = document.querySelectorAll('.cerrar-modal, .btn-cerrar-modal');
    if (botonesCerrar && botonesCerrar.forEach) {
        botonesCerrar.forEach(btn => {
            btn.addEventListener('click', () => {
                cerrarModal('modal-detalles');
            });
        });
    }

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal-detalles');
        if (e.target === modal) {
            cerrarModal('modal-detalles');
        }
    });
});

/**
 * Editar proyecto - Redirige al diseñador (futuro: cargar proyecto)
 */
function editarProyecto(proyectoId) {
    // Redirigir al diseñador 3D con query param proyecto
    try{
        window.location.href = 'diseños-3d.html?proyecto=' + encodeURIComponent(proyectoId);
    }catch(e){
        alert('No se pudo abrir el diseñador. Intenta manualmente: diseños-3d.html?proyecto=' + proyectoId);
    }
}

/**
 * Duplicar proyecto
 */
async function duplicarProyecto(proyectoId) {
    const proyecto = proyectosCargados.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const nuevoNombre = prompt('Nombre del proyecto duplicado:', proyecto.nombre + ' (Copia)');
    if (!nuevoNombre) return;

    try {
        // Crear proyecto duplicado
        const resultado = await createProyecto(
            nuevoNombre,
            proyecto.descripcion || 'Copia de ' + proyecto.nombre,
            proyecto.color_prenda,
            proyecto.talla
        );

        if (resultado.success) {
            const nuevoProyectoId = resultado.data.proyecto_id;

            // Copiar elementos
            const resultadoElementos = await getElementos(proyectoId);
            if (resultadoElementos.success) {
                for (const elemento of resultadoElementos.data.elementos) {
                    await addElemento(nuevoProyectoId, {
                        tipo: elemento.tipo,
                        contenido: elemento.contenido,
                        posicion_x: elemento.posicion_x,
                        posicion_y: elemento.posicion_y,
                        rotacion: elemento.rotacion,
                        escala: elemento.escala,
                        color: elemento.color
                    });
                }
            }

            alert('Proyecto duplicado exitosamente');
            cargarProyectos();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al duplicar proyecto');
    }
}

/**
 * Cambiar estado del proyecto
 */
async function cambiarEstado(proyectoId) {
    const proyecto = proyectosCargados.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const nuevoEstado = proyecto.estado === 'completado' ? 'en_progreso' : 'completado';
    const textoEstado = nuevoEstado === 'completado' ? 'Completado' : 'En Progreso';

    try {
        const resultado = await updateProyecto(proyectoId, { estado: nuevoEstado });

        if (resultado.success) {
            alert('Proyecto marcado como: ' + textoEstado);
            cargarProyectos();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar estado');
    }
}

// Añadir animación CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);
