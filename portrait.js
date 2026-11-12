// Phones in portrait get 9:16 crops of the same footage (sharper, full-bleed). Runs before stage.js (a module, deferred).
(function(){if(!matchMedia('(max-aspect-ratio: 1/1)').matches)return;var s=document.getElementById('stage');
      s.querySelectorAll('[data-src-m]').forEach(function(e){if(e.tagName==='IMG'){e.src=e.dataset.srcM}else{e.dataset.src=e.dataset.srcM}});
      s.querySelectorAll('[data-poster-m]').forEach(function(v){v.poster=v.dataset.posterM});document.documentElement.classList.add('es-portrait')})();
