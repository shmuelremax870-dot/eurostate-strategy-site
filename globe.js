import * as THREE from "./vendor/three.module.min.js";

const EU_STAR_COUNT = 12;

const fallbackCanvas = document.getElementById("globeCanvas");
const stage = fallbackCanvas?.closest("[data-globe-stage], .system-stage");

if (fallbackCanvas && stage) {
  const canvas = document.createElement("canvas");
  canvas.id = "globeCanvas3D";
  canvas.className = "globe-canvas-3d";
  canvas.setAttribute(
    "aria-label",
    fallbackCanvas.getAttribute("aria-label") || "Interactive global AI signal network"
  );
  stage.replaceChild(canvas, fallbackCanvas);
  window.__three_globe_active = true;

  initGlobe(canvas, stage).catch((error) => {
    console.warn("Three.js globe init failed; restoring canvas fallback.", error);
    window.__three_globe_active = false;
    stage.classList.add("globe-stage--fallback");
    if (canvas.isConnected) canvas.replaceWith(fallbackCanvas);
    const status = stage.querySelector("[data-globe-status]");
    if (status) status.textContent = "GLOBAL MODEL STANDBY";
  });
}

async function initGlobe(targetCanvas, targetStage) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const regionLabel = targetStage.querySelector("[data-globe-region]");
  const coordinateLabel = targetStage.querySelector("[data-globe-coordinates]");
  const routeLabel = targetStage.querySelector("[data-globe-routes]");
  const statusLabel = targetStage.querySelector("[data-globe-status]");
  const geoData = await fetch("./assets/ne_110m_admin_0_countries.geojson").then((response) => {
    if (!response.ok) throw new Error("Unable to load globe geography");
    return response.json();
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.1);

  const renderer = new THREE.WebGLRenderer({
    canvas: targetCanvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  scene.add(new THREE.AmbientLight(0x3d6968, 0.24));
  const keyLight = new THREE.DirectionalLight(0xc4fff5, 3.4);
  keyLight.position.set(-4, 5, 7);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x4ad7c5, 10, 20, 2);
  rimLight.position.set(4, -2, -5);
  scene.add(rimLight);

  const globeGroup = new THREE.Group();
  globeGroup.rotation.set(-0.08, -1.82, -0.03);
  globeGroup.position.y = -0.14;
  scene.add(globeGroup);

  const sphereGeometry = new THREE.SphereGeometry(2, 96, 72);
  const oceanMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x020a0d,
    emissive: 0x021719,
    emissiveIntensity: 0.42,
    metalness: 0.36,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.22,
    transparent: true,
    opacity: 0.98,
  });
  const ocean = new THREE.Mesh(sphereGeometry, oceanMaterial);
  globeGroup.add(ocean);

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 2048;
  textureCanvas.height = 1024;
  const textureContext = textureCanvas.getContext("2d");
  const landTexture = new THREE.CanvasTexture(textureCanvas);
  landTexture.colorSpace = THREE.SRGBColorSpace;
  landTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const landMaterial = new THREE.MeshStandardMaterial({
    map: landTexture,
    color: 0xd5e4e1,
    emissive: 0x02191a,
    emissiveIntensity: 0.18,
    metalness: 0.38,
    roughness: 0.58,
    transparent: true,
    opacity: 0.96,
    alphaTest: 0.015,
    depthWrite: false,
  });
  const land = new THREE.Mesh(sphereGeometry, landMaterial);
  land.scale.setScalar(1.0045);
  land.renderOrder = 3;
  globeGroup.add(land);

  const grid = createGlobeGrid();
  grid.renderOrder = 4;
  globeGroup.add(grid);

  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.045, 0.012, 8, 180),
    new THREE.MeshBasicMaterial({
      color: 0x66f8e5,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scanRing.rotation.x = Math.PI / 2;
  scanRing.renderOrder = 6;
  globeGroup.add(scanRing);

  const atmosphere = createAtmosphere();
  atmosphere.scale.setScalar(1.18);
  atmosphere.position.y = -0.14;
  scene.add(atmosphere);

  const orbitSystem = createOrbitSystem();
  scene.add(orbitSystem.group);

  const europeanStarRing = createEuropeanStarRing();
  scene.add(europeanStarRing.group);
  targetCanvas.dataset.euStarCount = String(EU_STAR_COUNT);

  const stars = createStarField();
  scene.add(stars);

  const routes = createSignalNetwork(globeGroup);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(4, 4);
  const targetCamera = new THREE.Vector2();
  const continents = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];
  const routeCounts = {
    Europe: 12,
    Asia: 18,
    Africa: 9,
    "North America": 14,
    "South America": 8,
    Oceania: 6,
  };

  let hoveredContinent = "";
  let ambientContinent = "Europe";
  let ambientIndex = 0;
  let pointerInside = false;
  let pointerDown = false;
  let pointerMoved = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let pickPending = false;
  let isVisible = true;

  renderLandTexture(ambientContinent, false);
  updateReadout("", null);

  const ambientTimer = window.setInterval(() => {
    if (reducedMotion || pointerInside || document.hidden) return;
    ambientIndex = (ambientIndex + 1) % continents.length;
    ambientContinent = continents[ambientIndex];
    renderLandTexture(ambientContinent, false);
    if (statusLabel) statusLabel.textContent = `SCANNING ${ambientContinent.toUpperCase()}`;
  }, 4200);

  const stageObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
    },
    { threshold: 0.04 }
  );
  stageObserver.observe(targetStage);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(targetStage);
  resize();

  targetCanvas.addEventListener("pointerenter", () => {
    pointerInside = true;
    targetCanvas.classList.add("is-active");
  });

  targetCanvas.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    pointerMoved = false;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    targetCanvas.setPointerCapture(event.pointerId);
    targetCanvas.classList.add("is-dragging");
  });

  targetCanvas.addEventListener("pointermove", (event) => {
    const rect = targetCanvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    pointer.x = (localX / rect.width) * 2 - 1;
    pointer.y = -(localY / rect.height) * 2 + 1;
    targetCamera.set(pointer.x * 0.22, pointer.y * 0.13);

    if (pointerDown) {
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      pointerMoved = pointerMoved || Math.abs(deltaX) + Math.abs(deltaY) > 2;
      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x = THREE.MathUtils.clamp(
        globeGroup.rotation.x + deltaY * 0.003,
        -0.46,
        0.38
      );
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    } else {
      pointerMoved = false;
    }

    pickPending = true;
  });

  const releasePointer = (event) => {
    pointerDown = false;
    targetCanvas.classList.remove("is-dragging");
    if (targetCanvas.hasPointerCapture(event.pointerId)) {
      targetCanvas.releasePointerCapture(event.pointerId);
    }
  };

  targetCanvas.addEventListener("pointerup", releasePointer);
  targetCanvas.addEventListener("pointercancel", releasePointer);
  targetCanvas.addEventListener("pointerleave", (event) => {
    pointerInside = false;
    releasePointer(event);
    pointer.set(4, 4);
    targetCamera.set(0, 0);
    setHoveredContinent("", null);
    targetCanvas.classList.remove("is-active");
  });

  let previousTime = performance.now();

  function animate(time) {
    window.requestAnimationFrame(animate);
    if (!isVisible || document.hidden) return;

    const delta = Math.min(40, time - previousTime);
    previousTime = time;

    if (!reducedMotion && !pointerDown) {
      globeGroup.rotation.y += delta * 0.000075;
    }

    camera.position.x += (targetCamera.x - camera.position.x) * 0.035;
    camera.position.y += (targetCamera.y - camera.position.y) * 0.035;
    camera.lookAt(0, -0.12, 0);

    if (pickPending && pointerInside && !pointerMoved) {
      pickPending = false;
      pickContinent();
    }

    const seconds = time * 0.001;
    scanRing.rotation.y = reducedMotion ? 0.35 : seconds * 0.32;
    scanRing.rotation.z = reducedMotion ? 0.08 : Math.sin(seconds * 0.42) * 0.18;
    scanRing.material.opacity = reducedMotion ? 0.12 : 0.11 + Math.sin(seconds * 1.4) * 0.025;
    atmosphere.material.uniforms.uTime.value = reducedMotion ? 0 : seconds;
    stars.rotation.y = reducedMotion ? 0 : seconds * 0.006;

    europeanStarRing.stars.forEach((star, index) => {
      const shimmer = reducedMotion ? 1 : 1 + Math.sin(seconds * 0.5 + index * 0.8) * 0.012;
      star.scale.setScalar(shimmer);
    });

    orbitSystem.rings.forEach((ring, index) => {
      if (!reducedMotion) ring.rotation.z += delta * (0.000018 + index * 0.000006);
    });
    orbitSystem.pulses.forEach((pulse, index) => {
      const angle = reducedMotion ? index * 1.7 : seconds * (0.42 + index * 0.05) + index * 2.1;
      pulse.mesh.position.set(
        Math.cos(angle) * pulse.radius,
        Math.sin(angle) * pulse.radius,
        0
      );
      pulse.mesh.scale.setScalar(reducedMotion ? 0.85 : 0.7 + Math.sin(seconds * 4 + index) * 0.2);
    });

    routes.forEach((route, index) => {
      const progress = reducedMotion ? (index + 1) / (routes.length + 1) : (seconds * route.speed + route.offset) % 1;
      route.pulse.position.copy(route.curve.getPointAt(progress));
      route.pulse.scale.setScalar(reducedMotion ? 0.85 : 0.72 + Math.sin(seconds * 5 + index) * 0.25);
    });

    renderer.render(scene, camera);
  }

  animate(performance.now());

  function resize() {
    const rect = targetStage.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 640 ? 7.45 : width < 900 ? 7.2 : 6.9;
    camera.updateProjectionMatrix();
    const scale = width < 440 ? 0.84 : width < 700 ? 0.94 : 1;
    globeGroup.scale.setScalar(scale);
    orbitSystem.group.scale.setScalar(scale);
    europeanStarRing.group.scale.setScalar(scale);
    atmosphere.scale.setScalar(1.18 * scale);
  }

  function pickContinent() {
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const intersection = raycaster.intersectObject(land, false)[0];
    if (!intersection?.uv) {
      setHoveredContinent("", null);
      return;
    }

    const longitude = intersection.uv.x * 360 - 180;
    const latitude = intersection.uv.y * 180 - 90;
    const feature = findFeature(longitude, latitude);
    const continent = feature?.properties?.CONTINENT || "";
    setHoveredContinent(continent === "Antarctica" ? "" : continent, { latitude, longitude });
  }

  function findFeature(longitude, latitude) {
    return geoData.features.find((feature) => {
      const bbox = feature.bbox;
      if (bbox && latitude >= bbox[1] && latitude <= bbox[3]) {
        const spansDateline = bbox[2] - bbox[0] > 300;
        if (!spansDateline && (longitude < bbox[0] || longitude > bbox[2])) return false;
      } else if (bbox) {
        return false;
      }
      return pointInGeometry(longitude, latitude, feature.geometry);
    });
  }

  function setHoveredContinent(continent, coordinates) {
    if (continent === hoveredContinent) {
      if (coordinates) updateReadout(continent, coordinates);
      return;
    }

    hoveredContinent = continent;
    renderLandTexture(continent || ambientContinent, Boolean(continent));
    updateReadout(continent, coordinates);

    routes.forEach((route) => {
      const isRelated = !continent || route.continents.includes(continent);
      route.line.material.opacity = continent ? (isRelated ? 0.5 : 0.035) : 0.18;
      route.pulse.material.opacity = continent ? (isRelated ? 0.72 : 0.08) : 0.56;
    });
  }

  function updateReadout(continent, coordinates) {
    if (regionLabel) regionLabel.textContent = continent || "Global signal network";
    if (routeLabel) routeLabel.textContent = `${routeCounts[continent] || routes.length} ACTIVE ROUTES`;
    if (statusLabel) statusLabel.textContent = continent ? "CONTINENT SIGNAL LOCK" : "WORLD MODEL / LIVE";
    if (coordinateLabel) {
      coordinateLabel.textContent = coordinates
        ? `LAT ${formatCoordinate(coordinates.latitude)} · LON ${formatCoordinate(coordinates.longitude)}`
        : "MULTI-MARKET INTELLIGENCE GRID";
    }
  }

  function renderLandTexture(activeContinent, directHover) {
    const width = textureCanvas.width;
    const height = textureCanvas.height;
    textureContext.clearRect(0, 0, width, height);

    geoData.features.forEach((feature) => {
      const continent = feature.properties.CONTINENT;
      const isActive = continent === activeContinent;
      const palette = continentPalette(continent);
      textureContext.save();
      textureContext.fillStyle = isActive
        ? directHover
          ? "rgba(86, 205, 192, 0.96)"
          : "rgba(65, 132, 128, 0.9)"
        : palette.fill;
      textureContext.strokeStyle = isActive ? "rgba(195, 240, 232, 0.92)" : palette.stroke;
      textureContext.lineWidth = isActive ? 1.45 : 0.5;
      textureContext.shadowColor = isActive ? "rgba(69, 205, 190, 0.72)" : "transparent";
      textureContext.shadowBlur = isActive ? (directHover ? 10 : 4) : 0;
      drawGeometry(textureContext, feature.geometry, width, height);
      textureContext.restore();
    });

    landTexture.needsUpdate = true;
  }

  function createGlobeGrid() {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x75e5d8,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let latitude = -60; latitude <= 60; latitude += 20) {
      const points = [];
      for (let longitude = -180; longitude <= 180; longitude += 3) {
        points.push(latLonToVector(latitude, longitude, 2.026));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }

    for (let longitude = -150; longitude < 180; longitude += 30) {
      const points = [];
      for (let latitude = -88; latitude <= 88; latitude += 3) {
        points.push(latLonToVector(latitude, longitude, 2.026));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }

    return group;
  }

  function createAtmosphere() {
    return new THREE.Mesh(
      new THREE.SphereGeometry(2, 72, 56),
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x47e7d3) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            float rim = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
            float pulse = 0.86 + sin(uTime * 0.8 + vWorldPosition.y * 3.0) * 0.04;
            gl_FragColor = vec4(uColor, rim * pulse * 0.36);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
  }

  function createOrbitSystem() {
    const group = new THREE.Group();
    group.position.y = -0.14;
    const rings = [];
    const pulses = [];
    const ringConfigs = [
      { radius: 2.62, x: 0.86, y: 0.22, color: 0x62cfc4, opacity: 0.1 },
    ];

    ringConfigs.forEach((config, index) => {
      const ring = new THREE.Group();
      ring.rotation.set(config.x, config.y, index * 0.46);
      const line = new THREE.Mesh(
        new THREE.TorusGeometry(config.radius, 0.006, 6, 180),
        new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: config.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.add(line);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 12, 10),
        new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: 0.38,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.add(pulse);
      group.add(ring);
      rings.push(ring);
      pulses.push({ mesh: pulse, radius: config.radius });
    });

    return { group, rings, pulses };
  }

  function createStarField() {
    const positions = [];
    let seed = 4129;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let index = 0; index < 240; index += 1) {
      const radius = 7 + random() * 9;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xd7fffa,
        size: 0.015,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
  }

  function createEuropeanStarRing() {
    const group = new THREE.Group();
    const starLayer = new THREE.Group();
    const stars = [];
    const orbitRadius = 2.25;
    group.position.set(0, -0.14, 0.08);
    group.name = "european-sovereign-star-ring";

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(orbitRadius, 0.004, 6, 192),
      new THREE.MeshBasicMaterial({
        color: 0xd8aa53,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    orbit.renderOrder = 10;
    group.add(orbit);

    const shape = new THREE.Shape();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? 0.054 : 0.023;
      const angle = -Math.PI / 2 + (point * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      curveSegments: 2,
      steps: 1,
    });
    geometry.center();

    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58a43,
      emissive: 0x3f2708,
      emissiveIntensity: 0.38,
      metalness: 0.88,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      depthWrite: false,
    });
    const glowTexture = createRadialGlowTexture();

    for (let index = 0; index < EU_STAR_COUNT; index += 1) {
      const angle = Math.PI / 2 - (index * Math.PI * 2) / EU_STAR_COUNT;
      const star = new THREE.Group();
      star.name = `eu-star-${index + 1}`;
      star.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
      star.userData.euStar = true;

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: 0xf2bc55,
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        })
      );
      glow.scale.set(0.2, 0.2, 1);
      glow.renderOrder = 10;
      star.add(glow);

      const starMesh = new THREE.Mesh(geometry, starMaterial);
      starMesh.renderOrder = 11;
      star.add(starMesh);
      starLayer.add(star);
      stars.push(star);
    }

    group.add(starLayer);
    return { group, stars };
  }

  function createRadialGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 225, 154, 0.9)");
    gradient.addColorStop(0.18, "rgba(237, 180, 75, 0.42)");
    gradient.addColorStop(1, "rgba(237, 180, 75, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function createSignalNetwork(parent) {
    const hubs = [
      { name: "Cyprus", continent: "Europe", lat: 35.12, lon: 33.38 },
      { name: "London", continent: "Europe", lat: 51.5, lon: -0.12 },
      { name: "New York", continent: "North America", lat: 40.71, lon: -74 },
      { name: "Sao Paulo", continent: "South America", lat: -23.55, lon: -46.63 },
      { name: "Lagos", continent: "Africa", lat: 6.52, lon: 3.38 },
      { name: "Dubai", continent: "Asia", lat: 25.2, lon: 55.27 },
      { name: "Singapore", continent: "Asia", lat: 1.35, lon: 103.82 },
      { name: "Sydney", continent: "Oceania", lat: -33.87, lon: 151.21 },
    ];
    const connections = [
      [0, 1], [0, 2], [0, 4], [0, 5], [0, 6], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7],
    ];

    hubs.forEach((hub, index) => {
      const normal = latLonToVector(hub.lat, hub.lon, 1).normalize();
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(index === 0 ? 0.045 : 0.027, 14, 12),
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0xf2c978 : 0x6effe9,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      node.position.copy(normal.clone().multiplyScalar(2.075));
      parent.add(node);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.066, 24),
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0xf2c978 : 0x6effe9,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.position.copy(normal.clone().multiplyScalar(2.083));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      parent.add(ring);
    });

    return connections.map(([fromIndex, toIndex], index) => {
      const fromHub = hubs[fromIndex];
      const toHub = hubs[toIndex];
      const from = latLonToVector(fromHub.lat, fromHub.lon, 2.07);
      const to = latLonToVector(toHub.lat, toHub.lon, 2.07);
      const lift = 2.55 + Math.min(0.38, from.distanceTo(to) * 0.12);
      const middle = from.clone().add(to).normalize().multiplyScalar(lift);
      const curve = new THREE.QuadraticBezierCurve3(from, middle, to);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(72)),
        new THREE.LineBasicMaterial({
          color: index % 3 === 0 ? 0xe2b96c : 0x63efdd,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      line.renderOrder = 8;
      parent.add(line);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 12, 10),
        new THREE.MeshBasicMaterial({
          color: index % 3 === 0 ? 0xf4cf84 : 0xcafff7,
          transparent: true,
          opacity: 0.56,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      pulse.renderOrder = 9;
      parent.add(pulse);

      return {
        curve,
        line,
        pulse,
        speed: 0.08 + (index % 4) * 0.014,
        offset: index * 0.113,
        continents: [fromHub.continent, toHub.continent],
      };
    });
  }

  function latLonToVector(latitude, longitude, radius) {
    const phi = THREE.MathUtils.degToRad(90 - latitude);
    const theta = THREE.MathUtils.degToRad(longitude + 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function pointInGeometry(longitude, latitude, geometry) {
    if (!geometry) return false;
    if (geometry.type === "Polygon") {
      return pointInPolygon(longitude, latitude, geometry.coordinates);
    }
    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.some((polygon) => pointInPolygon(longitude, latitude, polygon));
    }
    return false;
  }

  function pointInPolygon(longitude, latitude, rings) {
    if (!rings.length || !pointInRing(longitude, latitude, rings[0])) return false;
    return !rings.slice(1).some((ring) => pointInRing(longitude, latitude, ring));
  }

  function pointInRing(longitude, latitude, ring) {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
      let currentLongitude = ring[index][0];
      let previousLongitude = ring[previous][0];
      while (currentLongitude - longitude > 180) currentLongitude -= 360;
      while (currentLongitude - longitude < -180) currentLongitude += 360;
      while (previousLongitude - longitude > 180) previousLongitude -= 360;
      while (previousLongitude - longitude < -180) previousLongitude += 360;
      const currentLatitude = ring[index][1];
      const previousLatitude = ring[previous][1];
      const intersects =
        currentLatitude > latitude !== previousLatitude > latitude &&
        longitude <
          ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
            (previousLatitude - currentLatitude || Number.EPSILON) +
            currentLongitude;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function drawGeometry(context, geometry, width, height) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    polygons.forEach((rings) => {
      context.beginPath();
      rings.forEach((ring) => drawRing(context, ring, width, height));
      context.fill("evenodd");
      context.stroke();
    });
  }

  function drawRing(context, ring, width, height) {
    const points = ring.map(([longitude, latitude]) => [
      ((longitude + 180) / 360) * width,
      ((90 - latitude) / 180) * height,
    ]);

    for (let index = 1; index < points.length; index += 1) {
      while (points[index][0] - points[index - 1][0] > width / 2) points[index][0] -= width;
      while (points[index][0] - points[index - 1][0] < -width / 2) points[index][0] += width;
    }

    [-width, 0, width].forEach((offset) => {
      context.moveTo(points[0][0] + offset, points[0][1]);
      points.slice(1).forEach(([x, y]) => context.lineTo(x + offset, y));
      context.closePath();
    });
  }

  function continentPalette(continent) {
    const palettes = {
      Europe: { fill: "rgba(55, 104, 103, 0.9)", stroke: "rgba(131, 200, 191, 0.62)" },
      Asia: { fill: "rgba(41, 76, 82, 0.88)", stroke: "rgba(105, 165, 169, 0.48)" },
      Africa: { fill: "rgba(47, 78, 78, 0.88)", stroke: "rgba(117, 176, 167, 0.5)" },
      "North America": { fill: "rgba(43, 81, 79, 0.88)", stroke: "rgba(111, 174, 162, 0.48)" },
      "South America": { fill: "rgba(40, 72, 72, 0.88)", stroke: "rgba(101, 160, 151, 0.46)" },
      Oceania: { fill: "rgba(45, 74, 80, 0.86)", stroke: "rgba(108, 161, 165, 0.44)" },
      Antarctica: { fill: "rgba(93, 111, 113, 0.34)", stroke: "rgba(180, 202, 202, 0.26)" },
    };
    return palettes[continent] || { fill: "rgba(42, 76, 76, 0.86)", stroke: "rgba(105, 165, 157, 0.44)" };
  }

  function formatCoordinate(value) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}°`;
  }

  window.addEventListener("beforeunload", () => {
    window.clearInterval(ambientTimer);
    resizeObserver.disconnect();
    stageObserver.disconnect();
    renderer.dispose();
  });
}
