/* ============================================================
   SensorMind Pvt. Ltd. — Main JavaScript
   ============================================================ */

'use strict';

/* ── Utility ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────
   1. NAVIGATION
───────────────────────────────────────── */
(function initNav() {
  const navbar   = $('#navbar');
  const toggle   = $('#navToggle');
  const menu     = $('#navMenu');
  const overlay  = document.createElement('div');

  if (!navbar) return;

  overlay.className = 'nav-overlay';
  Object.assign(overlay.style, {
    display: 'none', position: 'fixed', inset: '0',
    background: 'rgba(6,9,24,0.6)', zIndex: '998',
    backdropFilter: 'blur(4px)'
  });
  document.body.appendChild(overlay);

  // Scroll effect
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  if (toggle && menu) {
    const closeMenu = () => {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    };
    const openMenu = () => {
      menu.classList.add('open');
      toggle.classList.add('open');
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', () =>
      menu.classList.contains('open') ? closeMenu() : openMenu()
    );
    overlay.addEventListener('click', closeMenu);

    $$('.nav-link', menu).forEach(link =>
      link.addEventListener('click', closeMenu)
    );
  }

  // Active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ─────────────────────────────────────────
   2. SCROLL REVEAL (Intersection Observer)
───────────────────────────────────────── */
(function initReveal() {
  const revealEls = $$('.reveal, .reveal-left, .reveal-right');
  if (!revealEls.length) return;

  const revealVisible = el => {
    el.classList.add('visible');
  };

  const runScrollFallback = () => {
    let ticking = false;
    const revealInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      revealEls.forEach(el => {
        if (el.classList.contains('visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 0.88 && rect.bottom >= 0) {
          revealVisible(el);
        }
      });
      ticking = false;
    };
    const requestReveal = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(revealInView);
    };
    window.addEventListener('scroll', requestReveal, { passive: true });
    window.addEventListener('resize', requestReveal, { passive: true });
    requestReveal();
  };

  if (!('IntersectionObserver' in window)) {
    runScrollFallback();
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealVisible(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => observer.observe(el));
  runScrollFallback();
})();

/* ─────────────────────────────────────────
   3. COUNTER ANIMATION
───────────────────────────────────────── */
(function initCounters() {
  const counters = $$('[data-counter]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.counter);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const duration = 2000;
    const start    = performance.now();
    const isFloat  = String(target).includes('.');
    const decimals = isFloat ? (String(target).split('.')[1] || '').length : 0;

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = easeOut(progress) * target;
      el.textContent = prefix + (isFloat ? value.toFixed(decimals) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────
   4. PARTICLE CANVAS (Home hero)
───────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let particles = [];
  let mouse    = { x: null, y: null };
  let animId;

  const resize = () => {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COLORS = ['#4F8EF7', '#00D2FF', '#7C3AED', '#10F5A8'];

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x   = Math.random() * canvas.width;
      this.y   = init ? Math.random() * canvas.height : canvas.height + 10;
      this.r   = Math.random() * 1.8 + 0.4;
      this.vx  = (Math.random() - 0.5) * 0.35;
      this.vy  = -(Math.random() * 0.5 + 0.15);
      this.alpha = Math.random() * 0.55 + 0.1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset();

      // Subtle mouse interaction
      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x += (dx / dist) * force * 0.8;
          this.y += (dy / dist) * force * 0.8;
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + Math.round(this.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  const COUNT = Math.min(120, Math.floor((canvas.width * canvas.height) / 8000));
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  // Draw connection lines
  const drawLines = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          const alpha = (1 - dist / 90) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(79,142,247,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  };
  loop();

  // Mouse tracking (hero section only)
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; }, { passive: true });
  }
})();

/* ─────────────────────────────────────────
   5. TYPED TEXT EFFECT
───────────────────────────────────────── */
(function initTyped() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const texts  = el.dataset.texts ? JSON.parse(el.dataset.texts) : [el.textContent];
  let tIdx     = 0;
  let cIdx     = 0;
  let deleting = false;

  const type = () => {
    const cur  = texts[tIdx];
    el.textContent = deleting
      ? cur.substring(0, cIdx - 1)
      : cur.substring(0, cIdx + 1);

    deleting ? cIdx-- : cIdx++;

    let delay = deleting ? 45 : 90;
    if (!deleting && cIdx === cur.length)  { delay = 2200; deleting = true; }
    else if (deleting && cIdx === 0)       { deleting = false; tIdx = (tIdx + 1) % texts.length; delay = 400; }

    setTimeout(type, delay);
  };
  setTimeout(type, 800);
})();

/* ─────────────────────────────────────────
   6. PRODUCT FILTERS
───────────────────────────────────────── */
(function initFilters() {
  const filterBtns  = $$('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      const productCards = $$('[data-category]');

      productCards.forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        if (match) {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
          card.style.pointerEvents = '';
          card.style.display = '';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.pointerEvents = 'none';
          setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
        }
      });
    });
  });
})();

