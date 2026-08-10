export function createTransformManager({ sceneManager } = {}) {
  const manager = {
    sceneManager,
    currentSelection: null,

    selectElement(element) {
      this.currentSelection = element;
      return element;
    },

    scaleSelectedBy(delta) {
      if (!this.currentSelection) return this;
      const currentScale = Number(this.currentSelection.scale || 100);
      this.currentSelection.scale = Math.max(20, Math.min(400, currentScale + delta));
      return this;
    },

    rotateSelectedBy(delta) {
      if (!this.currentSelection) return this;
      const currentRotation = Number(this.currentSelection.rotation || 0);
      this.currentSelection.rotation = (currentRotation + delta + 360) % 360;
      return this;
    },

    updateSceneLabel() {
      const activeLabel = document.getElementById('active-scene-label');
      if (activeLabel && this.sceneManager) {
        const current = this.sceneManager.getActiveScene();
        activeLabel.textContent = current?.label || 'Frente';
      }
      return this;
    }
  };

  if (typeof window !== 'undefined') {
    window.LFUTURE_TransformManager = { createTransformManager };
  }

  return manager;
}

export default createTransformManager;
