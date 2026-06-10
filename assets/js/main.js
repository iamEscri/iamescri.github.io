// iamEscri — main.js v2-final

var IS_SUBPAGE = document.body.classList.contains('is-subpage');

// ── Section navigation ──────────────────────
function showSection(id, navEl) {
  if (IS_SUBPAGE) {
    window.location.href = '/#' + id;
    return;
  }
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.topnav-link').forEach(n => n.classList.remove('active'));
  var section = document.getElementById('section-' + id);
  if (section) section.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else {
    var el = document.getElementById('nav-' + id);
    if (el) el.classList.add('active');
  }
  updateHash(id);
  if (window.innerWidth <= 960) closeMobileNav();
  window.scrollTo(0, 0);
}

// Mantiene la URL sincronizada con la sección activa
// (permite compartir enlaces y que funcione el botón atrás)
function updateHash(id) {
  if (!history.pushState) return;
  var target = '#' + id;
  if (window.location.hash === target) return;
  if (id === 'home') {
    if (!window.location.hash) return;
    history.pushState(null, '', window.location.pathname);
  } else {
    history.pushState(null, '', target);
  }
}

function handleHashNavigation() {
  if (IS_SUBPAGE) return;
  var hash = window.location.hash.replace('#', '') || 'home';
  if (document.getElementById('section-' + hash)) {
    showSection(hash, null);
  }
}

window.addEventListener('hashchange', handleHashNavigation);

// ── Mobile nav ───────────────────────────────
function toggleMobileNav() {
  document.getElementById('mobile-nav').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeMobileNav() {
  document.getElementById('mobile-nav').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── Platform filter (writeups) ───────────────
function filterPlatform(platform, tabEl) {
  if (IS_SUBPAGE) { window.location.href = '/#writeups'; return; }
  document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  document.querySelectorAll('.writeup-card').forEach(card => {
    var match = platform === 'all' || card.dataset.platform === platform;
    card.classList.toggle('hidden', !match);
  });
}

// ── Pub category filter ──────────────────────
function filterPubCategory(category, tabEl) {
  if (IS_SUBPAGE) return;
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  document.querySelectorAll('.pub-card').forEach(card => {
    var cat = card.dataset.category || 'all';
    var match = category === 'all' || cat === category;
    card.classList.toggle('hidden', !match);
  });
}

// ── Writeup counters ─────────────────────────
function updateCounts() {
  var platforms = ['dockerlabs','hackthebox','tryhackme','vulnyx'];
  var total = 0;
  platforms.forEach(function(p) {
    var count = document.querySelectorAll('.writeup-card[data-platform="' + p + '"]').length;
    var el = document.getElementById('tab-count-' + p);
    if (el) el.textContent = count;
    total += count;
  });
  var totalEl = document.getElementById('tab-count-all');
  if (totalEl) totalEl.textContent = total;
  try {
    var saved = {};
    platforms.forEach(function(p) {
      saved[p] = document.querySelectorAll('.writeup-card[data-platform="' + p + '"]').length;
    });
    saved['total'] = total;
    localStorage.setItem('writeup-counts', JSON.stringify(saved));
  } catch(e) {}
}

function restoreCountsInSubpage() {
  try {
    var saved = JSON.parse(localStorage.getItem('writeup-counts') || 'null');
    if (!saved) return;
    ['dockerlabs','hackthebox','tryhackme','vulnyx'].forEach(function(p) {
      var el = document.getElementById('tab-count-' + p);
      if (el && saved[p] !== undefined) el.textContent = saved[p];
    });
    var allEl = document.getElementById('tab-count-all');
    if (allEl && saved['total'] !== undefined) allEl.textContent = saved['total'];
  } catch(e) {}
}

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  handleHashNavigation();
  if (IS_SUBPAGE) {
    restoreCountsInSubpage();
  } else {
    updateCounts();
  }
  // Imágenes de posts en lazy: los writeups cargan 15-20 capturas
  document.querySelectorAll('.writeup-body img').forEach(function(img) {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
});

// ── Reveal on scroll ─────────────────────────
(function() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTOR = [
    '.estado-card', '.stack-badge', '.home-activity-row',
    '.blog-card', '.writeup-card', '.project-card',
    '.about-cert-cell', '.training-row'
  ].join(',');

  function init() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('reveal-in');
        // Tras la animación se limpia el estado para no interferir
        // con las transiciones de hover del propio elemento
        var delay = parseInt(el.style.transitionDelay, 10) || 0;
        setTimeout(function() {
          el.classList.remove('reveal-init', 'reveal-in');
          el.style.transitionDelay = '';
        }, 600 + delay);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll(SELECTOR).forEach(function(el) {
      var siblings = el.parentElement ? el.parentElement.children : [];
      var idx = Array.prototype.indexOf.call(siblings, el);
      el.classList.add('reveal-init');
      el.style.transitionDelay = (Math.max(idx, 0) % 6) * 50 + 'ms';
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

// ── Code block headers + copy button ─────────────────
(function() {
  var LANG_COLORS = {
    bash:'#00e5a0',shell:'#00e5a0',sh:'#00e5a0',
    python:'#7dd3fc',py:'#7dd3fc',
    yaml:'#fde68a',yml:'#fde68a',json:'#fde68a',
    ini:'#c084fc',conf:'#c084fc',config:'#c084fc',
    javascript:'#f59e0b',js:'#f59e0b',
    html:'#f87171',xml:'#f87171',
    sql:'#818cf8',ruby:'#f87171',
    text:'rgba(255,255,255,.3)',plaintext:'rgba(255,255,255,.3)'
  };
  function init() {
    // Rouge wraps: <div class="language-XXX highlighter-rouge"><div class="highlight">...
    // So we target the outer wrapper, not .highlight directly
    document.querySelectorAll('.highlighter-rouge').forEach(function(wrapper) {
      if (wrapper.querySelector('.code-block-header')) return;
      // Get language from outer wrapper class
      var lang = '';
      var m = wrapper.className.match(/language-(\w+)/);
      if (m) lang = m[1].toLowerCase();
      // Skip inline code (no pre inside)
      var pre = wrapper.querySelector('pre');
      if (!pre) return;
      var color = LANG_COLORS[lang] || 'rgba(255,255,255,.3)';
      var display = lang || 'code';
      // Build header
      var hdr = document.createElement('div');
      hdr.className = 'code-block-header';
      hdr.innerHTML =
        '<div class="code-block-lang">' +
          '<span class="code-block-lang-dot" style="background:'+color+'"></span>' +
          display +
        '</div>' +
        '<button class="code-copy-btn">copiar</button>';
      // Insert before .highlight div inside wrapper
      var highlight = wrapper.querySelector('.highlight');
      wrapper.insertBefore(hdr, highlight || wrapper.firstChild);
      // Copy button
      hdr.querySelector('.code-copy-btn').addEventListener('click', function() {
        var text = pre.innerText;
        navigator.clipboard.writeText(text).then(function() {
          var btn = hdr.querySelector('.code-copy-btn');
          btn.textContent = '✓ copiado';
          btn.classList.add('copied');
          setTimeout(function(){ btn.textContent='copiar'; btn.classList.remove('copied'); }, 2000);
        });
      });
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
