/* ══════════════════════════════════════════
   sharecode.ts — codec del share-code (v1).

   Serializa un RunLog a un string corto y versionado (`v1.AbC…`) y lo vuelve
   a leer. No inventa una segunda reproducción: usa runWith de run.ts con un
   driver que ESCRIBE bits (encode) o los LEE (decode), reproduciendo el mismo
   contexto en ambos lados. Por eso el ancho de cada campo se conoce sin
   guardarlo (índices relativos al contexto del draft).

   FORMATO CONGELADO v1 — no reordenar estas listas ni cambiar el layout: los
   códigos ya emitidos tienen que seguir leyéndose. Cambios de fondo → v2.
══════════════════════════════════════════ */

import { type FormationName, FORMATIONS, type Player } from '../data/players';
import { type Attitude, type PenAim } from './engine';
import {
  type RunLog, type RunDriver, type DraftMove,
  RUN_VERSION, runWith, RunError,
} from './run';
import { ESCUDO_PALETTE, PATTERNS, type Pattern } from './escudo';

/* El prefijo VIAJA con la versión del motor: un bump de RUN_VERSION invalida
   limpio los códigos viejos (caen al mensaje "otra versión") en vez de dejar
   que reproduzcan una corrida que el autor nunca jugó. */
const PREFIX = `v${RUN_VERSION}.`;

/* Órdenes canónicos (índice = valor serializado). CONGELADOS en v1. */
const FORM_LIST = Object.keys(FORMATIONS) as FormationName[]; // el orden de FORMATIONS es parte del formato
const ATT_LIST: Attitude[] = ['def', 'eq', 'off'];
const AIM_LIST: PenAim[] = ['L', 'C', 'R'];
const ATT_IDX: Record<Attitude, number> = { def: 0, eq: 1, off: 2 };
const AIM_IDX: Record<PenAim, number> = { L: 0, C: 1, R: 2 };

const FORM_BITS = bitsFor(FORM_LIST.length); // 6 formaciones → 3 bits

/* Bits para representar n valores (0..n-1). 1 valor → 0 bits (forzado). */
function bitsFor(n: number): number {
  return n <= 1 ? 0 : Math.ceil(Math.log2(n));
}

/* ── Bit IO (big-endian) ── */
class BitWriter {
  private bits: number[] = [];
  write(value: number, n: number): void {
    for (let i = n - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
  bytes(): Uint8Array {
    const out = new Uint8Array(Math.ceil(this.bits.length / 8));
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) out[i >> 3] |= 1 << (7 - (i & 7));
    }
    return out;
  }
}

class BitReader {
  private pos = 0;
  private readonly data: Uint8Array;
  constructor(data: Uint8Array) { this.data = data; }
  read(n: number): number {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const bit = this.pos < this.data.length * 8
        ? (this.data[this.pos >> 3] >> (7 - (this.pos & 7))) & 1
        : 0;
      v = (v << 1) | bit;
      this.pos++;
    }
    return v >>> 0;
  }
}

