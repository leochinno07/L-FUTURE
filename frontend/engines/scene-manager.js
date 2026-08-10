export function createSceneManager(options = {}) {
  const scenes = options.scenes || [
    { id: 'front', label: 'Frente', active: true },
    { id: 'back', label: 'Trasera', active: false }
  ];

  const manager = {
    scenes,
    activeIndex: options.activeIndex || 0,

    getActiveScene() {
      return this.scenes[this.activeIndex] || this.scenes[0];
    },

    setActiveScene(index) {
      const normalizedIndex = Number.isInteger(index) ? index : 0;
      this.scenes.forEach((scene, sceneIndex) => {
        scene.active = sceneIndex === normalizedIndex;
      });
      this.activeIndex = normalizedIndex;
      return this.getActiveScene();
    },

    addScene(scene) {
      this.scenes.push(scene);
      return scene;
    },

    syncSceneSelection() {
      const labels = document.querySelectorAll('[data-scene]');
      labels.forEach((label) => {
        const isActive = Number(label.dataset.scene) === this.activeIndex;
        label.classList.toggle('scene-active', isActive);
      });
      const activeLabel = document.getElementById('active-scene-label');
      if (activeLabel) {
        const current = this.getActiveScene();
        activeLabel.textContent = current?.label || 'Frente';
      }
      return this;
    }
  };

  manager.setActiveScene(manager.activeIndex);

  if (typeof window !== 'undefined') {
    window.LFUTURE_SceneManager = { createSceneManager };
  }

  return manager;
}

export default createSceneManager;
