const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const RECENT_COLORS_KEY = 'lfuture_recent_text_colors';
const LOGO_HISTORY_KEY = 'lfuture_recent_logos';
const UPLOADS_PAGE_SIZE = 24;
let brushMode = false;
let activeStroke = null;
let uploadsPage = 1;
let uploadsLoading = false;
let uploadsHaveMore = true;

const TEMPLATE_PRESETS = {
  'franela-minimal': {
    type: 'tshirt',
    color: '#f1eee5',
    elements: [{ tipo: 'texto', contenido: 'L-FUTURE', tamano: 28, fuente: 'Orbitron', color: '#14191d', x: 0, y: -16, escala: 1, rotacion: 0, opacidad: 100 }]
  },
  'franela-street': {
    type: 'tshirt',
    color: '#111519',
    elements: [{ tipo: 'texto', contenido: 'NO SIGNAL', tamano: 34, fuente: 'Orbitron', color: '#62e2dc', x: 0, y: -8, escala: 1, rotacion: -4, opacidad: 100 }]
  },
  'sueter-oversize': {
    type: 'sweater',
    color: '#26323a',
    elements: [{ tipo: 'logo', contenido: 'LF / 26', tamano: 44, color: '#ff9a57', x: 0, y: 0, escala: 1, rotacion: 0, opacidad: 100 }]
  },
  'crop-top': {
    type: 'crop-top',
    color: '#d9e3df',
    elements: [{ tipo: 'texto', contenido: 'FUTURE', tamano: 30, fuente: 'Saira Extra Condensed', color: '#172126', x: 0, y: -8, escala: 1, rotacion: 0, opacidad: 100 }]
  }
};

const LOGO_MARKS = [
  { name: 'LF Monograma', mark: 'LF', tags: 'monograma minimal marca' },
  { name: 'L-FUTURE', mark: 'L-FUTURE', tags: 'wordmark marca etiqueta' },
  { name: 'Future Dept.', mark: 'F/26', tags: 'street urbano tendencia' },
  { name: 'No Signal', mark: 'N/S', tags: 'cyber tech tendencia' },
  { name: 'Studio 01', mark: 'S01', tags: 'studio etiqueta minimal' },
  { name: 'After Hours', mark: 'AH', tags: 'street nocturno' }
];

function getScenes() {
  return window.LFUTURE_EditorScenes || [];
}

function currentScene() {
  return getScenes()[window.currentSceneIndex || 0];
}

function commitScene(scene = currentScene()) {
  const scenes = getScenes();
  const index = scenes.indexOf(scene);
  if (index >= 0) window.saveHistory?.(index);
  window.renderAll?.();
  renderLayers();
}

function setToolPanel(tool) {
  const layout = document.querySelector('.layout');
  const sidebar = document.querySelector('.aside');
  const closePanel = window.matchMedia('(max-width: 760px)').matches
    && layout?.dataset.activeTool === tool
    && sidebar?.classList.contains('panel-open');
  document.querySelectorAll('[data-editor-tool]').forEach(button => {
    const active = button.dataset.editorTool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-tool-panel]').forEach(panel => {
    panel.classList.toggle('is-active', panel.dataset.toolPanel === tool);
  });
  sidebar?.classList.toggle('panel-open', !closePanel);
  layout?.setAttribute('data-active-tool', tool);
}

function readRecentColors() {
  try {
    const colors = JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) || '[]');
    return Array.isArray(colors) ? colors.filter(color => /^#[\da-f]{6}$/i.test(color)).slice(0, 6) : [];
  } catch {
    return [];
  }
}

function renderRecentColors() {
  const container = document.getElementById('recent-text-colors');
  if (!container) return;
  container.replaceChildren(...readRecentColors().map(color => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recent-color-swatch';
    button.style.setProperty('--swatch-color', color);
    button.title = `Usar ${color}`;
    button.setAttribute('aria-label', `Usar color ${color}`);
    button.addEventListener('click', () => {
      document.getElementById('text-color').value = color;
    });
    return button;
  }));
}

