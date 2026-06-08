# Mística Futbolera

Juego viral de fútbol, 100% client-side. Drafteás un once mítico cruzando glorias de
**campeones de la Champions League** y disputás un torneo contra otros campeones.
Sesión corta, **determinista por semilla** (misma semilla + mismas decisiones → mismo
torneo) para compartir y desafiar.

Inspirado en [7a0.com.br](http://7a0.com.br). Online: `misticafutbolera.wusman.com`.

## Cómo se juega
1. **Setup** — elegí formación y mirá la semilla.
2. **Draft** — la semilla sortea campeones de a uno; de cada uno elegís un jugador para un puesto libre. Tenés 3 descartes.
3. **Torneo** — tu once juega Grupo → Octavos → Cuartos → Semi → Final. En cada partido decidís la actitud en el entretiempo (Defensivo / Equilibrado / Ofensivo). Empate en eliminatorias → penales.
4. **Fin** — campeón o eliminado, con las estadísticas de tu campaña.

## Stack
- **Vite + React + TypeScript** (mobile-first).
- **Cloudflare** (Workers static assets, deploy automático al pushear a `main`).
- Arquitectura **funcional core / imperative shell**: motor puro y determinista; React solo guarda estado y dispara eventos.

## Estructura
```
src/
  data/players.ts        # campeones + posiciones + colores + formaciones
  labels.ts              # etiquetas de posición (UI en español)
  lib/engine.ts          # PRNG, draft, partido, penales, scouting
  lib/tournament.ts      # tipos y constantes del torneo
  App.tsx                # máquina de estados
  components/            # SetupStep, BuildStep, MatchStep, TournamentStep
  index.css              # tema oscuro + fondo por semilla
```

## Desarrollo
```bash
npm install
npm run dev      # local
npm run build    # producción
```

## Identidad e IP
Identidad visual **100% propia**. Solo se usan nombres, ratings y hechos históricos:
**nunca** escudos, camisetas ni marcas de UEFA/Champions o clubes. Los equipos se
distinguen por 1-3 colores propios, no por escudos.

> Documentación interna: ver `CONTEXTO_mistica_futbolera.md` (fuente de verdad) e
> `INSTRUCCIONES_mistica_futbolera.md` (reglas de trabajo).