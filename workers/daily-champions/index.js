/* ══════════════════════════════════════════
   Mística Futbolera — Worker: campeones del día (estilo arcade)
   GET  /daily/YYYY-MM-DD  → { date, champions: [{ name, at }] }
   POST /daily/YYYY-MM-DD  → agrega { name } (solo si la fecha es HOY en UTC)

   Storage: Cloudflare Workers KV (binding CHAMPIONS). Gratis en el plan
   free: 100k lecturas/día y 1k escrituras/día — sobra para arrancar.
   v1 = sistema de honor (sin verificación de que ganaste de verdad);
   cuando exista el share-code se puede exigir como comprobante.
══════════════════════════════════════════ */

/* CORS endurecido: solo el sitio (+ dev local). Requests sin Origin (curl)
   reciben el valor de producción — inofensivo. Al hacer el rename de marca,
   actualizar la lista. */
const ALLOWED_ORIGINS = [
  'https://misticafutbolera.wusman.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const corsFor = (req) => {
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
};

const jsonWith = (cors) => (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

export default {
  async fetch(req, env) {
    const cors = corsFor(req);
    const json = jsonWith(cors);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    const m = new URL(req.url).pathname.match(/^\/daily\/(\d{4}-\d{2}-\d{2})$/);
    if (!m) return json({ error: 'not_found' }, 404);
    const date = m[1];
    const key = `daily:${date}`;

    if (req.method === 'GET') {
      const list = JSON.parse((await env.CHAMPIONS.get(key)) || '[]');
      return json({ date, champions: list });
    }

    if (req.method === 'POST') {
      // Solo se puede inscribir el campeón del día EN ese día (UTC).
      const today = new Date().toISOString().slice(0, 10);
      if (date !== today) return json({ error: 'closed' }, 400);

      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

      // Nombre estilo arcade: 2–12 caracteres, letras/números/espacios básicos.
      const name = String(body.name ?? '')
        .trim()
        .slice(0, 12)
        .replace(/[^\p{L}\p{N} _.\-]/gu, '');
      if (name.length < 2) return json({ error: 'bad_name' }, 400);

      const list = JSON.parse((await env.CHAMPIONS.get(key)) || '[]');
      if (list.length >= 200) return json({ error: 'full' }, 429);

      // Stats para el orden de mérito (números saneados 0–999).
      const num = (v) => Math.max(0, Math.min(999, Number(v) || 0));

      // Identidad del campeón (Paso 3b) — OPCIONAL y saneada; las entradas
      // viejas sin estos campos siguen siendo válidas (el front las tolera).
      const HEX = /^#[0-9a-fA-F]{6}$/;
      const colors = Array.isArray(body.colors)
        ? body.colors.filter((c) => typeof c === 'string' && HEX.test(c)).slice(0, 3)
        : [];
      const pattern = typeof body.pattern === 'string' && /^[a-z]{3,12}$/.test(body.pattern)
        ? body.pattern : undefined;
      const team = String(body.team ?? '')
        .trim().slice(0, 24).replace(/[^\p{L}\p{N} _.\-]/gu, '');

      const entry = {
        name,
        at: Date.now(),
        w: num(body.w), d: num(body.d), l: num(body.l),
        gf: num(body.gf), ga: num(body.ga), avg: num(body.avg),
      };
      if (colors.length) entry.colors = colors;
      if (pattern) entry.pattern = pattern;
      if (team.length >= 2) entry.team = team;
      list.push(entry);
      // TTL 40 días: las listas viejas se limpian solas (KV gratis y prolijo).
      await env.CHAMPIONS.put(key, JSON.stringify(list), { expirationTtl: 60 * 60 * 24 * 40 });
      return json({ ok: true, count: list.length });
    }

    return json({ error: 'method_not_allowed' }, 405);
  },
};