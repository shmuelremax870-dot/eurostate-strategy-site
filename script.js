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
