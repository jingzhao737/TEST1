/* ═══════════════════════════════════════════
   3D ICE — HDR + Model + Particles + Bloom + Lens Flare
   ═══════════════════════════════════════════ */

import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ═══ Lens Flare Shader ═══
const LensFlareShader = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom:   { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    intensity:  { value: 1.2 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = normalize(uv - center);
      float dist = length(uv - center);

      // ── Ghost artifacts ──
      vec4 flare = vec4(0.0);
      float ghostCount = 6.0;

      for (float i = 1.0; i <= 6.0; i += 1.0) {
        float offset = i / ghostCount;
        float falloff = pow(1.0 - offset, 3.0);
        vec2 ghostUv = uv - dir * offset * 0.35;

        if (ghostUv.x < 0.0 || ghostUv.x > 1.0 ||
            ghostUv.y < 0.0 || ghostUv.y > 1.0) continue;

        vec4 ghost = texture2D(tDiffuse, ghostUv);
        float ghostBright = dot(ghost.rgb, vec3(0.2126, 0.7152, 0.0722));

        // Color shift per ghost — prismatic
        vec3 tint = vec3(1.0);
        if (i == 1.0) tint = vec3(0.9, 0.3, 0.1);
        if (i == 2.0) tint = vec3(0.2, 0.5, 0.9);
        if (i == 3.0) tint = vec3(0.3, 0.9, 0.2);
        if (i == 4.0) tint = vec3(0.9, 0.2, 0.7);
        if (i == 5.0) tint = vec3(0.7, 0.5, 0.2);
        if (i == 6.0) tint = vec3(1.0, 0.8, 0.4);

        float sizeFalloff = 1.0 - offset * 0.5;
        float ghostWeight = ghostBright * falloff * 0.25 * sizeFalloff;
        flare.rgb += ghost.rgb * tint * ghostWeight;
        // Chroma shift on ghosts
        float chroma = 0.04 * offset;
        vec2 rUv = ghostUv + dir * chroma * 0.5;
        vec2 bUv = ghostUv - dir * chroma * 0.3;
        float rSample = texture2D(tDiffuse, rUv).r;
        float bSample = texture2D(tDiffuse, bUv).b;
        flare.r += rSample * ghostWeight * 0.3;
        flare.b += bSample * ghostWeight * 0.3;
      }

      // ── Halo ring ──
      float haloDist = length(uv - center);
      float halo = smoothstep(0.07, 0.35, haloDist) * (1.0 - smoothstep(0.35, 0.55, haloDist));
      vec2 haloUv = uv - dir * 0.12;
      vec4 haloColor = texture2D(tDiffuse, haloUv);
      float haloBright = dot(haloColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      flare.rgb += haloColor.rgb * vec3(0.6, 0.3, 0.8) * halo * haloBright * 0.15;

      // ── Anamorphic streak ──
      vec2 texel = 1.0 / resolution;
      vec3 streak = vec3(0.0);
      for (float i = -15.0; i <= 15.0; i += 1.0) {
        float t = i / 15.0;
        vec2 offset = vec2(t * texel.x * 3.0, t * texel.y * 1.0);
        vec4 s = texture2D(tDiffuse, uv + offset);
        float b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
        float w = exp(-abs(t) * 2.5);
        streak += s.rgb * b * w * 0.08;
      }

      // ── Composite ──
      vec3 result = color.rgb + flare.rgb * intensity + streak * intensity * 0.5;

      // Subtle final tone to prevent blowout
      result = result / (result + 1.0);

      gl_FragColor = vec4(result, color.a);
    }
  `
};

(async function() {
  const container = document.querySelector('.ice-container');
  if (!container) return;

  // ═══ Renderer ═══
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.setClearColor(0x000000, 1);

  const oldCanvas = container.querySelector('canvas');
  container.insertBefore(renderer.domElement, oldCanvas);
  if (oldCanvas) oldCanvas.remove();
  renderer.domElement.className = 'ice-canvas';
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 60);
  camera.position.set(0, -5, 8);
  camera.lookAt(0, 0, 0);

  // ═══ Post Processing ═══
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.20,  // strength
    0.3,   // radius
    0.50   // threshold
  );
  composer.addPass(bloomPass);

  const lensFlarePass = new ShaderPass(LensFlareShader);
  lensFlarePass.uniforms['resolution'].value.set(
    container.clientWidth, container.clientHeight
  );
  lensFlarePass.renderToScreen = true;
  composer.addPass(lensFlarePass);

  // ═══ 粒子 ═══
  function addStars(count, rMin, rMax, color, size, opacity) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = rMin + Math.random() * (rMax - rMin);
      pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i*3+2] = Math.cos(phi) * r;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(pts);
    return pts;
  }

  const nearStars   = addStars(200, 7, 12, 0xaaccff, 0.025, 0.25);
  const brightStars = addStars(150, 15, 45, 0xccddff, 0.05,  0.30);
  const dimStars    = addStars(500, 15, 45, 0x7799bb, 0.03,  0.15);
  const farStars    = addStars(800, 30, 80, 0x6677aa, 0.035, 0.10);
  const deepStars   = addStars(300, 50, 120, 0x556699, 0.04,  0.06);
  const deepStars2  = addStars(200, 80, 200, 0x445588, 0.045, 0.04);

  // ═══ 环绕几何体 ═══
  const orbitBodies = [];
  const orbitColors = [0x6699cc, 0xdd8899, 0x77aadd, 0xddbb77, 0x99aadd, 0x88bbdd];

  for (let i = 0; i < 14; i++) {
    const radius = 2.5 + Math.random() * 4.5;
    const height = (Math.random() - 0.5) * 5;
    const speed = 0.15 + Math.random() * 0.5;
    const phase = Math.random() * Math.PI * 2;
    const geo = i < 7
      ? new THREE.BoxGeometry(0.06, 0.06, 0.06)
      : new THREE.SphereGeometry(0.045, 12, 12);
    const color = orbitColors[i % orbitColors.length];

    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.06,
      metalness: 0.2, roughness: 0.6,
      transparent: true, opacity: 0.35 + Math.random() * 0.2
    }));
    mesh.position.set(Math.cos(phase) * radius, height, Math.sin(phase) * radius);
    mesh.userData = { radius, height, speed, phase, rotSpeed: 0.5 + Math.random() * 2 };
    scene.add(mesh);
    orbitBodies.push(mesh);
  }

  // ═══ 模型 — 白色 + 色散 ═══
  const gltf = await new Promise((res, rej) => {
    new GLTFLoader().load('model/Model1.glb', res, undefined, rej);
  });

  const crystal = new THREE.Group();
  const box = new THREE.Box3();
  gltf.scene.traverse(c => { if (c.isMesh) box.expandByObject(c); });
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitScale = maxDim > 0.001 ? 3.2 / maxDim : 1;
  const center = box.getCenter(new THREE.Vector3());

  gltf.scene.traverse(function(child) {
    if (!child.isMesh) return;
    crystal.add(new THREE.Mesh(child.geometry, new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0.05, roughness: 0.08, ior: 1.5,
      transmission: 0.92, thickness: 2.0,
      envMapIntensity: 0.8,
      specularIntensity: 1.0, specularColor: new THREE.Color(0xffffff),
      dispersion: 0.5,
      side: THREE.DoubleSide, transparent: true,
    })));
  });

  crystal.scale.setScalar(fitScale);
  crystal.position.set(-center.x * fitScale, -center.y * fitScale, -center.z * fitScale);
  scene.add(crystal);

  // ═══ HDR ═══
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileCubemapShader();

  const hdrDefs = [
    { label: 'field',    path: 'images/exr/field_02k.exr' },
    { label: 'orchard',  path: 'images/exr/orchard_01k.exr' },
    { label: 'overcast', path: 'images/exr/overcast_02k.exr' }
  ];

  const hdrCache = [];

  await Promise.all(hdrDefs.map((def, idx) => {
    return new Promise((resolve) => {
      new EXRLoader().load(def.path, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        const env = pmremGen.fromEquirectangular(tex).texture;
        hdrCache[idx] = { tex, env };
        resolve();
      }, undefined, () => resolve());
    });
  }));

  function applyHdr(idx) {
    const { tex, env } = hdrCache[idx];
    scene.background = tex;
    scene.backgroundIntensity = document.documentElement.classList.contains('light') ? 0.85 : 0.65;
    scene.environment = env;
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.isMeshPhysicalMaterial) {
        obj.material.envMap = env;
        obj.material.envMapIntensity = 0.8;
        obj.material.needsUpdate = true;
      }
    });
  }

  let currentHdr = 0;
  if (hdrCache[0]) applyHdr(0);

  const hdrBtns = document.querySelectorAll('.hdr-ring');
  hdrBtns[0]?.classList.add('active');
  hdrBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.hdr);
      if (idx === currentHdr || !hdrCache[idx]) return;
      currentHdr = idx;
      hdrBtns.forEach((b,i) => b.classList.toggle('active', i === idx));
      applyHdr(idx);
    });
  });

  // ═══ Controls (Trackball — 无死角全向旋转) ═══
  const controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.2;
  controls.zoomSpeed = 0;
  controls.noZoom = true;
  controls.panSpeed = 0;
  controls.noPan = true;
  controls.minDistance = 1.5;
  controls.maxDistance = 18;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.update();

  // ═══ Resize ═══
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
    lensFlarePass.uniforms['resolution'].value.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // ═══ Zoom Slider ═══
  const zoomKnob = document.getElementById('zoomKnob');
  const zoomFill = document.getElementById('zoomFill');
  const zoomTrack = document.getElementById('zoomSlider');
  if (zoomKnob && zoomFill && zoomTrack) {
  const zoomMin = controls.minDistance;
  const zoomMax = controls.maxDistance;
  let zoomValue = 1;
  let zoomDragging = false;
  let zoomStartX = 0, zoomStartVal = 0;

  function zoomKnobPos(val) {
    var pct = (val * 100) + '%';
    zoomKnob.style.left = pct;
    zoomFill.style.width = pct;
  }

  function applyZoom(val) {
    var dist = zoomMax - val * (zoomMax - zoomMin);
    var currentDist = camera.position.length();
    if (currentDist < 0.001) return;
    var scale = dist / currentDist;
    camera.position.multiplyScalar(scale);
  }

  // Smooth zoom lerp
  var zoomTarget = zoomValue;
  var zoomRaf = null;
  function startZoomLerp() {
    if (zoomRaf) return;
    zoomRaf = requestAnimationFrame(function tick() {
      var diff = zoomTarget - zoomValue;
      if (Math.abs(diff) < 0.002) {
        zoomValue = zoomTarget;
        zoomKnobPos(zoomValue);
        applyZoom(zoomValue);
        zoomRaf = null;
        return;
      }
      zoomValue += diff * 0.06;
      zoomKnobPos(zoomValue);
      applyZoom(zoomValue);
      zoomRaf = requestAnimationFrame(tick);
    });
  }

  zoomValue = 1 - (camera.position.length() - zoomMin) / (zoomMax - zoomMin);
  zoomValue = Math.max(0, Math.min(1, zoomValue));
  zoomTarget = zoomValue;
  zoomKnobPos(zoomValue);

  function handleDragStart(clientX) {
    zoomDragging = true;
    zoomStartX = clientX;
    zoomStartVal = zoomTarget;
    zoomKnob.classList.add('active');
  }

  function handleDragMove(clientX) {
    if (!zoomDragging) return;
    var rect = zoomTrack.getBoundingClientRect();
    var dx = (clientX - zoomStartX) / rect.width;
    zoomTarget = Math.max(0, Math.min(1, zoomStartVal + dx));
    startZoomLerp();
  }

  function handleDragEnd() {
    if (!zoomDragging) return;
    zoomDragging = false;
    zoomKnob.classList.remove('active');
  }

  zoomTrack.addEventListener('mousedown', function(e) {
    if (e.target === zoomKnob) {
      handleDragStart(e.clientX);
      e.preventDefault();
      e.stopPropagation();
    } else {
      var rect = zoomTrack.getBoundingClientRect();
      zoomTarget = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      startZoomLerp();
      e.preventDefault();
      e.stopPropagation();
    }
  });

  zoomTrack.addEventListener('touchstart', function(e) {
    if (e.target === zoomKnob) {
      handleDragStart(e.touches[0].clientX);
      e.preventDefault();
      e.stopPropagation();
    } else {
      var rect = zoomTrack.getBoundingClientRect();
      zoomTarget = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
      startZoomLerp();
      e.preventDefault();
      e.stopPropagation();
    }
  }, {passive: false});

  document.addEventListener('mousemove', function(e) { handleDragMove(e.clientX); });
  document.addEventListener('touchmove', function(e) { handleDragMove(e.touches[0].clientX); }, {passive: false});
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchend', handleDragEnd);
  } // end zoomSlider check

  // ═══ Loop ═══
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(container);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    // TrackballControls 不自带 autoRotate，手动旋转
    const ra = 0.0025;
    const px = camera.position.x, pz = camera.position.z;
    camera.position.x = px * Math.cos(ra) + pz * Math.sin(ra);
    camera.position.z = -px * Math.sin(ra) + pz * Math.cos(ra);
    camera.lookAt(controls.target);
    controls.update();

    nearStars.rotation.y += dt * 0.04; nearStars.rotation.x += dt * 0.02;
    brightStars.rotation.y += dt * 0.015; brightStars.rotation.x += dt * 0.008;
    dimStars.rotation.y += dt * 0.012; dimStars.rotation.x += dt * 0.006;
    farStars.rotation.y += dt * 0.005;
    deepStars.rotation.y += dt * 0.003;
    deepStars2.rotation.y += dt * 0.002;

    for (let i = 0; i < orbitBodies.length; i++) {
      const b = orbitBodies[i];
      const d = b.userData;
      d.phase += d.speed * dt;
      b.position.x = Math.cos(d.phase) * d.radius;
      b.position.z = Math.sin(d.phase) * d.radius;
      b.rotation.x += d.rotSpeed * dt;
      b.rotation.y += d.rotSpeed * 0.7 * dt;
      b.rotation.z += d.rotSpeed * 0.5 * dt;
    }

    composer.render();
  }
  animate();
})();
