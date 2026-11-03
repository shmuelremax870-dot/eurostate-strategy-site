// Eurostate Strategy — hero v2: real footage + a photographic Earth, choreographed by scroll.
// Footage (credited in index.html): Mixkit + Pexels free licences. Earth: NASA Blue Marble ("Whole world – land and oceans",
// public domain) and NASA "Earth's City Lights" (DMSP, public domain). three.js r170 (MIT), self-hosted.
import * as THREE from './assets/vendor/three.module.min.js';

const root = document.documentElement;
const stage = document.getElementById('stage');
const canvas = document.getElementById('globe');
const CAPTURE = location.search.includes('capture');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !CAPTURE;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (e) { return false; }
}
if (!stage || !canvas || reduce || !webglOK()) {
  // Still hero: the poster frame of the opening footage + the first caption (CSS handles the rest).
} else {
  start().catch(err => { console.warn('stage fallback', err); root.classList.remove('stage-live'); });
}

const D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// win(p, a, b, c, d): 0 before a, ramps to 1 by b, holds, ramps down from c to 0 at d.
const win = (p, a, b, c, d) => Math.min(ss(a, b, p), 1 - ss(c, d, p));

function ll(lat, lon, r = 1, out = new THREE.Vector3()) {
  const la = lat * D2R, lo = lon * D2R;
  return out.set(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}
// Lat/lon grid with explicit equirectangular UVs, so the textures line up exactly with ll().
function grid(lon0, lon1, lat0, lat1, nx, ny, r) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny; const p = ll(lerp(lat0, lat1, v), lerp(lon0, lon1, u), r);
    pos.push(p.x, p.y, p.z); uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

const LARNACA = { lat: 34.92, lon: 33.62 };
const PATCH = { lon0: 20, lon1: 44, lat0: 26, lat1: 42 };
// Decorative reach lines (unlabelled), from Larnaca toward major markets.
// A European network (unlabelled hubs), drawn on the closing step.
const HUB = { lon: [51.5,-0.1], par: [48.9,2.35], fra: [50.1,8.7], ams: [52.37,4.9], ber: [52.5,13.4], mil: [45.5,9.2], mad: [40.4,-3.7], lis: [38.7,-9.1], dub: [53.35,-6.26], sto: [59.33,18.07], hel: [60.17,24.94], war: [52.23,21.0], vie: [48.2,16.37], buc: [44.43,26.1], ath: [37.98,23.7] };
const LINKS = [['dub','lon'],['lon','ams'],['lon','par'],['ams','fra'],['par','fra'],['par','mad'],['mad','lis'],['par','mil'],['fra','mil'],['fra','ber'],['ams','sto'],['sto','hel'],['ber','war'],['ber','vie'],['vie','buc'],['mil','ath'],['buc','ath'],['war','hel']];

const EARTH_VS = `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const EARTH_FS = `
uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uSun; uniform float uNightAmt; uniform float uPatch; uniform float uAlpha;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  vec3 day = texture2D(uDay, vUv).rgb;
  float lum = dot(day, vec3(.299,.587,.114));
  float water = smoothstep(0.02, 0.10, day.b - max(day.r, day.g) + 0.04) * (1.0 - smoothstep(0.35, 0.6, lum));
  float ndl = dot(n, normalize(uSun));
  float dayMix = smoothstep(-0.12, 0.22, ndl);
  vec3 lit = day * (0.18 + 1.05 * max(ndl, 0.0));
  // gentle ocean glint
  vec3 h = normalize(normalize(uSun) + v); float spec = pow(max(dot(n, h), 0.0), 60.0) * water * 0.35;
  lit += vec3(1.0, .93, .82) * spec * dayMix;
  vec3 nightTex = texture2D(uNight, vec2(vUv.x, vUv.y)).rgb;
  float lights = smoothstep(0.24, 0.8, dot(nightTex, vec3(.333)));
  vec3 night = day * 0.035 + vec3(1.0, .78, .48) * lights * 1.7 * uNightAmt;
  vec3 col = mix(night, lit, dayMix);
  // atmosphere at the limb
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col += vec3(.35, .55, 1.0) * fres * (0.25 + 0.75 * smoothstep(-0.3, 0.6, ndl)) * 0.55;
  // film-ish toe and slight warmth
  col = col / (col + vec3(0.9)) * 1.75;
  float a = uAlpha;
  if (uPatch > 0.5) { vec2 e = min(vUv, 1.0 - vUv); a *= smoothstep(0.0, 0.08, min(e.x, e.y)); }
  gl_FragColor = vec4(col, a);
}`;
const ATMO_FS = `
uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
  float rim = pow(1.0 - abs(dot(n, v)), 2.2); float lit = 0.35 + 0.65 * smoothstep(-0.4, 0.5, dot(n, normalize(uSun)));
  gl_FragColor = vec4(vec3(.32, .55, 1.0) * rim * lit, rim * 0.9); }`;

function loadTex(url) {
  return new Promise((res, rej) => new THREE.TextureLoader().load(url, t => res(t), undefined, rej));
}

async function start() {
  root.classList.add('stage-live');
  const mobile = Math.min(innerWidth, innerHeight) < 700 || /Mobi/.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.75 : 2));
  renderer.setClearColor(0x03070f, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

  const [dayT, nightT, patchT] = await Promise.all([
    loadTex(`assets/tex/earth-day-${mobile ? '2k' : '4k'}.jpg`),
    loadTex(`assets/tex/earth-night-${mobile ? '2k' : '4k'}.jpg`),
    loadTex('assets/tex/med-patch.jpg'),
  ]);
  for (const t of [dayT, nightT, patchT]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }

  const globe = new THREE.Group(); scene.add(globe);
  const uni = { uDay: { value: dayT }, uNight: { value: nightT }, uSun: { value: new THREE.Vector3(-.5, .4, .75) }, uNightAmt: { value: 0 }, uPatch: { value: 0 }, uAlpha: { value: 1 } };
  const earthMat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: EARTH_VS, fragmentShader: EARTH_FS });
  globe.add(new THREE.Mesh(grid(-180, 180, -90, 90, 160, 80, 1), earthMat));
  const patchMat = new THREE.ShaderMaterial({ uniforms: { ...uni, uDay: { value: patchT }, uPatch: { value: 1 }, uAlpha: { value: 1 } }, vertexShader: EARTH_VS, fragmentShader: EARTH_FS, transparent: true, depthWrite: false });
  patchMat.uniforms.uSun = uni.uSun; patchMat.uniforms.uNightAmt = uni.uNightAmt;
  const patchGeo = grid(PATCH.lon0, PATCH.lon1, PATCH.lat0, PATCH.lat1, 48, 32, 1.0004);
  const patch = new THREE.Mesh(patchGeo, patchMat); patch.renderOrder = 1; globe.add(patch);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 64), new THREE.ShaderMaterial({ uniforms: { uSun: uni.uSun }, vertexShader: EARTH_VS, fragmentShader: ATMO_FS, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(atmo);

  // faint, sparse stars (real space photos show few)
  { const n = 900, p = new Float32Array(n * 3); let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) { const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 30; p[i*3] = r*Math.sin(ph)*Math.cos(th); p[i*3+1] = r*Math.cos(ph); p[i*3+2] = r*Math.sin(ph)*Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfcbe0, size: mobile ? 0.05 : 0.04, transparent: true, opacity: .35, depthWrite: false }))); }

  // Larnaca marker: a small precise pin, no glow.
  const lp = ll(LARNACA.lat, LARNACA.lon, 1.001);
  const pin = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 24), new THREE.MeshBasicMaterial({ color: 0xe8b04a, transparent: true, depthWrite: false }));
  pin.position.copy(lp); pin.lookAt(lp.clone().multiplyScalar(2)); globe.add(pin);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.011, 0.0125, 48), new THREE.MeshBasicMaterial({ color: 0xe8b04a, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  ring.position.copy(lp); ring.lookAt(lp.clone().multiplyScalar(2)); globe.add(ring);

  // Thin reach lines.
  const arcs = LINKS.map(([k1, k2], i) => {
    const a = ll(HUB[k1][0], HUB[k1][1], 1.002), b = ll(HUB[k2][0], HUB[k2][1], 1.002);
    const dist = a.angleTo(b); const mid = a.clone().add(b).normalize().multiplyScalar(1 + 0.02 + dist * 0.18);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 96, mobile ? 0.0018 : 0.0017, 5, false);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf2d29a, transparent: true, opacity: 0.6, depthWrite: false }));
    m.geometry.setDrawRange(0, 0); globe.add(m);
    const end = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 16), new THREE.MeshBasicMaterial({ color: 0xf6e2b8, transparent: true, opacity: 0, depthWrite: false }));
    end.position.copy(b); end.lookAt(b.clone().multiplyScalar(2)); globe.add(end);
    return { m, end, total: geo.index.count, delay: (i % 6) * 0.06 };
  });

  // Video layers.
  const layers = [...stage.querySelectorAll('.layer')].map(el => ({ el, v: el.querySelector('video'), loaded: false, playing: false }));
  function ensure(L) {
    if (L.loaded || !L.v) return;
    L.loaded = true;
    for (const s of L.v.querySelectorAll('source[data-src]')) { s.src = s.dataset.src; }
    L.v.load();
  }
  if (CAPTURE) {
    layers.forEach(ensure);
    await Promise.all(layers.map(L => new Promise(r => { if (L.v.readyState >= 2) return r(); L.v.addEventListener('loadeddata', r, { once: true }); setTimeout(r, 8000); })));
  }

  // Camera keyframes in scroll progress p: [p, lon, lat, dist, offsetX, offsetY]
  const KD = [
    [0.00, 26, 30, 4.6, 0.50, 0.05],
    [0.10, 22, 38, 4.3, 0.46, 0.05],
    [0.24, 16, 45, 3.0, 0.30, 0.03],
    [0.38, 13, 47, 2.05, 0.18, 0.02],
    [0.76, 24, 42, 3.4, 0.36, 0.05],
    [0.90, 14, 48, 2.75, 0.40, 0.02],
    [1.00, 12, 49, 2.6, 0.42, 0.02],
  ];
  const KM = KD.map(k => [k[0], k[1], k[2] - 3, k[3] * 1.32, 0, 0.42]);

  let W = 0, H = 0;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  const caps = [...stage.querySelectorAll('.cap')];
  const ticks = [...stage.querySelectorAll('[data-tick]')];
  const tag = stage.querySelector('.geo-tag');
  const CAPW = [[-1, -0.5, 0.07, 0.11], [0.17, 0.21, 0.33, 0.37], [0.42, 0.45, 0.54, 0.57], [0.58, 0.61, 0.67, 0.70], [0.71, 0.74, 0.81, 0.84], [0.89, 0.93, 2, 3]];
  const LAYW = { hero: [-1, -0.5, 0.10, 0.17], energy: [0.36, 0.41, 0.555, 0.595], dc: [0.555, 0.595, 0.68, 0.72], build: [0.68, 0.72, 0.82, 0.87] };

  const qy = new THREE.Quaternion(), qx = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  const sunDay = new THREE.Vector3(-.45, .45, .77).normalize(), sunNight = new THREE.Vector3(.9, .2, -.1).normalize();
  let p = 0, pSm = 0, clock = 0;
  const readP = () => { const r = stage.getBoundingClientRect(); const span = stage.offsetHeight - innerHeight; return span > 0 ? clamp(-r.top / span) : 0; };

  function sample(K, q) {
    let i = 0; while (i < K.length - 2 && q > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1]; const t = ease(clamp((q - a[0]) / (b[0] - a[0])));
    return a.map((x, j) => j === 0 ? q : lerp(x, b[j], t));
  }

  function frame(dt) {
    clock += dt;
    p = readP();
    pSm = CAPTURE ? p : pSm + (p - pSm) * Math.min(1, dt * 6);
    const q = pSm;
    const K = innerWidth < 760 ? KM : KD;
    const [, lon, lat, dist, ox, oy] = sample(K, q);
    const drift = q < 0.4 ? clock * 0.5 : (q > 0.86 ? clock * 0.25 : 0);
    qy.setFromAxisAngle(Y, -(lon + drift) * D2R); qx.setFromAxisAngle(X, lat * D2R);
    globe.quaternion.copy(qx).multiply(qy);
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, -ox * W * 0.5, oy * H * 0.5, W, H);

    const nightAmt = ss(0.72, 0.84, q);
    uni.uNightAmt.value = nightAmt;
    uni.uSun.value.copy(sunDay).lerp(sunNight, nightAmt).normalize();
    patchMat.uniforms.uAlpha.value = 1 - ss(0.5, 0.7, q);

    const pinA = 0;
    pin.material.opacity = pinA; ring.material.opacity = pinA * (0.55 + 0.25 * Math.sin(clock * 2.2));
    const arcP = ss(0.87, 0.98, q);
    for (const A of arcs) {
      const t = clamp((arcP - A.delay) / 0.62);
      A.m.geometry.setDrawRange(0, Math.floor(A.total * t / 3) * 3);
      A.m.material.opacity = 0.55;
      A.end.material.opacity = ss(0.92, 1, t) * 0.9;
    }

    // video layers
    let covered = false;
    for (const L of layers) {
      const w = LAYW[L.el.dataset.layer]; const o = win(q, ...w);
      const local = clamp((q - w[0]) / (w[3] - w[0]));
      L.el.style.opacity = o.toFixed(3);
      if (o > 0.999) covered = true;
      L.el.style.transform = `scale(${(1.06 + 0.06 * local).toFixed(4)})`;
      const near = q > w[0] - 0.08 && q < w[3] + 0.04;
      if (near) ensure(L);
      if (!CAPTURE && L.v) {
        if (o > 0.001 && !L.playing) { L.playing = true; const pr = L.v.play(); if (pr) pr.catch(() => { L.playing = false; }); }
        else if (o <= 0.001 && L.playing) { L.playing = false; L.v.pause(); }
      }
    }
    // geo tag (Larnaca coordinates) follows the pin during the dive
    if (tag) {
      const tA = 0;
      if (tA > 0.01) {
        globe.updateMatrixWorld(); const wp = lp.clone().applyMatrix4(globe.matrixWorld).project(camera);
        const sx = (wp.x * .5 + .5) * W, sy = (-wp.y * .5 + .5) * H; const flip = sx > W - 230;
        tag.classList.toggle('flip', flip);
        tag.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)${flip ? ' translateX(-100%)' : ''}`;
      }
      tag.style.opacity = tA.toFixed(3);
    }
    // captions
    let active = 0;
    caps.forEach((c, i) => {
      const w = CAPW[i]; const o = win(q, ...w);
      c.style.opacity = o.toFixed(3); c.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      c.style.transform = `translateY(${((1 - o) * (q < w[1] ? 26 : -18)).toFixed(1)}px)`;
      if (q >= w[0] - 0.02) active = i;
    });
    ticks.forEach((t, i) => t.classList.toggle('on', i === active));
    root.style.setProperty('--hint', (1 - ss(0.0, 0.04, q)).toFixed(3));
    // save the phone's GPU: no WebGL work while a full-screen clip covers the globe or the hero is scrolled away
    const offscreen = stage.getBoundingClientRect().bottom < 0;
    if (!covered && !offscreen) renderer.render(scene, camera);
  }

  root.classList.add('stage-ready');
  if (CAPTURE) {
    window.__step = async (ms) => {
      const dt = ms / 1000; clock += 0; // clock advances inside frame()
      // seek visible videos to the virtual clock
      const q = readP(); const waits = [];
      for (const L of layers) {
        const w = LAYW[L.el.dataset.layer]; const o = win(q, ...w);
        if (o > 0.001 && L.v && L.v.duration) {
          const t = ((clock + dt) * 0.9) % (L.v.duration - 0.05);
          if (Math.abs(L.v.currentTime - t) > 0.001) {
            waits.push(new Promise(r => { const done = () => r(); L.v.addEventListener('seeked', done, { once: true }); setTimeout(done, 1500); }));
            L.v.currentTime = t;
          }
        }
      }
      await Promise.all(waits);
      frame(dt);
    };
    frame(0);
  } else {
    let last = performance.now();
    const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    for (const L of layers) if (L.v) L.v.playbackRate = 0.9;
  }
}
