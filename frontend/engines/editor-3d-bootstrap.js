async function bootstrapEditor3D() {
  if (typeof window === 'undefined') return null;
  if (window.LFEditor3D && window.LFEditor3D.bootstrapped) return window.LFEditor3D;

  const frontCanvas = document.getElementById('editor-canvas-front');
  const backCanvas = document.getElementById('editor-canvas-back');
  const previewCanvas = document.getElementById('garment-3d-canvas');

  if (!frontCanvas || !backCanvas || !previewCanvas) {
    return null;
  }

  let preview;
  try {
    const { createGarmentPreview } = await import('./garment-preview.js');
    preview = createGarmentPreview({
      canvas: previewCanvas,
      frontCanvas,
      backCanvas,
      getScenes: () => window.LFUTURE_EditorScenes
    });
  } catch (error) {
    console.error('No se pudo iniciar el visor 3D:', error);
    const message = document.getElementById('garment-3d-error');
    if (message) message.hidden = false;
    return null;
  }

  const layout = document.querySelector('.layout');
  const viewButtons = [...document.querySelectorAll('[data-editor-view]')];

  function setView(view) {
    if (!layout) return;
    layout.dataset.view = view;
    viewButtons.forEach(button => {
      const active = button.dataset.editorView === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (view === '3d') requestAnimationFrame(() => preview.resize());
  }

  viewButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.editorView)));
  setView(window.matchMedia('(max-width: 760px)').matches ? '3d' : 'edit');

  const api = {
    bootstrapped: true,
    preview,
    setActiveScene(index) {
      window.setActiveScene?.(index);
      return index;
    },
    setView,
    refresh() {
      preview.resize();
      preview.sync();
      return this;
    },
    syncTextures() {
      preview.sync();
      return this;
    }
  };

  window.LFUTURE_3DPreview = preview;
  window.LFEditor3D = api;
  window.addEventListener('resize', () => api.refresh());
  return api;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrapEditor3D, { once: true });
}

export { bootstrapEditor3D };
export default bootstrapEditor3D;
