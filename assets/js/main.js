// =============================================
//  iamEscri — main.js
// =============================================

// ── Section navigation ──────────────────────
function showSection(id, navEl) {
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
    projects:  '~/proyectos'
  };
  const bc = document.getElementById('breadcrumb-text');
  if (bc) bc.textContent = labels[id] || '~/' + id;

  if (window.innerWidth <= 900) closeSidebar();
  window.scrollTo(0, 0);
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
  document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  document.querySelectorAll('.writeup-card').forEach(card => {
    const match = platform === 'all' || card.dataset.platform === platform;
    card.classList.toggle('hidden', !match);
  });
}

// ── Live search ──────────────────────────────
function handleSearch(val) {
  val = val.toLowerCase().trim();
  if (!val) {
    document.querySelectorAll('.writeup-card').forEach(c => c.classList.remove('hidden'));
    return;
  }
  // Jump to writeups section
  const wu = document.getElementById('section-writeups');
  if (wu && !wu.classList.contains('active')) {
    showSection('writeups', document.querySelector('[data-section="writeups"]'));
  }
  document.querySelectorAll('.writeup-card').forEach(card => {
    card.classList.toggle('hidden', !card.textContent.toLowerCase().includes(val));
  });
}

// ── Update counters ──────────────────────────
function updateCounts() {
  const platforms = ['dockerlabs', 'hackthebox', 'tryhackme', 'vulnyx'];
  let total = 0;
  platforms.forEach(p => {
    const count = document.querySelectorAll(`[data-platform="${p}"]`).length;
    const el = document.getElementById('count-' + p);
    if (el) el.textContent = count;
    total += count;
  });
  const allEl = document.getElementById('count-all');
  if (allEl) allEl.textContent = total;
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
  updateCounts();

  // Animate skills when portfolio is shown
  const portfolioNav = document.querySelector('[data-section="portfolio"]');
  if (portfolioNav) {
    portfolioNav.addEventListener('click', () => {
      setTimeout(animateSkills, 100);
    });
  }

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  });
});
