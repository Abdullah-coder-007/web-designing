// Cloudflare Pages Function: GET /api/geo
// Returns the visitor's country code from Cloudflare's edge, used to pick the
// trades list and pricing currency. No personal data is stored.
export function onRequestGet({ request }) {
  return new Response(JSON.stringify({ country: request.cf?.country || null }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=3600' }
  });
}
