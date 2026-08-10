export function createThreeEngine(canvas, options = {}) {
  const state = {
    background: options.background || '#18120b',
    activeScene: options.activeScene || 0,
    initialized: false,
    sceneObjects: []
  };

  const engine = {
    canvas,
    state,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,

    init() {
      if (!this.canvas || this.initialized) return this;

      if (window.THREE) {
        const { THREE } = window;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, this.canvas.width / this.canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(this.state.background, 1);
      } else {
        this.scene = { type: 'fallback-scene', children: [] };
        this.camera = { position: { set() {} } };
        this.renderer = { setPixelRatio() {}, setClearColor() {} };
      }

      this.initialized = true;
      return this;
    },

    resize() {
      const canvas = this.canvas;
      if (!canvas) return this;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width || canvas.width || 520);
      const height = Math.max(240, rect.height || canvas.height || 420);
      if (this.renderer && typeof this.renderer.setSize === 'function') {
        this.renderer.setSize(width, height, false);
      }
      if (this.camera && typeof this.camera.aspect === 'number') {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
      return this;
    },

    render() {
      if (this.renderer && typeof this.renderer.render === 'function' && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      return this;
    },

    setBackground(color) {
      this.state.background = color;
      if (this.renderer && typeof this.renderer.setClearColor === 'function') {
        this.renderer.setClearColor(color, 1);
      }
      return this;
    },

    addObject(object) {
      if (this.scene && this.scene.add) {
        this.scene.add(object);
      } else {
        this.state.sceneObjects.push(object);
      }
      return object;
    },

    clearScene() {
      if (this.scene && this.scene.clear) {
        this.scene.clear();
      }
      this.state.sceneObjects = [];
      return this;
    }
  };

  engine.init();

  if (typeof window !== 'undefined') {
    window.LFUTURE_ThreeEngine = { createThreeEngine };
  }

  return engine;
}

export default createThreeEngine;
