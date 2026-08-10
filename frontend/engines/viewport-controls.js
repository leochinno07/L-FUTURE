export function createViewportControls({ engine, sceneManager } = {}) {
  const controls = {
    engine,
    sceneManager,

    bind() {
      const canvas = this.engine?.canvas;
      if (!canvas) return this;

      canvas.addEventListener('pointerdown', () => {
        canvas.style.cursor = 'grabbing';
      });

      canvas.addEventListener('pointerup', () => {
        canvas.style.cursor = 'grab';
      });

      canvas.addEventListener('pointerleave', () => {
        canvas.style.cursor = 'grab';
      });

      return this;
    }
  };

  controls.bind();

  if (typeof window !== 'undefined') {
    window.LFUTURE_ViewportControls = { createViewportControls };
  }

  return controls;
}

export default createViewportControls;