function rememberColor(color) {
  const colors = [color, ...readRecentColors().filter(item => item.toLowerCase() !== color.toLowerCase())].slice(0, 6);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors));
  renderRecentColors();
}

function renderLogoGallery(query = '') {
  const gallery = document.getElementById('lfuture-logo-gallery');
  if (!gallery) return;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const recent = (() => {
    try { return JSON.parse(localStorage.getItem(LOGO_HISTORY_KEY) || '[]'); } catch { return []; }
  })();
  gallery.replaceChildren(...LOGO_MARKS
    .map((logo, index) => ({ ...logo, index }))
    .filter(logo => `${logo.name} ${logo.tags} ${logo.mark}`.toLocaleLowerCase().includes(normalizedQuery))
    .map(logo => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lfuture-logo-thumb logo-mark';
      button.dataset.tags = logo.tags;
      button.title = `${logo.name} · ${logo.tags}`;
      button.textContent = logo.mark;
      button.addEventListener('click', () => addLogo(logo.index));
      if (recent[0] === logo.index) button.classList.add('recent');
      return button;
    }));
}

function addLogo(index) {
  const logo = LOGO_MARKS[index];
  const scene = currentScene();
  if (!scene || !logo) return;
  scene.state.elementos.push({
    tipo: 'logo', contenido: logo.mark, tamano: 44, color: '#62e2dc',
    x: 0, y: 0, escala: 1, rotacion: 0, opacidad: 100
  });
  try {
    const recent = JSON.parse(localStorage.getItem(LOGO_HISTORY_KEY) || '[]');
    localStorage.setItem(LOGO_HISTORY_KEY, JSON.stringify([index, ...recent.filter(item => item !== index)].slice(0, 5)));
  } catch { /* local history is optional */ }
  commitScene(scene);
}

function addShape(shape) {
  const scene = currentScene();
  if (!scene) return;
  scene.state.elementos.push({
    tipo: 'forma', forma: shape, contenido: shape, color: '#62e2dc',
    tamano: 74, x: 0, y: 0, escala: 1, rotacion: 0, opacidad: 100
  });
  commitScene(scene);
}

function updateLayers() {
  const list = document.getElementById('tool-layers-list');
  const scene = currentScene();
  if (!list || !scene) return;
  list.replaceChildren(...scene.state.elementos.map((element, index) => {
    const row = document.createElement('div');
    row.className = 'layer-row';
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = `element-item${index === scene.state.selected ? ' selected' : ''}`;
    selectButton.textContent = `${element.tipo === 'texto' ? 'Aa' : element.tipo === 'forma' ? '◈' : '◆'}  ${(element.contenido || element.forma || 'Imagen').toString().slice(0, 24)}`;
    selectButton.addEventListener('click', () => window.selectElementByIndex?.(index));
    const move = direction => {
      const target = index + direction;
      if (target < 0 || target >= scene.state.elementos.length) return;
      const [moved] = scene.state.elementos.splice(index, 1);
      scene.state.elementos.splice(target, 0, moved);
      scene.state.selected = target;
      commitScene(scene);
    };
    const moveUp = document.createElement('button');
    moveUp.type = 'button';
    moveUp.className = 'layer-order-button';
    moveUp.textContent = '↑';
    moveUp.title = 'Subir capa';
    moveUp.setAttribute('aria-label', 'Subir capa');
    moveUp.disabled = index === 0;
    moveUp.addEventListener('click', () => move(-1));
    const moveDown = document.createElement('button');
    moveDown.type = 'button';
    moveDown.className = 'layer-order-button';
    moveDown.textContent = '↓';
    moveDown.title = 'Bajar capa';
    moveDown.setAttribute('aria-label', 'Bajar capa');
    moveDown.disabled = index === scene.state.elementos.length - 1;
    moveDown.addEventListener('click', () => move(1));
    row.append(selectButton, moveUp, moveDown);
    return row;
  }));
}

function selectedElement() {
  const scene = currentScene();
  return scene && scene.state.selected !== null ? scene.state.elementos[scene.state.selected] : null;
}

