// Cloudflare Pages Function: POST /api/analyze  { "url": "example.com" }
// Fetches the visitor's homepage, checks its HTML for common problems, and (optionally)
// adds Google PageSpeed Insights scores. Returns one report the page can render.
//
// Optional secret: PSI_KEY (Google PageSpeed Insights API key) for higher rate limits.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;

function normalise(input) {
  let raw = String(input || '').trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  if (u.port && !['80', '443'].includes(u.port)) return null;
  if (PRIVATE_HOST.test(u.hostname) || !u.hostname.includes('.')) return null;
  u.hash = '';
  return u;
}

async function fetchWithTimeout(url, ms, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: 'follow' });
  } finally {
    clearTimeout(t);
  }
}

async function readCapped(res, maxBytes) {
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { chunks.push(value); try { reader.cancel(); } catch {} break; }
    chunks.push(value);
  }
  const buf = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let o = 0;
  for (const c of chunks) { buf.set(c, o); o += c.byteLength; }
  return { text: new TextDecoder('utf-8', { fatal: false }).decode(buf), bytes: size };
}

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
};

function checkHtml(html, finalUrl, ms, bytes) {
  const checks = [];
  const add = (id, ok, title, detail, fix, area) => checks.push({ id, ok, title, detail, fix, area });
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [html])[0];
  const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  const metas = head.match(/<meta\b[^>]*>/gi) || [];
  const metaBy = (key, val) => metas.find((m) => (attr(m, key) || '').toLowerCase() === val);

  // Security
  const https = finalUrl.protocol === 'https:';
  add('https', https, 'Secure connection (HTTPS)', https ? 'Your site loads over HTTPS.' : 'Your site loads without HTTPS, so Chrome shows "Not secure" next to your address.', 'We switch the site to HTTPS with a free certificate and redirect every old address.', 'Security');
  if (https) {
    const mixed = (html.match(/\s(?:src|href)\s*=\s*["']http:\/\/[^"']+\.(?:js|css|png|jpe?g|gif|webp|svg)/gi) || []).length;
    add('mixed', mixed === 0, 'No insecure files on a secure page', mixed ? `${mixed} ${mixed === 1 ? 'file still loads' : 'files still load'} over plain HTTP, which can trigger browser warnings.` : 'All files load securely.', 'We move every file to HTTPS so the padlock stays clean.', 'Security');
  }

  // Mobile
  const viewport = metaBy('name', 'viewport');
  add('viewport', !!viewport, 'Set up for phones', viewport ? 'The page tells phones how to size it.' : 'The page has no mobile viewport setting, so phones show a shrunken desktop page.', 'We rebuild the layout mobile-first, so it reads well on any phone.', 'Mobile');

  // SEO basics
  const titleM = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? strip(titleM[1]) : '';
  const titleOk = title.length >= 15 && title.length <= 65;
  add('title', titleOk, 'Page title', !title ? 'There is no page title, which is the headline Google shows for your site.' : titleOk ? `"${title.slice(0, 70)}"` : `Your title is ${title.length} characters ("${title.slice(0, 60)}${title.length > 60 ? '…' : ''}"). Aim for about 30 to 60, with your service and town.`, 'We write a title with your main service and location, for example "Emergency Plumber in Calgary | Northside".', 'Search');
  const desc = metaBy('name', 'description');
  const descText = desc ? (attr(desc, 'content') || '').trim() : '';
  const descOk = descText.length >= 50 && descText.length <= 170;
  add('description', descOk, 'Search description', !descText ? 'There is no meta description, so Google picks random text from the page to show under your link.' : descOk ? 'Your page has a search description of a good length.' : `Your description is ${descText.length} characters. Aim for about 120 to 160.`, 'We write a short description that makes people click your result instead of a competitor\'s.', 'Search');
  const h1s = (body.match(/<h1\b[\s\S]*?<\/h1>/gi) || []).map(strip).filter(Boolean);
  add('h1', h1s.length === 1, 'One clear main heading', h1s.length === 0 ? 'The page has no main heading (H1), so Google has to guess what it is about.' : h1s.length === 1 ? `Main heading: "${h1s[0].slice(0, 70)}"` : `The page has ${h1s.length} main headings, which muddles what it is about.`, 'We give each page one clear heading that says what you do and where.', 'Search');
  const canonical = /<link\b[^>]*rel\s*=\s*["']?canonical/i.test(head);
  add('canonical', canonical, 'Preferred address set (canonical)', canonical ? 'The page tells Google its preferred address.' : 'No canonical tag, so Google may split your ranking across duplicate addresses.', 'We add canonical tags so all ranking strength goes to one address.', 'Search');
  const noindex = metas.some((m) => /robots/i.test(attr(m, 'name') || '') && /noindex/i.test(attr(m, 'content') || ''));
  add('indexable', !noindex, 'Visible to Google', noindex ? 'The page tells search engines not to list it (noindex).' : 'Search engines are allowed to list the page.', 'We remove the block so Google can show your site.', 'Search');
  const schema = /application\/ld\+json/i.test(html);
  add('schema', schema, 'Business details for Google (structured data)', schema ? 'The page includes structured data.' : 'No structured data, so Google has less to show (hours, rating, location) in results.', 'We add LocalBusiness data with your hours, address, phone and services.', 'Search');
  const og = metas.some((m) => /og:image/i.test(attr(m, 'property') || ''));
  add('social', og, 'Link preview image', og ? 'Links to your site show a preview image when shared.' : 'When someone shares your link on WhatsApp or Facebook, no preview image appears.', 'We add a branded preview image and text for shared links.', 'Search');

  // Content and accessibility
  const imgs = body.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter((t) => { const a = attr(t, 'alt'); return a === null; }).length;
  add('alt', imgs.length === 0 || noAlt === 0, 'Image descriptions (alt text)', imgs.length === 0 ? 'No images found on the page.' : noAlt ? `${noAlt} of ${imgs.length} images ${noAlt === 1 ? 'has' : 'have'} no description, which hurts image search and screen readers.` : `All ${imgs.length} images have descriptions.`, 'We describe every image, which helps image search and visitors using screen readers.', 'Search');
  const words = strip(body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')).split(' ').filter((w) => w.length > 1).length;
  add('content', words >= 250, 'Enough text for Google', words < 250 ? `Only about ${words} words on the page. Thin pages rarely rank for local searches.` : `About ${words} words of text on the page.`, 'We write clear sections on your services, areas and hours so Google can match you to searches.', 'Search');

  // Conversion
  const tel = /href\s*=\s*["']tel:/i.test(body);
  add('tel', tel, 'Tap-to-call phone number', tel ? 'Visitors can tap your number to call.' : 'Your phone number is not tappable, so mobile visitors have to copy it by hand.', 'We add a tap-to-call button on every page.', 'Customers');
  const form = /<form\b/i.test(body) || /calendly|cal\.com|booking|book now|book online/i.test(body);
  add('form', form, 'Quote or booking form', form ? 'Visitors have a way to contact or book you from the site.' : 'There is no form or booking option, so visitors who won\'t call simply leave.', 'We add a short quote or booking form that takes under a minute.', 'Customers');
  const yearMatches = [...body.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)].map((m) => +m[1]);
  const year = yearMatches.length ? Math.max(...yearMatches) : null;
  const now = new Date().getUTCFullYear();
  if (year) add('fresh', now - year <= 1, 'Looks up to date', now - year <= 1 ? `Copyright shows ${year}.` : `Your footer still says ${year}, which tells visitors the site isn't looked after.`, 'We refresh the design and keep the footer current automatically.', 'Customers');

  // Speed (from this server's point of view)
  const kb = Math.round(bytes / 1024);
  add('weight', kb <= 500, 'Page size', `The page's HTML is ${kb} KB${kb > 500 ? ', which is heavy before images and scripts even load' : ''}.`, 'We strip out bloat so the page loads fast on mobile data.', 'Speed');
  add('response', ms <= 1500, 'Server response time', `Your server took ${(ms / 1000).toFixed(1)} s to send the page${ms > 1500 ? ', which is slow' : ''}.`, 'We host on a fast global network so the first byte arrives quickly everywhere.', 'Speed');
  const scripts = (head.match(/<script\b(?![^>]*\b(?:async|defer|type\s*=\s*["']?application\/ld\+json))[^>]*\bsrc=/gi) || []).length;
  add('blocking', scripts <= 2, 'Scripts that delay the page', scripts > 2 ? `${scripts} scripts in the page head load before anything shows.` : 'Few or no scripts block the first paint.', 'We defer non-essential scripts so content appears first.', 'Speed');

  // Platform hints
  const gen = metaBy('name', 'generator');
  const platform = gen ? (attr(gen, 'content') || '').slice(0, 60) : (/wp-content|wp-includes/i.test(html) ? 'WordPress' : /wix\.com|wixstatic/i.test(html) ? 'Wix' : /squarespace/i.test(html) ? 'Squarespace' : /cdn\.shopify|shopify/i.test(html) ? 'Shopify' : /godaddy|websitebuilder/i.test(html) ? 'GoDaddy Website Builder' : null);

  return { checks, platform, title };
}

async function pageSpeed(url, key) {
  const qs = new URLSearchParams({ url, strategy: 'mobile' });
  ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) => qs.append('category', c));
  if (key) qs.set('key', key);
  try {
    const res = await fetchWithTimeout('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + qs, 45000);
    if (!res.ok) return null;
    const data = await res.json();
    const lr = data.lighthouseResult || {};
    const cats = lr.categories || {};
    const a = lr.audits || {};
    const score = (k) => (cats[k] && typeof cats[k].score === 'number' ? Math.round(cats[k].score * 100) : null);
    return {
      scores: { performance: score('performance'), seo: score('seo'), accessibility: score('accessibility'), bestPractices: score('best-practices') },
      metrics: {
        lcp: a['largest-contentful-paint']?.displayValue || null,
        fcp: a['first-contentful-paint']?.displayValue || null,
        cls: a['cumulative-layout-shift']?.displayValue || null,
        tbt: a['total-blocking-time']?.displayValue || null
      }
    };
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Send a website address.' }, 400); }
  const target = normalise(body.url);
  if (!target) return json({ ok: false, error: 'That doesn\'t look like a public website address. Try something like yourbusiness.com.' }, 422);

  const psiPromise = pageSpeed(target.href, env.PSI_KEY);

  let res, started = Date.now();
  try {
    res = await fetchWithTimeout(target.href, 12000, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KromaloomSiteCheck/1.0; +https://kromaloom.com)', Accept: 'text/html' }
    });
    if (!res.ok && target.protocol === 'https:') throw new Error('status');
  } catch {
    try {
      const httpUrl = new URL(target.href); httpUrl.protocol = 'http:';
      started = Date.now();
      res = await fetchWithTimeout(httpUrl.href, 12000, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KromaloomSiteCheck/1.0)' } });
    } catch {
      return json({ ok: false, error: 'We couldn\'t reach that website. Check the address, or send it to us and we\'ll look by hand.' }, 502);
    }
  }
  const ms = Date.now() - started;
  const type = res.headers.get('content-type') || '';
  if (!/html/i.test(type)) return json({ ok: false, error: 'That address didn\'t return a web page.' }, 422);

  const { text, bytes } = await readCapped(res, 3 * 1024 * 1024);
  const finalUrl = new URL(res.url || target.href);
  const report = checkHtml(text, finalUrl, ms, bytes);
  const psi = await psiPromise;

  return json({ ok: true, source: 'full', url: finalUrl.href, ...report, psi });
}

export function onRequest() {
  return json({ ok: false, error: 'Use POST.' }, 405);
}
