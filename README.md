# Mística Futbolera

**Draftea leyendas. Conviértete en el rey de Europa.**

Juego web gratuito: la semilla sortea glorias de Europa — campeones y
finalistas míticos (1993–2025) —, de cada equipo eliges un crack hasta
completar tu once, y sales a ganar el torneo: fase de grupos, eliminatorias y
la gran final, con relato minuto a minuto, decisión táctica en el entretiempo
y tandas de penaltis donde pateas **y** eliges la estirada de tu portero.

🎮 **Juega ahora:** [misticafutbolera.wusman.com](https://misticafutbolera.wusman.com)

## La gracia: las semillas

Cada torneo nace de una **semilla**. Misma semilla + mismas decisiones = mismo
torneo, gol por gol. Eso convierte cada corrida en un desafío:

- Copia tu semilla desde el inicio o desde la carta final y pásasela a un
  amigo: juega tus mismas cartas.
- Cualquier palabra sirve como semilla: prueba `messi`.
- ¿Perdiste la final? **Revancha**: misma semilla, a ver si esta vez decides mejor.

## Torneo del día 🗓

Una semilla global por día, **un solo intento**. Si sales campeón, dejas tu
nombre estilo arcade en la **tabla de campeones del día**, ordenada por mérito
(menos derrotas, mejor diferencia y, en el desempate final, el once de menor
media). La tabla vive en un Worker de Cloudflare (KV); todo lo demás corre en
tu navegador.

## Cómo se juega

1. **Draftea** — el tambor sortea un equipo histórico; elige un jugador que te
   sirva (tienes 3 descartes) hasta llenar el once de tu formación.
2. **Compite** — grupo (2 fechas, necesitas 3 puntos), octavos, cuartos,
   semifinal y final. En el entretiempo decides: ¿defensivo, equilibrado u
   ofensivo? Si la eliminatoria acaba empatada: penaltis, palo a palo.
3. **Desafía** — comparte la semilla (torneo libre) o reta a tus amigos al
   torneo del día.

## Stack

- [Vite](https://vitejs.dev) + [React](https://react.dev) + TypeScript
- [Framer Motion](https://www.framer.com/motion/) para las animaciones
- Núcleo de juego **puro y determinista** (el reloj y la red viven fuera del core)
- **4 idiomas** (español, English, português, français) con detección del
  navegador; `prefers-reduced-motion` respetado

## Desarrollo

```bash
npm install
npm run dev      # entorno local
npm run build    # build de producción
```

El deploy del juego es automático al pushear a `main`. El Worker de la tabla
del día vive en `workers/daily-champions/` (ver su README para el deploy).

## Privacidad

Sin cuentas ni datos personales. El torneo del día guarda tu resultado en el
almacenamiento local de tu navegador y, si te inscribes como campeón, el nombre
que elijas se publica en la tabla del día. Detalle completo en
[/privacidad.html](https://misticafutbolera.wusman.com/privacidad.html).