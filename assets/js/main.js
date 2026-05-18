// =============================================
//  iamEscri — main.js
// =============================================

// Detecta si estamos en una subpágina (writeup / post individual)
// o en el index (SPA con secciones).
var IS_SUBPAGE = document.body.classList.contains('is-subpage');

// ── Section navigation ──────────────────────
function showSection(id, navEl) {
  // Si estamos en una subpágina, redirigir al index con hash
  if (IS_SUBPAGE) {
    window.location.href = '/' + '#' + id;
    return;
  }

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('section-' + id);
  if (section) section.classList.add('active');
  if (navEl) navEl.classList.add('active');

  const labels = {
    home:      '~/home',
    writeups:  '~/writeups',
    portfolio: '~/portfolio',
    blog:      '~/blog',
    projects:  '~/proyectos',
    defensive: '~/seg-defensiva'
  };
  const bc = document.getElementById('breadcrumb-text');
  if (bc) bc.textContent = labels[id] || '~/' + id;

  if (window.innerWidth <= 900) closeSidebar();
  window.scrollTo(0, 0);
}

// ── Handle hash on page load (para volver desde subpágina) ──
function handleHashNavigation() {
  if (IS_SUBPAGE) return;
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('section-' + hash)) {
    const navEl = document.querySelector('[data-section="' + hash + '"]');
    showSection(hash, navEl);
  }
}

// ── Mobile sidebar ───────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── Platform filter (writeups) ───────────────
function filterPlatform(platform, tabEl) {
  // Si estamos en subpágina, redirigir al index y filtrar
  if (IS_SUBPAGE) {
    window.location.href = '/#writeups';
    return;
  }

  document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  document.querySelectorAll('.writeup-card').forEach(card => {
    const match = platform === 'all' || card.dataset.platform === platform;
    card.classList.toggle('hidden', !match);
  });
}

