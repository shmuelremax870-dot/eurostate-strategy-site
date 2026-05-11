/* =========================================================================
   Eurostate Strategy — Calm interactions + a truly alive globe
   Loads real coastlines from Natural Earth (world-atlas via CDN) and
   animates with starfield, multi-arc traffic, hub bursts, and wobble.
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
     CANVAS — Hero ambient dust + ALIVE GLOBE with real continents
     ========================================================================= */
  function getColors() {
    const cs = getComputedStyle(root);
    return {
      accent:  cs.getPropertyValue("--accent").trim()   || "#64ffda",
      accent2: cs.getPropertyValue("--accent-2").trim() || "#d4a373",
      accent3: cs.getPropertyValue("--accent-3").trim() || "#8b94d6",
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

  /* ----- Hero ambient: subtle drifting particles ---------------------- */
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
     ALIVE GLOBE — real continents, atmosphere, terminator, multi-arc traffic
     ========================================================================= */
  const globeCanvas = document.getElementById("globeCanvas");
  const globeState = setupCanvas(globeCanvas);

  // Coastline polygons loaded from world-atlas TopoJSON (50m resolution).
  // Each entry: { rings: [[ [lon,lat], [lon,lat], ... ], ...], centroid: [lon,lat] }
  let landPolys = null;
  let landLoading = false;

  async function loadLand() {
    if (landPolys || landLoading) return;
    landLoading = true;
    try {
      // Wait for topojson global to be ready
      const waitForTopo = () => new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          if (window.topojson) return resolve(window.topojson);
          if (Date.now() - start > 6000) return reject(new Error("topojson timeout"));
          setTimeout(check, 60);
        })();
      });
      const topojson = await waitForTopo();
      const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json");
      const data = await res.json();
      const feature = topojson.feature(data, data.objects.land);
      const polys = [];
      const collect = (geom) => {
        if (geom.type === "Polygon") {
          polys.push(buildPoly(geom.coordinates));
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((rings) => polys.push(buildPoly(rings)));
        }
      };
      if (feature.type === "FeatureCollection") {
        feature.features.forEach((f) => collect(f.geometry));
      } else {
        collect(feature.geometry);
      }
      landPolys = polys;
    } catch (e) {
      console.warn("Globe land load failed:", e);
      landPolys = []; // give up gracefully
    }
  }

  function buildPoly(rings) {
    // Compute area-weighted centroid of outer ring (for shading)
    const outer = rings[0];
    let sx = 0, sy = 0;
    outer.forEach(([lon, lat]) => { sx += lon; sy += lat; });
    const n = outer.length || 1;
    return { rings, centroid: [sx / n, sy / n] };
  }

  // Major hub cities
  const hubs = [
    { name: "Limassol", lon: 33.04, lat: 34.71, home: true, phase: 0 },
    { name: "London",   lon: -0.13, lat: 51.51, phase: 0.4 },
    { name: "New York", lon: -74.0, lat: 40.71, phase: 0.8 },
    { name: "San Francisco", lon: -122.42, lat: 37.77, phase: 1.2 },
    { name: "Tokyo",    lon: 139.69, lat: 35.69, phase: 1.6 },
    { name: "Singapore",lon: 103.82, lat: 1.35,  phase: 2.0 },
    { name: "Dubai",    lon: 55.27, lat: 25.20,  phase: 2.4 },
    { name: "São Paulo",lon: -46.63, lat: -23.55, phase: 2.8 },
    { name: "Berlin",   lon: 13.4,  lat: 52.52,  phase: 3.2 },
    { name: "Bangalore",lon: 77.59, lat: 12.97,  phase: 3.6 },
    { name: "Tel Aviv", lon: 34.78, lat: 32.08,  phase: 4.0 },
    { name: "Mumbai",   lon: 72.87, lat: 19.07,  phase: 4.4 },
    { name: "Sydney",   lon: 151.21, lat: -33.86, phase: 4.8 },
    { name: "Hong Kong",lon: 114.16, lat: 22.31, phase: 5.2 },
  ];

  // Arcs originating from home (Limassol)
  const arcDestinations = hubs.map((_, i) => i).filter((i) => !hubs[i].home);

  const liveArcs = [];
  const hubBursts = []; // expanding rings when an arc launches

  function spawnArc() {
    if (liveArcs.length > 3) return;
    const toIdx = arcDestinations[Math.floor(Math.random() * arcDestinations.length)];
    // Color tier: 60% accent, 30% accent-2, 10% accent-3
    const r = Math.random();
    const tier = r < 0.6 ? "accent" : r < 0.9 ? "accent2" : "accent3";
    liveArcs.push({
      from: 0,
      to: toIdx,
      t: 0,
      speed: 0.00035 + Math.random() * 0.00025, // slower
      lifetime: 1.0,
      tier,
    });
    hubBursts.push({ idx: 0, t: 0, tier });
  }
  let arcTimer = 0;

  // 3D rotation utilities
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
    return {
      x: cx + r * p.x,
      y: cy - r * p.y,
      z: p.z,
      visible: p.z > -0.01,
    };
  }

  function projectVec(v, rotation, cx, cy, r, tilt, scale) {
    const p = rotateAndTilt(v, rotation, tilt);
    const s = scale || 1;
    return {
      x: cx + r * p.x * s,
      y: cy - r * p.y * s,
      z: p.z,
      visible: p.z > -0.01,
    };
  }

  // Light direction (sun) — fixed in world space
  const lightDir = { x: -0.45, y: 0.55, z: 0.7 };
  (function normalize() {
    const m = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= m; lightDir.y /= m; lightDir.z /= m;
  })();

  function shadeAt(lon, lat, rotation, tilt) {
    const v = unitVec(lon, lat);
    const p = rotateAndTilt(v, rotation, tilt);
    const dot = p.x * lightDir.x + p.y * lightDir.y + p.z * lightDir.z;
    return Math.max(0, Math.min(1, (dot + 0.35) / 1.35));
  }

  // Draw a continent ring with proper horizon clipping.
  // Splits the ring at the sphere horizon (z = 0) and bridges
  // exit-to-entry along the rim arc so fill stays on the visible side.
  function drawClippedRing(ctx, ring, rotation, cx, cy, r, tilt) {
    const N = ring.length;
    if (N < 3) return;

    // Project all points to screen + retain z for visibility
    const pts = new Array(N);
    for (let i = 0; i < N; i++) {
      const [lon, lat] = ring[i];
      const v = unitVec(lon, lat);
      const p = rotateAndTilt(v, rotation, tilt);
      pts[i] = { x: cx + r * p.x, y: cy - r * p.y, z: p.z };
    }

    // Quick paths
    let frontCount = 0;
    for (let i = 0; i < N; i++) if (pts[i].z > 0) frontCount++;
    if (frontCount === 0) return;
    if (frontCount === N) {
      // Fully visible
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < N; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    // Snap a point onto the sphere rim in screen space
    const snapRim = (p) => {
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6) return { x: cx + r, y: cy };
      return { x: cx + dx / d * r, y: cy + dy / d * r };
    };

    // Rotate ring so we start on an invisible point — this guarantees
    // visible runs do not wrap across the start/end boundary.
    let start = 0;
    for (let i = 0; i < N; i++) {
      if (pts[i].z <= 0) { start = i; break; }
    }

    // Walk N+1 segments to wrap around once and collect visible runs
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
      // else: both invisible — skip
    }
    if (runs.length === 0) return;

    // Build closed path, bridging between runs along the rim
    ctx.beginPath();
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const startPt = run.start;
      if (i === 0) {
        ctx.moveTo(startPt.x, startPt.y);
      } else {
        // Bridge from previous run's end to this run's start along the rim
        const prev = runs[i - 1];
        if (prev.end) {
          const a1 = Math.atan2(prev.end.y - cy, prev.end.x - cx);
          const a2 = Math.atan2(startPt.y - cy, startPt.x - cx);
          ctx.arc(cx, cy, r, a1, a2, false);
        }
      }
      for (const m of run.mids) ctx.lineTo(m.x, m.y);
      if (run.end) ctx.lineTo(run.end.x, run.end.y);
    }
    // Close: arc from last end back to first start
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

  // Great-circle spherical interpolation
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

  // Starfield — static, three color tiers (60/30/10)
  const stars = Array.from({ length: 90 }, (_, i) => {
    const r = Math.random();
    // 60% neutral text, 30% sand, 10% indigo
    const tier = r < 0.6 ? "text" : r < 0.9 ? "sand" : "indigo";
    return {
      x: Math.random(),
      y: Math.random(),
      s: 0.35 + Math.random() * 1.0,
      a: 0.15 + Math.random() * 0.35,
      tier,
    };
  });

  function drawGlobe(time) {
    if (!globeState || !globeState.visible) return;
    const { ctx, w, h } = globeState;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.34;
    // Gentle wobble (long period) + slower rotation for a strategic feel
    const tilt = -0.32 + Math.sin(time * 0.00012) * 0.025;
    const rotation = (time * 0.0035) % 360;
    const accent = palette.accent;

    // ===== 7-second global heartbeat =====
    // A short bell at ~0.12 of each 7s cycle. Most of the time the
    // value is ~0; once per 7s it spikes to ~1 then fades.
    const cycle = (time % 7000) / 7000;
    const beatT = cycle - 0.12;
    const heartbeat = Math.exp(-beatT * beatT * 28);

    // Kick off loading if not started
    if (!landPolys && !landLoading) loadLand();

    // Update readouts
    const elNodes    = document.querySelector("[data-readout-nodes]");
    const elArcs     = document.querySelector("[data-readout-arcs]");
    const elRotation = document.querySelector("[data-readout-rotation]");
    if (elNodes)    elNodes.textContent    = String(hubs.length);
    if (elArcs)     elArcs.textContent     = String(liveArcs.length);
    if (elRotation) elRotation.textContent = `${rotation.toFixed(1)}°`;

    // ===== Starfield (background, static — no twinkle) =====
    for (const s of stars) {
      const color =
        s.tier === "sand"   ? palette.accent2 :
        s.tier === "indigo" ? palette.accent3 :
                              palette.text;
      // Subtle heartbeat brightening
      const alpha = s.a * (0.35 + heartbeat * 0.4);
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }

    // ===== Atmosphere halo (mint inner, indigo outer fade) =====
    const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.55);
    haloGrad.addColorStop(0,    hexToRgba(accent, 0.22 + heartbeat * 0.25));
    haloGrad.addColorStop(0.35, hexToRgba(accent, 0.07));
    haloGrad.addColorStop(0.75, hexToRgba(palette.accent3, 0.05));
    haloGrad.addColorStop(1,    hexToRgba(palette.accent3, 0));
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
    ctx.fill();

    // ===== Sphere base — ocean with terminator gradient =====
    // Day-side direction projected on screen
    const lightScreen = rotateAndTilt(lightDir, 0, tilt);
    // Position light on screen for gradient origin
    const lx = cx + lightScreen.x * r * 0.8;
    const ly = cy - lightScreen.y * r * 0.8;
    const oceanGrad = ctx.createRadialGradient(lx, ly, r * 0.1, cx, cy, r * 1.1);
    oceanGrad.addColorStop(0, hexToRgba(accent, 0.12));
    oceanGrad.addColorStop(0.45, "rgba(6, 18, 26, 0.85)");
    oceanGrad.addColorStop(1, "rgba(2, 6, 10, 0.97)");
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Clip to sphere for graticule, continents, arcs (front side)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // ===== Graticule (subtle) =====
    ctx.strokeStyle = hexToRgba(accent, 0.05);
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 20) {
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
    for (let lon = -150; lon <= 180; lon += 30) {
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

    // ===== REAL CONTINENTS — heartbeat boosts brightness briefly =====
    if (landPolys && landPolys.length) {
      const beatBoost = heartbeat * 0.18;
      for (const poly of landPolys) {
        const shade = shadeAt(poly.centroid[0], poly.centroid[1], rotation, tilt);
        const fillA = 0.04 + shade * 0.28 + beatBoost * shade;
        const strokeA = 0.15 + shade * 0.55 + beatBoost * 0.4;
        ctx.fillStyle = hexToRgba(accent, fillA);
        ctx.strokeStyle = hexToRgba(accent, strokeA);
        ctx.lineWidth = 0.7;

        for (const ring of poly.rings) {
          drawClippedRing(ctx, ring, rotation, cx, cy, r, tilt);
        }
      }

      // Subtle day-side highlight pass (overlay)
      ctx.globalCompositeOperation = "screen";
      const dayGrad = ctx.createRadialGradient(lx, ly, r * 0.1, cx, cy, r);
      dayGrad.addColorStop(0, hexToRgba(accent, 0.10));
      dayGrad.addColorStop(0.5, hexToRgba(accent, 0.02));
      dayGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dayGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else {
      // Loading shimmer hint
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = hexToRgba(palette.muted, 0.5);
      ctx.textAlign = "center";
      ctx.fillText("LOADING WORLD…", cx, cy);
      ctx.textAlign = "start";
    }

    // ===== Arcs (slower, fewer, three-color rotation) =====
    arcTimer += 16;
    if (arcTimer > 1600) { arcTimer = 0; spawnArc(); }

    for (let i = liveArcs.length - 1; i >= 0; i--) {
      const arc = liveArcs[i];
      arc.t += arc.speed * 16;
      if (arc.t >= 1) {
        arc.lifetime -= 0.02;
        if (arc.lifetime <= 0) { liveArcs.splice(i, 1); continue; }
      }
      const arcColor =
        arc.tier === "accent2" ? palette.accent2 :
        arc.tier === "accent3" ? palette.accent3 :
                                 accent;

      const a = unitVec(hubs[arc.from].lon, hubs[arc.from].lat);
      const b = unitVec(hubs[arc.to].lon,   hubs[arc.to].lat);
      const dot = Math.max(-1, Math.min(1, a.x*b.x + a.y*b.y + a.z*b.z));
      const dist = Math.acos(dot);
      const maxBulge = 0.08 + dist * 0.14;
      const samples = 36;
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

      // Leading packet only (no busy trail particles)
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

    // ===== Hub markers — static, only home pulses on the heartbeat =====
    hubs.forEach((hub) => {
      const p = project(hub.lon, hub.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) return;
      const baseR = hub.home ? 3.6 : 2.0;

      // Home gets a heartbeat ring (matches 7s global pulse)
      if (hub.home) {
        const ringR = baseR + 6 + heartbeat * 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(accent, 0.35 + heartbeat * 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2);
      ctx.fillStyle = hub.home ? hexToRgba(palette.text, 1) : hexToRgba(accent, 0.85);
      ctx.shadowBlur = hub.home ? 20 : 8;
      ctx.shadowColor = hexToRgba(accent, hub.home ? 0.9 : 0.5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Home label
      if (hub.home) {
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = hexToRgba(palette.text, 0.85);
        ctx.fillText(hub.name.toUpperCase(), p.x + 10, p.y - 6);
      }
    });

    // ===== Hub bursts (when arcs launch — colored to match arc) =====
    for (let i = hubBursts.length - 1; i >= 0; i--) {
      const burst = hubBursts[i];
      burst.t += 0.012;
      if (burst.t >= 1) { hubBursts.splice(i, 1); continue; }
      const hub = hubs[burst.idx];
      const p = project(hub.lon, hub.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) continue;
      const burstColor =
        burst.tier === "accent2" ? palette.accent2 :
        burst.tier === "accent3" ? palette.accent3 :
                                   accent;
      const ringR = 6 + burst.t * 38;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(burstColor, 0.5 * (1 - burst.t));
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // ===== Sphere rim highlight =====
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