function updateSelectedTextProperty(property, value, commit = false) {
  const element = selectedElement();
  if (element?.tipo !== 'texto') return;
  element[property] = value;
  if (commit) commitScene();
  else window.renderAll?.();
}

function removeSelected() {
  const scene = currentScene();
  if (!scene || scene.state.selected === null) return;
  scene.state.elementos.splice(scene.state.selected, 1);
  scene.state.selected = null;
  commitScene(scene);
}

function duplicateSelected() {
  const scene = currentScene();
  const element = selectedElement();
  if (!scene || !element) return;
  const copy = JSON.parse(JSON.stringify(element));
  copy.x = (Number(copy.x) || 0) + 24;
  copy.y = (Number(copy.y) || 0) + 24;
  scene.state.elementos.push(copy);
  scene.state.selected = scene.state.elementos.length - 1;
  commitScene(scene);
  if (url.startsWith('/uploads/')) loadUserUploads(true);
}

function addUploadedAsset(file) {
  const scene = currentScene();
  if (!scene || !file?.file_url) return;
  const id = Date.now() + Math.floor(Math.random() * 10000);
  scene.state.imglist.push({ id, url: file.file_url, name: file.filename, size: file.tamano });
  scene.state.elementos.push({ tipo: 'img', image_id: id, x: 0, y: 0, rotacion: 0, opacidad: 100, escala: 1, alineacion: 'center', cornerRadius: 0 });
  scene.state.selected = scene.state.elementos.length - 1;
  commitScene(scene);
}

async function loadUserUploads(reset = false) {
  const gallery = document.getElementById('user-uploads-gallery');
  const token = localStorage.getItem('auth_token');
  if (!gallery || !token || uploadsLoading || (!uploadsHaveMore && !reset)) return;
  if (reset) {
    uploadsPage = 1;
    uploadsHaveMore = true;
    gallery.replaceChildren();
  }

  uploadsLoading = true;
  try {
    const response = await fetch(`${window.API_BASE_URL || (location.origin + '/api')}/uploads?page=${uploadsPage}&limit=${UPLOADS_PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success || !Array.isArray(result.archivos)) {
      throw new Error(result?.message || 'No se pudo cargar la biblioteca');
    }

    for (const file of result.archivos) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-preset small';
      button.title = file.filename || 'Asset guardado';
      const image = document.createElement('img');
      image.src = file.file_url;
      image.alt = '';
      const caption = document.createElement('span');
      caption.textContent = file.filename || 'Asset';
      button.append(image, caption);
      button.addEventListener('click', () => addUploadedAsset(file));
      gallery.append(button);
    }

    uploadsHaveMore = result.archivos.length === UPLOADS_PAGE_SIZE;
    uploadsPage += 1;
    document.getElementById('uploads-load-more').hidden = !uploadsHaveMore;
  } catch (error) {
    setUploadStatus(error.message || 'No se pudo cargar la biblioteca.', true);
  } finally {
    uploadsLoading = false;
  }
}

function setUploadStatus(message, isError = false) {
  const status = document.getElementById('upload-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    setUploadStatus('Formato no admitido. Usa PNG, JPG, WEBP o GIF.', true);
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    setUploadStatus('La imagen supera el límite de 5 MB.', true);
    return;
  }

  const scene = currentScene();
  if (!scene) return;
  setUploadStatus('Validando y subiendo imagen...');
  let url;
  const token = localStorage.getItem('auth_token');
  if (token && window.currentProjectId) {
    try {
      const form = new FormData();
      form.append('image', file, file.name);
      const response = await fetch(`${window.API_BASE_URL || (location.origin + '/api')}/proyectos/${window.currentProjectId || 0}/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success && result.file_url) url = result.file_url;
    } catch (error) {
      console.warn('Se usará almacenamiento local para esta imagen:', error);
    }
  }

  if (!url) {
    try {
      url = await readAsDataUrl(file);
      setUploadStatus('Imagen guardada en el proyecto local.');
    } catch (error) {
      setUploadStatus(error.message, true);
      return;
    }
  } else {
    setUploadStatus('Imagen subida al servidor.');
  }

  const id = Date.now() + Math.floor(Math.random() * 10000);
  scene.state.imglist.push({ id, url, name: file.name, size: file.size });
  scene.state.elementos.push({ tipo: 'img', image_id: id, x: 0, y: 0, rotacion: 0, opacidad: 100, escala: 1, alineacion: 'center', cornerRadius: 0 });
  scene.state.selected = scene.state.elementos.length - 1;
  commitScene(scene);
}

