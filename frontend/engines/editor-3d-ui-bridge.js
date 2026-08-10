export function bindEditorUI({ sceneManager, engine } = {}) {
  const sceneLabel = document.getElementById('active-scene-label');
  const frontBox = document.getElementById('scene-front');
  const backBox = document.getElementById('scene-back');

  const updateLabel = () => {
    if (sceneLabel) {
      const current = sceneManager?.getActiveScene?.();
      sceneLabel.textContent = current?.label || 'Frente';
    }
  };

  const updateSceneClasses = () => {
    const activeIndex = sceneManager?.activeIndex ?? 0;
    if (frontBox) frontBox.classList.toggle('scene-active', activeIndex === 0);
    if (backBox) backBox.classList.toggle('scene-active', activeIndex === 1);
  };

  const sync = () => {
    updateLabel();
    updateSceneClasses();
    if (engine && typeof engine.render === 'function') {
      engine.render();
    }
  };

  if (typeof window !== 'undefined') {
    window.LFUTURE_EditorBridge = { sync, updateLabel, updateSceneClasses };
  }

  sync();
  return { sync, updateLabel, updateSceneClasses };
}

export default bindEditorUI;
