// ─── SCROLL-BASED LOGO TRAVEL (center → nav top-left) ───
const heroSection = document.getElementById('hero');
const logoEl      = document.getElementById('hero-logo-text');
const nav         = document.getElementById('main-nav');
const scrollHint  = document.getElementById('scroll-hint');

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

// Cache layout-dependent values; recompute on resize only
let heroH = 0, runway = 1, vw = 0, vh = 0, logoW = 0;
const NAV_HEIGHT    = 84;
const NAV_PAD_X     = 40;   // matches nav padding
const FINAL_LOGO_PX = 64;   // visual size of the logo when parked in the nav

function measure() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  heroH  = heroSection.offsetHeight;
  runway = Math.max(1, heroH - vh);
  logoW  = logoEl.offsetWidth || logoW;
}
measure();
// re-measure once the image has loaded (offsetWidth may be 0 before that)
if (!logoEl.complete) {
  logoEl.addEventListener('load', () => { measure(); onScroll(); }, { once: true });
}

// Don't let scroll handler fight the entrance animation for the first ~1s
let entranceDone = false;
setTimeout(() => { entranceDone = true; onScroll(); }, 1050);

let ticking = false, lastScrollY = 0;

const servicePanels = document.querySelectorAll('.service-panel');

function update() {
  ticking = false;
  const scrollY = lastScrollY;

  const progress = clamp(scrollY / runway, 0, 1);
  const t = easeInOut(progress);

  if (logoEl && (entranceDone || scrollY > 4) && logoW > 0) {
    if (logoEl.style.animation !== 'none') logoEl.style.animation = 'none';

    const finalScale = FINAL_LOGO_PX / logoW;
    const scale = lerp(1, finalScale, t);

    const startX = vw / 2;
    const startY = vh / 2;
    const endX   = NAV_PAD_X + (logoW * finalScale) / 2;
    const endY   = NAV_HEIGHT / 2;

    const cx = lerp(startX, endX, t);
    const cy = lerp(startY, endY, t);

    logoEl.style.left = cx + 'px';
    logoEl.style.top  = cy + 'px';
    logoEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
    logoEl.style.opacity = 1;
  }

  if (scrollHint) {
    scrollHint.style.opacity = clamp(1 - progress * 4, 0, 1);
  }

  nav.classList.toggle('scrolled', scrollY > 60);

  // ─── Sticky service panels: zoom-out title, fade-in description ───
  servicePanels.forEach(panel => {
    const rect = panel.getBoundingClientRect();

    // Trigger the big background number's entry animation as the panel
    // approaches the viewport (one-shot, then leaves it in the "in" state).
    if (rect.top < vh * 0.88 && rect.bottom > 0) {
      const bignum = panel.querySelector('.panel-bignum');
      if (bignum && !bignum.classList.contains('in')) bignum.classList.add('in');
    }

    // Quickly skip panels far from the viewport
    if (rect.bottom < -200 || rect.top > vh + 200) return;

    const panelH = panel.offsetHeight;
    // Pinning runway = panel height − viewport height (sticky inner is 100vh)
    const pinRange = Math.max(1, panelH - vh);
    // 0 when panel just locks to top, 1 when it's about to release
    const p = clamp(-rect.top / pinRange, 0, 1);

    const title = panel.querySelector('.panel-title');
    const desc  = panel.querySelector('.panel-desc');
    const tag   = panel.querySelector('.panel-tag');

    if (title) {
      // Zoom-out: title starts at 1.6× and shrinks to 1× across the pin
      const titleScale = 1.6 - 0.6 * p;
      const titleY = lerp(40, 0, p); // small downward settle
      title.style.transform = `translateY(${titleY}px) scale(${titleScale})`;
    }
    if (desc) {
      const dT = clamp((p - 0.30) / 0.40, 0, 1);
      desc.style.opacity = dT;
      desc.style.transform = `translateY(${(1 - dT) * 32}px)`;
    }
    if (tag) {
      tag.style.opacity = clamp((p - 0.55) / 0.30, 0, 1);
    }
  });

  animateOnScroll();
}

function onScroll() {
  lastScrollY = window.scrollY;
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

// ─── INTERSECTION / SCROLL REVEAL ───
const animatables = [
  { id: 'tagline',         delay: 0   },
  { id: 'tagline-divider', delay: 150 },
  { id: 'tagline-sub',     delay: 200 },
  { id: 'services-label',  delay: 0   },
  { id: 'services-title',  delay: 80  },
  { id: 'cta-inner',       delay: 0   },
  { id: 'social-eyebrow',  delay: 0   },
  { id: 'social-headline', delay: 80  },
  { id: 'social-sub',      delay: 160 },
  { id: 'social-links',    delay: 240 },
];

function animateOnScroll() {
  const wh = window.innerHeight;

  animatables.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < wh * 0.88) {
      el.classList.add('visible');
    }
  });

  // Social section in-view (drives the top vertical accent line)
  const socialSection = document.getElementById('social');
  if (socialSection) {
    const r = socialSection.getBoundingClientRect();
    if (r.top < wh * 0.85) socialSection.classList.add('in-view');
  }

  // Each social link reveals individually with stagger (CSS-driven delays)
  document.querySelectorAll('#social-links .social-link').forEach((el) => {
    if (el.classList.contains('visible')) return;
    const r = el.getBoundingClientRect();
    if (r.top < wh * 0.92) el.classList.add('visible');
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { measure(); onScroll(); });

// Initial call
onScroll();

// ─── HAMBURGER / MOBILE MENU ───
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

function setMenuOpen(open) {
  menuToggle.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.body.classList.toggle('menu-open', open);
}

menuToggle.addEventListener('click', () => {
  setMenuOpen(!menuToggle.classList.contains('open'));
});

// Close menu when any link inside is tapped
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setMenuOpen(false));
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuToggle.classList.contains('open')) {
    setMenuOpen(false);
  }
});

// Close menu if window is resized to desktop width
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && menuToggle.classList.contains('open')) {
    setMenuOpen(false);
  }
});