function selectedImage() {
  const scene = currentScene();
  const element = selectedElement();
  if (!scene || element?.tipo !== 'img') return null;
  return { scene, element, image: scene.state.imglist.find(item => item.id === element.image_id) };
}

async function transformSelectedImage(operation) {
  const selection = selectedImage();
  if (!selection?.image) {
    setUploadStatus('Selecciona una imagen de la escena.', true);
    return;
  }
  const image = new Image();
  image.src = selection.image.url;
  try {
    await image.decode();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: operation === 'remove-background' });
    if (!context) throw new Error('Canvas 2D no está disponible');

    if (operation === 'crop') {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - side) / 2;
      const sourceY = (image.naturalHeight - side) / 2;
      canvas.width = 512;
      canvas.height = 512;
      context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 512, 512);
    } else {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        if (red > 238 && green > 238 && blue > 238 && Math.max(red, green, blue) - Math.min(red, green, blue) < 14) {
          pixels.data[index + 3] = 0;
        }
      }
      context.putImageData(pixels, 0, 0);
    }

    selection.image.url = canvas.toDataURL('image/png');
    commitScene(selection.scene);
    setUploadStatus(operation === 'crop' ? 'Recorte aplicado.' : 'Fondo claro eliminado.');
  } catch (error) {
    setUploadStatus(error.message || 'No se pudo procesar la imagen.', true);
  }
}

function filterItems(input, selector) {
  const query = input.value.trim().toLocaleLowerCase();
  document.querySelectorAll(selector).forEach(item => {
    const content = `${item.textContent} ${item.dataset.tags || ''}`.toLocaleLowerCase();
    item.hidden = !content.includes(query);
  });
}

