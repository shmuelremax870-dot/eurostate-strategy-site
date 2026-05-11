/* =========================================================================
   Eurostate Strategy — Site interactions
   Lenis · GSAP ScrollTrigger · Unified canvas · Micro-interactions
   ========================================================================= */

(function () {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = matchMedia("(pointer: coarse)").matches;
  const root = document.documentElement;
  const body = document.body;

  /* ----- Page loader ---------------------------------------------------- */
  const loader = document.querySelector("[data-page-loader]");
  const dismissLoader = () => loader && loader.setAttribute("data-loaded", "");
  if (document.readyState === "complete") {
    setTimeout(dismissLoader, 200);
  } else {
    window.addEventListener("load", () => setTimeout(dismissLoader, 200));
    setTimeout(dismissLoader, 1800); // safety
  }

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

  /* ----- Smooth scroll (Lenis) ----------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (reducedMotion || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
    }
  }

  /* ----- Scroll progress + header state -------------------------------- */
  const header = document.querySelector("[data-header]");
  const hudProgress = document.querySelector("[data-hud-progress]");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty("--scroll-progress", String(ratio));
    if (hudProgress) hudProgress.style.width = `${ratio * 100}%`;
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ----- Cursor spotlight ---------------------------------------------- */
  if (!reducedMotion && !isCoarsePointer) {
    let raf;
    let tx = innerWidth / 2;
    let ty = innerHeight / 3;
    window.addEventListener(
      "pointermove",
      (e) => {
        body.classList.add("pointer-active");
        tx = e.clientX; ty = e.clientY;
        if (!raf) {
          raf = requestAnimationFrame(() => {
            root.style.setProperty("--spotlight-x", `${tx}px`);
            root.style.setProperty("--spotlight-y", `${ty}px`);
            raf = null;
          });
        }
      },
      { passive: true }
    );
    window.addEventListener("pointerleave", () => body.classList.remove("pointer-active"));
  }

  /* ----- Split text reveal --------------------------------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const html = el.innerHTML;
    el.innerHTML = "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    let i = 0;
    const walk = (node, parent) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.nodeValue.split(/(\s+)/);
        words.forEach((word) => {
          if (!word.trim()) {
            parent.appendChild(document.createTextNode(word));
            return;
          }
          const wrap = document.createElement("span");
          wrap.className = "word";
          wrap.style.setProperty("--i", String(i++));
          const inner = document.createElement("span");
          inner.textContent = word;
          wrap.appendChild(inner);
          parent.appendChild(wrap);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        if (clone.classList) clone.classList.add("split-inner");
        parent.appendChild(clone);
        node.childNodes.forEach((c) => walk(c, clone));
      }
    };
    tmp.childNodes.forEach((c) => walk(c, el));
    requestAnimationFrame(() => el.classList.add("is-revealed"));
  });

  /* ----- Magnetic buttons ---------------------------------------------- */
  if (!reducedMotion && !isCoarsePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 14;
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ----- Spotlight cards (cursor-aware glow) --------------------------- */
  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    });
  });

  /* ----- Reveal-on-scroll (fallback for non-scroll-driven browsers) ---- */
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

  /* ----- HUD section tracking ------------------------------------------ */
  const hudLayer = document.querySelector("[data-hud-layer]");
  const hudState = document.querySelector("[data-hud-state]");
  const hudSections = [...document.querySelectorAll("[data-hud-layer][data-hud-state]")];
  if (hudLayer && hudState && hudSections.length) {
    const hudObserver = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;
        hudLayer.textContent = active.target.dataset.hudLayer;
        hudState.textContent = active.target.dataset.hudState;
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-22% 0px -42% 0px" }
    );
    hudSections.forEach((s) => hudObserver.observe(s));
  }

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
    intelligence: { title: "Signal Intelligence", copy: "Market gap, category thesis, and demand surface" },
    architecture: { title: "AI Architecture",     copy: "Agents, workflows, data flows, orchestration, and model logic" },
    product:      { title: "Productization Layer", copy: "UX, platform surface, operating workflows, and launch assets" },
    market:       { title: "Market Expansion Layer", copy: "Commercial path, licensing structures, rollout systems, and global category position" },
  };
  const architectureButtons = [...document.querySelectorAll("[data-architecture-mode]")];
  const architectureNodes = [...document.querySelectorAll("[data-arch-node]")];
  const architectureTitle = document.querySelector("[data-arch-title]");
  const architectureCopy = document.querySelector("[data-arch-copy]");

  function setArchitectureMode(mode) {
    const sel = architectureModes[mode];
    if (!sel) return;
    architectureButtons.forEach((b) => {
      const active = b.dataset.architectureMode === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    architectureNodes.forEach((n) => n.classList.toggle("active", n.dataset.archNode === mode));

    const apply = () => {
      if (architectureTitle) architectureTitle.textContent = sel.title;
      if (architectureCopy)  architectureCopy.textContent  = sel.copy;
    };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }
  architectureButtons.forEach((b) =>
    b.addEventListener("click", () => setArchitectureMode(b.dataset.architectureMode))
  );

  /* ----- Signal row pulse ---------------------------------------------- */
  const signalRows = [...document.querySelectorAll("[data-signal-row]")];
  if (!reducedMotion && signalRows.length) {
    let i = 0;
    setInterval(() => {
      signalRows.forEach((r, idx) => r.classList.toggle("active", idx === i));
      i = (i + 1) % signalRows.length;
    }, 1700);
  }

  /* ----- Product cards ------------------------------------------------- */
  const productData = {
    influemint: {
      title: "InflueMint",
      copy: "AI commerce infrastructure product under the Eurostate Strategy venture studio model.",
      category: "AI Commerce Platform",
      role: "Product ecosystem",
    },
    "studio-rocket": {
      title: "Studio Rocket",
      copy: "Product and launch infrastructure brand for packaging modern digital products and AI-enabled business systems.",
      category: "AI Product Brand",
      role: "Launch infrastructure",
    },
  };
  const productCards = [...document.querySelectorAll("[data-product]")];
  const dt = document.querySelector("[data-detail-title]");
  const dc = document.querySelector("[data-detail-copy]");
  const dcat = document.querySelector("[data-detail-category]");
  const drole = document.querySelector("[data-detail-role]");
  function setProduct(key) {
    const p = productData[key];
    if (!p) return;
    productCards.forEach((c) => c.classList.toggle("is-active", c.dataset.product === key));
    const apply = () => {
      if (dt)    dt.textContent    = p.title;
      if (dc)    dc.textContent    = p.copy;
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

  /* ----- Animated counters --------------------------------------------- */
  const counters = [...document.querySelectorAll("[data-counter]")];
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.raw) {
          el.textContent = el.dataset.counter;
          counterObserver.unobserve(el);
          return;
        }
        const targetStr = el.dataset.counter;
        const target = parseFloat(targetStr);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const dur = 1400;
        const padLen = targetStr.replace(/\D/g, "").length;
        const tick = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = Math.round(target * eased);
          el.textContent = String(value).padStart(padLen, "0") + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ----- GSAP / ScrollTrigger setup ------------------------------------ */
  function initGsap() {
    if (reducedMotion || !window.gsap) return;
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Section parallax for hero console
    const heroConsole = document.querySelector(".hero-console");
    if (heroConsole && window.ScrollTrigger) {
      gsap.to(heroConsole, {
        y: -40,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      });
    }

    // Stagger reveal on bento cells
    document.querySelectorAll(".bento").forEach((bento) => {
      const cells = bento.querySelectorAll(".cell");
      gsap.from(cells, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: bento, start: "top 85%" },
      });
    });

    // Timeline step active state on scroll
    document.querySelectorAll(".timeline-step").forEach((step) => {
      window.ScrollTrigger.create({
        trigger: step,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () => step.classList.add("is-active"),
        onLeaveBack: () => step.classList.remove("is-active"),
      });
    });
  }

  /* ----- Unified canvas engine ----------------------------------------- */
  const heroCanvas  = document.getElementById("heroCanvas");
  const radarCanvas = document.getElementById("radarCanvas");
  const globeCanvas = document.getElementById("globeCanvas");

  const canvasState = new Map(); // canvas -> { ctx, w, h, dpr, visible }
  function setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { alpha: true });
    const state = { ctx, w: 0, h: 0, dpr: 1, visible: false };
    canvasState.set(canvas, state);

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.floor(box.width);
      state.h = Math.floor(box.height);
      state.dpr = dpr;
      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (state.visible = e.isIntersecting)),
      { threshold: 0.05 }
    );
    io.observe(canvas);
    return state;
  }

  const heroState  = setupCanvas(heroCanvas);
  const radarState = setupCanvas(radarCanvas);
  const globeState = setupCanvas(globeCanvas);

  // Hero canvas — flow field with subtle particles
  const fieldDots = Array.from({ length: 64 }, (_, i) => ({
    x: ((i * 37) % 100) / 100,
    y: ((i * 61) % 100) / 100,
    s: 0.7 + (i % 4) * 0.34,
    phase: i * 0.47,
  }));
  function drawHero(time) {
    if (!heroState || !heroState.visible) return;
    const { ctx, w, h } = heroState;
    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "rgba(140, 160, 170, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // signal field
    fieldDots.forEach((d) => {
      const flick = 0.18 + Math.sin(time * 0.0016 + d.phase) * 0.18;
      ctx.beginPath();
      ctx.arc(d.x * w, d.y * h, d.s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 230, 235, ${Math.max(0.08, flick)})`;
      ctx.fill();
    });

    // sweep
    const y = ((time * 0.025) % (h + 260)) - 130;
    const sweep = ctx.createLinearGradient(0, y - 80, 0, y + 80);
    sweep.addColorStop(0, "rgba(53, 211, 199, 0)");
    sweep.addColorStop(0.5, "rgba(53, 211, 199, 0.10)");
    sweep.addColorStop(1, "rgba(53, 211, 199, 0)");
    ctx.fillStyle = sweep;
    ctx.fillRect(0, y - 80, w, 160);
  }

  // Radar canvas
  function drawRadar(time) {
    if (!radarState || !radarState.visible) return;
    const { ctx, w, h } = radarState;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) * 0.34;

    ctx.strokeStyle = "rgba(53, 211, 199, 0.14)";
    ctx.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (radius / 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const angle = (time * 0.00055) % (Math.PI * 2);
    const sweep = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    sweep.addColorStop(0, "rgba(53, 211, 199, 0.22)");
    sweep.addColorStop(1, "rgba(53, 211, 199, 0)");
    ctx.fillStyle = sweep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + 0.62);
    ctx.closePath();
    ctx.fill();

    const points = [
      [0.18, 0.22, "rgba(53, 211, 199, 0.85)"],
      [0.78, 0.28, "rgba(200, 162, 95, 0.8)"],
      [0.24, 0.76, "rgba(131, 209, 139, 0.78)"],
      [0.73, 0.72, "rgba(53, 211, 199, 0.74)"],
      [0.52, 0.18, "rgba(246, 241, 232, 0.7)"],
    ];
    points.forEach(([x, y, color], i) => {
      const pulse = Math.sin(time * 0.002 + i) * 2;
      ctx.beginPath();
      ctx.arc(x * w, y * h, 3.5 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  // Globe canvas
  const continents = [
    { name: "North America", points: [[-168,70],[-138,72],[-112,62],[-86,54],[-62,45],[-76,28],[-98,18],[-118,24],[-134,38],[-154,55]] },
    { name: "South America", points: [[-82,12],[-66,5],[-50,-7],[-42,-22],[-54,-54],[-70,-47],[-78,-18]] },
    { name: "Europe", points: [[-12,58],[10,64],[34,55],[38,42],[20,35],[0,38],[-12,48]] },
    { name: "Africa", points: [[-18,34],[16,37],[36,22],[42,-8],[28,-34],[4,-36],[-13,-10]] },
    { name: "Asia", points: [[34,64],[82,72],[138,58],[154,34],[128,8],[94,8],[58,24],[38,46]] },
    { name: "Australia", points: [[112,-12],[154,-18],[150,-38],[118,-35],[108,-23]] },
  ];
  let globePointer = { active: false, x: 0, y: 0 };
  let hoveredContinent = "";

  function projectPoint(lon, lat, rotation, cx, cy, radius) {
    const lambda = (lon - rotation) * (Math.PI / 180);
    const phi = lat * (Math.PI / 180);
    const cosPhi = Math.cos(phi);
    const z = cosPhi * Math.cos(lambda);
    return {
      x: cx + radius * cosPhi * Math.sin(lambda),
      y: cy - radius * Math.sin(phi),
      z,
      visible: z > -0.04,
    };
  }
  function buildPath(continent, rotation, cx, cy, radius) {
    const path = new Path2D();
    let started = false; let count = 0;
    continent.points.forEach(([lon, lat]) => {
      const p = projectPoint(lon, lat, rotation, cx, cy, radius);
      if (!p.visible) return;
      count++;
      if (!started) { path.moveTo(p.x, p.y); started = true; }
      else path.lineTo(p.x, p.y);
    });
    if (count > 2) path.closePath();
    return count > 2 ? path : null;
  }
  function drawGlobeGrid(ctx, cx, cy, radius, rotation) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = "rgba(220, 230, 235, 0.08)";
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = projectPoint(lon, lat, rotation, cx, cy, radius);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -82; lat <= 82; lat += 4) {
        const p = projectPoint(lon, lat, rotation, cx, cy, radius);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawGlobe(time) {
    if (!globeState || !globeState.visible) return;
    const { ctx, w, h } = globeState;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.55;
    const radius = Math.min(w, h) * 0.3;
    const rotation = (time * 0.006) % 360;

    // sphere with bloom
    const sphere = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.48, radius * 0.12, cx, cy, radius);
    sphere.addColorStop(0, "rgba(53, 211, 199, 0.32)");
    sphere.addColorStop(0.45, "rgba(13, 44, 46, 0.78)");
    sphere.addColorStop(1, "rgba(2, 5, 7, 0.94)");

    ctx.save();
    ctx.shadowBlur = 50;
    ctx.shadowColor = "rgba(53, 211, 199, 0.4)";
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphere; ctx.fill();
    ctx.restore();

    drawGlobeGrid(ctx, cx, cy, radius, rotation);

    const paths = continents
      .map((c) => ({ continent: c, path: buildPath(c, rotation, cx, cy, radius) }))
      .filter((e) => e.path);

    let nextHovered = "";
    if (globePointer.active) {
      paths.forEach((entry) => {
        if (ctx.isPointInPath(entry.path, globePointer.x, globePointer.y)) {
          nextHovered = entry.continent.name;
        }
      });
    }
    hoveredContinent = nextHovered;

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    paths.forEach((entry) => {
      const isHover = entry.continent.name === hoveredContinent;
      ctx.save();
      ctx.shadowBlur = isHover ? 28 : 0;
      ctx.shadowColor = "rgba(53, 211, 199, 0.9)";
      ctx.fillStyle = isHover ? "rgba(53, 211, 199, 0.42)" : "rgba(230, 235, 240, 0.16)";
      ctx.strokeStyle = isHover ? "rgba(246, 241, 232, 0.92)" : "rgba(53, 211, 199, 0.36)";
      ctx.lineWidth = isHover ? 1.8 : 1;
      ctx.fill(entry.path); ctx.stroke(entry.path);
      ctx.restore();
    });
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = hoveredContinent ? "rgba(53, 211, 199, 0.7)" : "rgba(220, 230, 235, 0.12)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (hoveredContinent) {
      ctx.fillStyle = "rgba(246, 241, 232, 0.86)";
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.fillText(hoveredContinent, cx - radius * 0.42, cy + radius + 32);
    }
  }

  if (globeCanvas) {
    globeCanvas.addEventListener("pointermove", (e) => {
      const rect = globeCanvas.getBoundingClientRect();
      globePointer = { active: true, x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, { passive: true });
    globeCanvas.addEventListener("pointerleave", () => {
      globePointer = { active: false, x: 0, y: 0 };
      hoveredContinent = "";
    });
  }

  // Single rAF loop drives all canvases
  let frame = null;
  function tick(time) {
    drawHero(time);
    drawRadar(time);
    drawGlobe(time);
    if (!reducedMotion) frame = requestAnimationFrame(tick);
  }
  if (heroState || radarState || globeState) {
    if (reducedMotion) {
      // single static paint
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

  /* ----- Boot Lenis + GSAP after deferred scripts load ----------------- */
  window.addEventListener("DOMContentLoaded", () => {
    initLenis();
    initGsap();
  });
  // Also try after window load (in case CDN is slow)
  window.addEventListener("load", () => {
    if (!lenis) initLenis();
    initGsap();
  });
})();
