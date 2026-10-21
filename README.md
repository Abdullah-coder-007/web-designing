# Kromaloom website

The agency's own website. It's a fast static site with no build step, ready for Cloudflare Pages.

"Kromaloom" and `kromaloom.com` are a working name. To switch to your final domain, search the project for `kromaloom` and replace it.

## What's in it

| Path | What it is |
| --- | --- |
| `index.html` | Homepage: hero with before/after slider, process, concept work, pricing in CAD/USD/GBP/AED, comparison, FAQ, free-concept form |
| `privacy.html`, `terms.html` | Legal pages |
| `404.html` | Not-found page (Cloudflare Pages serves it automatically) |
| `assets/css/style.css` | All styles |
| `assets/js/main.js` | Slider, 3D tilt, currency switcher, mobile menu, form |
| `assets/fonts/` | Self-hosted Bricolage Grotesque and Instrument Sans (SIL Open Font License) |
| `assets/img/` | Favicon, app icons, social share image |
| `functions/api/concept.js` | Form handler (Cloudflare Pages Function) |
| `_headers` | Security and caching headers |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Search engine and AI crawler files |

SEO already included: unique titles and descriptions, canonical URLs, Open Graph image, structured data (ProfessionalService, WebSite, FAQPage), sitemap, robots.txt, semantic headings, and no render-blocking third-party requests.

## Preview on GitHub Pages

All paths are relative, so the site also runs from GitHub Pages at
`https://abdullah-coder-007.github.io/web-designing/`. To switch it on: repo **Settings → Pages → Build and deployment**, source **Deploy from a branch**, branch **main**, folder **/ (root)**. The form can't send from GitHub Pages (it needs the Cloudflare function), so there it shows an "email us instead" link.

## Deploy on Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick this repository (`web-designing`), branch `main`.
3. Build settings: framework preset **None**, build command **empty**, output directory **`/`**.
4. Deploy. You'll get a `*.pages.dev` address within a minute.
5. Once the domain is bought: **Custom domains → Set up a custom domain**, then add both `yourdomain.com` and `www.yourdomain.com`.

Every push to `main` redeploys automatically.

## Make the form deliver leads

The form posts to `/api/concept`. Set up at least one of these, or visitors will see an "email us instead" link:

- **Email each request to you (recommended):** get a free access key at web3forms.com, then in your Pages project go to **Settings → Variables and Secrets** and add a secret named `WEB3FORMS_KEY`.
- **Store requests in Cloudflare:** create a KV namespace, then under **Settings → Bindings** bind it to the project with the name `LEADS`.

## After going live

- Add the site to Google Search Console and submit `https://yourdomain.com/sitemap.xml`.
- Set up `hello@yourdomain.com` with Cloudflare Email Routing, and add SPF, DKIM and DMARC records before sending any outreach.
- Replace the three concept projects with real client work as soon as you have it.
