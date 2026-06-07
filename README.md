# Mística Futbolera

Micro-juego viral de fútbol, 100% client-side, sobre la mística de la Copa
Libertadores. Drafteás un once mítico cruzando glorias de distintas finales y
buscás el 7–0. Inspirado en [7a0.com.br](https://7a0.com.br), con tema, capa de
estrategia e identidad propios.

**Live:** https://misticafutbolera.wusman.com

## Cómo se juega

1. **Setup** — elegís formación y ves la semilla de la partida.
2. **Draft** — la semilla sortea campeones de a uno; de cada uno elegís **un**
   jugador hacia un casillero abierto de la cancha. Cada jugador está catalogado
   para una o dos posiciones; si entra en dos casilleros libres, elegís cuál.
   Si nadie te sirve, sorteás otro campeón.
3. **Simular** — con los 11 listos, un click resuelve el partido (ataque vs defensa).
4. **Resultado** — marcador + goleadores, ponderados por rol y rating.

Todo es **determinista por semilla**: misma semilla → misma partida. Base de la
rejugabilidad y de poder compartir/desafiar con un código.

## Qué lo hace distinto

No es solo azar: sobre el draft hay una **capa fina de estrategia** — encaje de
posición (cada jugador vale para 1–2 puestos), y en el roadmap descartes
limitados, un cambio de entretiempo y decisiones de partido — en sesiones de ~1 minuto.

## Modos (objetivo)

- **Diario** — misma semilla para todos cada día; una jugada por día (soft). El momento social.
- **Libre** — semillas infinitas, para enganchar y cazar el 7–0 que se comparte.

## Stack

- **Vite + React + TypeScript** (bundle chico).
- **Cloudflare** (Workers con static assets), auto-deploy en cada push a `main`.
- Engine de simulación en funciones puras, desacoplado de React.

## Arquitectura

Patrón *funcional core / imperative shell*. El núcleo (`engine.ts`, `players.ts`)
es puro y determinista; la cáscara React guarda estado y dispara eventos. El loop
es una máquina de estados (`useReducer`); el reducer guarda `seed + step + lineup`
y todo lo demás se deriva.

```
src/
  data/players.ts          # 12 planteles + posiciones finas + formaciones (con coordenadas)
  lib/engine.ts            # PRNG, draft, lineup, simulación y goleadores (puro)
  App.tsx                  # máquina de estados del loop
  components/
    SetupStep.tsx          # formación + semilla
    BuildStep.tsx          # el draft (equipo izquierda + tablero derecha)
    ResultCard.tsx         # marcador + goleadores
  index.css                # identidad editorial + cancha
```

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Datos e IP

Solo nombres, ratings y hechos históricos. **Nunca** escudos, camisetas ni marcas
de CONMEBOL / Libertadores. Identidad visual 100% original. El dataset se cura por
calidad y se edita en `src/data/players.ts`.

## Roadmap

- [x] **Fase 0** — slice draft jugable.
- [x] **Fase 1** — dataset curado (12 ediciones).
- [~] **Fase 2** — posiciones finas + doble puesto + tablero (hecho); descartes
  limitados, banco + cambio de entretiempo, decisiones de partido (pendiente).
- [ ] **Fase 3** — share-code + card; modos Diario y Libre; idiomas; tema claro/oscuro; animaciones.
- [ ] **Fase 4** — OG en edge; tabla con iniciales (Worker + KV, verificada); reto por seed.
- [ ] **Fase 5** — Ko-fi/AdSense; modos extra (campaña, "de memoria").

## Licencia

Código bajo la licencia del repositorio. Nombres de clubes y jugadores pertenecen
a sus titulares y se usan de forma nominativa.