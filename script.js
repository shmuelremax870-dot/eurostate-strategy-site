/* =========================================================================
   Eurostate Strategy — Calm interactions + a globe that's truly alive
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
    influemint: {
      category: "AI Commerce Platform",
      role: "Product ecosystem",
    },
    "studio-rocket": {
      category: "AI Product Brand",
      role: "Launch infrastructure",
    },
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
     CANVAS — Hero ambient dust + ALIVE GLOBE
     ========================================================================= */

  // Shared color reader (re-read on theme change)
  function getColors() {
    const cs = getComputedStyle(root);
    return {
      accent: cs.getPropertyValue("--accent").trim() || "#64ffda",
      text:   cs.getPropertyValue("--text").trim()   || "#f1f3f5",
      muted:  cs.getPropertyValue("--muted").trim()  || "#9aa3ad",
      surface:cs.getPropertyValue("--surface-1").trim() || "#0b0e10",
      bg:     cs.getPropertyValue("--bg").trim() || "#06080a",
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

  /* ----- Hero ambient: drifting particles ----------------------------- */
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
     ALIVE GLOBE — atmosphere, terminator, animated arcs, pulsing hubs
     ========================================================================= */
  const globeCanvas = document.getElementById("globeCanvas");
  const globeState = setupCanvas(globeCanvas);

  // Continents — pre-densified outlines
  const continents = [
    { name: "North America", pts: [[-165,68],[-156,71],[-128,70],[-95,65],[-78,56],[-64,48],[-58,52],[-75,38],[-86,30],[-98,22],[-110,28],[-124,38],[-132,52],[-146,58],[-165,68]] },
    { name: "South America", pts: [[-80,12],[-65,8],[-50,0],[-40,-15],[-44,-32],[-58,-52],[-72,-48],[-78,-30],[-82,-12],[-80,2],[-80,12]] },
    { name: "Europe",        pts: [[-10,58],[5,62],[20,66],[38,60],[42,48],[28,42],[12,40],[-2,42],[-10,48],[-10,58]] },
    { name: "Africa",        pts: [[-16,34],[12,36],[34,32],[42,12],[48,-2],[40,-22],[28,-35],[18,-35],[6,-32],[-8,-15],[-16,4],[-16,34]] },
    { name: "Asia",          pts: [[38,62],[68,72],[112,72],[140,62],[156,42],[145,30],[122,18],[108,8],[95,12],[80,22],[62,18],[48,28],[40,42],[38,62]] },
    { name: "India",         pts: [[68,30],[78,32],[88,28],[92,18],[80,8],[72,18],[68,30]] },
    { name: "Southeast Asia",pts: [[96,20],[108,18],[120,14],[118,2],[108,-2],[100,8],[96,20]] },
    { name: "Australia",     pts: [[115,-12],[140,-14],[152,-22],[148,-36],[125,-38],[115,-30],[115,-12]] },
    { name: "Greenland",     pts: [[-50,82],[-25,82],[-18,72],[-40,68],[-50,76],[-50,82]] },
    { name: "Antarctica",    pts: [[-180,-66],[180,-66],[180,-78],[-180,-78],[-180,-66]] },
  ];

  // Major hub cities — anchor for arcs and pulses
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
  ];

  // Pre-build arc pairs from Limassol to others (home outbound)
  const arcPairs = hubs
    .map((h, i) => (h.home ? null : { from: 0, to: i }))
    .filter(Boolean);

  // Live arcs in flight
  const liveArcs = [];
  function spawnArc() {
    if (liveArcs.length > 4) return;
    const pair = arcPairs[Math.floor(Math.random() * arcPairs.length)];
    liveArcs.push({
      from: pair.from,
      to: pair.to,
      t: 0,
      speed: 0.0006 + Math.random() * 0.0004,
      lifetime: 1.0,
    });
  }
  let arcTimer = 0;

  // Hub pulse phases
  hubs.forEach((h, i) => { h.phase = i * 0.6; });

  // Project a 3D point on sphere into 2D screen
  function project(lon, lat, rotation, cx, cy, r, tilt) {
    const lambda = (lon + rotation) * Math.PI / 180;
    const phi    = lat * Math.PI / 180;
    const cosPhi = Math.cos(phi);
    // Rotate around Y (rotation), then tilt around X
    let x = cosPhi * Math.sin(lambda);
    let y = Math.sin(phi);
    let z = cosPhi * Math.cos(lambda);
    // Tilt around X axis (camera looks at slight downward angle)
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const y2 =  y * cosT - z * sinT;
    const z2 =  y * sinT + z * cosT;
    return {
      x: cx + r * x,
      y: cy - r * y2,
      z: z2,
      visible: z2 > -0.02,
    };
  }

  // Great-circle interpolation for arcs
  function arcPoint(a, b, t) {
    // Spherical linear interpolation
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
  function unitVec(lon, lat) {
    const lambda = lon * Math.PI / 180;
    const phi    = lat * Math.PI / 180;
    const c = Math.cos(phi);
    return { x: c * Math.sin(lambda), y: Math.sin(phi), z: c * Math.cos(lambda) };
  }
  function projectVec(v, rotation, cx, cy, r, tilt) {
    const lambda = rotation * Math.PI / 180;
    const cosR = Math.cos(lambda), sinR = Math.sin(lambda);
    // rotate around Y
    let x = v.x * cosR + v.z * sinR;
    let z = -v.x * sinR + v.z * cosR;
    let y = v.y;
    // tilt around X
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const y2 =  y * cosT - z * sinT;
    const z2 =  y * sinT + z * cosT;
    // arc height — push out by (1 + bulge)
    const bulge = v.bulge || 0;
    const scale = 1 + bulge;
    return {
      x: cx + r * x * scale,
      y: cy - r * y2 * scale,
      z: z2,
      visible: z2 > -0.02,
    };
  }

  // Light direction (where the "sun" hits): fixed slightly upper-left
  const lightDir = { x: -0.5, y: 0.55, z: 0.65 };
  (function normalize() {
    const m = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= m; lightDir.y /= m; lightDir.z /= m;
  })();

  // Compute normal at a (lon, lat) and dot with light direction
  function shadeAt(lon, lat, rotation, tilt) {
    const v = unitVec(lon, lat);
    const lambda = rotation * Math.PI / 180;
    const cosR = Math.cos(lambda), sinR = Math.sin(lambda);
    let x = v.x * cosR + v.z * sinR;
    let z = -v.x * sinR + v.z * cosR;
    let y = v.y;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const y2 =  y * cosT - z * sinT;
    const z2 =  y * sinT + z * cosT;
    const dot = x * lightDir.x + y2 * lightDir.y + z2 * lightDir.z;
    return Math.max(0, Math.min(1, (dot + 0.4) / 1.4));
  }

  function drawGlobe(time) {
    if (!globeState || !globeState.visible) return;
    const { ctx, w, h } = globeState;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.36;
    const tilt = -0.32;
    const rotation = (time * 0.005) % 360; // slow, dignified
    const accent = palette.accent;

    // Update readouts
    const elNodes    = document.querySelector("[data-readout-nodes]");
    const elArcs     = document.querySelector("[data-readout-arcs]");
    const elRotation = document.querySelector("[data-readout-rotation]");
    if (elNodes)    elNodes.textContent    = String(hubs.length);
    if (elArcs)     elArcs.textContent     = String(liveArcs.length);
    if (elRotation) elRotation.textContent = `${rotation.toFixed(1)}°`;

    // ===== Atmosphere halo (outside sphere) =====
    const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.45);
    haloGrad.addColorStop(0, hexToRgba(accent, 0.18));
    haloGrad.addColorStop(0.5, hexToRgba(accent, 0.06));
    haloGrad.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // ===== Sphere base (dark surface) =====
    const sphereGrad = ctx.createRadialGradient(
      cx - r * 0.4, cy - r * 0.5, r * 0.1,
      cx, cy, r
    );
    sphereGrad.addColorStop(0, hexToRgba(accent, 0.12));
    sphereGrad.addColorStop(0.5, "rgba(8, 22, 28, 0.85)");
    sphereGrad.addColorStop(1, "rgba(3, 8, 10, 0.95)");
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // ===== Lat/lon graticule (subtle) =====
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = hexToRgba(accent, 0.06);
    ctx.lineWidth = 0.6;
    for (let lat = -60; lat <= 60; lat += 20) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 6) {
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
      for (let lat = -80; lat <= 80; lat += 4) {
        const p = project(lon, lat, rotation, cx, cy, r, tilt);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // ===== Continents with day/night shading =====
    continents.forEach((continent) => {
      // Project all points
      const proj = continent.pts.map(([lon, lat]) => ({
        ...project(lon, lat, rotation, cx, cy, r, tilt),
        shade: shadeAt(lon, lat, rotation, tilt),
      }));
      // Build path from visible run
      let started = false;
      ctx.beginPath();
      const avgShade = proj.reduce((s, p) => s + p.shade, 0) / proj.length;
      for (const p of proj) {
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      // Fill — lighter on day side
      const fillA = 0.04 + avgShade * 0.18;
      const strokeA = 0.12 + avgShade * 0.45;
      ctx.fillStyle = hexToRgba(accent, fillA);
      ctx.strokeStyle = hexToRgba(accent, strokeA);
      ctx.lineWidth = 0.8;
      ctx.fill();
      ctx.stroke();
    });

    // ===== Live arcs =====
    arcTimer += 16;
    if (arcTimer > 900) { arcTimer = 0; spawnArc(); }

    // Draw arcs (clipped to inside view, but show even partly behind for depth)
    for (let i = liveArcs.length - 1; i >= 0; i--) {
      const arc = liveArcs[i];
      arc.t += arc.speed * 16;
      if (arc.t >= 1) {
        arc.lifetime -= 0.04;
        if (arc.lifetime <= 0) {
          liveArcs.splice(i, 1);
          continue;
        }
      }
      const a = unitVec(hubs[arc.from].lon, hubs[arc.from].lat);
      const b = unitVec(hubs[arc.to].lon,   hubs[arc.to].lat);
      // Compute arc as samples; bulge proportional to great-circle distance
      const dot = Math.max(-1, Math.min(1, a.x*b.x + a.y*b.y + a.z*b.z));
      const dist = Math.acos(dot);
      const maxBulge = 0.06 + dist * 0.12;

      const samples = 28;
      const tProgress = Math.min(1, arc.t);
      const fadeFrom = Math.max(0, tProgress - 0.35);
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        if (t > tProgress) break;
        // Arc height: sine peak in the middle
        const v = arcPoint(a, b, t);
        const arcHeight = Math.sin(t * Math.PI) * maxBulge;
        v.bulge = arcHeight;
        const p = projectVec(v, rotation, cx, cy, r, tilt);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      // Gradient fade trail
      const alpha = 0.6 * arc.lifetime;
      ctx.strokeStyle = hexToRgba(accent, alpha);
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = hexToRgba(accent, 0.6);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Leading packet
      if (tProgress < 1) {
        const v = arcPoint(a, b, tProgress);
        v.bulge = Math.sin(tProgress * Math.PI) * maxBulge;
        const p = projectVec(v, rotation, cx, cy, r, tilt);
        if (p.visible) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(accent, 0.95);
          ctx.shadowBlur = 16;
          ctx.shadowColor = hexToRgba(accent, 0.9);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // ===== Hub markers with pulses =====
    hubs.forEach((hub) => {
      const p = project(hub.lon, hub.lat, rotation, cx, cy, r, tilt);
      if (!p.visible) return;
      const t = time * 0.001 + hub.phase;
      const pulse = (Math.sin(t * 2) + 1) / 2; // 0..1
      const baseR = hub.home ? 3.2 : 2.4;

      // Outer pulse ring (expanding)
      const pulseRadius = baseR + pulse * 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(accent, 0.4 * (1 - pulse));
      ctx.lineWidth = 1;
      ctx.stroke();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2);
      ctx.fillStyle = hub.home ? hexToRgba(palette.text, 1) : hexToRgba(accent, 0.95);
      ctx.shadowBlur = hub.home ? 18 : 10;
      ctx.shadowColor = hexToRgba(accent, 0.8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Home label
      if (hub.home) {
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = hexToRgba(palette.text, 0.85);
        ctx.fillText(hub.name.toUpperCase(), p.x + 10, p.y - 6);
      }
    });

    ctx.restore();

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
    if (reducedMotion) {
      tick(0);
    } else {
      frame = requestAnimationFrame(tick);
    }
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