/* ── base64url ── */
function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): Uint8Array {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ── Driver de ESCRITURA: lee las decisiones del log y las emite como bits ── */
function encodeDriver(log: RunLog, bw: BitWriter): RunDriver {
  const cur = { d: 0, a: 0, p: 0, s: 0 };
  return {
    draft(eligible, slotsFor, canPass) {
      const mv = log.draft[cur.d++];
      if (!mv) return undefined; // runWith → draft_corto
      if ('pass' in mv) {
        if (!canPass) throw new RunError('encode_pass_no_ofrecido');
        bw.write(1, 1);
        return mv;
      }
      if (canPass) bw.write(0, 1);
      const sorted = [...eligible].sort((a, b) => a.i - b.i);
      const pi = sorted.findIndex((p) => p.i === mv.pick.player);
      if (pi < 0) throw new RunError('encode_pick_no_elegible');
      bw.write(pi, bitsFor(sorted.length));
      const slots = slotsFor(sorted[pi]);
      if (slots.length > 1) {
        const si = slots.indexOf(mv.pick.slot);
        if (si < 0) throw new RunError('encode_slot_invalido');
        bw.write(si, bitsFor(slots.length));
      }
      return mv;
    },
    attitude() { const a = log.attitudes[cur.a++]; if (!a) return undefined; bw.write(ATT_IDX[a], 2); return a; },
    penAim() { const x = log.penAims[cur.p++]; if (!x) return undefined; bw.write(AIM_IDX[x], 2); return x; },
    shoot() { const x = log.shoot[cur.s++]; if (!x) return undefined; bw.write(AIM_IDX[x], 2); return x; },
  };
}

/* ── Driver de LECTURA: consume bits y reconstruye el log en `out` ── */
function decodeDriver(br: BitReader, out: RunLog): RunDriver {
  return {
    draft(eligible, slotsFor, canPass): DraftMove {
      if (canPass && br.read(1) === 1) {
        const mv: DraftMove = { pass: true };
        out.draft.push(mv);
        return mv;
      }
      const sorted = [...eligible].sort((a, b) => a.i - b.i);
      const pi = br.read(bitsFor(sorted.length));
      const player: Player | undefined = sorted[pi];
      if (!player) throw new RunError('decode_pick_oob');
      const slots = slotsFor(player);
      let slot = slots[0];
      if (slots.length > 1) {
        const si = br.read(bitsFor(slots.length));
        if (si >= slots.length) throw new RunError('decode_slot_oob');
        slot = slots[si];
      }
      const mv: DraftMove = { pick: { player: player.i, slot } };
      out.draft.push(mv);
      return mv;
    },
    attitude() { const a = ATT_LIST[br.read(2)]; if (!a) throw new RunError('decode_att_oob'); out.attitudes.push(a); return a; },
    penAim() { const x = AIM_LIST[br.read(2)]; if (!x) throw new RunError('decode_pen_oob'); out.penAims.push(x); return x; },
    shoot() { const x = AIM_LIST[br.read(2)]; if (!x) throw new RunError('decode_shoot_oob'); out.shoot.push(x); return x; },
  };
}

/* ── API pública ── */

/* Serializar un RunLog a un share-code. Lanza si el log no es reproducible
   (corrupto) o usa una formación desconocida. */
export function encodeRun(log: RunLog): string {
  if (log.v !== RUN_VERSION) throw new RunError('version_incompatible');
  const fi = FORM_LIST.indexOf(log.formation);
  if (fi < 0) throw new RunError('formacion_desconocida');

  const bw = new BitWriter();
  bw.write(log.seed >>> 0, 32);
  bw.write(fi, FORM_BITS);
  const r = runWith(log.seed, log.formation, encodeDriver(log, bw));
  if (!r.ok) throw new RunError('encode_' + r.error);
  return PREFIX + b64urlEncode(bw.bytes());
}

/* Leer un share-code. Devuelve el RunLog, o null si el prefijo no es v1, si el
   base64 está roto o si el stream no reproduce una corrida válida. */
export function decodeRun(code: string): RunLog | null {
  if (!code.startsWith(PREFIX)) return null;
  let bytes: Uint8Array;
  // El run es el 1er segmento; un `.escudo` opcional viene después y se ignora acá.
  try { bytes = b64urlDecode(code.slice(PREFIX.length).split('.')[0]); } catch { return null; }

  const br = new BitReader(bytes);
  const seed = br.read(32) >>> 0;
  const formation = FORM_LIST[br.read(FORM_BITS)];
  if (!formation) return null;

  const out: RunLog = { v: RUN_VERSION, seed, formation, draft: [], attitudes: [], penAims: [], shoot: [] };
  try {
    const r = runWith(seed, formation, decodeDriver(br, out));
    if (!r.ok) return null;
  } catch {
    return null;
  }
  return out;
}
/* ── Identidad del jugador como segmento aparte: `v2.{run}.{identidad}` ──
   Es IDENTIDAD, no run: no participa de la reproducción. Layout v2 (fresco —
   el bump de prefijo ya invalidó los segmentos del formato viejo):

     count (2 bits, 0–3) | color (4 bits) × count | pattern (4 bits)
     | nameLen (6 bits, BYTES UTF-8, 0–63) | name (8 bits × nameLen)

   ORDEN DE `PATTERNS` CONGELADO desde acá: el índice de 4 bits es parte del
   formato. Agregar patrones nuevos = SOLO al final de la lista. */

export interface EscudoTag {
  colors: string[];      // [] → la UI cae al escudo de marca
  pattern?: Pattern;     // ausente/corrupto → Emblem deriva su default
  name: string;          // '' → la UI cae a "Tu once"
}

/* Devuelve '' si no hay nada que declarar (sin colores, patrón default
   irrelevante y sin nombre): el código queda corto, como antes. */
export function encodeEscudo(tag: EscudoTag): string {
  const idx = tag.colors.slice(0, 3).map((c) => ESCUDO_PALETTE.indexOf(c)).filter((i) => i >= 0);
  const pi = tag.pattern ? PATTERNS.indexOf(tag.pattern) : -1;

  /* Nombre → UTF-8, tope 63 bytes SIN partir un carácter multibyte. */
  const enc = new TextEncoder();
  let name = tag.name.trim().slice(0, 24);
  let nameBytes = enc.encode(name);
  while (nameBytes.length > 63) {
    name = name.slice(0, -1);
    nameBytes = enc.encode(name);
  }

  if (!idx.length && pi <= 0 && !nameBytes.length) return '';

  const bw = new BitWriter();
  bw.write(idx.length, 2);                    // 0–3 colores
  for (const i of idx) bw.write(i, 4);        // índice de paleta 0–13
  bw.write(pi >= 0 ? pi : 0, 4);              // índice de patrón 0–9
  bw.write(nameBytes.length, 6);              // largo del nombre en bytes
  for (const b of nameBytes) bw.write(b, 8);
  return b64urlEncode(bw.bytes());
}

export function decodeEscudo(code: string): EscudoTag | null {
  if (!code.startsWith(PREFIX)) return null;
  const seg = code.slice(PREFIX.length).split('.')[1];
  if (!seg) return null;
  let bytes: Uint8Array;
  try { bytes = b64urlDecode(seg); } catch { return null; }

  const br = new BitReader(bytes);
  const count = Math.min(br.read(2), 3);
  const colors: string[] = [];
  for (let k = 0; k < count; k++) {
    const i = br.read(4);
    if (i < ESCUDO_PALETTE.length) colors.push(ESCUDO_PALETTE[i]);
  }
  const pIdx = br.read(4);
  const pattern: Pattern | undefined = pIdx < PATTERNS.length ? PATTERNS[pIdx] : undefined;

  const nameLen = Math.min(br.read(6), 63);
  const nameBytes = new Uint8Array(nameLen);
  for (let k = 0; k < nameLen; k++) nameBytes[k] = br.read(8);
  let name = '';
  try { name = new TextDecoder().decode(nameBytes).trim().slice(0, 24); } catch { /* corrupto → sin nombre */ }

  if (!colors.length && !name && pattern === undefined) return null;
  return { colors, pattern, name };
}