/* ─────────────────────────────────────────
   7. FAQ ACCORDION
───────────────────────────────────────── */
(function initFAQ() {
  $$('.faq-item').forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.faq-item').forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
      });
      // Open clicked
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();

/* ─────────────────────────────────────────
   8. CONTACT FORM
───────────────────────────────────────── */
(function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;
    $$('[required]', form).forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#EF4444';
        field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
      }
    });

    const emailField = form.querySelector('input[type="email"]');
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      valid = false;
      emailField.style.borderColor = '#EF4444';
    }

    if (!valid) return;

    // Simulate submission
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      if (success) success.style.display = 'block';
    }, 1400);
  });
})();

/* ─────────────────────────────────────────
   9. SMOOTH ANCHOR SCROLL
───────────────────────────────────────── */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ─────────────────────────────────────────
   10. SCROLLYTELLING ENGINE (premium, scroll-scrubbed)
───────────────────────────────────────── */
(function initScrollytelling() {
  const track = document.getElementById('scrollStoryTrack');
  if (!track) return;

  const steps   = $$('.st-step');
  const scenes  = $$('.st-scene');
  const dots    = $$('.st-dot');
  const bar     = document.querySelector('.st-progress-bar');
  const label   = document.querySelector('.st-step-label');
  const clockEl = document.querySelector('.st-topbar .clock');
  const TOTAL   = steps.length;
  let lastIdx   = -1;

  /* Scene-3 confidence meter (scrubs as you scroll through step 3) */
  const confFill = document.querySelector('.sc3-meter-fill');
  const confPct  = document.querySelector('.sc3-meter .pct');

  /* Scene-4 channel cascade */
  const channels = $$('.sc4-channel');

  /* Scene-2 alert lanes */
  const sc2Lanes = $$('.sc2-lane');

  const activate = idx => {
    steps.forEach((s, i)  => s.classList.toggle('active', i === idx));
    scenes.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i)   => d.classList.toggle('active', i === idx));
    if (label) label.textContent =
      `Step ${String(idx + 1).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`;

    /* Scene-2 lane states */
    sc2Lanes.forEach(l => l.classList.remove('alert'));
    if (idx === 1) {
      const thermal = sc2Lanes.find ? null : null;
      const t = document.querySelector('.sc2-lane[data-sensor="thermal"]');
      if (t) t.classList.add('alert');
    }

    /* Scene-4 channel cascade */
    channels.forEach(c => c.classList.remove('fired'));
    if (idx === 3) {
      channels.forEach((c, i) => {
        setTimeout(() => c.classList.add('fired'), 400 + i * 320);
      });
    }
  };

  const onScroll = () => {
    const rect     = track.getBoundingClientRect();
    const trackH   = track.offsetHeight;
    const winH     = window.innerHeight;
    const raw      = -rect.top / (trackH - winH);
    const progress = Math.max(0, Math.min(1, raw));

    if (bar) bar.style.width = (progress * 100) + '%';

    const scaled = progress * TOTAL;
    const idx    = Math.min(TOTAL - 1, Math.floor(scaled));
    if (idx !== lastIdx) {
      activate(idx);
      lastIdx = idx;
    }

    /* Per-scene scrub (0..1 within the current step) */
    const sub = Math.min(1, Math.max(0, scaled - idx));

    /* Scene 3: confidence meter scrubs from 0 → 99.1% across step 3 */
    if (idx === 2 && confFill && confPct) {
      const pct = (sub * 99.1).toFixed(1);
      confFill.style.setProperty('--sc3-conf', pct + '%');
      confPct.textContent = pct + '%';
    } else if (idx > 2 && confFill && confPct) {
      confFill.style.setProperty('--sc3-conf', '99.1%');
      confPct.textContent = '99.1%';
    } else if (idx < 2 && confFill && confPct) {
      confFill.style.setProperty('--sc3-conf', '0%');
      confPct.textContent = '0.0%';
    }
  };

  /* Live clock — premium real-time HUD */
  if (clockEl) {
    setInterval(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(d.getMilliseconds() / 10)).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}.${ms}`;
    }, 60);
  }

  /* Live ticking sensor values in Scene 1 baseline */
  const sc1Vals = $$('.sc1-lane-val');
  if (sc1Vals.length) {
    const base = [
      { v: 23.4, jitter: 0.3, suffix: '°C' },
      { v: 0.02, jitter: 0.04, suffix: 'g'  },
      { v: 0.01, jitter: 0.03, suffix: 'mm' },
      { v: 32,   jitter: 4,    suffix: 'dB' }
    ];
    setInterval(() => {
      sc1Vals.forEach((el, i) => {
        const b = base[i] || base[0];
        const v = (b.v + (Math.random() - 0.5) * b.jitter);
        el.textContent = (v < 1 ? v.toFixed(2) : v.toFixed(1)) + b.suffix;
      });
    }, 800);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  activate(0);
  onScroll();
})();
