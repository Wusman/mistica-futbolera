# Mística Futbolera

Micro-juego viral de fútbol, 100% client-side. Drafteás un once mítico cruzando
glorias de distintos **campeones de la Champions League** y simulás el partido,
con una decisión de entretiempo que puede cambiarlo todo. Buscá el 7–0.

Inspirado en [7a0.com.br](https://7a0.com.br), con capa de estrategia e identidad propias.

**Live:** https://misticafutbolera.wusman.com

## Cómo se juega

1. **Setup** — elegís formación (6 disponibles) y ves la semilla; al lado, la cancha de preview.
2. **Draft** — la semilla sortea campeones de a uno; de cada uno elegís **un** jugador hacia un
   casillero abierto. Cada jugador vale para 1–2 posiciones; si entra en dos libres, elegís cuál.
   Tenés **3 descartes** voluntarios; si no te sirve nadie, sorteás otro gratis.
3. **Simular** — el partido se juega en **dos tiempos**.
4. **Entretiempo** — ves el parcial y el **scouting del rival**, y elegís la actitud del 2º tiempo:
   *Defensivo / Equilibrado / Ofensivo*. El 50/50 del juego.
5. **Resultado** — marcador, goleadores y veredicto.

Todo es **determinista por semilla** (misma semilla + mismas decisiones → mismo partido).
Base de la rejugabilidad y de poder compartir/desafiar.

## Por qué Champions (v1)

El motor es independiente del tema. Empezamos con campeones de la Champions porque sus
cracks los conoce todo el mundo — y en un juego viral, reconocer a los jugadores es la mitad
de la gracia. La versión **Libertadores** llega más adelante como variante.

## Stack

- **Vite + React + TypeScript** — bundle chico, mobile-first.
- **Cloudflare** (Workers con static assets), auto-deploy en cada push a `main`.
- Engine de simulación en funciones puras, desacoplado de React.

## Arquitectura

Patrón *funcional core / imperative shell*. El núcleo (`engine.ts`, `players.ts`) es puro y
determinista; React guarda estado y dispara eventos. El loop es una máquina de estados
(`setup | drafting | halftime | result`); el reducer guarda `seed + formación + (paso, once, descartes)`.

```
src/
  data/players.ts          # campeones de Champions + posiciones finas + colores + formaciones
  labels.ts                # etiquetas de posición en español (solo UI)
  lib/engine.ts            # PRNG, draft, lineup, scouting del rival, simulación por tiempos
  App.tsx                  # máquina de estados del loop
  components/
    SetupStep.tsx          # formación + semilla + preview
    BuildStep.tsx          # draft en 3 columnas
    MatchStep.tsx          # entretiempo (decisión de actitud)
    ResultCard.tsx         # marcador + goleadores + veredicto
  index.css                # identidad editorial + cancha
```

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

## Datos e IP

Solo nombres, ratings y hechos históricos. **Nunca** escudos, camisetas ni marcas de
UEFA / Champions / clubes. La identidad (incluidos los 1–3 colores por equipo) es 100% propia.
El dataset se cura por calidad y se edita en `src/data/players.ts`.

## Roadmap

- [x] Draft jugable + once en la cancha.
- [x] Dataset v1 (8 campeones de Champions, creciendo hacia ~22).
- [x] Posiciones finas + doble puesto + 6 formaciones + 3 columnas.
- [x] 3 descartes; partido en dos tiempos + decisión de entretiempo + scouting del rival.
- [ ] **Estructura de torneo**: fase de grupos → llaves → final (simular el torneo completo).
- [ ] Banco + un cambio; más decisiones de partido.
- [ ] Share-code + card; Modo Diario y Libre; tema claro/oscuro.
- [ ] OG en edge; tabla arcade verificada; reto por seed.
- [ ] Variante **Libertadores**.

## Licencia

Código bajo la licencia del repositorio. Nombres de clubes y jugadores pertenecen a sus
titulares y se usan de forma nominativa.