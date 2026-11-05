import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEXTURE_CROP = { left: 0.12, bottom: 0.1, width: 0.76, height: 0.76 };

function createShirtShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.24, 0.94);
  shape.quadraticCurveTo(0, 0.76, 0.24, 0.94);
  shape.lineTo(0.55, 0.88);
  shape.lineTo(0.84, 0.72);
  shape.lineTo(1.1, 0.38);
  shape.lineTo(0.83, 0.17);
  shape.lineTo(0.61, 0.38);
  shape.lineTo(0.55, -0.82);
  shape.quadraticCurveTo(0, -0.98, -0.55, -0.82);
  shape.lineTo(-0.61, 0.38);
  shape.lineTo(-0.83, 0.17);
  shape.lineTo(-1.1, 0.38);
  shape.lineTo(-0.84, 0.72);
  shape.lineTo(-0.55, 0.88);
  shape.closePath();
  return shape;
}

function setShirtUvs(geometry) {
  const positions = geometry.getAttribute('position');
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    uvs[index * 2] = TEXTURE_CROP.left + ((x + 1.1) / 2.2) * TEXTURE_CROP.width;
    uvs[index * 2 + 1] = TEXTURE_CROP.bottom + ((y + 0.98) / 1.92) * TEXTURE_CROP.height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function getCanvasPoint(event, canvas, raycaster, camera, surfaces, frontCanvas, backCanvas) {
  const rect = canvas.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const intersection = raycaster.intersectObjects(surfaces, false)[0];
  if (!intersection) return null;

  const sceneIndex = intersection.object.userData.sceneIndex;
  const textureCanvas = sceneIndex === 0 ? frontCanvas : backCanvas;
  if (!textureCanvas) return null;

  const uv = intersection.uv;
  return {
    sceneIndex,
    x: uv.x * textureCanvas.width,
    y: (1 - uv.y) * textureCanvas.height
  };
}

export function createGarmentPreview({ canvas, frontCanvas, backCanvas, getScenes } = {}) {
  if (!canvas || !frontCanvas || !backCanvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#15191e');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.04, 3.8);

  scene.add(new THREE.HemisphereLight('#f7f5ee', '#263039', 2.2));
  const keyLight = new THREE.DirectionalLight('#fff0ce', 3.2);
  keyLight.position.set(-2.6, 3.4, 4.2);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight('#69dce5', 1.7);
  rimLight.position.set(2.8, 0.5, -2.4);
  scene.add(rimLight);

  const shape = createShirtShape();
  const depth = 0.12;
  const baseGeometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 16
  });
  baseGeometry.translate(0, 0, -depth / 2);
  const garment = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.92,
    metalness: 0.01
  }));
  scene.add(garment);

  const frontTexture = makeTexture(frontCanvas);
  const backTexture = makeTexture(backCanvas);
  const faceGeometry = new THREE.ShapeGeometry(shape, 24);
  setShirtUvs(faceGeometry);

  const faceMaterial = texture => new THREE.MeshStandardMaterial({
    map: texture,
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    alphaTest: 0.015,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const frontFace = new THREE.Mesh(faceGeometry, faceMaterial(frontTexture));
  frontFace.position.z = depth / 2 + 0.004;
  frontFace.userData.sceneIndex = 0;
  const backFace = new THREE.Mesh(faceGeometry.clone(), faceMaterial(backTexture));
  backFace.rotation.y = Math.PI;
  backFace.position.z = -depth / 2 - 0.004;
  backFace.userData.sceneIndex = 1;
  scene.add(frontFace, backFace);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 5.4;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI - 0.35;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.72;
  controls.addEventListener('change', render);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function sync() {
    frontTexture.needsUpdate = true;
    backTexture.needsUpdate = true;
    render();
  }

  function setGarmentColor(color) {
    garment.material.color.set(color || '#ffffff');
    render();
  }

  const raycaster = new THREE.Raycaster();
  const surfaces = [frontFace, backFace];
  let dragState = null;
  let pendingDragPoint = null;
  let dragFrame = 0;

  function applyPendingDragPoint() {
    dragFrame = 0;
    const point = pendingDragPoint;
    pendingDragPoint = null;
    if (!point || !dragState || point.sceneIndex !== dragState.sceneIndex) return;
    const sceneState = getScenes()[dragState.sceneIndex].state;
    const element = sceneState.elementos[dragState.elementIndex];
    if (!element) return;
    element.x = point.x - dragState.offsetX - frontCanvas.width / 2;
    element.y = point.y - dragState.offsetY - frontCanvas.height / 2;
    window.renderAll?.();
  }

  function pickElement(event) {
    const point = getCanvasPoint(event, canvas, raycaster, camera, surfaces, frontCanvas, backCanvas);
    if (!point) return null;
    const scenes = getScenes?.() || [];
    const state = scenes[point.sceneIndex]?.state;
    if (!state) return null;

    let selectedIndex = -1;
    let selectedDistance = Infinity;
    state.elementos.forEach((element, index) => {
      const x = frontCanvas.width / 2 + (Number(element.x) || 0);
      const y = frontCanvas.height / 2 + (Number(element.y) || 0);
      const distance = Math.hypot(point.x - x, point.y - y);
      const radius = Math.max(34, 66 * (Number(element.escala) || 1));
      if (distance <= radius && distance < selectedDistance) {
        selectedDistance = distance;
        selectedIndex = index;
      }
    });

    return selectedIndex < 0 ? null : { ...point, elementIndex: selectedIndex };
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    const picked = pickElement(event);
    if (!picked) return;
    const state = getScenes()[picked.sceneIndex].state;
    dragState = {
      sceneIndex: picked.sceneIndex,
      elementIndex: picked.elementIndex,
      offsetX: picked.x - (frontCanvas.width / 2 + (Number(state.elementos[picked.elementIndex].x) || 0)),
      offsetY: picked.y - (frontCanvas.height / 2 + (Number(state.elementos[picked.elementIndex].y) || 0))
    };
    controls.enabled = false;
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopImmediatePropagation();
    window.setActiveScene?.(picked.sceneIndex);
    window.selectElement?.(state, picked.elementIndex);
  }, true);

  canvas.addEventListener('pointermove', event => {
    if (!dragState) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingDragPoint = getCanvasPoint(event, canvas, raycaster, camera, surfaces, frontCanvas, backCanvas);
    if (!dragFrame) dragFrame = requestAnimationFrame(applyPendingDragPoint);
  }, true);

  function finishDrag(event) {
    if (!dragState) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (dragFrame) cancelAnimationFrame(dragFrame);
    applyPendingDragPoint();
    window.saveHistory?.(dragState.sceneIndex);
    dragState = null;
    pendingDragPoint = null;
    controls.enabled = true;
    sync();
  }

  canvas.addEventListener('pointerup', finishDrag, true);
  canvas.addEventListener('pointercancel', finishDrag, true);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  return {
    camera,
    controls,
    renderer,
    scene,
    sync,
    resize,
    setGarmentColor,
    dispose() {
      resizeObserver.disconnect();
      controls.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      renderer.dispose();
    }
  };
}
