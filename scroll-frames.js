/* =========================================================================
   Scroll-frame driver — Waste → Energy → Compute transformation
   Renders 240 frames to a canvas based on scroll progress through the
   [data-scrolly] section. Exposes scroll progress as CSS custom property
   --p (0..1) on the canvas for parallax / zoom effects.

   On mobile: loads every other frame (120 frames, ~7 MB) to keep the
   data + GPU budget reasonable. Skipped only under prefers-reduced-motion.
   ========================================================================= */
(function initScrolly() {
  "use strict";

  const root = document.querySelector("[data-scrolly]");
  if (!root) return;
  const canvas = root.querySelector("[data-scrolly-canvas]");
  if (!canvas) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const isMobile = matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  // STEP=2 on mobile -> use 120 frames (every other one). Same scroll
  // distance, half the asset weight and half the decoded textures in memory.
  const STEP = isMobile ? 2 : 1;
  const TOTAL_SOURCE = 240;
  const TOTAL = Math.ceil(TOTAL_SOURCE / STEP);
  const PATH = (i) =>
    `./scroll-frames/transform/frame-${String(i * STEP + 1).padStart(3, "0")}.jpg`;

  // Native frame dimensions (after watermark crop)
  const FW = 1280;
  const FH = 670;

  const ctx = canvas.getContext("2d");
  // Lower DPR on mobile — saves a lot of VRAM with full-bleed canvas.
  const dpr = isMobile
    ? Math.min(window.devicePixelRatio || 1, 1.25)
    : Math.min(window.devicePixelRatio || 1, 2);

  function sizeCanvas() {
    const stage = root.querySelector(".scrolly-stage") || root;
    const r = stage.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  sizeCanvas();
  window.addEventListener("resize", () => {
    sizeCanvas();
    lastDrawn = -1;
    render();
  }, { passive: true });

  // ----- Frame loader with priority order ---------------------------------
  // Frame 0, frame N-1 first (start + end visible immediately), then every
  // 8th key frame, then fill-in. nearestLoaded() falls back to a neighbour
  // when the exact frame isn't ready yet.
  const imgs = new Array(TOTAL);
  let loadedCount = 0;
  let ready = false;

  function loadFrame(i) {
    return new Promise((resolve) => {
      if (imgs[i]) return resolve();
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        imgs[i] = img;
        loadedCount++;
        if (!ready && loadedCount >= 30) {
          ready = true;
          root.setAttribute("data-scrolly-ready", "");
          render();
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = PATH(i);
    });
  }

  const priority = [0, TOTAL - 1];
  for (let i = 0; i < TOTAL; i += 8) if (!priority.includes(i)) priority.push(i);
  for (let i = 0; i < TOTAL; i++) if (!priority.includes(i)) priority.push(i);

  (async () => {
    for (let i = 0; i < Math.min(30, priority.length); i++) {
      await loadFrame(priority[i]);
    }
    for (let i = 30; i < priority.length; i++) loadFrame(priority[i]);
  })();

  function nearestLoaded(idx) {
    for (let r = 0; r < TOTAL; r++) {
      if (imgs[idx - r]) return imgs[idx - r];
      if (imgs[idx + r]) return imgs[idx + r];
    }
    return null;
  }

  // ----- Caption cross-fade -----------------------------------------------
  const caps = {
    waste: root.querySelector('[data-scrolly-caption="waste"]'),
    energy: root.querySelector('[data-scrolly-caption="energy"]'),
    compute: root.querySelector('[data-scrolly-caption="compute"]'),
  };
  function setCaption(p) {
    const w = p < 0.33 ? 1 : Math.max(0, 1 - (p - 0.33) / 0.08);
    const e =
      p < 0.33 ? Math.max(0, 1 - (0.33 - p) / 0.08) :
      p < 0.66 ? 1 :
      Math.max(0, 1 - (p - 0.66) / 0.08);
    const c = p > 0.66 ? 1 : Math.max(0, 1 - (0.66 - p) / 0.08);
    if (caps.waste) {
      caps.waste.style.opacity = w.toFixed(3);
      caps.waste.classList.toggle("is-on", w > 0.5);
    }
    if (caps.energy) {
      caps.energy.style.opacity = e.toFixed(3);
      caps.energy.classList.toggle("is-on", e > 0.5);
    }
    if (caps.compute) {
      caps.compute.style.opacity = c.toFixed(3);
      caps.compute.classList.toggle("is-on", c > 0.5);
    }
  }

  // ----- object-fit:cover math on canvas ---------------------------------
  function drawCover(img) {
    if (!img) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / FW, ch / FH);
    const dw = FW * scale;
    const dh = FH * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ----- Render -----------------------------------------------------------
  let lastDrawn = -1;
  function render() {
    if (!ready) return;
    const r = root.getBoundingClientRect();
    const span = root.offsetHeight - window.innerHeight;
    const p = Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
    const idx = Math.min(TOTAL - 1, Math.round(p * (TOTAL - 1)));

    // Update CSS var for parallax — runs every frame even if image hasn't
    // changed, so the zoom/drift stays in sync with sub-pixel scroll.
    canvas.style.setProperty("--p", p.toFixed(4));

    if (idx !== lastDrawn) {
      const img = nearestLoaded(idx);
      if (img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCover(img);
        lastDrawn = idx;
      }
    }
    setCaption(p);
  }

  // ----- Scroll throttled via rAF ----------------------------------------
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        render();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  setCaption(0);
})();
