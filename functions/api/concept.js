// Cloudflare Pages Function: POST /api/concept
// Saves free-concept requests. Configure at least one of:
//   - KV namespace bound as LEADS  (Pages > Settings > Bindings)
//   - WEB3FORMS_KEY secret         (free key from web3forms.com, emails each request to you)
// If neither is set, the form shows visitors an "email us instead" link.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let input;
  try {
    const type = request.headers.get('Content-Type') || '';
    input = type.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Could not read the form.' }, 400);
  }

  // Honeypot: bots fill hidden fields, people don't.
  if (clean(input.company)) return json({ ok: true });

  const lead = {
    name: clean(input.name, 120),
    business: clean(input.business, 160),
    email: clean(input.email, 200),
    website: clean(input.website, 300),
    country: clean(input.country, 60),
    plan: clean(input.plan, 60),
    notes: clean(input.notes, 2000),
    receivedAt: new Date().toISOString(),
    ip_country: request.cf?.country || ''
  };

  if (!lead.name || !lead.business || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ ok: false, error: 'Name, business and a valid email are required.' }, 422);
  }

  let stored = false;

  if (env.LEADS) {
    const key = `lead:${lead.receivedAt}:${crypto.randomUUID()}`;
    await env.LEADS.put(key, JSON.stringify(lead));
    stored = true;
  }

  if (env.WEB3FORMS_KEY) {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        subject: `Free concept request: ${lead.business} (${lead.country})`,
        from_name: 'Kromaloom website',
        replyto: lead.email,
        ...lead
      })
    });
    if (res.ok) stored = true;
  }

  if (!stored) return json({ ok: false, error: 'Lead storage is not configured.' }, 503);
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'Use POST.' }, 405);
}
