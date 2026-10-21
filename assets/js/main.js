(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header border on scroll */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile navigation */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* Before/after slider */
  const compare = document.getElementById('compare');
  const range = document.getElementById('compare-range');
  if (compare && range) {
    const setPos = (v) => compare.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => { setPos(range.value); compare.classList.add('is-touched'); });

    // One orchestrated moment: the old site sweeps away to reveal the redesign.
    if (!reduceMotion) {
      let touched = false;
      range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      range.addEventListener('keydown', () => { touched = true; }, { once: true });
      const from = 94, to = 7, duration = 1900, delay = 700;
      setPos(from); range.value = from;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      setTimeout(() => {
        const start = performance.now();
        const step = (now) => {
          if (touched) return;
          const t = Math.min(1, (now - start) / duration);
          const v = from + (to - from) * ease(t);
          setPos(v.toFixed(2)); range.value = Math.round(v);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    }
  }

  /* 3D tilt that follows the pointer (desktop only) */
  const device = document.getElementById('device');
  const stage = document.querySelector('.stage');
  if (device && stage && !reduceMotion && window.matchMedia('(hover: hover) and (min-width: 761px)').matches) {
    let frame = 0;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        device.classList.add('is-tracking');
        device.style.setProperty('--ry', (-12 + x * 14).toFixed(2) + 'deg');
        device.style.setProperty('--rx', (6 - y * 10).toFixed(2) + 'deg');
      });
    });
    stage.addEventListener('pointerleave', () => {
      device.classList.remove('is-tracking');
      device.style.removeProperty('--ry');
      device.style.removeProperty('--rx');
    });
  }

  /* Currency switcher (founding prices, rounded to similar value) */
  const PRICES = {
    CAD: { sym: 'CA$', redesign: 299, new: 499, store: 999, page: 49, products: 49, logo: 99, gbp: 79, care1: 29, care2: 49 },
    USD: { sym: 'US$', redesign: 249, new: 399, store: 799, page: 39, products: 39, logo: 79, gbp: 59, care1: 24, care2: 39 },
    GBP: { sym: '£',   redesign: 199, new: 299, store: 599, page: 29, products: 29, logo: 59, gbp: 49, care1: 19, care2: 29 },
    AED: { sym: 'AED ', redesign: 899, new: 1499, store: 2899, page: 149, products: 149, logo: 299, gbp: 229, care1: 89, care2: 149 }
  };
  const buttons = document.querySelectorAll('.currency button');
  const fmt = (n) => n.toLocaleString('en-US');
  const applyCurrency = (code) => {
    const p = PRICES[code];
    if (!p) return;
    document.querySelectorAll('[data-price]').forEach((el) => {
      const key = el.getAttribute('data-price');
      if (p[key] != null) el.textContent = p.sym + fmt(p[key]);
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.currency === code)));
    try { localStorage.setItem('km-currency', code); } catch (e) { /* storage unavailable */ }
  };
  const guessCurrency = () => {
    try {
      const saved = localStorage.getItem('km-currency');
      if (saved && PRICES[saved]) return saved;
    } catch (e) { /* storage unavailable */ }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toUpperCase();
    if (tz === 'Asia/Dubai' || lang.endsWith('-AE')) return 'AED';
    if (tz === 'Europe/London' || lang.endsWith('-GB')) return 'GBP';
    if (lang.endsWith('-CA') || /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton)/.test(tz)) return 'CAD';
    if (lang.endsWith('-US') || /^America\//.test(tz)) return 'USD';
    return 'CAD';
  };
  buttons.forEach((b) => b.addEventListener('click', () => applyCurrency(b.dataset.currency)));
  if (buttons.length) applyCurrency(guessCurrency());

  /* Plan buttons pre-select the plan in the form */
  const planSelect = document.getElementById('f-plan');
  document.querySelectorAll('[data-plan]').forEach((a) => {
    a.addEventListener('click', () => { if (planSelect) planSelect.value = a.dataset.plan; });
  });

  /* Concept request form */
  const form = document.getElementById('concept-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    const say = (msg, kind) => {
      status.textContent = msg;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      form.querySelectorAll('[required]').forEach((el) => {
        const ok = el.checkValidity();
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) {
        say('Please fill in your name, business name and a valid email.', 'error');
        firstBad.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      say('Sending your request…');
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Request failed');
        form.reset();
        say('Request received. Your free concept will arrive within 24 hours.', 'ok');
      } catch (err) {
        const body = encodeURIComponent(
          `Name: ${data.name}\nBusiness: ${data.business}\nWebsite: ${data.website || '-'}\nCountry: ${data.country}\nNeed: ${data.plan}\n\n${data.notes || ''}`
        );
        status.className = 'form-status is-error';
        status.innerHTML = 'The form couldn\'t send right now. <a href="mailto:hello@kromaloom.com?subject=Free%20concept%20request&body=' + body + '">Send it by email instead</a>.';
      } finally {
        button.disabled = false;
      }
    });
  }

  /* Hero background: coloured threads weaving slowly, like a loom */
  const canvas = document.getElementById('threads');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['#5B3DF5', '#E5384F', '#FFB020', '#0E9F95', '#8C75FF', '#F2667A'];
    let w = 0, h = 0, dpr = 1, threads = [], raf = 0, running = false, t0 = performance.now();

    const build = () => {
      const count = w < 700 ? 6 : 10;
      threads = Array.from({ length: count }, (_, i) => ({
        color: COLORS[i % COLORS.length],
        y: (h * (i + 0.6)) / count,
        amp: 18 + (i % 4) * 14,
        freq: 0.0016 + (i % 3) * 0.0007,
        speed: 0.00012 + (i % 5) * 0.00004,
        phase: i * 1.7,
        width: 2 + (i % 3) * 1.5,
        alpha: 0.16 + (i % 4) * 0.05
      }));
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    const draw = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      threads.forEach((th, i) => {
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 12) {
          const y = th.y
            + Math.sin(x * th.freq + th.phase + t * th.speed * 6) * th.amp
            + Math.sin(x * th.freq * 2.3 - t * th.speed * 3 + i) * th.amp * 0.35;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = th.color;
        ctx.globalAlpha = th.alpha;
        ctx.lineWidth = th.width;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };
    const loop = (now) => { draw(now); if (running) raf = requestAnimationFrame(loop); };
    const start = () => { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    draw(performance.now());
    window.addEventListener('resize', () => { resize(); draw(performance.now()); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      }).observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* Hero starter: carry the address into the full form */
  const starter = document.getElementById('starter');
  if (starter) {
    starter.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('starter-url').value.trim();
      const site = document.getElementById('f-site');
      const plan = document.getElementById('f-plan');
      if (site) site.value = url;
      if (plan) plan.value = url ? 'Redesign' : 'New website';
      const target = document.getElementById('concept');
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => { const n = document.getElementById('f-name'); if (n) n.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    });
  }

  /* Leak chart plays once when it scrolls into view */
  const leak = document.querySelector('.leak');
  if (leak && !reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { leak.classList.add('is-playing'); io.disconnect(); }
      });
    }, { threshold: 0.5 });
    io.observe(leak);
  }

  /* Sticky mobile button: show after the hero, hide over the form */
  const mobileCta = document.getElementById('mobile-cta');
  const heroEl = document.querySelector('.hero');
  const conceptEl = document.getElementById('concept');
  if (mobileCta && heroEl && conceptEl && 'IntersectionObserver' in window) {
    let pastHero = false, atForm = false;
    const update = () => mobileCta.classList.toggle('is-visible', pastHero && !atForm);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; update(); }).observe(heroEl);
    new IntersectionObserver(([e]) => { atForm = e.isIntersecting; update(); }, { threshold: 0.15 }).observe(conceptEl);
  }

  /* Footer year */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
