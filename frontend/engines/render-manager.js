export function createRenderManager({ engine, sceneManager } = {}) {
  const manager = {
    engine,
    sceneManager,

    tick() {
      if (this.engine && typeof this.engine.render === 'function') {
        this.engine.render();
      }
      return this;
    },

    refresh() {
      if (this.engine && typeof this.engine.resize === 'function') {
        this.engine.resize();
      }
      this.tick();
      return this;
    }
  };

  if (typeof window !== 'undefined') {
    window.LFUTURE_RenderManager = { createRenderManager };
  }

  return manager;
}

export default createRenderManager;
