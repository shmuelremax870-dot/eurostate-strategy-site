// Eurostate Strategy — small progressive enhancements (no tracking, no external requests)
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.site-header');
    var btn = document.querySelector('.menu-btn');
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open menu');
      });
    });

    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('in'); });
    }

    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();

(function () {
  var kick = function () {
    document.querySelectorAll('video').forEach(function (v) {
      v.muted = true;
      if (v.paused && (v.hasAttribute('autoplay') || v.dataset.want === '1')) { var p = v.play(); if (p) p.catch(function () {}); }
    });
  };
  var hv = document.querySelector('video[autoplay]');
  // Safety net: if the scroll stage has not started the opening footage (no WebGL, reduced motion, script error), start it here.
  if (hv) setTimeout(function () {
    if (hv.currentSrc) return;
    hv.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); });
    hv.muted = true; hv.load(); var p = hv.play(); if (p) p.catch(function () {});
  }, 1200);
  ['touchstart', 'click', 'scroll'].forEach(function (e) { window.addEventListener(e, kick, { passive: true, once: true }); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
})();

// One quiet retry if a clip's network fetch fails (flaky mobile connections).
document.querySelectorAll('video').forEach(function (v) {
  var tries = 0;
  var retry = function () {
    if (tries++ >= 2) return;
    setTimeout(function () { var t = v.currentTime; v.load(); v.muted = true; var p = v.play(); if (p) p.catch(function () {}); }, 1200);
  };
  v.addEventListener('error', retry);
  v.querySelectorAll('source').forEach(function (s) { s.addEventListener('error', retry); });
});

// iOS Low Power Mode / data saver block every <video> (play() rejects, the poster just sits there).
// Watch each visible clip; if it is not actually moving, swap in an animated-image loop of the same footage
// (animated images are not blocked) plus a slow pan, so the hero is never a frozen still.
(function () {
  var layers = [].slice.call(document.querySelectorAll('.layer'));
  var state = layers.map(function () { return { stuck: 0, last: -1, on: false }; });
  function useLoop(L, s) {
    if (s.on) return; s.on = true;
    var img = L.querySelector('.layer-anim');
    if (img && !img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src;
    L.classList.add('vid-blocked');
  }
  function visible(L) {
    var cs = getComputedStyle(L);
    return cs.display !== 'none' && parseFloat(cs.opacity) > 0.02;
  }
  setInterval(function () {
    if (document.hidden) return;
    layers.forEach(function (L, i) {
      var v = L.querySelector('video'), s = state[i];
      if (!v || s.on) return;
      if (!visible(L)) { s.stuck = 0; return; }
      var moving = !v.paused && v.readyState >= 3 && v.currentTime !== s.last;
      s.last = v.currentTime;
      s.stuck = moving ? 0 : s.stuck + 1;
      if (s.stuck >= 2) useLoop(L, s);
    });
  }, 800);
  // Preload the hero loop early when the browser tells us it will refuse autoplay.
  var hv = document.querySelector('.layer[data-layer=hero] video');
  if (hv) hv.addEventListener('play', function () {}, { once: true });
  window.__esUseLoops = function () { layers.forEach(function (L, i) { useLoop(L, state[i]); }); };
})();
