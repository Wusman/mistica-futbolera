/* ══════════════════════════════════════════
   Mística Futbolera — Worker: campeones del día (estilo arcade)
   GET  /daily/YYYY-MM-DD  → { date, champions: [{ name, at }] }
   POST /daily/YYYY-MM-DD  → agrega { name } (solo si la fecha es HOY en UTC)

   Storage: Cloudflare Workers KV (binding CHAMPIONS). Gratis en el plan
   free: 100k lecturas/día y 1k escrituras/día — sobra para arrancar.
   v1 = sistema de honor (sin verificación de que ganaste de verdad);
   cuando exista el share-code se puede exigir como comprobante.
══════════════════════════════════════════ */

const CORS = {
  // Endurecer luego: cambiar '*' por 'https://misticafutbolera.wusman.com'
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

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
      list.push({
        name,
        at: Date.now(),
        w: num(body.w), d: num(body.d), l: num(body.l),
        gf: num(body.gf), ga: num(body.ga), avg: num(body.avg),
      });
      // TTL 40 días: las listas viejas se limpian solas (KV gratis y prolijo).
      await env.CHAMPIONS.put(key, JSON.stringify(list), { expirationTtl: 60 * 60 * 24 * 40 });
      return json({ ok: true, count: list.length });
    }

    return json({ error: 'method_not_allowed' }, 405);
  },
};