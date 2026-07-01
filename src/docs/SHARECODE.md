# SHARE-CODE — spec del formato (v1)

Estado: **formato aprobado, en implementación por módulos.** Una vez que un `v1`
sale a producción, este layout no se toca: los códigos viejos tienen que
seguir leyéndose. Cambios de fondo → `v2` (y `v1` se rechaza con mensaje claro,
no se reinterpreta).

---

## Qué es

Un string corto y versionado (`v1.AbC123…`) que comprime **la semilla + todas
las decisiones del jugador** de una corrida. Como el core es determinista,
ese string ES la corrida completa, gol por gol. No guarda resultados: los
**reproduce** corriendo el mismo engine.

## En qué difiere de hoy

- Hoy se comparte una **semilla**: mismas cartas de draft, pero la corrida del
  otro es suya. La inscripción al daily manda los números (`w/d/l/gf/ga/avg`)
  y el Worker **confía** en ellos (sistema de honor).
- El share-code es la **corrida entera**. La inscripción manda el código; el
  Worker lo reproduce y saca los números de la reproducción, no del cliente.

## Qué habilita

1. **Daily incorruptible**: el Worker verifica que la corrida del código sea la
   del torneo de hoy y termine campeón. Sin cuentas, sin base de datos.
2. **Modo espectador** (`?r=CODIGO`): reproduce la corrida ajena en el
   navegador. 100% client-side, no toca el Worker.
3. **Duelos**: misma semilla, dos códigos → comparar dónde cayó cada uno.

---

## El RunLog (estructura que se serializa)

Decisiones del jugador, en el orden en que ocurren. Lo que NO está acá lo
regenera la semilla (qué equipo sale en cada paso del draft, el relato, los
rivales, etc.).

| Campo        | Qué es                                            | Cardinalidad |
|--------------|---------------------------------------------------|--------------|
| `seed`       | semilla de la corrida                             | uint32       |
| `formation`  | índice de formación                               | 6 → 3 bits   |
| `draft[]`    | por paso decidible: PASS, o PICK(jugador, slot)   | variable     |
| `attitudes[]`| actitud de entretiempo por partido (def/eq/off)   | 3 → 2 bits   |
| `penAims[]`  | palo de cada penal EN JUGADA (L/C/R)              | 3 → 2 bits   |
| `shoot[]`    | palo (tu remate) o estirada (tu arquero) en tanda | 3 → 2 bits   |

## Layout de bits (orden de escritura)

El prefijo `v1.` va como texto; el resto es el payload en base64url.

```
[ seed: 32 bits ]
[ formation: 3 bits ]
[ draft: ancho variable, dependiente del contexto ]
[ attitudes: 2 bits × (partidos jugados) ]
[ penAims: 2 bits × (penales en jugada ocurridos) ]
[ shoot: 2 bits × (penales de tanda) ]
```

### El draft (la parte fina)

El codec NO guarda qué equipo salió en cada paso ni los saltos forzados — los
**reproduce**. En cada paso, encoder y decoder calculan lo mismo:

1. `draftTeamAt(seed, step)` → equipo del paso.
2. `eligible` = jugadores del equipo no tomados y con slot abierto compatible.
3. Si `eligible` está vacío → **salto forzado**, 0 bits, se avanza solo.
   (En la UI ese caso es el "reroll"; nunca es una decisión del jugador.)
4. Si hay elegibles, el jugador decidió:
   - **¿le quedan pases?** 1 bit "¿pasó?". Si pasó → fin del paso.
   - si no pasó: índice del jugador dentro de `eligible` (ordenada por `i`):
     `ceil(log2(N))` bits.
   - si ese jugador tiene **M > 1** slots compatibles abiertos: índice del slot
     elegido, `ceil(log2(M))` bits. Si M = 1, **0 bits** (el slot es forzado).

Como ambos lados reproducen el contexto, el **ancho de cada campo se conoce sin
guardarlo**. Por eso el draft entra en ~4–6 bits por pick en vez de los ~12 que
costaría guardar el id global.

### Tamaño estimado

`32 + 3 + (≈11 picks × ≈5) + (≤9 actitudes × 2) + algunos penales` ≈ **150–220
bits** → **~25–37 caracteres** en base64url, más el prefijo `v1.`.

---

## Alcance honesto (decisión de producto)

El determinismo está atado al **engine + dataset**. El día que cambie el dataset
(más equipos, Libertadores), `draftTeamAt` sortea distinto y un código viejo
reproduciría otra corrida. v1 **no** intenta ser eterno:

- El código vale en la ventana que importa: el día del torneo, el momento de
  compartir. No se reproducen corridas de hace meses.
- El prefijo `v1.` sirve para **rechazar limpio** un código de versión
  incompatible ("este código es de una versión anterior del juego"), no para
  reinterpretarlo.

Esto evita tener que congelar y versionar snapshots del engine: barato y cubre
el uso real.

---

## Verificación (Worker)

```
verify(code, seedDeHoy) →
  1. parse: prefijo v1. + base64url → bits
  2. decode → RunLog (reproduciendo el contexto del draft)
  3. ¿runLog.seed === seedDeHoy?         → si no: rechazar
  4. playRun(runLog) → resultado
  5. ¿resultado.champion?                → si no: rechazar
  6. devolver stats DE LA REPRODUCCIÓN (no del cliente)
```

El Worker reusa `playRun` tal cual (incluye el relato, porque el penal en
jugada necesita ajustar goles/goleadores). Es aritmética pura sobre ≤9
partidos: microsegundos, muy por debajo del techo de 10 ms de CPU del Worker
free. No hace falta un camino "liviano" aparte.

---

## Costo

- Generar el código: client-side, cero red.
- Modo espectador: client-side, **no toca el Worker**.
- Inscripción: **reemplaza** el POST de honor de hoy por uno verificado — no
  agrega peticiones.
- Free tier alcanza de sobra; el cuello, si hay viralidad, son las escrituras
  KV (≈1k/día = 1 por campeón inscrito), no el share-code.

---

## Módulos (orden de implementación)

1. ✅ **Orquestación pura** — `lib/tournament.ts`: `matchSeedFor`, `settleMatch`,
   `settleH2` extraídas del reducer (mismo comportamiento, reusables headless).
2. ✅ **Corrida reproducible** — `lib/run.ts`: `RunLog`, `playRun`. Reproduce
   una corrida entera fuera de React. Validado con 4000 corridas.
3. ✅ **Captura** — el reducer anota el RunLog mientras se juega (wrapper
   `capture`, estado `log` en `GameState`). **Test de oro pasado**: 3000
   corridas jugadas por el reducer real → `playRun` sobre la captura da idéntico
   (campeón, etapa y stats), 0 divergencias. En dev, cada corrida terminada
   loguea `[sharecode] gold test OK ✓`; en prod el chequeo se elimina.
4. ⏭ **Codec** — `lib/sharecode.ts`: BitWriter/Reader + `encodeRun`/`decodeRun`,
   `v1.` + base64url, en orden de ocurrencia (draft, luego decisiones de
   partido interleaveadas).
5. **UI de compartir** — botón "copiar código" en la carta de resultado.
6. **Modo espectador** — `?r=CODIGO` reproduce con `playRun` (client-side).
7. **Worker verify** — POST con código; reproduce y verifica; stats del replay.