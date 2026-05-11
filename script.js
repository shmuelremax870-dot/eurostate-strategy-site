const productData = {
  influemint: {
    title: "InflueMint",
    copy:
      "AI commerce infrastructure product under the Eurostate Strategy venture studio model.",
    category: "AI Commerce Platform",
    role: "Product ecosystem",
  },
  "studio-rocket": {
    title: "Studio Rocket",
    copy:
      "Product and launch infrastructure brand for packaging modern digital products and AI-enabled business systems.",
    category: "AI Product Brand",
    role: "Launch infrastructure",
  },
};

const progress = document.querySelector(".progress-bar span");
const header = document.querySelector("[data-header]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const spotlight = document.querySelector(".cursor-spotlight");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const depthItems = [...document.querySelectorAll("[data-depth]")];
const signalRows = [...document.querySelectorAll("[data-signal-row]")];
const hudLayer = document.querySelector("[data-hud-layer]");
const hudState = document.querySelector("[data-hud-state]");
const hudProgress = document.querySelector("[data-hud-progress]");
const hudSections = [...document.querySelectorAll("[data-hud-layer][data-hud-state]")];
const architectureButtons = [...document.querySelectorAll("[data-architecture-mode]")];
const architectureNodes = [...document.querySelectorAll("[data-arch-node]")];
const architectureTitle = document.querySelector("[data-arch-title]");
const architectureCopy = document.querySelector("[data-arch-copy]");
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const architectureModes = {
  intelligence: {
    title: "Signal Intelligence",
    copy: "Market gap, category thesis, and demand surface",
  },
  architecture: {
    title: "AI Architecture",
    copy: "Agents, workflows, data flows, orchestration, and model logic",
  },
  product: {
    title: "Productization Layer",
    copy: "UX, platform surface, operating workflows, and launch assets",
  },
  market: {
    title: "Market Expansion Layer",
    copy: "Commercial path, licensing structures, rollout systems, and global category position",
  },
};

function updateDepth() {
  if (reducedMotion) return;

  depthItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const depth = Number.parseFloat(item.dataset.depth || "0");
    const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
    item.style.setProperty("--depth-y", `${(-centerOffset * depth).toFixed(2)}px`);
  });
}

function updateChrome() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
  if (hudProgress) {
    hudProgress.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
  }
  header.classList.toggle("scrolled", window.scrollY > 12);
  updateDepth();
}

window.addEventListener("scroll", updateChrome, { passive: true });
window.addEventListener("resize", updateChrome);
updateChrome();

if (!reducedMotion && signalRows.length > 0) {
  let activeSignalIndex = 0;

  window.setInterval(() => {
    signalRows.forEach((row, index) => {
      row.classList.toggle("active", index === activeSignalIndex);
    });
    activeSignalIndex = (activeSignalIndex + 1) % signalRows.length;
  }, 1700);
}

