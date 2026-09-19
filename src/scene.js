import * as THREE from "three";

const SECTION_COLORS = [
  0x6c8cff, 0xb06cff, 0x4ade80, 0xffd166, 0xff6b8b, 0x4dd0e1, 0xff9e64, 0xa78bfa,
];
export const colorFor = (i) => SECTION_COLORS[i % SECTION_COLORS.length];

export function createScene(canvas) {
  // ---------- Renderer / camera / composer ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060e);
  scene.fog = new THREE.FogExp2(0x05060e, 0.0035);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );

  const composer = null; // no postprocessing: glow comes from additive sprites

  // ---------- Lights ----------
  scene.add(new THREE.AmbientLight(0x8899ff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(60, 90, 40);
  scene.add(key);
  const rim = new THREE.PointLight(0xb06cff, 2.0, 500);
  rim.position.set(-70, -30, -60);
  scene.add(rim);

  // ---------- Soft round sprite texture ----------
  function makeGlowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(220,228,255,0.5)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = makeGlowTexture();

  // ---------- Starfield ----------
  function makeStarfield(count, spread, size, opacity) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.35 + 0.65 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.35;
      pos[i * 3 + 2] = Math.sin(theta) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbfd0ff, size, map: glowTex,
      transparent: true, opacity, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }
  const starsFar = makeStarfield(2600, 900, 2.2, 0.85);
  const starsNear = makeStarfield(900, 500, 3.4, 0.45);
  scene.add(starsFar, starsNear);

  // Central core glow
  const core = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex, color: 0x8fa8ff, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  core.scale.setScalar(60);
  scene.add(core);

  // ---------- Galaxy ----------
  const galaxy = new THREE.Group();
  scene.add(galaxy);
  const groups = []; // { section, group, planets, label, radius, speed, angle0 }

  const sharedSphere = new THREE.SphereGeometry(1, 20, 14);
  const planetMats = new Map(); // hex -> MeshStandardMaterial
  function matFor(hex) {
    if (!planetMats.has(hex)) {
      planetMats.set(hex, new THREE.MeshStandardMaterial({
        color: hex, roughness: 0.4, metalness: 0.3,
        emissive: hex, emissiveIntensity: 0.38,
      }));
    }
    return planetMats.get(hex);
  }

  function makeRingMesh(radius, color, opacity) {
    const geo = new THREE.RingGeometry(0.985, 1.0, 160);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.scale.setScalar(radius);
    return m;
  }

  function makeTextSprite(text, color) {
    const c = document.createElement("canvas");
    const measure = c.getContext("2d");
    const font = '600 44px "Space Grotesk", sans-serif';
    measure.font = font;
    const w = Math.ceil(measure.measureText(text).width) + 36;
    c.width = w; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.font = font;
    ctx.fillStyle = "#" + color.getHexString();
    ctx.shadowColor = "#" + color.getHexString();
    ctx.shadowBlur = 16;
    ctx.fillText(text, 18, 46);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set((w / 64) * 6, 6, 1);
    return s;
  }

  function build(data) {
    // clear previous
    for (const g of groups) galaxy.remove(g.group);
    groups.length = 0;

    const n = data.sections.length;
    data.sections.forEach((section, si) => {
      const group = new THREE.Group();
      const color = new THREE.Color(colorFor(si));
      const count = section.questions.length;
      const radius = 24 + si * 3.0;
      const speed = 0.06 / (1 + si * 0.05);
      const angle0 = (si / n) * Math.PI * 6;

      group.add(makeRingMesh(radius, color, 0.08 + Math.min(0.1, count / 900)));

      const planets = [];
      const spreadAngle = Math.min(Math.PI * 1.8, 0.17 * count);
      for (let pi = 0; pi < count; pi++) {
        const q = section.questions[pi];
        const a = angle0 + (pi / count) * spreadAngle;
      const planet = new THREE.Mesh(sharedSphere, matFor(colorFor(si)));
      const s = 0.55 + Math.min(0.9, q.text.length / 120);
      planet.scale.setScalar(s);
      const baseY = ((pi % 3) - 1) * 2.4;
      planet.position.set(Math.cos(a) * radius, baseY, Math.sin(a) * radius);
      planet.userData = {
        section, question: q, sectionIndex: si, qIndex: pi, baseY, baseScale: s,
      };
      // additive halo glow (cheap bloom substitute)
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: colorFor(si), transparent: true,
        opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      halo.scale.setScalar(3.4);
      planet.add(halo);
        group.add(planet);
        planets.push(planet);
      }

      const label = makeTextSprite(section.title.toUpperCase(), color);
      label.position.set(Math.cos(angle0) * radius, 8.5, Math.sin(angle0) * radius);
      group.add(label);

      group.rotation.y = si * 0.7;
      galaxy.add(group);
      groups.push({ section, group, planets, label, radius, speed, angle0 });
    });
  }

  // ---------- Camera rig ----------
  const rig = {
    target: new THREE.Vector3(0, 0, 0),
    r: 150, theta: 0.0, phi: 1.08,
    goalTarget: new THREE.Vector3(0, 0, 0),
    goalR: 150,
  };
  let flying = false;
  let selected = null; // planet userData

  function applyRig() {
    const sp = Math.max(0.05, rig.phi);
    camera.position.set(
      rig.target.x + rig.r * Math.sin(sp) * Math.sin(rig.theta),
      rig.target.y + rig.r * Math.cos(sp),
      rig.target.z + rig.r * Math.sin(sp) * Math.cos(rig.theta)
    );
    camera.lookAt(rig.target);
  }

  // ---------- Picking ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoverPlanet = null;
  const listeners = { click: [], hover: [], cine: [] };

  function pick(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = [];
    for (const g of groups) for (const p of g.planets) meshes.push(p);
    const hits = raycaster.intersectObjects(meshes, false);
    return hits.length ? hits[0].object : null;
  }

  let downX = 0, downY = 0, dragging = false, moved = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = false; downX = e.clientX; downY = e.clientY;
    canvas._lx = e.clientX; canvas._ly = e.clientY;
  });
  window.addEventListener("pointermove", (e) => {
    const hit = pick(e);
    if (hit !== hoverPlanet) {
      hoverPlanet = hit;
      listeners.hover.forEach((fn) => fn(hit ? hit.userData : null, e));
    }
    document.body.style.cursor = hit ? "pointer" : dragging ? "grabbing" : "default";
  });
  window.addEventListener("pointerup", (e) => {
    if (dragging && !moved && !e.target.closest("#topbar, #wheel, #qpanel, #results, #intro")) {
      const hit = pick(e);
      listeners.click.forEach((fn) => fn(hit ? hit.userData : null));
    }
    dragging = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - canvas._lx;
    const dy = e.clientY - canvas._ly;
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) moved = true;
    canvas._lx = e.clientX; canvas._ly = e.clientY;
    rig.theta -= dx * 0.005;
    rig.phi = Math.max(0.15, Math.min(1.5, rig.phi - dy * 0.004));
    flying = false;
  });
  canvas.addEventListener("pointerup", () => { canvas._lx = canvas._ly = undefined; });
  let cineArmed = false; // fires once per zoom-out journey, after the user has been inside
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const prev = rig.r;
    rig.r = Math.max(6, Math.min(400, rig.r + e.deltaY * 0.12));
    flying = false;
    if (rig.r < 300) cineArmed = true; // been inside -> now over-zoom can trigger
    // Zoomed all the way out past the galaxy -> reveal the Shiva eye
    if (cineArmed && prev > 350 && e.deltaY > 0 && rig.r >= 400) {
      cineArmed = false;
      listeners.cine.forEach((fn) => fn());
    }
  }, { passive: false });

  // ---------- Focus ----------
  const wp = new THREE.Vector3();
  function setFocus(ud) {
    selected = ud;
    if (ud) {
      ud.planet.getWorldPosition(wp);
      rig.goalTarget.copy(wp);
      rig.goalR = 14;
    } else {
      rig.goalTarget.set(0, 0, 0);
      rig.goalR = 150;
    }
    flying = true;
  }

  // ---------- Animation loop ----------
  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    for (const g of groups) {
      g.group.rotation.y += g.speed * dt;
      g.label.position.y = 8.5 + Math.sin(t * 1.3 + g.angle0) * 0.7;
      for (const p of g.planets) {
        p.position.y = p.userData.baseY + Math.sin(t * 0.9 + p.userData.qIndex * 0.7) * 0.5;
        const target = p === hoverPlanet || p === (selected && selected.planet) ? 1.9 : p.userData.baseScale;
        p.scale.lerp(tmpV.setScalar(target), 0.12);
      }
    }

    starsFar.rotation.y += dt * 0.004;
    starsNear.rotation.y -= dt * 0.002;
    core.material.opacity = 0.3 + Math.sin(t * 0.7) * 0.08;

    // Camera: follow selected planet, glide toward goals
    if (selected) {
      selected.planet.getWorldPosition(wp);
      rig.goalTarget.copy(wp);
    }
    if (flying) {
      rig.target.lerp(rig.goalTarget, 0.07);
      rig.r += (rig.goalR - rig.r) * 0.07;
      if (
        rig.target.distanceTo(rig.goalTarget) < 0.05 &&
        Math.abs(rig.r - rig.goalR) < 0.05
      ) flying = false;
    } else if (selected) {
      rig.target.copy(rig.goalTarget);
    }
    applyRig();

    renderer.render(scene, camera);
  }
  animate();

  // ---------- Intro glide-in ----------
  rig.r = 480; // start far out; Enter glides to 150

  // ---------- Resize ----------
  function resizeTo(w, h) {
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", () =>
    resizeTo(window.innerWidth, window.innerHeight)
  );
  // Self-heal when the canvas element gets its real size (e.g. webview attach)
  new ResizeObserver((entries) => {
    const r = entries[0].contentRect;
    resizeTo(r.width, r.height);
  }).observe(canvas);

  return {
    build,
    on: (type, fn) => listeners[type].push(fn),
    setFocus,
    flyHome() {
      selected = null;
      rig.goalTarget.set(0, 0, 0);
      rig.goalR = 150;
      flying = true;
    },
    getPlanetAt(si, qi) {
      const mesh = groups[si]?.planets[qi];
      return mesh ? { planet: mesh, ...mesh.userData } : null;
    },
    renderer,
    scene,
    camera,
  };
}
