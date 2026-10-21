(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- Mobile navigation ---------- */
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

  /* ---------- Highlight the menu item for the section in view ---------- */
  if (nav && 'IntersectionObserver' in window) {
    const links = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.remove('is-active'));
          const a = byId.get(e.target.id);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Markets: country drives the trades strip and the currency ---------- */
  const MARKETS = {
    CA: { name: 'Canada', currency: 'CAD', country: 'Canada', trades: ['Plumbers', 'Electricians', 'HVAC and furnace pros', 'Roofers', 'Snow removal crews', 'Landscapers', 'General contractors', 'Painters', 'Movers', 'Cleaners', 'Auto repair shops', 'Dentists', 'Physiotherapists', 'Chiropractors', 'Massage therapists', 'Optometrists', 'Hair salons', 'Barbers', 'Nail and lash studios', 'Spas', 'Cafés', 'Restaurants', 'Bakeries', 'Food trucks', 'Breweries', 'Florists', 'Pet groomers', 'Daycares', 'Tutors', 'Driving schools', 'Fitness studios', 'Yoga studios', 'Accountants', 'Bookkeepers', 'Lawyers', 'Notaries', 'Real estate agents', 'Mortgage brokers', 'Insurance brokers', 'Photographers', 'Wedding planners', 'Boutiques', 'Gift shops', 'Farm stands', 'Cottage rentals'] },
    US: { name: 'the United States', currency: 'USD', country: 'United States', trades: ['Plumbers', 'HVAC contractors', 'Roofers', 'Electricians', 'Pest control', 'Pool services', 'Garage door repair', 'Landscapers', 'Handymen', 'Cleaners', 'Movers', 'Auto repair shops', 'Auto detailers', 'Towing companies', 'Dentists', 'Med spas', 'Chiropractors', 'Physical therapists', 'Veterinarians', 'Hair salons', 'Barbershops', 'Nail salons', 'Tattoo studios', 'Restaurants', 'Food trucks', 'Coffee shops', 'Bakeries', 'Breweries', 'Florists', 'Dog groomers', 'Daycares', 'Tutors', 'CrossFit gyms', 'Yoga studios', 'Martial arts schools', 'CPAs', 'Bookkeepers', 'Law firms', 'Real estate agents', 'Insurance agents', 'Mortgage brokers', 'Photographers', 'Wedding venues', 'Event planners', 'Boutiques', 'Storage facilities'] },
    UK: { name: 'the United Kingdom', currency: 'GBP', country: 'United Kingdom', trades: ['Plumbers', 'Electricians', 'Builders', 'Roofers', 'Joiners', 'Plasterers', 'Gas engineers', 'Landscape gardeners', 'Window cleaners', 'Removal firms', 'MOT garages', 'Mobile mechanics', 'Dental practices', 'Physios', 'Osteopaths', 'Opticians', 'Beauty salons', 'Barbers', 'Nail bars', 'Cafés', 'Pubs', 'Restaurants', 'Takeaways', 'Bakeries', 'Tea rooms', 'Florists', 'Dog groomers', 'Nurseries', 'Tutors', 'Driving instructors', 'Personal trainers', 'Yoga studios', 'Accountants', 'Solicitors', 'Estate agents', 'Letting agents', 'Mortgage advisers', 'Photographers', 'Wedding venues', 'B&Bs', 'Holiday lets', 'Boutiques', 'Farm shops'] },
    AE: { name: 'the UAE', currency: 'AED', country: 'United Arab Emirates', trades: ['Real estate brokers', 'Holiday homes', 'Interior fit-out firms', 'AC maintenance', 'Cleaning companies', 'Pest control', 'Movers', 'Car rentals', 'Car detailing', 'Garages', 'Dental clinics', 'Aesthetic clinics', 'Physiotherapy centres', 'Pharmacies', 'Ladies salons', 'Barbershops', 'Spas', 'Restaurants', 'Cafés', 'Cloud kitchens', 'Bakeries', 'Shawarma spots', 'Perfume shops', 'Abaya boutiques', 'Tailors', 'Jewellers', 'Florists', 'Pet groomers', 'Nurseries', 'Tutoring centres', 'Driving schools', 'Gyms', 'Yoga studios', 'Accounting and VAT firms', 'Business setup consultants', 'PRO services', 'Typing centres', 'Legal consultants', 'Desert safari operators', 'Tour operators', 'Event planners', 'Photographers', 'Printing shops'] }
  };

  const PRICES = {
    CAD: { sym: 'CA$', redesign: 299, plus: 499, store: 899, page: 49, logo: 99, gbp: 79, care1: 29, care2: 49 },
    USD: { sym: 'US$', redesign: 249, plus: 399, store: 749, page: 39, logo: 79, gbp: 59, care1: 24, care2: 39 },
    GBP: { sym: '£', redesign: 199, plus: 299, store: 549, page: 29, logo: 59, gbp: 49, care1: 19, care2: 29 },
    AED: { sym: 'AED ', redesign: 899, plus: 1499, store: 2699, page: 149, logo: 299, gbp: 229, care1: 89, care2: 149 }
  };
  const CURRENCY_TO_MARKET = { CAD: 'CA', USD: 'US', GBP: 'UK', AED: 'AE' };

  const fmt = (n) => n.toLocaleString('en-US');
  const currencyButtons = document.querySelectorAll('.currency button');
  const marketButtons = document.querySelectorAll('.market button');

  const applyCurrency = (code) => {
    const p = PRICES[code];
    if (!p) return;
    document.querySelectorAll('[data-price]').forEach((el) => {
      const key = el.getAttribute('data-price');
      if (p[key] != null) el.textContent = p.sym + fmt(p[key]);
    });
    currencyButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.currency === code)));
    store.set('km-currency', code);
  };

  const fillTrack = (el, items) => {
    if (!el) return;
    const html = items.map((t) => `<span>${t}</span>`).join('');
    el.innerHTML = html + html; // doubled for a seamless loop
  };

  const applyMarket = (code, opts = {}) => {
    const m = MARKETS[code];
    if (!m) return;
    const nameEl = document.getElementById('market-name');
    if (nameEl) nameEl.textContent = m.name.replace(/^the /, 'the ');
    const half = Math.ceil(m.trades.length / 2);
    fillTrack(document.getElementById('trades-a'), m.trades.slice(0, half));
    fillTrack(document.getElementById('trades-b'), m.trades.slice(half));
    const list = document.getElementById('trades-list');
    if (list) {
      const t = m.trades.map((x, i) => (i === 0 || /^[A-Z]{2}/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1)));
      list.textContent = t.slice(0, -1).join(', ') + ' and ' + t.at(-1) + '.';
    }
    marketButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.market === code)));
    const country = document.getElementById('f-country');
    if (country && !opts.keepForm) country.value = m.country;
    if (!opts.keepCurrency) applyCurrency(m.currency);
    store.set('km-market', code);
  };

  const guessMarket = () => {
    const saved = store.get('km-market');
    if (saved && MARKETS[saved]) return saved;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toUpperCase();
    if (tz === 'Asia/Dubai' || lang.endsWith('-AE')) return 'AE';
    if (tz === 'Europe/London' || lang.endsWith('-GB')) return 'UK';
    if (lang.endsWith('-CA') || /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton|Whitehorse|Yellowknife)/.test(tz)) return 'CA';
    if (lang.endsWith('-US') || /^America\//.test(tz)) return 'US';
    return 'CA';
  };

  marketButtons.forEach((b) => b.addEventListener('click', () => applyMarket(b.dataset.market)));
  currencyButtons.forEach((b) => b.addEventListener('click', () => {
    applyCurrency(b.dataset.currency);
    const mk = CURRENCY_TO_MARKET[b.dataset.currency];
    if (mk) applyMarket(mk, { keepCurrency: true });
  }));
  applyMarket(guessMarket());
  const savedCurrency = store.get('km-currency');
  if (savedCurrency && PRICES[savedCurrency]) applyCurrency(savedCurrency);

  /* ---------- Before/after slider in the work section ---------- */
  const compare = document.getElementById('compare-slider');
  const range = document.getElementById('compare-range');
  if (compare && range) {
    const setPos = (v) => compare.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => { setPos(range.value); compare.classList.add('is-touched'); });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      let touched = false;
      range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      range.addEventListener('keydown', () => { touched = true; }, { once: true });
      const sweep = () => {
        const from = 92, to = 10, duration = 1800;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
          if (touched) return;
          const t = Math.min(1, (now - start) / duration);
          const v = from + (to - from) * ease(t);
          setPos(v.toFixed(2)); range.value = Math.round(v);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { sweep(); io.disconnect(); } });
      }, { threshold: 0.5 });
      io.observe(compare);
    }
  }

  /* 3D tilt on the slider device (desktop only) */
  const device = document.getElementById('device');
  const stage = device && device.closest('.stage');
  if (device && stage && !reduceMotion && window.matchMedia('(hover: hover) and (min-width: 761px)').matches) {
    let frame = 0;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        device.classList.add('is-tracking');
        device.style.setProperty('--ry', (-10 + x * 14).toFixed(2) + 'deg');
        device.style.setProperty('--rx', (5 - y * 10).toFixed(2) + 'deg');
      });
    });
    stage.addEventListener('pointerleave', () => {
      device.classList.remove('is-tracking');
      device.style.removeProperty('--ry');
      device.style.removeProperty('--rx');
    });
  }

  /* ---------- Hero starter: carry the address into the full form ---------- */
  const starter = document.getElementById('starter');
  if (starter) {
    starter.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('starter-url').value.trim();
      const site = document.getElementById('f-site');
      if (site) site.value = url;
      document.getElementById('concept').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => {
        const target = document.getElementById(url ? 'f-name' : 'f-site');
        if (target) target.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 700);
    });
  }

  /* Plan buttons pre-select the package in the form */
  const planSelect = document.getElementById('f-plan');
  document.querySelectorAll('[data-plan]').forEach((a) => {
    a.addEventListener('click', () => { if (planSelect) planSelect.value = a.dataset.plan; });
  });

  /* ---------- Concept request form ---------- */
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
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Request failed');
        form.reset();
        say('Request received. Your free redesign concept will arrive within 24 hours.', 'ok');
      } catch (err) {
        const body = encodeURIComponent(
          `Name: ${data.name}\nBusiness: ${data.business}\nWebsite: ${data.website || '-'}\nCountry: ${data.country}\nPackage: ${data.plan}\n\n${data.notes || ''}`
        );
        status.className = 'form-status is-error';
        status.innerHTML = 'The form couldn\'t send right now. <a href="mailto:hello@kromaloom.com?subject=Free%20redesign%20concept&body=' + body + '">Send it by email instead</a>.';
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- Sticky mobile button: after the hero, hidden over the form ---------- */
  const mobileCta = document.getElementById('mobile-cta');
  const heroEl = document.querySelector('.card-hero');
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