function setArchitectureMode(mode) {
  const selected = architectureModes[mode];
  if (!selected) return;

  architectureButtons.forEach((button) => {
    const isActive = button.dataset.architectureMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  architectureNodes.forEach((node) => {
    node.classList.toggle("active", node.dataset.archNode === mode);
  });

  if (architectureTitle) architectureTitle.textContent = selected.title;
  if (architectureCopy) architectureCopy.textContent = selected.copy;
}

architectureButtons.forEach((button) => {
  const activate = () => setArchitectureMode(button.dataset.architectureMode);
  button.addEventListener("click", activate);
  button.addEventListener("pointerup", activate);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

setArchitectureMode("intelligence");

const hudObserver = new IntersectionObserver(
  (entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!active || !hudLayer || !hudState) return;

    hudLayer.textContent = active.target.dataset.hudLayer;
    hudState.textContent = active.target.dataset.hudState;
  },
  { threshold: [0.18, 0.36, 0.54], rootMargin: "-24% 0px -42% 0px" }
);

hudSections.forEach((section) => hudObserver.observe(section));

if (!reducedMotion && spotlight) {
  window.addEventListener(
    "pointermove",
    (event) => {
      document.body.classList.add("pointer-active");
      document.documentElement.style.setProperty("--spotlight-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--spotlight-y", `${event.clientY}px`);
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("pointer-active");
  });
}

const navObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { threshold: [0.28, 0.46, 0.64], rootMargin: "-18% 0px -48% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const cards = [...document.querySelectorAll("[data-product]")];
const detailTitle = document.querySelector("[data-detail-title]");
const detailCopy = document.querySelector("[data-detail-copy]");
const detailCategory = document.querySelector("[data-detail-category]");
const detailRole = document.querySelector("[data-detail-role]");

function setProduct(productKey) {
  const product = productData[productKey];
  if (!product) return;

  cards.forEach((card) => {
    card.classList.toggle("active", card.dataset.product === productKey);
  });

  detailTitle.textContent = product.title;
  detailCopy.textContent = product.copy;
  detailCategory.textContent = product.category;
  detailRole.textContent = product.role;
}

cards.forEach((card) => {
  card.addEventListener("click", () => setProduct(card.dataset.product));
  card.addEventListener("pointermove", (event) => {
    if (reducedMotion) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = ((y / rect.height) - 0.5) * -8;

    card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setProduct(card.dataset.product);
    }
  });
});

const canvas = document.getElementById("heroCanvas");
const context = canvas.getContext("2d");
const radarCanvas = document.getElementById("radarCanvas");
const radarContext = radarCanvas ? radarCanvas.getContext("2d") : null;
const globeCanvas = document.getElementById("globeCanvas");
const globeContext = globeCanvas ? globeCanvas.getContext("2d") : null;
const nodes = [
  { x: 0.14, y: 0.26, r: 3, label: "Signal" },
  { x: 0.28, y: 0.58, r: 4, label: "Lab" },
  { x: 0.42, y: 0.34, r: 3, label: "AI Core" },
  { x: 0.56, y: 0.62, r: 5, label: "Product" },
  { x: 0.71, y: 0.32, r: 3, label: "Venture" },
  { x: 0.84, y: 0.58, r: 4, label: "Market" },
  { x: 0.92, y: 0.42, r: 3, label: "Scale" },
];
const links = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [1, 3],
  [2, 4],
  [3, 5],
];
const fieldDots = Array.from({ length: 56 }, (_, index) => ({
  x: ((index * 37) % 100) / 100,
  y: ((index * 61) % 100) / 100,
  s: 0.7 + (index % 4) * 0.34,
  phase: index * 0.47,
}));
const continents = [
  {
    name: "North America",
    points: [
      [-168, 70], [-138, 72], [-112, 62], [-86, 54], [-62, 45], [-76, 28],
      [-98, 18], [-118, 24], [-134, 38], [-154, 55],
    ],
  },
  {
    name: "South America",
    points: [
      [-82, 12], [-66, 5], [-50, -7], [-42, -22], [-54, -54], [-70, -47],
      [-78, -18],
    ],
  },
  {
    name: "Europe",
    points: [
      [-12, 58], [10, 64], [34, 55], [38, 42], [20, 35], [0, 38], [-12, 48],
    ],
  },
  {
    name: "Africa",
    points: [
      [-18, 34], [16, 37], [36, 22], [42, -8], [28, -34], [4, -36],
      [-13, -10],
    ],
  },
  {
    name: "Asia",
    points: [
      [34, 64], [82, 72], [138, 58], [154, 34], [128, 8], [94, 8],
      [58, 24], [38, 46],
    ],
  },
  {
    name: "Australia",
    points: [
      [112, -12], [154, -18], [150, -38], [118, -35], [108, -23],
    ],
  },
];

let width = 0;
let height = 0;
let radarWidth = 0;
let radarHeight = 0;
let globeWidth = 0;
let globeHeight = 0;
let pixelRatio = 1;
let animationFrame = null;
let globePointer = { active: false, x: 0, y: 0 };
let hoveredContinent = "";

function resizeCanvas() {
  const box = canvas.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.floor(box.width);
  height = Math.floor(box.height);
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function resizeRadar() {
  if (!radarCanvas || !radarContext) return;

  const box = radarCanvas.getBoundingClientRect();
  radarWidth = Math.floor(box.width);
  radarHeight = Math.floor(box.height);
  radarCanvas.width = Math.floor(radarWidth * pixelRatio);
  radarCanvas.height = Math.floor(radarHeight * pixelRatio);
  radarContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function resizeGlobe() {
  if (!globeCanvas || !globeContext) return;

  const box = globeCanvas.getBoundingClientRect();
  globeWidth = Math.floor(box.width);
  globeHeight = Math.floor(box.height);
  globeCanvas.width = Math.floor(globeWidth * pixelRatio);
  globeCanvas.height = Math.floor(globeHeight * pixelRatio);
  globeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawGrid() {
  context.strokeStyle = "rgba(246, 241, 232, 0.055)";
  context.lineWidth = 1;

  for (let x = 0; x < width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y < height; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawSignalField(time) {
  fieldDots.forEach((dot) => {
    const flicker = reducedMotion ? 0.32 : 0.18 + Math.sin(time * 0.0016 + dot.phase) * 0.14;
    context.beginPath();
    context.arc(dot.x * width, dot.y * height, dot.s, 0, Math.PI * 2);
    context.fillStyle = `rgba(246, 241, 232, ${Math.max(0.08, flicker)})`;
    context.fill();
  });

  if (reducedMotion) return;

  const y = ((time * 0.025) % (height + 260)) - 130;
  const sweep = context.createLinearGradient(0, y - 80, 0, y + 80);
  sweep.addColorStop(0, "rgba(53, 211, 199, 0)");
  sweep.addColorStop(0.5, "rgba(53, 211, 199, 0.09)");
  sweep.addColorStop(1, "rgba(53, 211, 199, 0)");
  context.fillStyle = sweep;
  context.fillRect(0, y - 80, width, 160);
}

function drawArchitecture(time) {
  const points = nodes.map((node, index) => {
    const drift = reducedMotion ? 0 : Math.sin(time * 0.001 + index) * 8;
    return {
      x: node.x * width + drift,
      y: node.y * height + Math.cos(time * 0.0012 + index) * 6,
      r: node.r,
      label: node.label,
    };
  });

  context.lineWidth = 1.2;
  links.forEach(([from, to]) => {
    const point = points[from];
    const next = points[to];

    const gradient = context.createLinearGradient(point.x, point.y, next.x, next.y);
    gradient.addColorStop(0, "rgba(53, 211, 199, 0.08)");
    gradient.addColorStop(0.5, "rgba(246, 241, 232, 0.22)");
    gradient.addColorStop(1, "rgba(200, 162, 95, 0.12)");
    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(next.x, next.y);
    context.stroke();
  });

  points.forEach((point, index) => {
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.002 + index) * 1.8;
    context.beginPath();
    context.arc(point.x, point.y, point.r + 7 + pulse, 0, Math.PI * 2);
    context.strokeStyle = "rgba(53, 211, 199, 0.12)";
    context.stroke();

    context.beginPath();
    context.arc(point.x, point.y, point.r + 2, 0, Math.PI * 2);
    context.fillStyle = index % 2 === 0 ? "rgba(53, 211, 199, 0.9)" : "rgba(200, 162, 95, 0.88)";
    context.fill();

    context.font = "600 12px Inter, system-ui, sans-serif";
    context.fillStyle = "rgba(246, 241, 232, 0.42)";
    context.fillText(point.label, point.x + 14, point.y - 10);
  });

  const packet = reducedMotion ? 0.62 : (time * 0.00008) % 1;
  const segment = Math.min(points.length - 2, Math.floor(packet * (points.length - 1)));
  const local = packet * (points.length - 1) - segment;
  const start = points[segment];
  const end = points[segment + 1];

  if (start && end) {
    const x = start.x + (end.x - start.x) * local;
    const y = start.y + (end.y - start.y) * local;
    context.beginPath();
    context.arc(x, y, 4.5, 0, Math.PI * 2);
    context.fillStyle = "rgba(246, 241, 232, 0.92)";
    context.fill();
  }
}

function drawRadar(time) {
  if (!radarContext || radarWidth === 0 || radarHeight === 0) return;

  radarContext.clearRect(0, 0, radarWidth, radarHeight);
  const centerX = radarWidth / 2;
  const centerY = radarHeight / 2;
  const radius = Math.min(radarWidth, radarHeight) * 0.34;

  radarContext.strokeStyle = "rgba(53, 211, 199, 0.12)";
  radarContext.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring += 1) {
    radarContext.beginPath();
    radarContext.arc(centerX, centerY, (radius / 4) * ring, 0, Math.PI * 2);
    radarContext.stroke();
  }

  const sweepAngle = reducedMotion ? 0.8 : (time * 0.00055) % (Math.PI * 2);
  const sweep = radarContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  sweep.addColorStop(0, "rgba(53, 211, 199, 0.2)");
  sweep.addColorStop(1, "rgba(53, 211, 199, 0)");
  radarContext.fillStyle = sweep;
  radarContext.beginPath();
  radarContext.moveTo(centerX, centerY);
  radarContext.arc(centerX, centerY, radius, sweepAngle, sweepAngle + 0.62);
  radarContext.closePath();
  radarContext.fill();

  const points = [
    [0.18, 0.22, "rgba(53, 211, 199, 0.8)"],
    [0.78, 0.28, "rgba(200, 162, 95, 0.78)"],
    [0.24, 0.76, "rgba(131, 209, 139, 0.76)"],
    [0.73, 0.72, "rgba(53, 211, 199, 0.72)"],
    [0.52, 0.18, "rgba(246, 241, 232, 0.7)"],
  ];

  points.forEach(([x, y, color], index) => {
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.002 + index) * 2;
    radarContext.beginPath();
    radarContext.arc(x * radarWidth, y * radarHeight, 3.5 + pulse, 0, Math.PI * 2);
    radarContext.fillStyle = color;
    radarContext.fill();
  });
}

function projectGlobePoint(lon, lat, rotation, centerX, centerY, radius) {
  const lambda = (lon - rotation) * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const cosPhi = Math.cos(phi);
  const z = cosPhi * Math.cos(lambda);

  return {
    x: centerX + radius * cosPhi * Math.sin(lambda),
    y: centerY - radius * Math.sin(phi),
    z,
    visible: z > -0.04,
  };
}

function drawGlobeGrid(centerX, centerY, radius, rotation) {
  if (!globeContext) return;

  globeContext.save();
  globeContext.beginPath();
  globeContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  globeContext.clip();
  globeContext.strokeStyle = "rgba(246, 241, 232, 0.08)";
  globeContext.lineWidth = 1;

  for (let lat = -60; lat <= 60; lat += 30) {
    globeContext.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 4) {
      const point = projectGlobePoint(lon, lat, rotation, centerX, centerY, radius);
      if (!point.visible) {
        started = false;
        continue;
      }
      if (!started) {
        globeContext.moveTo(point.x, point.y);
        started = true;
      } else {
        globeContext.lineTo(point.x, point.y);
      }
    }
    globeContext.stroke();
  }

  for (let lon = -150; lon <= 180; lon += 30) {
    globeContext.beginPath();
    let started = false;
    for (let lat = -82; lat <= 82; lat += 4) {
      const point = projectGlobePoint(lon, lat, rotation, centerX, centerY, radius);
      if (!point.visible) {
        started = false;
        continue;
      }
      if (!started) {
        globeContext.moveTo(point.x, point.y);
        started = true;
      } else {
        globeContext.lineTo(point.x, point.y);
      }
    }
    globeContext.stroke();
  }

  globeContext.restore();
}

function buildContinentPath(continent, rotation, centerX, centerY, radius) {
  const path = new Path2D();
  let visiblePoints = 0;
  let started = false;

  continent.points.forEach(([lon, lat]) => {
    const point = projectGlobePoint(lon, lat, rotation, centerX, centerY, radius);
    if (!point.visible) {
      return;
    }

    visiblePoints += 1;
    if (!started) {
      path.moveTo(point.x, point.y);
      started = true;
    } else {
      path.lineTo(point.x, point.y);
    }
  });

  if (visiblePoints > 2) path.closePath();
  return visiblePoints > 2 ? path : null;
}

function drawSignalArc(from, to) {
  if (!globeContext) return;

  const middleX = (from.x + to.x) / 2;
  const middleY = (from.y + to.y) / 2 - 34;
  globeContext.beginPath();
  globeContext.moveTo(from.x, from.y);
  globeContext.quadraticCurveTo(middleX, middleY, to.x, to.y);
  globeContext.stroke();
}

function drawGlobe(time) {
  if (!globeContext || globeWidth === 0 || globeHeight === 0) return;

  globeContext.clearRect(0, 0, globeWidth, globeHeight);
  const centerX = globeWidth / 2;
  const centerY = globeHeight * 0.55;
  const radius = Math.min(globeWidth, globeHeight) * 0.3;
  const rotation = reducedMotion ? 12 : (time * 0.006) % 360;

  const sphere = globeContext.createRadialGradient(
    centerX - radius * 0.42,
    centerY - radius * 0.48,
    radius * 0.12,
    centerX,
    centerY,
    radius
  );
  sphere.addColorStop(0, "rgba(53, 211, 199, 0.3)");
  sphere.addColorStop(0.45, "rgba(13, 44, 46, 0.82)");
  sphere.addColorStop(1, "rgba(2, 5, 7, 0.94)");

  globeContext.save();
  globeContext.shadowBlur = 40;
  globeContext.shadowColor = "rgba(53, 211, 199, 0.35)";
  globeContext.beginPath();
  globeContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  globeContext.fillStyle = sphere;
  globeContext.fill();
  globeContext.restore();

  drawGlobeGrid(centerX, centerY, radius, rotation);

  const paths = continents
    .map((continent) => ({
      continent,
      path: buildContinentPath(continent, rotation, centerX, centerY, radius),
    }))
    .filter((entry) => entry.path);

  let nextHovered = "";
  if (globePointer.active) {
    paths.forEach((entry) => {
      if (globeContext.isPointInPath(entry.path, globePointer.x, globePointer.y)) {
        nextHovered = entry.continent.name;
      }
    });
  }
  hoveredContinent = nextHovered;

  globeContext.save();
  globeContext.beginPath();
  globeContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  globeContext.clip();

  paths.forEach((entry) => {
    const isHovered = entry.continent.name === hoveredContinent;
    globeContext.save();
    globeContext.shadowBlur = isHovered ? 28 : 0;
    globeContext.shadowColor = "rgba(53, 211, 199, 0.9)";
    globeContext.fillStyle = isHovered ? "rgba(53, 211, 199, 0.42)" : "rgba(246, 241, 232, 0.16)";
    globeContext.strokeStyle = isHovered ? "rgba(246, 241, 232, 0.88)" : "rgba(53, 211, 199, 0.34)";
    globeContext.lineWidth = isHovered ? 1.8 : 1;
    globeContext.fill(entry.path);
    globeContext.stroke(entry.path);
    globeContext.restore();
  });

  if (hoveredContinent) {
    const centerPoint = { x: centerX, y: centerY };
    const networkPoints = [
      { x: centerX - radius * 0.48, y: centerY - radius * 0.15 },
      { x: centerX + radius * 0.46, y: centerY - radius * 0.28 },
      { x: centerX + radius * 0.3, y: centerY + radius * 0.42 },
    ];
    globeContext.strokeStyle = "rgba(53, 211, 199, 0.58)";
    globeContext.lineWidth = 1.2;
    networkPoints.forEach((point) => drawSignalArc(centerPoint, point));
  }

  globeContext.restore();

  globeContext.beginPath();
  globeContext.arc(centerX, centerY, radius + 7, 0, Math.PI * 2);
  globeContext.strokeStyle = hoveredContinent ? "rgba(53, 211, 199, 0.72)" : "rgba(246, 241, 232, 0.12)";
  globeContext.lineWidth = 1.2;
  globeContext.stroke();

  if (hoveredContinent) {
    globeContext.fillStyle = "rgba(246, 241, 232, 0.86)";
    globeContext.font = "700 13px Inter, system-ui, sans-serif";
    globeContext.fillText(hoveredContinent, centerX - radius * 0.42, centerY + radius + 34);
  }
}

function render(time = 0) {
  context.clearRect(0, 0, width, height);
  drawGrid();
  drawSignalField(time);
  drawArchitecture(time);
  drawRadar(time);
  drawGlobe(time);

  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(render);
  }
}

function startCanvas() {
  resizeCanvas();
  resizeRadar();
  resizeGlobe();
  render(0);
  if (!reducedMotion) {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(render);
  }
}

window.addEventListener("resize", startCanvas);
startCanvas();

if (globeCanvas) {
  globeCanvas.addEventListener(
    "pointermove",
    (event) => {
      const rect = globeCanvas.getBoundingClientRect();
      globePointer = {
        active: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    { passive: true }
  );

  globeCanvas.addEventListener("pointerleave", () => {
    globePointer = { active: false, x: 0, y: 0 };
    hoveredContinent = "";
  });
}
