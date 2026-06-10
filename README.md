# Mística Futbolera

**Drafteá leyendas. Convertite en el rey de Europa.**

Juego web gratuito y 100% client-side: la semilla sortea campeones de Europa de
distintas épocas, de cada uno elegís un crack hasta completar tu once, y salís a
ganar el torneo — fase de grupos, eliminatorias y la gran final, con relato
minuto a minuto, decisión táctica en el entretiempo y tandas de penales donde el
palo lo elegís vos.

🎮 **Jugá ahora:** [misticafutbolera.wusman.com](https://misticafutbolera.wusman.com)

## La gracia: las semillas

Cada torneo nace de una **semilla**. Misma semilla + mismas decisiones = mismo
torneo, gol por gol. Eso convierte cada corrida en un desafío:

- Copiá tu semilla desde el inicio o desde la carta final y pasásela a un amigo:
  juega tus mismas cartas.
- Cualquier palabra sirve como semilla: probá `messi`.
- ¿Perdiste la final? **Revancha**: misma semilla, a ver si esta vez decidís mejor.

## Cómo se juega

1. **Drafteá** — el tambor sortea un campeón histórico; elegí un jugador que te
   sirva (tenés 3 descartes) hasta llenar el once de tu formación.
2. **Competí** — grupo (2 fechas, necesitás 3 puntos), octavos, cuartos, semifinal
   y final. En el entretiempo decidís: ¿defensivo, equilibrado u ofensivo?
3. **Desafiá** — compartí la semilla. Mismo torneo, mismas cartas, otro DT.

## Stack

- [Vite](https://vitejs.dev) + [React](https://react.dev) + TypeScript
- [Framer Motion](https://www.framer.com/motion/) para las animaciones
- Núcleo de juego **puro y determinista** (sin servidor: todo corre en tu navegador)
- Español rioplatense + inglés; `prefers-reduced-motion` respetado

## Desarrollo

```bash
npm install
npm run dev      # entorno local
npm run build    # build de producción
```

El deploy es automático al pushear a `main`.

## Privacidad

Sin cuentas, sin datos personales, sin cookies de seguimiento. Detalle completo
en [/privacidad.html](https://misticafutbolera.wusman.com/privacidad.html).