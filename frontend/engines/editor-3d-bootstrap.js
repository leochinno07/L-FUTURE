import { createThreeEngine } from './three-engine.js';
import { createSceneManager } from './scene-manager.js';
import { createRenderManager } from './render-manager.js';
import { createViewportControls } from './viewport-controls.js';
import { bindEditorUI } from './editor-3d-ui-bridge.js';
import { createTransformManager } from './editor-3d-transform.js';
import { shouldBlockMobile, redirectToMobileBlock } from './editor-3d-core.js';

function bootstrapEditor3D() {
  if (typeof window === 'undefined') return null;
  if (window.LFEditor3D && window.LFEditor3D.bootstrapped) return window.LFEditor3D;

  const frontCanvas = document.getElementById('editor-canvas-front');
  const backCanvas = document.getElementById('editor-canvas-back');

  if (!frontCanvas && !backCanvas) {
    return null;
  }

  const sceneManager = createSceneManager({
    scenes: [
      { id: 'front', label: 'Frente', active: true },
      { id: 'back', label: 'Trasera', active: false }
    ],
    activeIndex: 0
  });

  const frontEngine = createThreeEngine(frontCanvas, { background: '#18120b' });
  const backEngine = createThreeEngine(backCanvas, { background: '#18120b' });
  const renderManager = createRenderManager({ engine: frontEngine, sceneManager });
  const transformManager = createTransformManager({ sceneManager });
  const viewportControls = createViewportControls({ engine: frontEngine, sceneManager });
  const bridge = bindEditorUI({ sceneManager, engine: frontEngine });

  const api = {
    bootstrapped: true,
    sceneManager,
    frontEngine,
    backEngine,
    renderManager,
    transformManager,
    viewportControls,
    bridge,
    setActiveScene(index) {
      sceneManager.setActiveScene(index);
      renderManager.refresh();
      bridge.sync();
      return sceneManager.getActiveScene();
    },
    refresh() {
      frontEngine.resize();
      backEngine.resize();
      renderManager.refresh();
      bridge.sync();
      return this;
    }
  };

  if (shouldBlockMobile()) {
    redirectToMobileBlock();
    return api;
  }

  window.LFEditor3D = api;
  window.addEventListener('resize', () => api.refresh());

  return api;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrapEditor3D, { once: true });
}

export { bootstrapEditor3D };
export default bootstrapEditor3D;
