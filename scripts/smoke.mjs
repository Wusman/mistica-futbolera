/* ══════════════════════════════════════════
   smoke.mjs — prueba de humo del bundle REAL.
   `npm run smoke` (buildea y ejecuta dist/ en jsdom, exige que #root monte
   con contenido). Existe porque tsc + build NO detectan crashes de runtime
   (ej.: ciclos de import que dejan un módulo a medio inicializar).
   Correr SIEMPRE antes de entregar/pushear, junto a tsc y lint.
══════════════════════════════════════════ */
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';
import { pathToFileURL } from 'url';

const html = readFileSync('dist/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://misticafutbolera.wusman.com/', pretendToBeVisual: true });
const { window } = dom;

/* Shims que jsdom no trae, primero SOBRE window */
window.matchMedia ??= () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
window.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
window.requestAnimationFrame ??= (cb) => setTimeout(() => cb(Date.now()), 16);
window.cancelAnimationFrame ??= clearTimeout;
window.scrollTo = () => {};
window.fetch = async () => { throw new Error('sin red en el smoke'); };

/* Delegar los globals del bundle a window vía getters */
for (const k of ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location',
  'history', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'getComputedStyle', 'CustomEvent',
  'MutationObserver', 'matchMedia', 'ResizeObserver', 'IntersectionObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'fetch']) {
  try { Object.defineProperty(globalThis, k, { get: () => (k === 'window' ? window : window[k]), configurable: true }); } catch {}
}

const bundle = readdirSync('dist/assets').find((f) => f.endsWith('.js'));
let crashed = null;
window.addEventListener('error', (e) => { crashed ??= e.error ?? e.message; });
try {
  await import(pathToFileURL(`dist/assets/${bundle}`).href);
} catch (e) { crashed = e; }
await new Promise((r) => setTimeout(r, 500));

const root = window.document.getElementById('root');
const kids = root ? root.children.length : -1;
const text = (root?.textContent ?? '').trim();
if (crashed) { console.error('CRASH AL CARGAR:', crashed?.stack?.split('\n').slice(0, 4).join('\n') ?? crashed); process.exit(1); }
if (kids < 1 || !text) { console.error(`PANTALLA VACÍA: #root con ${kids} hijos, texto=\"${text.slice(0, 60)}\"`); process.exit(1); }
console.log(`SMOKE OK — #root montado (${kids} hijos), texto: "${text.slice(0, 70)}..."`);