function bindBrushMode() {
  document.getElementById('tool-brush')?.addEventListener('click', event => {
    brushMode = !brushMode;
    event.currentTarget.classList.toggle('active', brushMode);
    event.currentTarget.setAttribute('aria-pressed', String(brushMode));
    document.querySelectorAll('#editor-canvas-front, #editor-canvas-back').forEach(canvas => {
      canvas.style.cursor = brushMode ? 'crosshair' : 'grab';
    });
    setUploadStatus(brushMode ? 'Dibujo libre activado. Traza sobre la prenda.' : 'Dibujo libre desactivado.');
  });

  document.querySelectorAll('#editor-canvas-front, #editor-canvas-back').forEach((canvas, sceneIndex) => {
    canvas.addEventListener('pointerdown', event => {
      if (!brushMode || (event.button !== undefined && event.button !== 0)) return;
      const scene = getScenes()[sceneIndex];
      const rect = canvas.getBoundingClientRect();
      const firstPoint = {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2
      };
      const stroke = {
        tipo: 'stroke', contenido: 'Dibujo', points: [firstPoint], color: document.getElementById('text-color').value,
        tamano: 5, x: 0, y: 0, escala: 1, rotacion: 0, opacidad: 100
      };
      scene.state.elementos.push(stroke);
      scene.state.selected = null;
      activeStroke = { canvas, scene, stroke };
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    canvas.addEventListener('pointermove', event => {
      if (!activeStroke || activeStroke.canvas !== canvas) return;
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2
      };
      const previous = activeStroke.stroke.points.at(-1);
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return;
      if (activeStroke.stroke.points.length < 2000) activeStroke.stroke.points.push(point);
      event.preventDefault();
      event.stopImmediatePropagation();
      window.renderAll?.();
    }, true);

    const finishStroke = event => {
      if (!activeStroke || activeStroke.canvas !== canvas) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const { scene, stroke } = activeStroke;
      if (stroke.points.length < 2) scene.state.elementos.pop();
      window.saveHistory?.(sceneIndex);
      activeStroke = null;
      window.renderAll?.();
    };
    canvas.addEventListener('pointerup', finishStroke, true);
    canvas.addEventListener('pointercancel', finishStroke, true);
  });
}

function applyTemplate(templateId) {
  const template = TEMPLATE_PRESETS[templateId];
  const scenes = getScenes();
  if (!template || scenes.length !== 2) return;
  scenes.forEach((scene, index) => {
    scene.state.elementos = index === 0 ? JSON.parse(JSON.stringify(template.elements)) : [];
    scene.state.imglist = [];
    scene.state.selected = null;
    scene.state.shirt.type = template.type;
    scene.state.shirt.color = template.color;
    scene.state.historial = [];
    scene.state.historialRedo = [];
    window.saveHistory?.(index);
  });
  window.document.getElementById('color-base').value = template.color;
  window.document.getElementById('shirt-type').value = template.type;
  window.renderAll?.();
  const dialog = document.getElementById('template-confirm');
  if (dialog?.open) dialog.close();
}

function initEditorWorkspace() {
  const nav = document.querySelector('.editor-bottom-nav');
  nav?.querySelectorAll('[data-editor-tool]').forEach(button => {
    button.addEventListener('click', () => {
      setToolPanel(button.dataset.editorTool);
      if (button.dataset.editorTool === 'uploads') loadUserUploads(true);
    });
  });
  document.getElementById('uploads-load-more')?.addEventListener('click', () => loadUserUploads());
  setToolPanel('text');

  const textSize = document.getElementById('text-size');
  const textSizeRange = document.getElementById('text-size-range');
  textSizeRange?.addEventListener('input', () => {
    textSize.value = textSizeRange.value;
    document.getElementById('text-input').style.fontSize = `${textSizeRange.value}px`;
    updateSelectedTextProperty('tamano', Number(textSizeRange.value));
  });
  textSizeRange?.addEventListener('change', () => updateSelectedTextProperty('tamano', Number(textSizeRange.value), true));
  textSize?.addEventListener('input', () => {
    textSizeRange.value = textSize.value;
    document.getElementById('text-input').style.fontSize = `${textSize.value}px`;
    updateSelectedTextProperty('tamano', Number(textSize.value));
  });
  textSize?.addEventListener('change', () => updateSelectedTextProperty('tamano', Number(textSize.value), true));

  const textColor = document.getElementById('text-color');
  textColor?.addEventListener('input', () => updateSelectedTextProperty('color', textColor.value));
  textColor?.addEventListener('change', () => {
    rememberColor(textColor.value);
    updateSelectedTextProperty('color', textColor.value, true);
  });
  const textSpacing = document.getElementById('text-spacing');
  textSpacing?.addEventListener('input', () => updateSelectedTextProperty('espaciado', Number(textSpacing.value)));
  textSpacing?.addEventListener('change', () => updateSelectedTextProperty('espaciado', Number(textSpacing.value), true));
  const textLineHeight = document.getElementById('text-line-height');
  textLineHeight?.addEventListener('input', () => updateSelectedTextProperty('lineHeight', Number(textLineHeight.value)));
  textLineHeight?.addEventListener('change', () => updateSelectedTextProperty('lineHeight', Number(textLineHeight.value), true));
  document.getElementById('font-category-select')?.addEventListener('change', event => {
    window.renderFontListDropdown?.(Number(event.target.value));
  });
  document.getElementById('font-list-select')?.addEventListener('change', () => {
    updateSelectedTextProperty('fuente', window.getCurrentFontName?.() || 'Arial', true);
  });
  renderRecentColors();
  document.getElementById('logo-search')?.addEventListener('input', event => renderLogoGallery(event.target.value));
  renderLogoGallery();

  document.getElementById('resource-search')?.addEventListener('input', event => {
    filterItems(event.target, '.shape-tool, .sticker-tab, #sticker-gallery > *');
  });
  document.getElementById('template-search')?.addEventListener('input', event => {
    filterItems(event.target, '.template-option');
  });
  document.getElementById('image-search')?.addEventListener('input', event => {
    filterItems(event.target, '#image-gallery > *');
  });
  document.querySelectorAll('[data-shape]').forEach(button => button.addEventListener('click', () => addShape(button.dataset.shape)));
  document.querySelectorAll('[data-template]').forEach(button => button.addEventListener('click', () => {
    const dialog = document.getElementById('template-confirm');
    dialog.dataset.pendingTemplate = button.dataset.template;
    dialog.showModal();
  }));

  document.getElementById('template-confirm-yes')?.addEventListener('click', () => {
    applyTemplate(document.getElementById('template-confirm').dataset.pendingTemplate);
  });
  document.getElementById('template-confirm-no')?.addEventListener('click', () => document.getElementById('template-confirm').close());

  document.getElementById('image-upload')?.addEventListener('change', handleImageUpload);
  document.getElementById('camera-upload')?.addEventListener('change', handleImageUpload);
  document.getElementById('image-search-button')?.addEventListener('click', () => {
    const query = document.getElementById('image-search').value.trim();
    if (query) window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  });
  document.getElementById('image-crop')?.addEventListener('click', () => transformSelectedImage('crop'));
  document.getElementById('image-background-remove')?.addEventListener('click', () => transformSelectedImage('remove-background'));
  document.getElementById('image-corner-radius')?.addEventListener('input', event => {
    const element = selectedElement();
    if (element?.tipo !== 'img') return;
    element.cornerRadius = Number(event.target.value);
    window.renderAll?.();
  });
  document.getElementById('image-copy')?.addEventListener('click', () => {
    const element = selectedElement();
    if (element) window.__lfEditorClipboard = JSON.parse(JSON.stringify(element));
  });
  document.getElementById('image-paste')?.addEventListener('click', () => {
    const scene = currentScene();
    const clipboard = window.__lfEditorClipboard;
    if (!scene || !clipboard) return;
    const copy = JSON.parse(JSON.stringify(clipboard));
    if (copy.tipo === 'img') {
      const source = scene.state.imglist.find(item => item.id === copy.image_id);
      if (!source) return setUploadStatus('La imagen copiada no pertenece a esta escena.', true);
      const duplicate = { ...source, id: Date.now() };
      scene.state.imglist.push(duplicate);
      copy.image_id = duplicate.id;
    }
    copy.x = (Number(copy.x) || 0) + 22;
    copy.y = (Number(copy.y) || 0) + 22;
    scene.state.elementos.push(copy);
    scene.state.selected = scene.state.elementos.length - 1;
    commitScene(scene);
  });
  document.getElementById('image-delete')?.addEventListener('click', removeSelected);
  document.getElementById('tool-duplicate')?.addEventListener('click', duplicateSelected);
  document.getElementById('tool-eraser')?.addEventListener('click', removeSelected);
  bindBrushMode();

  document.getElementById('ai-style-suggest')?.addEventListener('click', () => {
    const suggestions = [
      { color: '#62e2dc', category: '1', font: '0' },
      { color: '#ff9a57', category: '2', font: '1' },
      { color: '#f1eee5', category: '5', font: '0' }
    ];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    document.getElementById('text-color').value = suggestion.color;
    document.getElementById('font-category-select').value = suggestion.category;
    window.renderFontListDropdown?.(Number(suggestion.category));
    document.getElementById('font-list-select').value = suggestion.font;
    rememberColor(suggestion.color);
  });

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const element = selectedElement();
      if (element) window.__lfEditorClipboard = JSON.parse(JSON.stringify(element));
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      document.getElementById('image-paste')?.click();
    }
    if (event.key === 'Delete' || event.key === 'Backspace') removeSelected();
  });
}

window.addLogo = addLogo;
window.addShape = addShape;
window.renderEditorLayers = updateLayers;
window.renderLFutureLogos = renderLogoGallery;
window.applyEditorTemplate = applyTemplate;
window.addEventListener('DOMContentLoaded', initEditorWorkspace, { once: true });
