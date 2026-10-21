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
    range.addEventListener('input', () => setPos(range.value));

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
        say('Request received. Your concept will arrive within 3 working days.', 'ok');
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

  /* Footer year */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
