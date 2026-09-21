import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const BUILD = (typeof window !== "undefined" && (window.HW_BUILD || new URLSearchParams(location.search).get("v"))) || "1552";

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

  const camera = new THREE.PerspectiveCamera(38, 360 / 220, 0.1, 100);
  camera.position.set(0.6, 0.35, 5.4);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0.35, 0);
  controls.minDistance = 2.2;
  controls.maxDistance = 12;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.72;

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
  floor.position.y = -2.15;
  scene.add(floor);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.35, 64),
    new THREE.MeshBasicMaterial({ color: 0x2a6ad4, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.13;
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
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar(3.8 / maxDim);
    const box2 = new THREE.Box3().setFromObject(obj);
    obj.position.sub(box2.getCenter(new THREE.Vector3()));
  }

  function aimAtNose(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const noseY = center.y + size.y * 0.2;
    controls.target.set(center.x, noseY, center.z);
    const dist = Math.max(size.x, size.z, 1.2) * 1.55 + 2.4;
    camera.position.set(center.x + dist * 0.22, noseY, center.z + dist * 0.92);
    camera.lookAt(controls.target);
    controls.update();
  }

  function tipUpCanvas(src) {
    const w = src.width, h = src.height;
    const g = src.getContext("2d");
    const img = g.getImageData(0, 0, w, h);
    const p = img.data;
    let sx = 0, sy = 0, n = 0;
    const xs = [], ys = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (p[(y * w + x) * 4 + 3] < 40) continue;
        sx += x; sy += y; n++;
        xs.push(x); ys.push(y);
      }
    }
    if (!n) return src;
    const cx = sx / n, cy = sy / n;
    let best = 0, tx = cx, ty = cy;
    for (let i = 0; i < xs.length; i++) {
      const d = (xs[i] - cx) ** 2 + (ys[i] - cy) ** 2;
      if (d > best) { best = d; tx = xs[i]; ty = ys[i]; }
    }
    const need = -Math.PI / 2 - Math.atan2(ty - cy, tx - cx);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const o = out.getContext("2d");
    o.translate(w / 2, h / 2);
    o.rotate(need);
    o.drawImage(src, -w / 2, -h / 2);
    return out;
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
      bakeScene.add(new THREE.HemisphereLight(0xffffff, 0x243044, 1.5));
      bakeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const k = new THREE.DirectionalLight(0xffffff, 2.6);
      k.position.set(2, 10, 1);
      bakeScene.add(k);
      const fill = new THREE.DirectionalLight(0xb8d4ff, 1.0);
      fill.position.set(-5, 6, -2);
      bakeScene.add(fill);
      const clone = root.clone(true);
      bakeScene.add(clone);
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const cam = new THREE.PerspectiveCamera(28, w / h, 0.05, 80);
      const span = Math.max(size.x, size.z, 0.2) * 1.7;
      cam.up.set(0, 0, -1);
      cam.position.set(center.x, center.y + span * 2.15, center.z + span * 0.12);
      cam.lookAt(center.x, center.y, center.z);
      bakeRenderer.render(bakeScene, cam);
      const raw = document.createElement("canvas");
      raw.width = w;
      raw.height = h;
      const g = raw.getContext("2d");
      g.drawImage(bakeRenderer.domElement, 0, 0);
      const img = g.getImageData(0, 0, w, h);
      const p = img.data;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i] + p[i + 1] + p[i + 2] < 12) p[i + 3] = 0;
      }
      g.putImageData(img, 0, 0);
      sprites[id] = tipUpCanvas(raw);
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
    aimAtNose(root);
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
