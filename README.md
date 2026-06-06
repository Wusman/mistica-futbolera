# Mística Futbolera

Micro-juego viral de fútbol, 100% client-side, sobre la mística de la Copa
Libertadores. Drafteás un once mítico cruzando glorias de distintas finales y
buscás el 7–0. Inspirado en [7a0.com.br](https://7a0.com.br), con tema, capa de
estrategia e identidad propios.

**Live:** https://misticafutbolera.wusman.com

## Cómo se juega

1. **Setup** — elegís formación (define los 11 cupos) y ves la semilla de la partida.
2. **Draft** — la semilla sortea campeones de a uno; en cada sorteo elegís **un**
   jugador de ese campeón hacia un cupo abierto. Un campeón puede volver a salir
   (nunca dos veces seguidas).
3. **Simular** — con los 11 listos, un click resuelve el partido (ataque vs defensa).
4. **Resultado** — marcador + goleadores, ponderados por rol y rating.

Todo es **determinista por semilla**: misma semilla → misma partida. Es la base de
la rejugabilidad y de poder compartir/desafiar con un código.

## Modos (objetivo)

- **Diario** — misma semilla para todo el mundo cada día; una jugada por día (soft).
  Es el momento social: comparás tu resultado con el de todos.
- **Libre** — semillas infinitas, para enganchar y cazar el 7–0 que se comparte.

## Qué lo hace distinto

No es solo azar: sobre el draft hay una **capa fina de estrategia** — encaje de
posición (jugar fuera de puesto penaliza), descartes limitados, un cambio de
entretiempo y decisiones de partido — manteniendo sesiones de ~1 minuto.

## Stack

- **Vite + React + TypeScript** (bundle chico, objetivo <1 MB).
- **Cloudflare** (Workers con static assets), auto-deploy en cada push a `main`.
- Engine de simulación en funciones puras, desacoplado de React.

## Arquitectura

Patrón *funcional core / imperative shell*:

- **Núcleo puro** (`src/lib/engine.ts`, `src/data/players.ts`): determinista, sin
  React ni DOM. Un seed reconstruye una partida.
- **Cáscara** (componentes React): estado, eventos y la única aleatoriedad (el seed).
- El loop es una **máquina de estados** en un `useReducer`; el reducer solo guarda
  `seed + step + picks` y todo lo demás se deriva.

```
src/
  data/players.ts          # clubes campeones + formaciones (fuente de datos)
  lib/engine.ts            # PRNG, draft, simulación y goleadores (puro)
  App.tsx                  # máquina de estados del loop
  components/
    SetupStep.tsx          # formación + semilla
    BuildStep.tsx          # el draft
    ResultCard.tsx         # marcador + goleadores
  index.css                # identidad editorial
```

## Desarrollo

```bash
npm install
npm run dev        # entorno local
npm run build      # build de producción
npm run preview    # previsualizar el build
```

## Datos e IP

Solo nombres, ratings y hechos históricos. **Nunca** escudos, camisetas ni marcas
de CONMEBOL / Libertadores. Identidad visual 100% original. El dataset se cura por
calidad (grandes históricos + hinchada) y se edita en un único lugar
(`src/data/players.ts`).

## Roadmap

- [x] **Fase 0** — slice draft jugable: setup → draft → simular → resultado.
- [ ] **Fase 1** — dataset curado + balance; descartes limitados (passes).
- [ ] **Fase 2** — posiciones finas + penalización fuera de puesto; banco + cambio
  de entretiempo (dos tiempos); decisiones de partido.
- [ ] **Fase 3** — share-code + card compartible; modos Diario y Libre; pizarra
  estilo cancha; trilingüe ES/PT/EN; toggle claro/oscuro.
- [ ] **Fase 4** — card OG en edge; tabla con iniciales estilo arcade (Worker + KV,
  con verificación por re-simulación); reto por seed.
- [ ] **Fase 5** — pulido viral, Ko-fi/AdSense, modos extra (campaña, "de memoria").

## Licencia

Código bajo la licencia del repositorio. Los nombres de clubes y jugadores
pertenecen a sus respectivos titulares y se usan de forma nominativa.