/* =========================================================================
   Eurostate Strategy — Calm interactions + clean abstract globe
   Self-contained: no external CDN fetches, no topojson.
   ========================================================================= */

(function () {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ----- Theme toggle --------------------------------------------------- */
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current =
        root.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const next = current === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("es-theme", next); } catch (_) {}
    });
  }

  /* ----- Scroll progress + header state -------------------------------- */
  const header = document.querySelector("[data-header]");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty("--scroll-progress", String(ratio));
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ----- Reveal on scroll --------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ----- Nav active link ----------------------------------------------- */
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const navTargets = navLinks
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);
  if (navTargets.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === `#${visible.target.id}`)
        );
      },
      { threshold: [0.2, 0.4], rootMargin: "-20% 0px -50% 0px" }
    );
    navTargets.forEach((s) => navObserver.observe(s));
  }

  /* ----- Architecture switcher ----------------------------------------- */
  const architectureModes = {
    intelligence: { title: "Signal Intelligence", copy: "Market gap, category thesis, and demand surface." },
    architecture: { title: "AI Architecture",     copy: "Agents, workflows, data flows, orchestration, and model logic." },
    product:      { title: "Productization",      copy: "UX, platform surface, operating workflows, and launch assets." },
    market:       { title: "Market Layer",        copy: "Commercial path, licensing structures, rollout systems, and global category position." },
  };
  const architectureButtons = [...document.querySelectorAll("[data-architecture-mode]")];
  const archTitle = document.querySelector("[data-arch-title]");
  const archCopy  = document.querySelector("[data-arch-copy]");
  function setArchMode(mode) {
    const sel = architectureModes[mode];
    if (!sel) return;
    architectureButtons.forEach((b) => {
      const active = b.dataset.architectureMode === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    const apply = () => {
      if (archTitle) archTitle.textContent = sel.title;
      if (archCopy)  archCopy.textContent  = sel.copy;
    };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }
  architectureButtons.forEach((b) =>
    b.addEventListener("click", () => setArchMode(b.dataset.architectureMode))
  );

  /* ----- Signal rows pulse --------------------------------------------- */
  const signalRows = [...document.querySelectorAll("[data-signal-row]")];
  if (!reducedMotion && signalRows.length) {
    let i = 0;
    setInterval(() => {
      signalRows.forEach((r, idx) => r.classList.toggle("active", idx === i));
      i = (i + 1) % signalRows.length;
    }, 2200);
  }

  /* ----- Portfolio selector -------------------------------------------- */
  const productData = {
    influemint: { category: "AI Commerce Platform", role: "Product ecosystem" },
    "studio-rocket": { category: "AI Product Brand", role: "Launch infrastructure" },
  };
  const productCards = [...document.querySelectorAll("[data-product]")];
  const dcat  = document.querySelector("[data-detail-category]");
  const drole = document.querySelector("[data-detail-role]");
  function setProduct(key) {
    const p = productData[key];
    if (!p) return;
    productCards.forEach((c) => c.classList.toggle("is-active", c.dataset.product === key));
    const apply = () => {
      if (dcat)  dcat.textContent  = p.category;
      if (drole) drole.textContent = p.role;
    };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }
  productCards.forEach((c) => {
    c.addEventListener("click", () => setProduct(c.dataset.product));
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setProduct(c.dataset.product);
      }
    });
  });

  /* =========================================================================
     CANVAS — Hero ambient dust + clean abstract globe (mint/green only)
     ========================================================================= */
  function getColors() {
    const cs = getComputedStyle(root);
    return {
      accent:  cs.getPropertyValue("--accent").trim()   || "#64ffda",
      accent2: cs.getPropertyValue("--accent-2").trim() || "#d4a373",
      text:    cs.getPropertyValue("--text").trim()     || "#f1f3f5",
      muted:   cs.getPropertyValue("--muted").trim()    || "#9aa3ad",
      bg:      cs.getPropertyValue("--bg").trim()       || "#06080a",
    };
  }
  let palette = getColors();
  if (themeBtn) themeBtn.addEventListener("click", () => setTimeout(() => { palette = getColors(); }, 50));

  function hexToRgba(hex, a) {
    if (!hex) return `rgba(100,255,218,${a})`;
    const v = hex.replace("#", "");
    const n = v.length === 3
      ? v.split("").map((c) => parseInt(c + c, 16))
      : [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
    return `rgba(${n[0]},${n[1]},${n[2]},${a})`;
  }

  function setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { alpha: true });
    const state = { ctx, w: 0, h: 0, dpr: 1, visible: false };
    function resize() {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.max(1, Math.floor(box.width));
      state.h = Math.max(1, Math.floor(box.height));
      state.dpr = dpr;
      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    });
    const io = new IntersectionObserver(
      ([entry]) => (state.visible = entry.isIntersecting),
      { threshold: 0.01 }
    );
    io.observe(canvas);
    return state;
  }

  /* ----- Hero ambient: drifting mint particles ------------------------ */
  const heroCanvas = document.getElementById("heroCanvas");
  const heroState = setupCanvas(heroCanvas);
  const dust = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    s: 0.4 + Math.random() * 1.1,
    vy: 0.00015 + Math.random() * 0.0003,
    a: 0.1 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }));
  function drawHero(time) {
    if (!heroState || !heroState.visible) return;
    const { ctx, w, h } = heroState;
    ctx.clearRect(0, 0, w, h);
    for (const d of dust) {
      const y = ((d.y + time * d.vy) % 1) * h;
      const flicker = 0.6 + Math.sin(time * 0.0012 + d.phase) * 0.4;
      ctx.beginPath();
      ctx.arc(d.x * w, y, d.s, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(palette.accent, d.a * flicker * 0.5);
      ctx.fill();
    }
  }

  /* =========================================================================
     ABSTRACT GLOBE — graticule sphere, mint/green only, premium feel
     ========================================================================= */
  const globeCanvas = document.getElementById("globeCanvas");
  const globeState = setupCanvas(globeCanvas);

  // Hub cities (anchor points only — for arcs and markers)
  const hubs = [
    { name: "Limassol", lon: 33.04, lat: 34.71, home: true },
    { name: "London",   lon: -0.13, lat: 51.51 },
    { name: "New York", lon: -74.0, lat: 40.71 },
    { name: "San Francisco", lon: -122.42, lat: 37.77 },
    { name: "Tokyo",    lon: 139.69, lat: 35.69 },
    { name: "Singapore",lon: 103.82, lat: 1.35 },
    { name: "Dubai",    lon: 55.27, lat: 25.20 },
    { name: "São Paulo",lon: -46.63, lat: -23.55 },
    { name: "Berlin",   lon: 13.4,  lat: 52.52 },
    { name: "Bangalore",lon: 77.59, lat: 12.97 },
    { name: "Sydney",   lon: 151.21, lat: -33.86 },
  ];
  const arcDestinations = hubs.map((_, i) => i).filter((i) => !hubs[i].home);

  /* ----- Inline continent outlines (simplified, no external fetch) ----- */
  // Each polygon is a closed ring of [lon, lat] points. Recognizable
  // landmasses only — enough to read as Earth.
  const CONTINENTS = [
    // North America (mainland)
    [[-168,66],[-156,71],[-138,70],[-122,71],[-102,72],[-90,70],[-78,72],
     [-65,67],[-58,52],[-53,48],[-62,45],[-69,44],[-74,40],[-76,37],
     [-78,35],[-80,32],[-80,26],[-82,25],[-83,30],[-87,30],[-94,29],
     [-97,26],[-91,19],[-87,21],[-83,16],[-83,9],[-87,13],[-95,16],
     [-103,18],[-110,23],[-115,29],[-117,33],[-122,37],[-124,42],
     [-124,48],[-130,54],[-138,59],[-148,60],[-155,58],[-162,55],
     [-168,66]],
    // South America
    [[-78,12],[-72,11],[-63,11],[-52,4],[-50,0],[-44,-2],[-39,-9],
     [-37,-12],[-39,-16],[-41,-22],[-48,-27],[-58,-34],[-62,-39],
     [-66,-45],[-69,-50],[-72,-54],[-74,-50],[-73,-43],[-72,-37],
     [-72,-30],[-71,-22],[-71,-15],[-77,-8],[-81,-5],[-80,-2],
     [-79,3],[-78,12]],
    // Europe (Iberia + Western Europe + Scandinavia + Baltic + Med)
    [[-9,36],[-9,43],[-1,43],[3,44],[3,48],[-1,49],[0,51],[4,51],
     [7,54],[10,54],[11,57],[8,58],[5,58],[5,62],[10,64],[14,67],
     [20,70],[27,71],[31,69],[28,65],[24,60],[28,60],[30,59],[27,55],
     [22,57],[18,55],[14,54],[12,55],[10,57],[9,54],[6,53],[4,51],
     [3,50],[2,48],[3,46],[7,44],[10,44],[12,46],[14,45],[14,42],
     [18,41],[20,39],[18,40],[14,40],[12,38],[8,38],[5,40],[0,40],
     [-3,37],[-9,36]],
    // Africa
    [[-17,28],[-12,25],[-3,18],[3,9],[9,4],[10,-2],[13,-8],[14,-15],
     [17,-22],[20,-30],[22,-34],[25,-34],[31,-30],[34,-27],[34,-24],
     [35,-21],[37,-15],[40,-10],[42,-3],[44,4],[51,11],[51,12],
     [44,12],[39,15],[37,18],[33,22],[31,28],[26,32],[19,32],[10,33],
     [0,35],[-7,33],[-10,30],[-13,28],[-17,28]],
    // Asia mainland (Arabia + south Asia + Far East + Siberia)
    [[34,38],[40,40],[48,42],[55,42],[58,40],[57,36],[55,28],[50,25],
     [49,19],[52,16],[55,13],[60,22],[67,25],[71,23],[68,15],[72,18],
     [73,15],[76,8],[80,8],[81,14],[88,21],[92,21],[97,16],[99,11],
     [102,7],[105,1],[109,11],[108,18],[110,22],[114,22],[117,23],
     [121,28],[122,32],[125,36],[128,39],[130,42],[132,45],[135,48],
     [140,52],[144,57],[154,60],[160,60],[166,66],[170,69],[178,69],
     [178,71],[160,72],[140,74],[120,75],[100,77],[80,75],[60,73],
     [50,69],[42,67],[34,67],[33,62],[37,58],[40,55],[37,50],[34,45],
     [34,38]],
    // Indian subcontinent (peninsula) — partly duplicated for clarity
    [[72,20],[73,15],[76,10],[78,8],[80,9],[80,14],[82,17],[85,20],
     [88,21],[88,22],[80,15],[73,20],[72,20]],
    // SE Asia / Indonesia (rough)
    [[95,5],[100,1],[105,0],[112,-3],[120,-5],[127,-3],[133,-2],
     [140,-3],[135,-5],[123,-9],[115,-9],[105,-7],[100,-3],[95,5]],
    // Australia
    [[114,-22],[115,-31],[119,-34],[127,-32],[131,-32],[140,-37],
     [143,-39],[149,-37],[152,-32],[153,-25],[146,-19],[140,-17],
     [135,-15],[129,-15],[125,-14],[119,-17],[114,-22]],
    // Greenland
    [[-46,82],[-22,82],[-15,79],[-22,71],[-32,67],[-44,68],[-52,73],
     [-54,76],[-50,80],[-46,82]],
    // UK
    [[-5,58],[-3,59],[-1,57],[1,55],[1,52],[-1,51],[-4,50],[-6,52],
     [-8,54],[-7,56],[-5,58]],
    // Ireland
    [[-10,55],[-7,55],[-6,52],[-9,52],[-10,55]],
    // Japan
    [[131,32],[136,34],[140,36],[142,40],[145,44],[141,45],[137,42],
     [135,38],[132,34],[131,32]],
    // Madagascar
    [[44,-12],[49,-13],[50,-19],[47,-25],[44,-24],[43,-19],[44,-12]],
    // New Zealand
    [[171,-41],[174,-37],[177,-39],[176,-43],[170,-46],[167,-46],
     [167,-43],[171,-41]],
    // Iceland
    [[-24,64],[-14,64],[-13,66],[-18,67],[-23,67],[-24,64]],
  ];

  // Pre-compute centroids for shading
  const continentMeta = CONTINENTS.map((ring) => {
    let sx = 0, sy = 0;
    ring.forEach(([lon, lat]) => { sx += lon; sy += lat; });
    const n = ring.length || 1;
    return { ring, centroid: [sx / n, sy / n] };
  });

  // Point-in-polygon (ray cast on lon/lat plane)
  function pointInRing(lon, lat, ring) {
    let inside = false;
    const N = ring.length;
    for (let i = 0, j = N - 1; i < N; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function pointOnLand(lon, lat) {
    for (const m of continentMeta) if (pointInRing(lon, lat, m.ring)) return true;
    return false;
  }

  /* ----- Bentley starlight: dense sparkles inside continents --------- */
  // Uniform sampling on the sphere by inverse-CDF (so high latitudes
  // aren't over-sampled), then reject anything not on land.
  const SPARKLE_TARGET = 520;
  const sparkles = [];
  let attempts = 0;
  while (sparkles.length < SPARKLE_TARGET && attempts < 24000) {
    attempts++;
    const lon = -180 + Math.random() * 360;
    const lat = Math.asin(2 * Math.random() - 1) * 180 / Math.PI; // uniform on sphere
    if (!pointOnLand(lon, lat)) continue;
    sparkles.push({
      lon, lat,
      phase: Math.random() * Math.PI * 2,
      // Slow, luxurious twinkle — period 5–14 seconds
      rate: 0.00045 + Math.random() * 0.0009,
      baseSize: 0.45 + Math.random() * 0.9,
      baseAlpha: 0.28 + Math.random() * 0.42,
      // ~10% are "feature stars" with subtle halo
      feature: Math.random() < 0.10,
      // ~30% are mostly steady (won't twinkle much)
      steady: Math.random() < 0.30,
    });
  }


  const liveArcs = [];
  const hubBursts = [];

  function spawnArc() {
    if (liveArcs.length > 3) return;
    const toIdx = arcDestinations[Math.floor(Math.random() * arcDestinations.length)];
    // 70% mint, 30% sand — no blue/indigo
    const tier = Math.random() < 0.7 ? "accent" : "accent2";
    liveArcs.push({
      from: 0,
      to: toIdx,
      t: 0,
      speed: 0.00035 + Math.random() * 0.00025,
      lifetime: 1.0,
      tier,
    });
    hubBursts.push({ idx: 0, t: 0, tier });
  }
  let arcTimer = 0;

  // Static stars — neutral text + sand (no indigo / no blue)
  const stars = Array.from({ length: 80 }, () => {
    const r = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      s: 0.35 + Math.random() * 1.0,
      a: 0.12 + Math.random() * 0.28,
      tier: r < 0.75 ? "text" : "sand",
    };
  });

  // 3D math
  function unitVec(lon, lat) {
    const lambda = lon * Math.PI / 180;
    const phi    = lat * Math.PI / 180;
    const c = Math.cos(phi);
    return { x: c * Math.sin(lambda), y: Math.sin(phi), z: c * Math.cos(lambda) };
  }
  function rotateAndTilt(v, rotation, tilt) {
    const lambda = rotation * Math.PI / 180;
    const cosR = Math.cos(lambda), sinR = Math.sin(lambda);
    let x = v.x * cosR + v.z * sinR;
    let z = -v.x * sinR + v.z * cosR;
    let y = v.y;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const y2 =  y * cosT - z * sinT;
    const z2 =  y * sinT + z * cosT;
    return { x, y: y2, z: z2 };
  }
  function project(lon, lat, rotation, cx, cy, r, tilt) {
    const v = unitVec(lon, lat);
    const p = rotateAndTilt(v, rotation, tilt);
    return { x: cx + r * p.x, y: cy - r * p.y, z: p.z, visible: p.z > -0.01 };
  }
  function projectVec(v, rotation, cx, cy, r, tilt, scale) {
    const p = rotateAndTilt(v, rotation, tilt);
    const s = scale || 1;
    return { x: cx + r * p.x * s, y: cy - r * p.y * s, z: p.z, visible: p.z > -0.01 };
  }
  // Horizon-clipped ring drawer (closes via rim arc on partial visibility)
  function drawClippedRing(ctx, ring, rotation, cx, cy, r, tilt) {
    const N = ring.length;
    if (N < 3) return;
    const pts = new Array(N);
    for (let i = 0; i < N; i++) {
      const [lon, lat] = ring[i];
      const v = unitVec(lon, lat);
      const p = rotateAndTilt(v, rotation, tilt);
      pts[i] = { x: cx + r * p.x, y: cy - r * p.y, z: p.z };
    }
    let frontCount = 0;
    for (let i = 0; i < N; i++) if (pts[i].z > 0) frontCount++;
    if (frontCount === 0) return;
    if (frontCount === N) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < N; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }
    const snapRim = (p) => {
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6) return { x: cx + r, y: cy };
      return { x: cx + dx / d * r, y: cy + dy / d * r };
    };
    let start = 0;
    for (let i = 0; i < N; i++) {
      if (pts[i].z <= 0) { start = i; break; }
    }
    const runs = [];
    let cur = null;
    for (let k = 0; k < N; k++) {
      const ai = (start + k) % N;
      const bi = (start + k + 1) % N;
      const a = pts[ai], b = pts[bi];
      if (a.z > 0 && b.z > 0) {
        if (!cur) { cur = { start: a, mids: [], end: null }; runs.push(cur); }
        cur.mids.push(a);
      } else if (a.z > 0 && b.z <= 0) {
        if (!cur) { cur = { start: a, mids: [], end: null }; runs.push(cur); }
        cur.mids.push(a);
        const t = a.z / (a.z - b.z);
        const hx = a.x + (b.x - a.x) * t;
        const hy = a.y + (b.y - a.y) * t;
        cur.end = snapRim({ x: hx, y: hy });
        cur = null;
      } else if (a.z <= 0 && b.z > 0) {
        const t = -a.z / (b.z - a.z);
        const hx = a.x + (b.x - a.x) * t;
        const hy = a.y + (b.y - a.y) * t;
        cur = { start: snapRim({ x: hx, y: hy }), mids: [], end: null };
        runs.push(cur);
      }
    }
    if (runs.length === 0) return;
    ctx.beginPath();
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (i === 0) ctx.moveTo(run.start.x, run.start.y);
      else {
        const prev = runs[i - 1];
        if (prev.end) {
          const a1 = Math.atan2(prev.end.y - cy, prev.end.x - cx);
          const a2 = Math.atan2(run.start.y - cy, run.start.x - cx);
          ctx.arc(cx, cy, r, a1, a2, false);
        }
      }
      for (const m of run.mids) ctx.lineTo(m.x, m.y);
      if (run.end) ctx.lineTo(run.end.x, run.end.y);
    }
    const lastRun = runs[runs.length - 1];
    const firstRun = runs[0];
    if (lastRun.end && firstRun.start) {
      const a1 = Math.atan2(lastRun.end.y - cy, lastRun.end.x - cx);
      const a2 = Math.atan2(firstRun.start.y - cy, firstRun.start.x - cx);
      ctx.arc(cx, cy, r, a1, a2, false);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Light direction + shading (cached at top scope)
  const _light = { x: -0.45, y: 0.55, z: 0.7 };
  (function n() {
    const m = Math.hypot(_light.x, _light.y, _light.z);
    _light.x /= m; _light.y /= m; _light.z /= m;
  })();
  function shadeAt(lon, lat, rotation, tilt) {
    const v = unitVec(lon, lat);
    const p = rotateAndTilt(v, rotation, tilt);
    const dot = p.x * _light.x + p.y * _light.y + p.z * _light.z;
    return Math.max(0, Math.min(1, (dot + 0.35) / 1.35));
  }

  function slerp(a, b, t) {
    const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
    const omega = Math.acos(dot);
    if (omega < 1e-6) return { ...a };
    const s = Math.sin(omega);
    const k1 = Math.sin((1 - t) * omega) / s;
    const k2 = Math.sin(t * omega) / s;
    return {
      x: a.x * k1 + b.x * k2,
      y: a.y * k1 + b.y * k2,
      z: a.z * k1 + b.z * k2,
    };
  }

  function drawGlobe(time) {
    if (!globeState || !globeState.visible) return;
    const { ctx, w, h } = globeState;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    // Sphere takes 38% of min dimension — proportional, never stretched
    const r = Math.min(w, h) * 0.38;
    const tilt = -0.32 + Math.sin(time * 0.00012) * 0.025;
    const rotation = (time * 0.0035) % 360;
    const accent  = palette.accent;
    const accent2 = palette.accent2;

    // 7-second global heartbeat (gaussian bell)
    const cycle = (time % 7000) / 7000;
    const beatT = cycle - 0.12;
    const heartbeat = Math.exp(-beatT * beatT * 28);

    // Readouts
    const elNodes    = document.querySelector("[data-readout-nodes]");
    const elArcs     = document.querySelector("[data-readout-arcs]");
    const elRotation = document.querySelector("[data-readout-rotation]");
    if (elNodes)    elNodes.textContent    = String(hubs.length);
    if (elArcs)     elArcs.textContent     = String(liveArcs.length);
    if (elRotation) elRotation.textContent = `${rotation.toFixed(1)}°`;

    // ===== Starfield (static, neutral + sand) =====
    for (const s of stars) {
      const color = s.tier === "sand" ? accent2 : palette.text;
      const alpha = s.a * (0.4 + heartbeat * 0.35);
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }

    // ===== Atmosphere halo (mint only, no indigo, no blue) =====
    const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.4);
    haloGrad.addColorStop(0,    hexToRgba(accent, 0.22 + heartbeat * 0.22));
    haloGrad.addColorStop(0.45, hexToRgba(accent, 0.06));
    haloGrad.addColorStop(1,    hexToRgba(accent, 0));
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // ===== Sphere base — dark green-black, NO blue tint =====
    // Lit position based on a fixed light direction projected on screen
    const lightDir = { x: -0.45, y: 0.55, z: 0.7 };
    const lm = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= lm; lightDir.y /= lm; lightDir.z /= lm;
    const lScreen = rotateAndTilt(lightDir, 0, tilt);
    const lx = cx + lScreen.x * r * 0.7;
    const ly = cy - lScreen.y * r * 0.7;

    const oceanGrad = ctx.createRadialGradient(lx, ly, r * 0.05, cx, cy, r * 1.05);
    oceanGrad.addColorStop(0,    "rgba(28, 50, 38, 0.85)");   // deep forest, sunlit
    oceanGrad.addColorStop(0.45, "rgba(10, 22, 16, 0.92)");   // near-black green
    oceanGrad.addColorStop(1,    "rgba(3, 8, 5, 0.97)");      // pure dark
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Clip to sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // ===== Graticule — clearer, mint at low alpha =====
    // Parallels
    ctx.lineWidth = 0.7;
    for (let lat = -75; lat <= 75; lat += 15) {
      const major = lat === 0;
      ctx.strokeStyle = hexToRgba(accent, major ? 0.20 : 0.09);
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = project(lon, lat, rotation, cx, cy, r, tilt);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // Meridians
    for (let lon = -180; lon < 180; lon += 15) {
      const major = lon === 0 || lon === -180 || Math.abs(lon) === 90;
      ctx.strokeStyle = hexToRgba(accent, major ? 0.18 : 0.07);
      ctx.beginPath();
      let started = false;
      for (let lat = -82; lat <= 82; lat += 4) {
        const p = project(lon, lat, rotation, cx, cy, r, tilt);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // ===== Real continents (inline outlines, day/night shaded) =====
    {
      const beat = heartbeat * 0.18;
      for (const m of continentMeta) {
        const shade = shadeAt(m.centroid[0], m.centroid[1], rotation, tilt);
        const fillA = 0.05 + shade * 0.26 + beat * shade;
        const strokeA = 0.20 + shade * 0.50 + beat * 0.30;
        ctx.fillStyle = hexToRgba(accent, fillA);
        ctx.strokeStyle = hexToRgba(accent, strokeA);
        ctx.lineWidth = 0.8;
        drawClippedRing(ctx, m.ring, rotation, cx, cy, r, tilt);
      }
    }

    // ===== Bentley starlight: dense twinkling stars on land =====
    for (const sp of sparkles) {
      const p = project(sp.lon, sp.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) continue;
      const shade = shadeAt(sp.lon, sp.lat, rotation, tilt);
      // Sparkles fade out on the dark side (no light, no glow)
      if (shade < 0.18) continue;
      const twinkle = sp.steady
        ? 0.85
        : 0.4 + 0.6 * Math.pow((Math.sin(time * sp.rate + sp.phase) + 1) / 2, 2);
      const alpha = sp.baseAlpha * twinkle * (0.55 + shade * 0.45);
      const size  = sp.baseSize * (0.8 + twinkle * 0.5);
      // Mostly warm white, occasional mint
      const color = sp.feature ? accent : palette.text;
      if (sp.feature) {
        // Subtle halo for feature stars
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(accent, alpha * 0.22);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }

    // ===== Day-side soft highlight pass =====
    ctx.globalCompositeOperation = "screen";
    const dayGrad = ctx.createRadialGradient(lx, ly, r * 0.05, cx, cy, r);
    dayGrad.addColorStop(0,   hexToRgba(accent, 0.10));
    dayGrad.addColorStop(0.6, hexToRgba(accent, 0.02));
    dayGrad.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = dayGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // ===== Arcs (mint primary, sand secondary; clipped inside sphere) =====
    arcTimer += 16;
    if (arcTimer > 1600) { arcTimer = 0; spawnArc(); }

    for (let i = liveArcs.length - 1; i >= 0; i--) {
      const arc = liveArcs[i];
      arc.t += arc.speed * 16;
      if (arc.t >= 1) {
        arc.lifetime -= 0.02;
        if (arc.lifetime <= 0) { liveArcs.splice(i, 1); continue; }
      }
      const arcColor = arc.tier === "accent2" ? accent2 : accent;

      const a = unitVec(hubs[arc.from].lon, hubs[arc.from].lat);
      const b = unitVec(hubs[arc.to].lon,   hubs[arc.to].lat);
      const dot = Math.max(-1, Math.min(1, a.x*b.x + a.y*b.y + a.z*b.z));
      const dist = Math.acos(dot);
      const maxBulge = 0.08 + dist * 0.14;
      const samples = 32;
      const tProgress = Math.min(1, arc.t);

      ctx.beginPath();
      let started = false;
      let prevVisible = false;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        if (t > tProgress) break;
        const v = slerp(a, b, t);
        const bulge = Math.sin(t * Math.PI) * maxBulge;
        const p = projectVec(v, rotation, cx, cy, r, tilt, 1 + bulge);
        if (!p.visible) { prevVisible = false; continue; }
        if (!started || !prevVisible) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
        prevVisible = true;
      }
      const alpha = 0.6 * arc.lifetime;
      ctx.strokeStyle = hexToRgba(arcColor, alpha);
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = hexToRgba(arcColor, 0.55);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (tProgress < 1) {
        const v = slerp(a, b, tProgress);
        const bulge = Math.sin(tProgress * Math.PI) * maxBulge;
        const p = projectVec(v, rotation, cx, cy, r, tilt, 1 + bulge);
        if (p.visible) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(arcColor, 0.95);
          ctx.shadowBlur = 16;
          ctx.shadowColor = hexToRgba(arcColor, 0.8);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore(); // end clip

    // ===== Hub markers (over the clip) =====
    hubs.forEach((hub) => {
      const p = project(hub.lon, hub.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) return;
      const baseR = hub.home ? 3.6 : 2.0;

      if (hub.home) {
        const ringR = baseR + 6 + heartbeat * 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(accent, 0.35 + heartbeat * 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2);
      ctx.fillStyle = hub.home ? hexToRgba(palette.text, 1) : hexToRgba(accent, 0.85);
      ctx.shadowBlur = hub.home ? 20 : 8;
      ctx.shadowColor = hexToRgba(accent, hub.home ? 0.9 : 0.5);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (hub.home) {
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = hexToRgba(palette.text, 0.85);
        ctx.fillText(hub.name.toUpperCase(), p.x + 10, p.y - 6);
      }
    });

    // ===== Hub bursts =====
    for (let i = hubBursts.length - 1; i >= 0; i--) {
      const burst = hubBursts[i];
      burst.t += 0.012;
      if (burst.t >= 1) { hubBursts.splice(i, 1); continue; }
      const hub = hubs[burst.idx];
      const p = project(hub.lon, hub.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) continue;
      const burstColor = burst.tier === "accent2" ? accent2 : accent;
      const ringR = 6 + burst.t * 38;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(burstColor, 0.5 * (1 - burst.t));
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // ===== Sphere rim =====
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(accent, 0.35);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  /* ----- Master rAF loop ----------------------------------------------- */
  let frame = null;
  function tick(time) {
    drawHero(time);
    drawGlobe(time);
    if (!reducedMotion) frame = requestAnimationFrame(tick);
  }
  if (heroState || globeState) {
    if (reducedMotion) tick(0);
    else frame = requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
    } else if (!reducedMotion && !frame) {
      frame = requestAnimationFrame(tick);
    }
  });
})();
