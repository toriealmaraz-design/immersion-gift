/**
 * Immersion Gift — 3D Galaxy Core Engine
 * Three.js: swirling vortex galaxy + central floating heart + orbiting
 * floaters + stardust particle field. Drives index.html (galaxyScene).
 *
 * Notes:
 *  - r128 build (UMD) from cdnjs to keep the page openable offline via
 *    the local copy of the script.
 *  - Memory: geometries/materials/disposal handled on scene teardown.
 */

(function () {
  "use strict";

  const SCENE = document.getElementById("galaxyScene");
  if (!SCENE) return;

  // Guard: only build when Three.js is actually loaded.
  if (typeof THREE === "undefined") {
    console.error("[3D Galaxy] THREE is undefined — check that js/three.min.js is loaded before three-scene.js");
    return;
  }

  let renderer, scene, camera, clock, heartGroup, galaxyGroup, starField;
  let floaters = [];
  let portalSpheres = [];
  let portalRings = [];
  let rafId = null;
  let running = true;
  let time = 0;

  const SIZE = 8;
  const GALAXY_LUMENS = 1400;
  const STARDUST = 2600;
  const HEART_SEGMENTS = 2600;

  const PINK = 0xff2a85;
  const MAGENTA = 0xff1493;
  const STARDUST_WHITE = 0xf0f0f0;

  // Camera is positioned at z=6.2, lookAt origin. Particles near z=3.5 are the
  // sharpest focal plane; we simulate a shallow depth-of-field feel by scaling
  // particle sizes inversely with distance from that plane (no postprocessing passthrough
  // dependencies — pure geometry-level faux-DoF).
  function getDepthScale(pos) {
    const z = pos.z || 0;
    const focal = 3.5;
    const range = 6.0;
    const t = Math.min(Math.max((focal - z) / range, -1), 1);
    return 0.55 + 0.45 * (1 - Math.abs(t));
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  // ── Geometry painters ────────────────────────────────────────────────

  function buildGalaxy() {
    const geo = new THREE.BufferGeometry();
    const count = GALAXY_LUMENS;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sca = new Float32Array(count);
    const eff = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(2 * rand(-1, 1) - 1);
      const r = Math.pow(rand(0, 1), 1.6) * SIZE * 0.9;

      // Spiral arm bias
      const arm = rand(0, 1) < 0.5 ? 1 : -1;
      const spiral = 0.35 + 0.15 * Math.sin(theta * 1.7 + 1.2);

      pos[i * 3] = Math.cos(theta + arm * 0.4) * r * spiral;
      pos[i * 3 + 1] = Math.sin(theta) * r * spiral * 0.6;
      pos[i * 3 + 2] = Math.sin(phi) * r * 0.5;

      // Radial gradient toward core: brighter near center
      const t = Math.min(r / (SIZE * 0.9), 1);
      const base = 0.25 + 0.75 * (1 - t);
      col[i * 3] = PINK * base;
      col[i * 3 + 1] = MAGENTA * base * 0.85;
      col[i * 3 + 2] = base * 0.3;

      sca[i] = (rand(0.25, 0.6) * getDepthScale({ z: pos[i * 3 + 2] }));
      eff[i] = 0.35 + 0.65 * (1 - t);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sca, 1));
    geo.setAttribute("eff", new THREE.BufferAttribute(eff, 1));
    geo.setDrawRange(0, count);
    return geo;
  }

  function buildHeart() {
    const geo = new THREE.BufferGeometry();
    const count = 2600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sca = new Float32Array(count);
    const eff = new Float32Array(count);

    // Heart-ish shape via a radial profile that leans positive on top,
    // dips in a cleft, then rises again (simplified cardioid-ish lobes).
    for (let i = 0; i < count; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(2 * rand(-1, 1) - 1);

      // heart profile: 1 on upper lobes, 0.0 in cleft, 0.7 in lower lobes
      const s = Math.sin(theta);
      const lobe = (Math.pow(Math.abs(s), 0.6) * 0.5 + 0.2) * (0.6 + 0.4 * Math.cos(phi * 0.7));
      const rad = rand(0.05, 0.9) * SIZE * 0.65 * lobe;

      pos[i * 3] = Math.cos(theta) * rad;
      pos[i * 3 + 1] = Math.abs(Math.sin(theta)) * rad * 0.55 + 0.08;
      pos[i * 3 + 2] = Math.sin(phi) * rad * 0.55;

      const base = 0.9 - 0.7 * (1 - Math.min(rad / (SIZE * 0.65), 1));
      col[i * 3] = PINK * base;
      col[i * 3 + 1] = MAGENTA * base * 0.9;
      col[i * 3 + 2] = 0x332244 * base;

      sca[i] = (rand(0.15, 0.5) * getDepthScale({ z: pos[i * 3 + 2] }));
      eff[i] = 0.85 + 0.15 * Math.sin(theta * 3 + i * 0.01);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sca, 1));
    geo.setAttribute("eff", new THREE.BufferAttribute(eff, 1));
    geo.setDrawRange(0, count);
    return geo;
  }

  function buildStardust() {
    const geo = new THREE.BufferGeometry();
    const count = STARDUST;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sca = new Float32Array(count);
    const rot = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(2 * rand(-1, 1) - 1);
      const r = rand(0, SIZE * 1.2);

      pos[i * 3] = Math.cos(theta) * r * 0.9;
      pos[i * 3 + 1] = Math.sin(theta) * r * 0.7;
      pos[i * 3 + 2] = Math.sin(phi) * r * 0.6;

      const bright = rand(0.5, 1);
      col[i * 3] = PINK * bright;
      col[i * 3 + 1] = MAGENTA * bright * 0.9;
      col[i * 3 + 2] = STARDUST_WHITE * bright * 0.5;

      sca[i] = (rand(0.6, 1.6) * getDepthScale({ z: pos[i * 3 + 2] }));
      rot[i] = rand(0, Math.PI * 2);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sca, 1));
    geo.setDrawRange(0, count);
    return geo;
  }

  // ── Floaters (Orbital text + sparkle sprites) ──────────────────────

  function buildTextTexture(text) {
    // Render the phrase onto an offscreen canvas to use as the sprite map.
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);

    // Dark, translucent backdrop so small text is readable
    ctx.fillStyle = "rgba(5, 5, 8, 0.55)";
    ctx.roundRect(0, 0, 256, 256, 28);
    ctx.fill();

    ctx.font = "700 42px 'Playfair Display', 'Tinos', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glow shadow
    ctx.shadowColor = "rgba(255,20,133,0.9)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    const y = canvas.height / 2 + 2;
    ctx.fillText(text, canvas.width / 2, y);

    // Second, stronger halo for depth
    ctx.shadowColor = "rgba(255,42,133,0.6)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(255,42,133,0.95)";
    ctx.fillText(text, canvas.width / 2, y - 2);

    return new THREE.CanvasTexture(canvas);
  }

  function buildFloaters() {
    const wrap = document.getElementById("floaters");
    if (!wrap) return;
    const els = Array.from(wrap.querySelectorAll(".floater"));
    const items = [];
    const phrases = els.map((el) => el.dataset.text || "Love");

    phrases.forEach((text) => {
      const material = new THREE.SpriteMaterial({
        map: buildTextTexture(text),
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(3.6, 3.6, 1);
      sprite.userData = { text, material };
      SCENE.add(sprite);
      items.push(sprite);
    });

    return items;
  }

  // ── Interactive 3D Portals ──────────────────────────────────────────

  // Build a 3D sphere the user can click. Creates an HTML overlay that sits
  // on top of the galaxy canvas at a screen-space position matching the
  // 3D position. Launches a target page when clicked / tapped.
  function buildPortalSphere({ icon, title, sub, page, offset, scale, color }) {
    const geo = new THREE.SphereGeometry(0.18 * scale, 32, 32);
    const params = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(geo, params);
    sphere.position.set(offset.x, offset.y, offset.z);
    sphere.userData = {
      type: "portal",
      icon, title, sub, page,
      overlay: null,
      scale,
    };
    SCENE.add(sphere);
    return sphere;
  }

  // Build a small 3D indicator ring that orbits around a portal sphere
  // (decorative, not clickable).
  function buildPortalRing({ center, radius, color, speed }) {
    const geo = new THREE.RingGeometry(radius * 0.5, radius, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { center, radius, color, speed, angle: 0 };
    SCENE.add(ring);
    return ring;
  }

  // Project a 3D world position to screen coordinates relative to the
  // galaxy scene container (for positioning HTML overlays).
  function projectToScreen(vector) {
    const vec = vector.clone().unproject(camera);
    const x = (vec.x * camera.position.z) / vec.z;
    const y = (vec.y * camera.position.z) / vec.z;
    const w = SCENE.clientWidth;
    const h = SCENE.clientHeight;
    return { x: (x + 1) * w / 2, y: (y + 1) * h / 2 };
  }

  // Build click-handler on the galaxy scene and the full document.
  // Portal HTML overlays live outside the canvas, so we search the
  // document (not just the canvas) for portal overlays.
  function bindGalaxyClick() {
    const handler = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      let node = el;
      while (node) {
        if (node.classList && node.classList.contains("portal-overlay")) {
          const card = node.querySelector(".portal-card");
          if (card) {
            const data = card.dataset;
            if (data && data.page) {
              window.openPage(data.page, {
                icon: card.querySelector(".portal-icon")?.textContent || "",
                title: card.querySelector(".portal-title")?.textContent || "",
                sub: card.querySelector(".portal-sub")?.textContent || "",
              });
            }
            break;
          }
          break;
        }
        node = node.parentElement;
      }
    };

    // Mouse events
    SCENE.addEventListener("click", handler);

    // Touch events for mobile
    SCENE.addEventListener("touchstart", handler, { passive: true });
  }

  // ── Initialisation ──────────────────────────────────────────────────

  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera: perspective, orbit around the core
    camera = new THREE.PerspectiveCamera(45, SCENE.clientWidth / SCENE.clientHeight, 0.1, 1000);
    camera.position.set(0, 2.2, 6.2);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(SCENE.clientWidth, SCENE.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    SCENE.appendChild(renderer.domElement);

    // Lighting — cinematic core glow + ambient fill
    const amb = new THREE.AmbientLight(0x442266, 0.5);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const rim = new THREE.DirectionalLight(0xff2a85, 0.4);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    const coreGlow = new THREE.PointLight(PINK, 1.4, 8);
    coreGlow.position.set(0, 0, 0);
    scene.add(coreGlow);

    // ── Build groups ─────────────────────────────────────────────────
    galaxyGroup = new THREE.Group();
    galaxyGroup.position.set(0, -0.05, 0);
    scene.add(galaxyGroup);

    heartGroup = new THREE.Group();
    heartGroup.position.set(0, 0.9, 0);
    scene.add(heartGroup);

    // Galaxy disc
    const galGeo = buildGalaxy();
    const galMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const galPoints = new THREE.Points(galGeo, galMat);
    galaxyGroup.add(galPoints);

    // Heart
    const heartGeo = buildHeart();
    const heartMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const heartPoints = new THREE.Points(heartGeo, heartMat);
    heartGroup.add(heartPoints);

    // Stardust
    const dustGeo = buildStardust();
    const dustMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    starField = new THREE.Points(dustGeo, dustMat);
    scene.add(starField);

    // Floaters
    floaters = buildFloaters();

    // ── Interactive 3D Portals ───────────────────────────────────────
    // A ring of 3 clickable portals around the galaxy:
    //   ✉ Letters  |  ◈ Memories  |  ✦ Explore more
    // Each is a glowing 3D sphere floating in the galaxy.
    const portalConfigs = [
      {
        icon: "✉",
        title: "Love Letters",
        sub: "Open a letter",
        page: "letters.html",
        offset: { x: 0, y: 1.6, z: 1.6 },
        scale: 1,
        color: 0xff2a85,
      },
      {
        icon: "◈",
        title: "Memories Vault",
        sub: "Open a memory",
        page: "memories.html",
        offset: { x: 1.6, y: -1.4, z: 1.4 },
        scale: 1,
        color: 0xff1493,
      },
      {
        icon: "✦",
        title: "Explore More",
        sub: "Open another page",
        page: "index.html",
        offset: { x: -1.6, y: -1.2, z: 1.4 },
        scale: 1,
        color: 0x8a0326,
      },
    ];

    const portalSpheres = [];
    const portalRings = [];

    portalConfigs.forEach((cfg, i) => {
      const sphere = buildPortalSphere(cfg);
      portalSpheres.push(sphere);

      // Orbiting ring
      const ring = buildPortalRing({
        center: { x: cfg.offset.x, y: cfg.offset.y, z: cfg.offset.z },
        radius: 0.35,
        color: cfg.color,
        speed: 0.8 + i * 0.3,
      });
      portalRings.push(ring);

      // Tiny stardust sparkles around each portal
      const sparkleCount = 20 + Math.floor(i * 5);
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPos = new Float32Array(sparkleCount * 3);
      const sparkSca = new Float32Array(sparkleCount);
      for (let j = 0; j < sparkleCount; j++) {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(0.25, 0.7);
        sparkPos[j * 3] = Math.cos(angle) * dist;
        sparkPos[j * 3 + 1] = Math.abs(Math.sin(angle)) * dist * 0.3 + 0.05;
        sparkPos[j * 3 + 2] = Math.sin(angle) * dist * 0.5;
        sparkSca[j] = rand(0.1, 0.3);
      }
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
      const sparkMat = new THREE.PointsMaterial({
        color: cfg.color,
        size: 0.02,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      sphere.add(sparkPoints);
      sparkPoints.userData.angle = 0;
    });

    // ── Interactive 3D Portals ───────────────────────────────────────
    // Create HTML overlays for each portal sphere and position them
    // at the screen-space location of the 3D sphere.
    portalSpheres.forEach((sphere, i) => {
      const overlay = document.createElement("div");
      overlay.className = "portal-overlay";
      overlay.innerHTML =
        '<div class="portal-card portal-box">' +
        '<span class="portal-icon">' + sphere.userData.icon + '</span>' +
        '<div class="portal-title">' + sphere.userData.title + '</div>' +
        '<div class="portal-sub">' + sphere.userData.sub + '</div>' +
        '</div>' +
        '<div class="portal-sphere portal-dot"></div>';

      // Attach the page data to the overlay
      overlay.dataset.page = sphere.userData.page;
      overlay.dataset.icon = sphere.userData.icon;
      overlay.dataset.title = sphere.userData.title;
      overlay.dataset.sub = sphere.userData.sub;

      // Position over the sphere (projected to screen space)
      const pos = projectToScreen(sphere.position);
      overlay.style.left = pos.x + "px";
      overlay.style.top = pos.y + "px";

      // Make overlay clickable (pointer events)
      overlay.style.pointerEvents = "auto";
      overlay.style.cursor = "pointer";
      overlay.style.zIndex = "999";
      overlay.style.position = "fixed";

      // Add click handler to the overlay (or use document-level)
      overlay.addEventListener("click", () => {
        window.openPage(sphere.userData.page, {
          icon: sphere.userData.icon,
          title: sphere.userData.title,
          sub: sphere.userData.sub,
        });
      });

      // Insert into document body (above the canvas)
      document.body.appendChild(overlay);

      // Store the overlay on the sphere for later updates
      sphere.userData.overlay = overlay;
      portalSpheres[i].userData.overlay = overlay;
    });

    // Update portals on window resize
    window.addEventListener("resize", () => {
      portalSpheres.forEach((sphere) => {
        if (sphere.userData.overlay) {
          const pos = projectToScreen(sphere.position);
          sphere.userData.overlay.style.left = pos.x + "px";
          sphere.userData.overlay.style.top = pos.y + "px";
        }
      });
    });

    // Clock
    clock = new THREE.Clock();

    // Window resize
    const onResize = () => {
      const w = SCENE.clientWidth || window.innerWidth;
      const h = SCENE.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Expose for teardown via window.removeScene() ─────────────────
    window.removeScene = () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (renderer) {
        // Dispose all materials and geometries
        const disposeList = [galPoints, heartPoints, starField];
        for (const obj of disposeList) {
          if (obj?.geometry) obj.geometry.dispose();
          if (obj?.material) obj.material.dispose();
        }
        // Cleanup floaters (sprites + their material)
        if (floaters) {
          for (const s of floaters) {
            if (s.userData?.material) s.userData.material.dispose();
            SCENE.remove(s);
          }
        }
        renderer.dispose();
        SCENE.remove(renderer.domElement);
      }
      // Remove inbound event to avoid repeated teardown
      window.removeEventListener("resize", onResize);
      // Re-enable the entry overlay
      const overlay = document.getElementById("entryOverlay");
      if (overlay) overlay.style.display = "block";
    };

    tick();
  }

  // ── Animation loop ──────────────────────────────────────────────────

  function tick() {
    if (!running) return;
    rafId = requestAnimationFrame(tick);

    const dt = clock.getDelta();
    time += dt;

    // Galaxy arms unwind slowly
    if (galaxyGroup) galaxyGroup.rotation.y += dt * 0.06;
    if (heartGroup) heartGroup.rotation.y += dt * 0.09;

    // Central heart pulses
    const pulse = 1 + 0.12 * Math.sin(time * 1.6);
    if (heartGroup) heartGroup.scale.set(pulse, pulse, pulse);

    // Starfield gentle orbital drift
    if (starField) {
      starField.rotation.y += dt * 0.015;
      starField.position.x = Math.sin(time * 0.012) * 0.15;
      starField.position.z = Math.cos(time * 0.017) * 0.15;
    }

    // Portal spheres: gentle bob + pulse
    if (portalSpheres.length) {
      portalSpheres.forEach((sphere, i) => {
        const bob = 0.12 * Math.sin(time * 0.7 + i * 1.2);
        sphere.position.y += bob * dt * 2;
        const pulse = 1 + 0.08 * Math.sin(time * 1.2 + i);
        sphere.scale.set(pulse, pulse, pulse);
        // Ring rotation
        const ring = sphere.parent?.querySelector?.(".portal-ring");
        if (ring) {
          ring.userData.angle += dt * ring.userData.speed;
          ring.rotation.z = ring.userData.angle;
        }
      });
    }

    // Orbiting floaters
    if (floaters.length) {
      const radius = 2.4;
      floaters.forEach((s, i) => {
        const phase = i * 0.9;
        const angle = time * 0.35 + phase;
        const r = radius * (0.85 + 0.15 * Math.sin(time * 0.2 + phase));
        s.position.x = Math.cos(angle) * r;
        s.position.y = Math.abs(Math.sin(angle)) * 0.25 + 0.1;
        s.position.z = Math.sin(angle) * r * 0.5;
        s.rotation.y = angle + Math.PI / 2;
        s.material.opacity = 0.6 + 0.35 * Math.sin(time * 0.9 + i);
      });
    }

    renderer.render(scene, camera);
  }

  // ── Start ───────────────────────────────────────────────────────────

  // Wait for the scene container to be visible/ready, then build.
  const probe = () => {
    if (SCENE.isConnected && SCENE.children.length === 0 && !renderer) {
      init();
    } else if (SCENE.isConnected) {
      requestAnimationFrame(probe);
    }
  };
  // ── Page navigation ──────────────────────────────────────────────────
  // Centralize page navigation for the 3D galaxy portals. Each page's
  // own three-scene.js builds into its own #galaxyScene element.
  window.openPage = (page, { icon, title, sub } = {}) => {
    const currentGalaxy = document.getElementById("galaxyScene");
    const targetGalaxy = document.getElementById("galaxyScene");

    if (currentGalaxy && targetGalaxy && currentGalaxy === targetGalaxy) {
      // Same galaxy page — do the cross-fade between pages by swapping content.
      const overlay = document.getElementById("entryOverlay");
      const card = document.getElementById("entryCard");
      if (overlay && card) {
        overlay.style.display = "flex";
        card.style.opacity = "0";
        card.style.transform = "translateY(24px) scale(0.92)";
        void card.offsetHeight;
        card.style.transition =
          "opacity 1s ease-out, transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        card.style.opacity = "1";
        card.style.transform = "translateY(0) scale(1)";
      }
      setTimeout(() => {
        if (overlay) overlay.style.display = "none";
      }, 1200);

      // Update floaters with context-appropriate labels
      const floatersEl = document.getElementById("floaters");
      if (floatersEl) {
        const labels = {
          letters: ["Happy Birthday", "You're Magic", "My Eternal Love", "I Adore You", "Always Together", "Mi Amor"],
          memories: ["The Day We Met", "A Love Moment", "Our Trip", "Ordinary Tuesday", "A Quiet Evening", "Our Song"],
        };
        const list = labels[page] || ["Love", "Life", "Stars", "You", "Forever", "Us"];
        const items = floatersEl.querySelectorAll(".floater");
        items.forEach((el, i) => { el.dataset.text = list[i] || "Love"; });
      }
    } else {
      // Navigate to a new page via anchor
      const link = document.createElement("a");
      link.href = page;
      link.click();
    }
  };

  probe();
})();
