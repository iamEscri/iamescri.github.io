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
  if (window.innerWidth <= 960) closeMobileNav();
  window.scrollTo(0, 0);
}

function handleHashNavigation() {
  if (IS_SUBPAGE) return;
  var hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('section-' + hash)) {
    showSection(hash, null);
  }
}

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
    var el = document.getElementById('count-' + p);
    if (el) el.textContent = count;
    total += count;
  });
  var totalEl = document.getElementById('count-total');
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
      var el = document.getElementById('count-' + p);
      if (el && saved[p] !== undefined) el.textContent = saved[p];
    });
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
});

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
    document.querySelectorAll('.highlight').forEach(function(block) {
      if (block.querySelector('.code-block-header')) return;
      var lang = '';
      var m = block.className.match(/language-(\w+)/);
      if (m) lang = m[1].toLowerCase();
      if (!lang) {
        var ic = block.querySelector('code');
        if (ic) { var m2 = ic.className.match(/language-(\w+)/); if (m2) lang = m2[1].toLowerCase(); }
      }
      var color = LANG_COLORS[lang] || 'rgba(255,255,255,.3)';
      var hdr = document.createElement('div');
      hdr.className = 'code-block-header';
      hdr.innerHTML = '<div class="code-block-lang"><span class="code-block-lang-dot" style="background:'+color+'"></span>'+(lang||'code')+'</div><button class="code-copy-btn">copiar</button>';
      block.insertBefore(hdr, block.firstChild);
      hdr.querySelector('.code-copy-btn').addEventListener('click', function() {
        var pre = block.querySelector('pre');
        if (!pre) return;
        navigator.clipboard.writeText(pre.innerText).then(function() {
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