// ── Blog category filter ─────────────────────
function filterBlogCategory(category, tabEl) {
  if (IS_SUBPAGE) return;

  document.querySelectorAll('.blog-category-tabs .platform-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  var visible = 0;
  document.querySelectorAll('#blog-posts-list .blog-card').forEach(function(card) {
    var cat = card.dataset.blogCategory || 'all';
    var match = category === 'all' || cat === category || (cat && cat.split(',').map(function(c){return c.trim();}).indexOf(category) !== -1);
    card.style.display = match ? '' : 'none';
    if (match) visible++;
  });

  // Renumber visible cards
  var idx = 1;
  document.querySelectorAll('#blog-posts-list .blog-card').forEach(function(card) {
    if (card.style.display !== 'none') {
      var num = card.querySelector('.blog-card-num');
      if (num) num.textContent = String(idx).padStart(2, '0');
      idx++;
    }
  });
}

function initBlogCategoryCounts() {
  var counts = { all: 0, analisis: 0, herramientas: 0, automatizacion: 0 };
  document.querySelectorAll('#blog-posts-list .blog-card').forEach(function(card) {
    counts.all++;
    var cat = card.dataset.blogCategory || '';
    cat.split(',').forEach(function(c) {
      c = c.trim();
      if (counts[c] !== undefined) counts[c]++;
    });
  });
  Object.keys(counts).forEach(function(k) {
    var el = document.getElementById('blog-tab-count-' + k);
    if (el) el.textContent = counts[k];
  });
}

// ── Live search (global) ─────────────────────
function handleSearch(val) {
  if (IS_SUBPAGE) return;
  val = val.toLowerCase().trim();

  if (!val) {
    document.querySelectorAll('.writeup-card').forEach(c => c.classList.remove('hidden'));
    document.querySelectorAll('.blog-card').forEach(c => c.style.display = '');
    document.querySelectorAll('.project-card').forEach(c => c.style.display = '');
    return;
  }

  // Writeups
  var writeupHits = 0;
  document.querySelectorAll('.writeup-card').forEach(card => {
    const match = card.textContent.toLowerCase().includes(val);
    card.classList.toggle('hidden', !match);
    if (match) writeupHits++;
  });

  // Blog
  var blogHits = 0;
  document.querySelectorAll('#section-blog .blog-card').forEach(card => {
    const match = card.textContent.toLowerCase().includes(val);
    card.style.display = match ? '' : 'none';
    if (match) blogHits++;
  });

  // Defensiva
  var defHits = 0;
  document.querySelectorAll('#section-defensive .blog-card').forEach(card => {
    const match = card.textContent.toLowerCase().includes(val);
    card.style.display = match ? '' : 'none';
    if (match) defHits++;
  });

  // Proyectos — excluir cards WIP
  var projectHits = 0;
  document.querySelectorAll('.project-card').forEach(card => {
    if (card.dataset.wip === 'true') { card.style.display = 'none'; return; }
    const match = card.textContent.toLowerCase().includes(val);
    card.style.display = match ? '' : 'none';
    if (match) projectHits++;
  });

  // Navegar a la sección con MÁS hits (ignorar secciones con 0)
  var scores = [
    { section: 'writeups',  count: writeupHits  },
    { section: 'blog',      count: blogHits      },
    { section: 'defensive', count: defHits       },
    { section: 'projects',  count: projectHits   }
  ];
  scores.sort(function(a, b) { return b.count - a.count; });

  if (scores[0].count > 0) {
    var best = scores[0].section;
    var navEl = document.querySelector('[data-section="' + best + '"]');
    showSection(best, navEl);
  }
}

// ── Update counters ──────────────────────────
// Actualiza tanto los badges del sidebar (id=count-*) 
// como los tabs de la sección writeups (id=tab-count-*)
function updateCounts() {
  const platforms = ['dockerlabs', 'hackthebox', 'tryhackme', 'vulnyx'];
  let total = 0;
  platforms.forEach(p => {
    const count = document.querySelectorAll('.writeup-card[data-platform="' + p + '"]').length;
    // Sidebar badge
    const sideEl = document.getElementById('count-' + p);
    if (sideEl) sideEl.textContent = count;
    // Tab counter (renombrado a tab-count-* para evitar ID duplicado)
    const tabEl = document.getElementById('tab-count-' + p);
    if (tabEl) tabEl.textContent = count;
    total += count;
  });
  // Total en tab "Todas"
  const tabAllEl = document.getElementById('tab-count-all');
  if (tabAllEl) tabAllEl.textContent = total;

  // Guardar en localStorage para que las subpáginas puedan leerlos
  try {
    const saved = {};
    platforms.forEach(p => {
      saved[p] = document.querySelectorAll('.writeup-card[data-platform="' + p + '"]').length;
    });
    saved['total'] = total;
    localStorage.setItem('writeup-counts', JSON.stringify(saved));
  } catch(e) {}
}

// ── Restore counters in subpages (desde localStorage) ──
function restoreCountsInSubpage() {
  try {
    const saved = JSON.parse(localStorage.getItem('writeup-counts') || 'null');
    if (!saved) return;
    ['dockerlabs', 'hackthebox', 'tryhackme', 'vulnyx'].forEach(p => {
      const sideEl = document.getElementById('count-' + p);
      if (sideEl && saved[p] !== undefined) sideEl.textContent = saved[p];
    });
  } catch(e) {}
}

// ── Skill bar animation ──────────────────────
function animateSkills() {
  document.querySelectorAll('.skill-fill').forEach(bar => {
    const w = bar.dataset.width || '0';
    setTimeout(() => { bar.style.width = w + '%'; }, 300);
  });
}

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Manejar navegación con hash (volver desde subpágina)
  handleHashNavigation();

  if (IS_SUBPAGE) {
    restoreCountsInSubpage();
  } else {
    updateCounts();
    initBlogCategoryCounts();

    // Animar skills al entrar al portfolio
    const portfolioNav = document.querySelector('[data-section="portfolio"]');
    if (portfolioNav) {
      portfolioNav.addEventListener('click', () => {
        setTimeout(animateSkills, 100);
      });
    }

    // Atajo de teclado: / para buscar
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    });
  }
});
