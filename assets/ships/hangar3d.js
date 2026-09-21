import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const BUILD = (typeof window !== "undefined" && (window.HW_BUILD || new URLSearchParams(location.search).get("v"))) || "1550";

function glbUrl(id) {
  if (id === "wake" && window.HW_WAKE_GLB) return window.HW_WAKE_GLB + (window.HW_WAKE_GLB.includes("?") ? "&" : "?") + "v=" + BUILD;
  const b64 = (window.HW_GLB_B64 || {})[id];
  if (id !== "wake" && b64 && b64.length > 80) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: "model/gltf-binary" }));
  }
  return `./assets/ships/${id}.glb?v=${BUILD}`;
}

function boot() {
  const wrap = document.getElementById("hangarViewWrap");
  const overlay = document.getElementById("hangarView");
  if (!wrap) return;

  let canvas = document.getElementById("hangar3d");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "hangar3d";
    canvas.width = 360;
    canvas.height = 220;
    canvas.style.cssText = "display:block;width:100%;height:210px;touch-action:none;position:absolute;inset:0;z-index:0;";
    wrap.style.position = "relative";
    wrap.insertBefore(canvas, wrap.firstChild);
  }
  if (overlay) {
    overlay.style.position = "relative";
    overlay.style.zIndex = "1";
    overlay.style.pointerEvents = "none";
    overlay.style.background = "transparent";
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.setClearColor(0x070b12, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b12, 12, 28);

  const camera = new THREE.PerspectiveCamera(42, 360 / 220, 0.1, 100);
  camera.position.set(4.2, 2.4, 5.5);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0.1, 0);
  controls.minDistance = 2.5;
  controls.maxDistance = 14;
  controls.enablePan = false;

  scene.add(new THREE.AmbientLight(0x6a7a90, 0.55));
  const key = new THREE.DirectionalLight(0xe8eef8, 1.35);
  key.position.set(4, 8, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x2a6ad4, 0.55);
  fill.position.set(-5, 2, -2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff9a20, 0.35);
  rim.position.set(0, 1, -6);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 64),
    new THREE.MeshStandardMaterial({ color: 0x121821, metalness: 0.7, roughness: 0.55 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  scene.add(floor);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.35, 64),
    new THREE.MeshBasicMaterial({ color: 0x2a6ad4, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.33;
  scene.add(ring);

  const loader = new GLTFLoader();
  const cache = new Map();
  const sprites = {};
  let current = null;
  let currentId = null;

  function sizeRenderer() {
    const w = wrap.clientWidth || 360;
    const h = 210;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  sizeRenderer();
  window.addEventListener("resize", sizeRenderer);

  function boostThrusters(root) {
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if ((m.name && /thruster/i.test(m.name)) || (m.color && m.color.r > 0.6 && m.color.g < 0.45 && m.color.b < 0.25)) {
          m.emissive = new THREE.Color(0xff730d);
          m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 1.6);
          m.needsUpdate = true;
        }
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
      }
    });
  }

  function frameObject(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar(4.2 / maxDim);
    const box2 = new THREE.Box3().setFromObject(obj);
    const c2 = box2.getCenter(new THREE.Vector3());
    obj.position.x -= c2.x;
    obj.position.z -= c2.z;
    obj.position.y += -1.15 - box2.min.y;
  }

  function bakeSprite(root, id) {
    try {
      const w = 256, h = 320;
      const bakeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      bakeRenderer.setSize(w, h, false);
      bakeRenderer.setClearColor(0x000000, 0);
      bakeRenderer.outputColorSpace = THREE.SRGBColorSpace;
      bakeRenderer.toneMapping = THREE.NoToneMapping;
      const bakeScene = new THREE.Scene();
      bakeScene.add(new THREE.HemisphereLight(0xf2f6ff, 0x1a2230, 1.35));
      bakeScene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const k = new THREE.DirectionalLight(0xffffff, 2.4);
      k.position.set(3, 7, 5);
      bakeScene.add(k);
      const fill = new THREE.DirectionalLight(0x9ec8ff, 0.9);
      fill.position.set(-4, 3, -2);
      bakeScene.add(fill);
      const rim = new THREE.DirectionalLight(0xff9a3a, 0.55);
      rim.position.set(0, 2, -6);
      bakeScene.add(rim);
      const clone = root.clone(true);
      bakeScene.add(clone);
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const cam = new THREE.PerspectiveCamera(32, w / h, 0.08, 80);
      const span = Math.max(size.x, size.z, size.y) * 1.35;
      cam.up.set(0, 1, 0);
      cam.position.set(center.x, center.y + span * 0.72, center.z + span * 1.15);
      cam.lookAt(center.x, center.y + span * 0.04, center.z);
      bakeRenderer.render(bakeScene, cam);
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const g = out.getContext("2d");
      g.drawImage(bakeRenderer.domElement, 0, 0);
      const img = g.getImageData(0, 0, w, h);
      const p = img.data;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i] + p[i + 1] + p[i + 2] < 18) p[i + 3] = 0;
      }
      g.putImageData(img, 0, 0);
      sprites[id] = out;
      bakeRenderer.dispose();
    } catch (e) {
      console.warn("bake fail", id, e);
    }
  }

  async function loadShip(id, locked) {
    id = id || "wake";
    if (!["wake", "needle", "anvil", "choir"].includes(id)) id = "wake";
    canvas.style.filter = locked ? "grayscale(1) brightness(0.62)" : "none";
    if (current && currentId === id) return;
    if (current) {
      scene.remove(current);
      current = null;
    }
    currentId = id;
    let gltf = cache.get(id);
    if (!gltf) {
      gltf = await loader.loadAsync(glbUrl(id));
      cache.set(id, gltf);
    }
    const root = gltf.scene.clone(true);
    boostThrusters(root);
    frameObject(root);
    scene.add(root);
    current = root;
    if (!sprites[id]) bakeSprite(root, id);
  }

  function tick() {
    requestAnimationFrame(tick);
    if (current) current.rotation.y += 0.0025;
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  window.HWHangar = {
    ready: true,
    load: loadShip,
    preview: (id, locked) => loadShip(id, !!locked),
    sprites,
    id: () => currentId,
  };

  const startId = (window.HW_SHIP || "wake");
  loadShip(startId)
    .then(async () => {
      for (const id of ["wake", "needle", "anvil", "choir"]) {
        if (sprites[id]) continue;
        try {
          const gltf = await loader.loadAsync(glbUrl(id));
          cache.set(id, gltf);
          const root = gltf.scene.clone(true);
          boostThrusters(root);
          frameObject(root);
          bakeSprite(root, id);
        } catch (e) {
          console.warn("preload", id, e);
        }
      }
    })
    .catch((e) => {
      console.warn("hangar glb", e);
      window.HWHangar.ready = false;
    });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
