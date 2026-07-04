# IDENTIDAD — sistema visual de Mística Futbolera

Cuarto documento canónico (junto a CONTEXTO, README, INSTRUCCIONES). Define la
identidad visual elegida y las reglas para construirla. Cuando cambie, se
reescribe limpio, no se parcha.

---

## 1. La ley de fusión: "A en reposo, C en acción"

La identidad es la fusión de dos direcciones aprobadas sobre mockups:

- **A — Noche Europea** es el MUNDO: la solemnidad del himno. Martes 20:45,
  estadio lleno, silencio antes del pitazo. Gobierna fondos, superficies,
  tipografía en reposo, navegación, home.
- **C — Matchday Arcade** es la ENERGÍA: el lenguaje de videojuego aparece
  solo cuando algo PASA. Gobierna momentos: gol, resultado, avance de ronda,
  CTAs de acción, hovers.

**Regla de decisión:** si el elemento está quieto esperando al jugador → habla
A (calma, plata, líneas finas). Si el elemento celebra, urge o golpea → habla
C (cursiva/skew, eléctrico, barrido de luz). Nunca los dos idiomas en el mismo
elemento en reposo. Esta regla evita que la fusión degenere en collage.

## 2. Tokens

Todos los colores viven como CSS custom properties bajo `[data-theme='night']`
en `:root`. Ningún color hardcodeado en reglas.

**Paleta (tema `night`):**
- `--night-0: #030714` / `--night-1: #0a1128` — cielo del estadio (gradiente base)
- `--surface: #0c142e` — superficies planas
- `--silver: #b9c2d8` — texto secundario, metadata, reglas
- `--white: #f4f6fb` — texto principal
- `--gold: #d9b24a` — SOLO filete: bordes superiores, subrayados, ratings,
  estrellas. **Nunca plancha de fondo** (lección del CTA amarillo).
- `--elec: #2e6bff` / `--violet: #5b3df5` — la energía C: gradientes de acción,
  sombra tipográfica de estampas, chyrons de momento.
- `--line: rgba(185,194,216,0.16)` / `--line-soft` — bordes finos.
- `--seed-hue` se conserva: tiñe la energía C por semilla (el gradiente
  eléctrico puede derivar de ella), no el mundo A.

**Tipografía (se mantiene el sistema Archivo):**
- `Archivo Black` (`--font-brand`): marca, wordmark, estampas de resultado.
  En contexto C se usa *en cursiva/skew(-8deg)*; en contexto A, recta.
- `Archivo Narrow` (`--font-display`): marcadores, etiquetas, chyrons,
  metadata en mayúsculas con tracking.
- Sistema (`--font-body`): párrafos.
- Numerales tabulares en todo marcador/reloj.

**Superficies:**
- Planas, sin `backdrop-filter` (el vidrio muere con la foto).
- Borde `1px var(--line)`; protagonistas con filete dorado superior de 2px.
- Esquinas: rectas o con UN corte diagonal (16-22px) — lenguaje de
  entrada/camiseta. Nada de radios grandes.
- Jerarquía por contraste de fondo y filete, no por sombras apiladas.

## 3. El fondo

La foto de estadio borrosa **se elimina** (aunque por desicion puede volver ya que le de identidad de "champions league").
El fondo es diseñado y propio:
1. Gradiente vertical `--night-0 → --night-1`.
2. **Geometría de cancha gigante** (círculo central, media cancha, área) en
   trazo `rgba(silver, 0.06)`, descentrada y recortada, que **se dibuja sola**
   al cargar (`stroke-dashoffset`, una vez, ~2.5s, reduced-motion = ya dibujada).
3. Un haz de luz radial frío desde arriba.
4. **Grano de transmisión** (SVG feTurbulence en data-URI, capa estática).
En momentos C puede sumarse una barra diagonal eléctrica estática de muy baja
opacidad. Todo estático o one-shot: cero loops de fondo.

## 4. El diario

**Placa de fixture** (de A): bloque oscuro con filete dorado superior, celda
de fecha (VIE / 03 JUL vía `Intl`, sin claves nuevas) separada por regla fina,
título en Black, metadata en Narrow tracking. Al hover, la energía C: barrido
de luz y borde que enciende. El boleto de papel queda descartado para el CTA
(sobrevive como concepto para la futura skin retro).

## 5. Movimiento

- **Momentos, no loops.** La vida es reacción: gol (flash + punch — ya
  construido), pick, avance de ronda, cambio de pantalla. Prohibidos los
  glows/pulsos infinitos.
- **Solo `transform` y `opacity` en cualquier animación repetida.** `filter`,
  `box-shadow` y fondos solo en one-shots cortos.
- Deslizamiento entre pantallas ya existe (AnimatePresence); el corte visual
  fuerte se rediseña dentro del lenguaje C cuando toque, no antes.
- `prefers-reduced-motion`: todo quieto, estados finales visibles.

## 6. Temas (preparación, no construcción)

- No se construye modo claro. La marca ES la noche.
- La tokenización bajo `[data-theme]` deja listo el terreno: un tema futuro =
  una hoja de tokens.
- Idea en el freezer: **"Programa Retro" (dirección B) como tema desbloqueable**
  (ej. al ganar un título). Tema como premio, no como setting. Se evalúa con
  la lente de siempre cuando llegue su turno.

## 7. Rename (preparación, no ejecución)

El nombre cambiará en algún momento (muy rioplatense para público
europeo/global). Reglas para que sea barato:

- **Una sola fuente:** `config.ts` (`BRAND`, `SITE_URL`, `DAILY_WORKER_URL`).
  Fugas actuales a corregir en etapa 0: `App.tsx` (masthead y footer
  hardcodean el nombre), `index.html` (`<title>`), `privacidad.html` (×5).
- **Las claves de storage NUNCA siguen a la marca.** `mf:locale` y `mf:streak`
  quedan como identificadores opacos para siempre; renombrarlas borra racha e
  idioma de los usuarios.
- Checklist del día del rename: dominio nuevo + redirect 301 del viejo (los
  share-links `?r=` viejos deben seguir vivos), worker URL, título/meta,
  privacidad, README, redes.
- Criterios para el nombre nuevo: pronunciable en es/en/pt/fr, corto,
  dominio disponible, y **sin términos con marca en fútbol** (evitar
  "Champions", "UEFA", "Euro").

## 8. Plan de construcción (una etapa = una entrega = un commit)

0. **Cimientos:** tokenización completa bajo `[data-theme='night']` + tapar
   fugas del brand (`App.tsx`, `index.html`). Sin cambio visual.
1. **El fondo:** foto afuera, geometría + grano + haz adentro.
2. **El hero:** placa de fixture, composición editorial, minutos 01'/45'/90'.
3. **Superficies del juego:** pizarra, ticker, cartas y modales al nuevo
   sistema; estampas de resultado en lenguaje C.
4. **Copy pass i18n:** tono sin ":", 4 idiomas.
5. **Micro-momentos:** ceremonia del pick y lo que surja de probar.

Cada etapa se valida (tsc 0, ESLint 0, build) y se prueba en ~380px antes de
pasar a la siguiente.
