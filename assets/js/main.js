(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scrollTo = (el, block = 'start') => el && el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block });

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = $('site-nav');
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
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const a = byId.get(e.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [...byId.keys()].map((id) => $(id)).filter(Boolean).forEach((s) => io.observe(s));
  }

  /* ---------- Links that jump somewhere and focus a field ---------- */
  document.querySelectorAll('[data-focus]').forEach((a) => {
    a.addEventListener('click', () => {
      setTimeout(() => { const f = $(a.dataset.focus); if (f) f.focus({ preventScroll: true }); }, reduceMotion ? 0 : 650);
    });
  });

  /* ---------- Country: picked automatically, drives trades and currency ---------- */
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
  const COUNTRY_TO_MARKET = { CA: 'CA', US: 'US', GB: 'UK', AE: 'AE' };
  const currencyButtons = document.querySelectorAll('.currency button');

  const applyCurrency = (code) => {
    const p = PRICES[code];
    if (!p) return;
    document.querySelectorAll('[data-price]').forEach((el) => {
      const key = el.getAttribute('data-price');
      if (p[key] != null) el.textContent = p.sym + p[key].toLocaleString('en-US');
    });
    currencyButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.currency === code)));
  };
  const applyMarket = (code, { keepCurrency = false } = {}) => {
    const m = MARKETS[code];
    if (!m) return;
    const nameEl = $('market-name');
    if (nameEl) nameEl.textContent = m.name;
    const track = $('trades-a');
    if (track) {
      const html = m.trades.map((t) => `<span>${esc(t)}</span>`).join('');
      track.innerHTML = html + html; // doubled for a seamless loop
    }
    const country = $('f-country');
    if (country) country.value = m.country;
    if (!keepCurrency) applyCurrency(m.currency);
  };
  const guessFromBrowser = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toUpperCase();
    if (tz === 'Asia/Dubai' || lang.endsWith('-AE')) return 'AE';
    if (tz === 'Europe/London' || lang.endsWith('-GB')) return 'UK';
    if (lang.endsWith('-CA') || /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton|Whitehorse|Yellowknife)/.test(tz)) return 'CA';
    if (lang.endsWith('-US') || /^America\//.test(tz)) return 'US';
    return 'CA';
  };
  currencyButtons.forEach((b) => b.addEventListener('click', () => {
    applyCurrency(b.dataset.currency);
    store.set('km-currency', b.dataset.currency);
    const mk = CURRENCY_TO_MARKET[b.dataset.currency];
    if (mk) applyMarket(mk, { keepCurrency: true });
  }));

  // Start with the browser's guess, then refine with Cloudflare's country when available.
  const savedCurrency = store.get('km-currency');
  const startMarket = (savedCurrency && CURRENCY_TO_MARKET[savedCurrency]) || guessFromBrowser();
  applyMarket(startMarket);
  if (!savedCurrency) {
    fetch('api/geo', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
      .then((d) => { const mk = d && COUNTRY_TO_MARKET[d.country]; if (mk && mk !== startMarket) applyMarket(mk); })
      .catch(() => { /* not on Cloudflare yet: keep the browser guess */ });
  }

  /* ---------- Website checker ---------- */
  const PSI_AUDITS = [
    ['is-on-https', 'Secure connection (HTTPS)', 'Security', 'Your site loads without HTTPS, so Chrome shows "Not secure" next to your address.', 'We switch the site to HTTPS with a free certificate and redirect every old address.'],
    ['viewport', 'Set up for phones', 'Mobile', 'The page has no mobile viewport setting, so phones show a shrunken desktop page.', 'We rebuild the layout mobile-first, so it reads well on any phone.'],
    ['font-size', 'Readable text on phones', 'Mobile', 'Some text is too small to read on a phone without zooming.', 'We set comfortable text sizes for small screens.'],
    ['largest-contentful-paint', 'Main content loads fast', 'Speed', 'Your main content is slow to appear on a phone.', 'We compress images, trim code and use fast hosting so the page appears in under 2.5 seconds.'],
    ['total-blocking-time', 'Responds quickly to taps', 'Speed', 'Heavy scripts make the page slow to respond when someone taps.', 'We remove or defer scripts the page doesn\'t need straight away.'],
    ['cumulative-layout-shift', 'Page doesn\'t jump around', 'Speed', 'Parts of the page shift while it loads, so people tap the wrong thing.', 'We reserve space for images and fonts so nothing moves.'],
    ['render-blocking-resources', 'Nothing delays the first view', 'Speed', 'Files in the page head hold up the first view of your site.', 'We load the essentials first and the rest afterwards.'],
    ['modern-image-formats', 'Images in modern formats', 'Speed', 'Images use old, heavy formats.', 'We convert images to WebP or AVIF, often half the size.'],
    ['unused-javascript', 'No wasted code', 'Speed', 'The page downloads code it never uses.', 'We strip out unused plugins and scripts.'],
    ['document-title', 'Page title', 'Search', 'The page has no title, which is the headline Google shows for your site.', 'We write a title with your main service and location.'],
    ['meta-description', 'Search description', 'Search', 'There is no meta description, so Google picks random text to show under your link.', 'We write a short description that makes people click your result.'],
    ['is-crawlable', 'Visible to Google', 'Search', 'The page is blocked from being listed in search results.', 'We remove the block so Google can show your site.'],
    ['canonical', 'Preferred address set', 'Search', 'The page\'s preferred address is missing or wrong.', 'We add canonical tags so all ranking strength goes to one address.'],
    ['link-text', 'Clear link text', 'Search', 'Some links say things like "click here", which tells Google nothing.', 'We write links that describe where they go.'],
    ['image-alt', 'Image descriptions (alt text)', 'Search', 'Some images have no description, which hurts image search and screen readers.', 'We describe every image.'],
    ['color-contrast', 'Readable colours', 'Customers', 'Some text doesn\'t stand out enough from its background.', 'We choose colours that pass accessibility contrast rules.'],
    ['errors-in-console', 'No errors on the page', 'Customers', 'The page throws errors in the browser, a sign something is broken.', 'We fix or remove the broken parts.']
  ];

  const normaliseUrl = (raw) => {
    let v = String(raw || '').trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      const u = new URL(v);
      if (!u.hostname.includes('.') || /\s/.test(u.hostname)) return null;
      return u;
    } catch (e) { return null; }
  };

  const fetchJson = async (url, opts, ms) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      const isJson = (res.headers.get('content-type') || '').includes('json');
      return { res, data: isJson ? await res.json() : null };
    } finally { clearTimeout(t); }
  };

  /* Turn a Lighthouse result (from Microlink or Google) into our checks and scores */
  const fromLighthouse = (lr) => {
    const cats = lr.categories || {};
    const a = lr.audits || {};
    const score = (k) => (cats[k] && typeof cats[k].score === 'number' ? Math.round(cats[k].score * 100) : null);
    const checks = [];
    PSI_AUDITS.forEach(([id, title, area, bad, fix]) => {
      const au = a[id];
      if (!au || au.score === null || au.score === undefined) return;
      const ok = au.score >= 0.9;
      const shown = au.displayValue ? ` (${au.displayValue})` : '';
      checks.push({ id, ok, title, area, fix, detail: ok ? `Passed${shown}.` : bad + shown });
    });
    return {
      checks,
      scores: { performance: score('performance'), seo: score('seo'), accessibility: score('accessibility'), bestPractices: score('best-practices') },
      audits: a
    };
  };

  /* Keyless checks via Microlink: one quick request (screenshot, colours, tech, title)
     and one slower Lighthouse request, run side by side so a slow speed test can't sink the report. */
  const microlink = async (params, ms) => {
    const { res, data } = await fetchJson('https://api.microlink.io/?' + new URLSearchParams(params), {}, ms);
    if (!res.ok || !data || data.status !== 'success') {
      const code = (data && data.code) || 'HTTP' + res.status;
      if (window.console) console.warn('Website check: Microlink returned', code, data && data.message);
      const err = new Error(code);
      err.code = code;
      err.rate = res.status === 429 || code === 'ERATE';
      err.unreachable = /EFAILEDURL|EINVALURL|ENOTFOUND|EINVALURLCLIENT|EBADREQUEST/.test(code);
      throw err;
    }
    return data.data || {};
  };
  const runMicrolinkQuick = async (url) => {
    const d = await microlink({ url, palette: 'true', screenshot: 'true', meta: 'true', 'insights.technologies': 'true' }, 40000);
    return {
      design: {
        screenshot: d.screenshot && d.screenshot.url,
        palette: (d.screenshot && d.screenshot.palette) || (d.image && d.image.palette) || (d.logo && d.logo.palette) || [],
        hasShareImage: !!(d.image && d.image.url),
        hasLogo: !!(d.logo && d.logo.url),
        tech: ((d.insights && d.insights.technologies) || []).map((t) => t.name),
        title: d.title || '',
        description: d.description || ''
      },
      finalUrl: d.url || url,
      lang: d.lang || null
    };
  };
  const runMicrolinkLighthouse = async (url) => {
    const d = await microlink({ url, meta: 'false', 'insights.lighthouse': 'true' }, 75000);
    const lh = d.insights && d.insights.lighthouse;
    if (!lh || !lh.categories) throw Object.assign(new Error('NOLIGHTHOUSE'), { code: 'NOLIGHTHOUSE' });
    return fromLighthouse(lh);
  };

  /* Checks we can make from the quick request alone */
  const quickChecks = (q) => {
    const c = [];
    const d = q.design;
    const https = /^https:/i.test(q.finalUrl || '');
    c.push({ id: 'https', ok: https, area: 'Security', title: 'Secure connection (HTTPS)', detail: https ? 'Your site loads over HTTPS.' : 'Your site loads without HTTPS, so Chrome shows "Not secure" next to your address.', fix: 'We switch the site to HTTPS with a free certificate and redirect every old address.' });
    const t = (d.title || '').trim();
    const tOk = t.length >= 15 && t.length <= 65;
    c.push({ id: 'title', ok: tOk, area: 'Search', title: 'Page title', detail: !t ? 'There is no page title, which is the headline Google shows for your site.' : tOk ? `"${t.slice(0, 70)}"` : `Your title is ${t.length} characters ("${t.slice(0, 60)}${t.length > 60 ? '…' : ''}"). Aim for about 30 to 60, with your service and town.`, fix: 'We write a title with your main service and location, for example "Emergency Plumber in Calgary | Northside".' });
    const ds = (d.description || '').trim();
    const dOk = ds.length >= 50 && ds.length <= 170;
    c.push({ id: 'description', ok: dOk, area: 'Search', title: 'Search description', detail: !ds ? 'There is no description, so Google picks random text from the page to show under your link.' : dOk ? 'Your page has a search description of a good length.' : `Your description is ${ds.length} characters. Aim for about 120 to 160.`, fix: 'We write a short description that makes people click your result instead of a competitor\'s.' });
    c.push({ id: 'social', ok: d.hasShareImage, area: 'Search', title: 'Link preview image', detail: d.hasShareImage ? 'Links to your site show a preview image when shared.' : 'When someone shares your link on WhatsApp or Facebook, no preview image appears.', fix: 'We add a branded preview image and text for shared links.' });
    c.push({ id: 'lang', ok: !!q.lang, area: 'Search', title: 'Page language set', detail: q.lang ? `Language: ${q.lang}.` : 'The page doesn\'t declare its language, which helps Google show it to the right searchers.', fix: 'We set the page language, and add Arabic or French versions if you need them.' });
    const old = (d.tech || []).filter((x) => /jQuery$|Flash|Joomla|Drupal 7|Bootstrap 3|Weebly|Site123|GoDaddy Website Builder/i.test(x));
    c.push({ id: 'tech', ok: old.length === 0, area: 'Speed', title: 'Up-to-date technology', detail: old.length ? `Uses ${old.join(', ')}, which is dated and often slow.` : 'No obviously dated technology detected.', fix: 'We rebuild on a modern, lightweight setup.' });
    return c;
  };

  /* Last resort: Google PageSpeed (shared allowance unless a key is set) */
  const runPageSpeed = async (url) => {
    const qs = new URLSearchParams({ url, strategy: 'mobile' });
    ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) => qs.append('category', c));
    const key = (document.querySelector('meta[name="psi-key"]') || {}).content;
    if (key) qs.set('key', key);
    const { res, data } = await fetchJson('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + qs, {}, 70000);
    if (!res.ok || !data || !data.lighthouseResult) {
      const msg = data && data.error && data.error.message ? data.error.message : '';
      throw new Error(/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS/i.test(msg)
        ? 'We couldn\'t reach that website. Check the address and try again.'
        : 'Our automatic check is at its limit for today. Send us your website below and we\'ll check it by hand, free.');
    }
    return fromLighthouse(data.lighthouseResult);
  };

  /* ---------- Colour helpers for the design suggestions ---------- */
  const hexToHsl = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  };
  const hsl = (h, s, l) => `hsl(${Math.round((h + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`;

  const designPlan = (design, lhAudits, checks) => {
    const palette = [...new Set((design.palette || []).map((c) => c.toUpperCase()))].slice(0, 6);
    const hsls = palette.map(hexToHsl).filter(Boolean);
    const vivid = hsls.filter((c) => c.s > 25 && c.l > 15 && c.l < 85).sort((a, b) => b.s - a.s);
    const base = vivid[0] || { h: 252, s: 70, l: 50 };
    const avgSat = hsls.length ? hsls.reduce((n, c) => n + c.s, 0) / hsls.length : 0;
    const refined = [
      { name: 'Brand', c: hsl(base.h, Math.max(62, Math.min(base.s, 82)), 48) },
      { name: 'Deep', c: hsl(base.h, 45, 14) },
      { name: 'Soft', c: hsl(base.h, 55, 96) },
      { name: 'Accent', c: hsl(base.h + 150, 85, 56) },
      { name: 'Highlight', c: hsl(base.h + 40, 95, 60) }
    ];
    const tips = [];
    const failed = (id) => checks.some((c) => c.id === id && !c.ok);
    if (hsls.length && avgSat < 18) tips.push(['A confident brand colour', 'Your current colours are mostly greys and muted tones, so nothing draws the eye to your call button. We build the page around one strong brand colour.']);
    else if (vivid.length >= 4) tips.push(['Fewer, stronger colours', 'Several bright colours compete for attention. We narrow it to one brand colour and one accent, so the important buttons stand out.']);
    else tips.push(['Sharper version of your colours', 'We keep your colours recognisable but make them cleaner and higher contrast, as in the refined palette above.']);
    tips.push(['A first screen that sells', 'One headline that says what you do and where, a big call or booking button, and your star rating, all visible without scrolling.']);
    tips.push(['Modern type', 'A characterful heading font paired with a clean, readable body font, sized properly for phones.']);
    if (failed('largest-contentful-paint') || failed('modern-image-formats') || failed('weight')) tips.push(['Lighter, faster visuals', 'Compressed images in modern formats and fewer heavy scripts, so the first screen appears in under 2.5 seconds.']);
    if (failed('color-contrast')) tips.push(['Text you can actually read', 'Some text blends into its background today. We set colours that pass accessibility contrast rules.']);
    tips.push(['Proof up front', 'Reviews, real photos of your work and trust badges moved high up the page, where people decide.']);
    tips.push(['A sticky call bar on phones', 'A "Call now" or "Book" button that stays at the bottom of the screen as people scroll.']);
    if (!design.hasShareImage) tips.push(['A branded link preview', 'When your link is shared on WhatsApp or Facebook, a proper image and title appear instead of a blank box.']);
    if (!design.hasLogo) tips.push(['A crisp logo', 'We redraw your logo as a sharp vector so it looks clean on every screen.']);
    tips.push(['One 3D accent', 'A single animated 3D element in the hero to make the site feel modern, without slowing it down.']);
    const old = (design.tech || []).filter((t) => /jQuery|Flash|Joomla|Drupal 7|Bootstrap 3|Wix|GoDaddy|Weebly|Site123/i.test(t));
    return { palette, refined, tips: tips.slice(0, 8), tech: design.tech || [], old };
  };

  const checker = $('checker');
  const report = $('report');
  if (checker && report) {
    const title = $('report-title');
    const sub = $('report-sub');
    const body = $('report-body');
    const progress = $('report-progress');
    const steps = [...report.querySelectorAll('.report-steps li')];
    let stepTimer = 0;

    const setStep = (i) => steps.forEach((li, n) => {
      li.classList.toggle('is-done', n < i);
      li.classList.toggle('is-active', n === i);
    });
    const startSteps = () => {
      let i = 0; setStep(0);
      clearInterval(stepTimer);
      stepTimer = setInterval(() => { i = Math.min(i + 1, steps.length - 1); setStep(i); }, 6000);
    };
    const stopSteps = () => { clearInterval(stepTimer); setStep(steps.length); };

    const dial = (label, hint, v) => {
      if (v == null) return '';
      const c = v >= 90 ? 'var(--teal)' : v >= 50 ? 'var(--saffron)' : 'var(--madder)';
      return `<div class="score"><span class="dial" style="--v:${v};--c:${c}"><b>${v}</b></span><span>${esc(label)}<small>${esc(hint)}</small></span></div>`;
    };
    const issueCard = (c) => `<article class="issue${c.ok ? ' ok' : ''}"><h4>${esc(c.title)}<em>${esc(c.area)}</em></h4><p>${esc(c.detail)}</p>${c.ok ? '' : `<p class="fix">${esc(c.fix)}</p>`}</article>`;
    const swatch = (c, label) => `<span class="sw"><i style="background:${esc(c)}"></i>${label ? `<small>${esc(label)}</small>` : ''}</span>`;

    const render = (r, host) => {
      progress.hidden = true;
      const failing = r.checks.filter((c) => !c.ok);
      const passing = r.checks.filter((c) => c.ok);
      title.textContent = failing.length
        ? `We found ${failing.length} thing${failing.length === 1 ? '' : 's'} holding ${host} back`
        : `${host} is in good shape technically`;
      sub.textContent = failing.length
        ? 'Each one costs you customers, Google rankings, or both. Below: what we found, how we\'d fix it, and how we\'d make it look better.'
        : 'The basics are covered. Below is how we\'d make it look sharper and turn more visitors into calls.';
      const s = r.scores;
      const scores = s ? `<div class="scores">${dial('Speed on phones', 'Lighthouse performance', s.performance)}${dial('Google search basics', 'SEO score', s.seo)}${dial('Easy to use', 'Accessibility', s.accessibility)}${dial('Built properly', 'Best practices', s.bestPractices)}</div>` : '';

      let designHtml = '';
      if (r.design) {
        const plan = designPlan(r.design, r.audits || {}, r.checks);
        const shot = r.design.screenshot ? `<figure class="shot-now"><div class="device-bar" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">${esc(host)}</span></div><img src="${esc(r.design.screenshot)}" alt="Screenshot of ${esc(host)} today" loading="lazy"><figcaption>Your site today</figcaption></figure>` : '';
        const pal = plan.palette.length ? `<div class="palettes"><div><p class="pal-label">Your colours now</p><div class="sws">${plan.palette.map((c) => swatch(c)).join('')}</div></div><div><p class="pal-label">A refined palette we'd start from</p><div class="sws">${plan.refined.map((x) => swatch(x.c, x.name)).join('')}</div></div></div>` : '';
        const tech = plan.tech.length ? `<p class="summary-line">Built with ${esc(plan.tech.slice(0, 5).join(', '))}.${plan.old.length ? ` ${esc(plan.old.join(', '))} ${plan.old.length === 1 ? 'is' : 'are'} dated and often slow; we can modernise or replace ${plan.old.length === 1 ? 'it' : 'them'}.` : ' We can redesign on the same platform or move it somewhere faster.'}</p>` : '';
        designHtml = `<section class="design-plan" aria-label="Design upgrades">
          <h3 class="design-title">How we'd make it look better</h3>
          <div class="design-grid">${shot}<div class="design-side">${pal}<ol class="tips">${plan.tips.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join('')}</ol></div></div>
          ${tech}
        </section>`;
      } else if (r.platform) {
        designHtml = `<p class="summary-line">Built with: ${esc(r.platform)}. We can redesign it on the same platform or move it somewhere faster.</p>`;
      }

      const source = r.source === 'full' ? 'Checked your homepage code directly, plus a Lighthouse test on a mobile connection.' : r.source === 'quick' ? 'The speed test couldn\'t finish for this site, so this report covers search, sharing and design. We\'ll include full speed results in your free concept.' : 'Based on a Lighthouse test run as a mobile visitor.';
      body.innerHTML = `${scores}
        ${failing.length ? `<h3 class="design-title">What's holding it back</h3><div class="issues">${failing.map(issueCard).join('')}</div>` : ''}
        ${passing.length ? `<details class="passed"><summary>${passing.length} check${passing.length === 1 ? '' : 's'} passed</summary><div class="issues">${passing.map(issueCard).join('')}</div></details>` : ''}
        ${designHtml}
        <div class="report-cta"><p>${failing.length ? 'Want all of this fixed? We\'ll send you a free redesign concept of your homepage within 24 hours.' : 'Want to see the new look? Get a free redesign concept within 24 hours.'}</p><button class="btn btn-onlight" type="button" id="report-to-form">Get my free redesign concept</button></div>
        <p class="report-note">${source} Results can vary between runs.</p>`;
      $('report-to-form').addEventListener('click', () => {
        const notes = $('f-notes');
        if (notes) notes.value = failing.length ? 'Website check found: ' + failing.map((c) => c.title).join('; ') : 'Website check: all basics passed.';
        scrollTo($('concept'));
        setTimeout(() => { const n = $('f-name'); if (n) n.focus({ preventScroll: true }); }, reduceMotion ? 0 : 650);
      });
    };

    const fail = (msg) => {
      stopSteps();
      progress.hidden = true;
      title.textContent = 'We\'ll check this one by hand';
      sub.textContent = '';
      body.innerHTML = `<p class="report-error">${esc(msg)}</p><div class="report-cta"><p>Send it to us and you'll get a full check plus a free redesign concept within 24 hours.</p><button class="btn btn-onlight" type="button" id="report-to-form">Send my website</button></div>`;
      $('report-to-form').addEventListener('click', () => { scrollTo($('concept')); setTimeout(() => { const n = $('f-name'); if (n) n.focus({ preventScroll: true }); }, 650); });
    };

    checker.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('checker-url');
      const u = normaliseUrl(input.value);
      if (!u) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        input.placeholder = 'Enter a website, like yourbusiness.com';
        input.value = '';
        return;
      }
      input.removeAttribute('aria-invalid');
      const host = u.hostname.replace(/^www\./, '');
      const site = $('f-site');
      if (site) site.value = host;
      report.hidden = false;
      progress.hidden = false;
      body.innerHTML = '';
      title.textContent = `Checking ${host}…`;
      sub.textContent = 'This usually takes 20 to 40 seconds. We load your homepage as a phone would.';
      startSteps();
      scrollTo(report, 'start');
      const button = checker.querySelector('button');
      button.disabled = true;
      try {
        // Run the server check (Cloudflare only) and both Microlink checks side by side.
        const settle = (pr) => pr.then((v) => ({ v }), (e) => ({ e }));
        const [server, quick, lh] = await Promise.all([
          settle(fetchJson('api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ url: u.href })
          }, 60000)),
          settle(runMicrolinkQuick(u.href)),
          settle(runMicrolinkLighthouse(u.href))
        ]);

        const sv = server.v;
        const serverOk = sv && sv.data && sv.data.ok ? sv.data : null;
        if (!serverOk && sv && sv.data && sv.data.error && sv.res.status !== 404 && sv.res.status !== 405) { fail(sv.data.error); return; }
        const q = quick.v || null;
        const L = lh.v || null;
        if (!serverOk && !q && !L) {
          const e = quick.e || lh.e || {};
          if (e.unreachable) { fail('We couldn\'t reach that website. Check the address (for example yourbusiness.com) and try again.'); return; }
          if (e.rate) { fail('You\'ve used today\'s free automatic checks from this connection. Send us your website below and we\'ll check it by hand, free.'); return; }
        }

        let checks = [], scores = null, audits = null, source = 'lighthouse';
        if (serverOk) {
          checks = serverOk.checks; source = 'full';
          if (serverOk.psi && serverOk.psi.scores) scores = serverOk.psi.scores;
        }
        if (L) {
          if (!serverOk) {
            // Lighthouse plus the quick checks Lighthouse doesn't cover
            const covered = new Set(['https', 'title', 'description']);
            checks = L.checks.concat(q ? quickChecks(q).filter((c) => !covered.has(c.id)) : []);
          }
          if (!scores) scores = L.scores;
          audits = L.audits;
        } else if (!serverOk && q) {
          checks = quickChecks(q); source = 'quick';
        }
        if (!scores) {
          try { const psi = await runPageSpeed(u.href); scores = psi.scores; if (!checks.length) checks = psi.checks; audits = audits || psi.audits; }
          catch (e2) { /* scores are optional */ }
        }
        if (!checks.length) { fail('Our automatic check couldn\'t load that page right now. Send us your website below and we\'ll check it by hand, free.'); return; }
        stopSteps();
        render({ checks, scores, audits, source, design: q ? q.design : null, platform: serverOk ? serverOk.platform : null }, host);
      } catch (err) {
        fail(err && err.message ? err.message : 'Our automatic check couldn\'t finish. Send us your website below and we\'ll check it by hand, free.');
      } finally {
        button.disabled = false;
      }
    });

    $('report-close').addEventListener('click', () => { report.hidden = true; clearInterval(stepTimer); scrollTo(checker, 'center'); });
  }

  /* ---------- Before/after slider in the work section ---------- */
  const compare = $('compare-slider');
  const range = $('compare-range');
  if (compare && range) {
    const setPos = (v) => compare.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => { setPos(range.value); compare.classList.add('is-touched'); });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      let touched = false;
      range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      range.addEventListener('keydown', () => { touched = true; }, { once: true });
      const sweep = () => {
        const from = 92, to = 10, duration = 1800, start = performance.now();
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
  const device = $('device');
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

  /* Plan buttons pre-select the package in the form */
  const planSelect = $('f-plan');
  document.querySelectorAll('[data-plan]').forEach((a) => {
    a.addEventListener('click', () => { if (planSelect) planSelect.value = a.dataset.plan; });
  });

  /* ---------- Concept request form ---------- */
  const form = $('concept-form');
  const status = $('form-status');
  if (form && status) {
    const say = (msg, kind) => { status.textContent = msg; status.className = 'form-status' + (kind ? ' is-' + kind : ''); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      form.querySelectorAll('[required]').forEach((el) => {
        const ok = el.checkValidity();
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { say('Please fill in your name, business name and a valid email.', 'error'); firstBad.focus(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      say('Sending your request…');
      try {
        const res = await fetch(form.action, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Request failed');
        form.reset();
        say('Request received. Your free redesign concept will arrive within 24 hours.', 'ok');
      } catch (err) {
        const mail = encodeURIComponent(`Name: ${data.name}\nBusiness: ${data.business}\nWebsite: ${data.website || '-'}\nCountry: ${data.country}\nPackage: ${data.plan}\n\n${data.notes || ''}`);
        status.className = 'form-status is-error';
        status.innerHTML = 'The form couldn\'t send right now. <a href="mailto:hello@kromaloom.com?subject=Free%20redesign%20concept&body=' + mail + '">Send it by email instead</a>.';
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- Sticky mobile button: after the hero, hidden near the form ---------- */
  const mobileCta = $('mobile-cta');
  const heroEl = document.querySelector('.card-hero');
  if (mobileCta && heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => mobileCta.classList.toggle('is-visible', !e.isIntersecting)).observe(heroEl);
  }

  const year = $('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
