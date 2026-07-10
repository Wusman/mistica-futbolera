/* ══════════════════════════════════════════
   Worker: campeones del día — Módulo 7 (verify).

   GET  /daily/YYYY-MM-DD → { date, champions: [...] }
   POST /daily/YYYY-MM-DD → inscribe SOLO si el share-code prueba la corrida:
     body { name, code, colors?, pattern?, team? }
     1. decodeRun(code)                → 400 code_invalid
     2. seed === dailyRunSeed(fecha)   → 400 wrong_seed  (otro día / modo libre)
     3. playRun(log).champion === true → 400 not_champion
     4. stats del REPLAY (server-authoritative; las del cliente se ignoran)
     5. un mismo code inscribe UNA vez → 400 duplicate

   El core puro (run/engine/players/sharecode) se BUNDLEA acá: wrangler usa
   esbuild y sigue los imports relativos a ../../src. Determinismo puro JS →
   el replay da idéntico en workerd que en el browser.

   ⚠ Al bumpear RUN_VERSION hay que REDEPLOYAR este worker (mismo motor y
   mismo prefijo que el sitio, o los códigos nuevos no validan).
   Deploy MANUAL: npm install && npx wrangler deploy
══════════════════════════════════════════ */
import { decodeRun } from '../../src/lib/sharecode';
import { playRun } from '../../src/lib/run';
import { dailyRunSeed, hashSeed } from '../../src/lib/engine';

interface Env { CHAMPIONS: KVNamespace; }

const TTL_DAYS = 40;
const MAX_ENTRIES = 200;

/* CORS endurecido: solo el sitio (+ dev local). Requests sin Origin (curl)
   reciben el valor de producción — inofensivo. Al hacer el rename de marca,
   actualizar la lista. */
const ALLOWED_ORIGINS = [
  'https://misticafutbolera.wusman.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const corsFor = (req: Request): Record<string, string> => {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsFor(req);
    const json = (obj: unknown, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    const m = new URL(req.url).pathname.match(/^\/daily\/(\d{4}-\d{2}-\d{2})$/);
    if (!m) return json({ error: 'not_found' }, 404);
    const date = m[1];
    const key = `daily:${date}`;

    if (req.method === 'GET') {
      const raw = await env.CHAMPIONS.get(key);
      const list: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      // codeHash es interno (anti-duplicados): no viaja al cliente.
      const champions = list.map(({ codeHash: _ch, ...rest }) => rest);
      return json({ date, champions });
    }

    if (req.method === 'POST') {
      // El alta solo abre para la fecha de HOY (UTC), como siempre.
      const today = new Date().toISOString().slice(0, 10);
      if (date !== today) return json({ error: 'closed' }, 400);

      let body: Record<string, unknown>;
      try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

      const name = String(body.name ?? '').trim().slice(0, 12).replace(/[^\p{L}\p{N} _.\-]/gu, '');
      if (name.length < 2) return json({ error: 'bad_name' }, 400);

      /* ── Módulo 7: el share-code es el comprobante ── */
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      const log = code ? decodeRun(code) : null;
      if (!log) return json({ error: 'code_invalid' }, 400);

      const expected = dailyRunSeed(new Date(`${date}T12:00:00Z`));
      if (log.seed !== expected) return json({ error: 'wrong_seed' }, 400);

      const replay = playRun(log);
      if (!replay.ok || !replay.champion) return json({ error: 'not_champion' }, 400);

      const raw = await env.CHAMPIONS.get(key);
      const list: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      if (list.length >= MAX_ENTRIES) return json({ error: 'full' }, 400);

      // Una corrida = una inscripción (mismo code no entra dos veces).
      const codeHash = hashSeed(code);
      if (list.some((e) => e.codeHash === codeHash)) return json({ error: 'duplicate' }, 400);

      // Identidad del campeón (Paso 3b) — OPCIONAL y saneada.
      const HEX = /^#[0-9a-fA-F]{6}$/;
      const colors = Array.isArray(body.colors)
        ? (body.colors as unknown[]).filter((c): c is string => typeof c === 'string' && HEX.test(c)).slice(0, 3)
        : [];
      const pattern = typeof body.pattern === 'string' && /^[a-z]{3,12}$/.test(body.pattern)
        ? body.pattern : undefined;
      const team = String(body.team ?? '').trim().slice(0, 24).replace(/[^\p{L}\p{N} _.\-]/gu, '');

      /* Stats del REPLAY, no del cliente: el salón queda a prueba de POST
         manuales. avg = media real del once reproducido. */
      const s = replay.stats;
      const entry: Record<string, unknown> = {
        name, at: Date.now(), codeHash,
        w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga, avg: replay.xiAvg,
      };
      if (colors.length) entry.colors = colors;
      if (pattern) entry.pattern = pattern;
      if (team.length >= 2) entry.team = team;
      list.push(entry);

      await env.CHAMPIONS.put(key, JSON.stringify(list), { expirationTtl: TTL_DAYS * 86400 });
      return json({ ok: true });
    }

    return json({ error: 'method' }, 405);
  },
};