# SHARE-CODE — spec del formato (prefijo versionado; hoy `v2.`)

Estado: **formato congelado.** El prefijo del código VIAJA con `RUN_VERSION`
(`PREFIX = \`v${RUN_VERSION}.\``): un bump del motor invalida limpio los
códigos anteriores (caen al mensaje "otra versión") en vez de dejar que
reproduzcan una corrida que el autor nunca jugó. Actual: **v2**
(post-rebalance jul 2026). Dentro de una misma versión, este layout no se
toca: los códigos ya emitidos tienen que seguir leyéndose.

---

## Qué es

Un string corto y versionado (`v2.AbC123…`, ~18–37 chars; +identidad opcional) que comprime **la
semilla + todas las decisiones del jugador** de una corrida. Como el core es
determinista, ese string ES la corrida completa, gol por gol. No guarda
resultados: los **reproduce** corriendo el mismo engine.

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

El prefijo `v{RUN_VERSION}.` va como texto; el resto es el payload en base64url.

```
[ seed: 32 bits ]
[ formation: 3 bits ]
[ decisiones en ORDEN DE OCURRENCIA, entrelazadas: ]
  · draft: al reproducir cada paso decidible
  · attitude / penAim del partido, y shoot de la tanda, cuando ocurren
```

Encoder y decoder recorren la MISMA reproducción (`runWith` de `run.ts`), así
que las decisiones se leen/escriben en el punto exacto en que la corrida las
pide. No hay que guardar cuántas hay de cada tipo: la corrida lo dicta.

### El draft (la parte fina)

El codec NO guarda qué equipo salió ni los saltos forzados — los **reproduce**.
En cada paso decidible (con elegibles):

- **¿le quedan pases?** 1 bit "¿pasó?". Si pasó → fin del paso.
- si no pasó: índice del jugador dentro de `eligible` (ordenada por `i`):
  `ceil(log2(N))` bits.
- si ese jugador tiene **M > 1** slots compatibles abiertos: índice del slot,
  `ceil(log2(M))` bits. Si M = 1, **0 bits** (forzado).

Los saltos forzados (equipo sin elegibles, el "reroll" de la UI) no son
decisión del jugador: se reproducen solos, 0 bits.

### Tamaño real (medido)

Sobre 4000 corridas: **18–37 caracteres**, promedio **22**, incluyendo el
prefijo versionado.

---

## Alcance honesto (decisión de producto)

El determinismo está atado al **engine + dataset**. El día que cambie el dataset
(más equipos, Libertadores), `draftTeamAt` sortea distinto y un código viejo
reproduciría otra corrida. v1 **no** intenta ser eterno:

- El código vale en la ventana que importa: el día del torneo, el momento de
  compartir. No se reproducen corridas de hace meses.
- El prefijo versionado sirve para **rechazar limpio** un código de versión
  incompatible, no para reinterpretarlo.

---

## Verificación (Worker)

```
verify(code, seedDeHoy) →
  1. decodeRun(code) → RunLog  (null si prefijo/base64/stream inválido)
  2. ¿runLog.seed === seedDeHoy?   → si no: rechazar
  3. playRun(runLog) → resultado
  4. ¿resultado.champion?          → si no: rechazar
  5. devolver stats DE LA REPRODUCCIÓN (no del cliente)
```

`decodeRun` nunca lanza ante basura: devuelve `null`. `playRun`/`runWith`
reusan la misma reproducción; aritmética pura sobre ≤9 partidos, microsegundos,
muy por debajo del techo de 10 ms de CPU del Worker free.

---

## Costo

- Generar y copiar el código: client-side, cero red.
- Modo espectador: client-side, **no toca el Worker**.
- Inscripción: **reemplaza** el POST de honor de hoy por uno verificado — no
  agrega peticiones.

---

## Arquitectura (por qué no se duplica la máquina)

`runWith(seed, formation, driver)` es la única reproducción. El `RunDriver`
inyecta la fuente de decisiones:

- `playRun(log)` → driver que las lee de un RunLog.
- `encodeRun(log)` → driver que las lee del log y **escribe bits**.
- `decodeRun(code)` → driver que **lee bits** y reconstruye el RunLog.

Una sola máquina, tres usos. Sin lógica duplicada que pueda divergir.

---

## Módulos (orden de implementación)

1. ✅ **Orquestación pura** — `lib/tournament.ts`: `matchSeedFor`, `settleMatch`,
   `settleH2` extraídas del reducer.
2. ✅ **Corrida reproducible** — `lib/run.ts`: `runWith` + `RunDriver`,
   `playRun`. Validado con miles de corridas.
3. ✅ **Captura** — el reducer anota el RunLog mientras se juega. Test de oro:
   `playRun(captura) == reducer`, 0 divergencias.
4. ✅ **Codec** — `lib/sharecode.ts`: BitWriter/Reader + `encodeRun`/`decodeRun`,
   prefijo + base64url. Round-trip exacto en 4000+ corridas; `decodeRun` robusto
   ante basura (siempre `null`, nunca crashea).
5. ✅ **UI de compartir** — botón "copiar código" en la carta de resultado
   (free y daily), con feedback e i18n en los 4 idiomas.
6. ✅ **Modo espectador** — `?r=CODIGO` reproduce con `playRun` (client-side) y
   muestra un resumen: el once, el camino partido a partido (rotulado con
   `stagesFor`) y el veredicto, más un botón "jugar esta semilla". Validado:
   3000 corridas decodean y rotulan sin fallos.
7. **Worker verify** — POST con código; reproduce y verifica; stats del replay.

---

## Segmento de identidad (`v2.{run}.{identidad}`) — jul 2026

Tercer segmento OPCIONAL, separado por `.`. Es **identidad, no run**: no
participa de la reproducción ni de `RUN_VERSION` — pero al vivir bajo el
mismo prefijo, un bump del motor también lo resetea (por eso este layout
pudo estrenarse fresco con `v2.`).

```
[ count: 2 bits (0–3 colores) ]
[ color: 4 bits × count  — índice de ESCUDO_PALETTE ]
[ pattern: 4 bits        — índice de PATTERNS ]
[ nameLen: 6 bits        — BYTES UTF-8 del nombre, 0–63 ]
[ name: 8 bits × nameLen — UTF-8, sin partir caracteres multibyte ]
```

- **El orden de `PATTERNS` está CONGELADO** (el índice es parte del
  formato): patrones nuevos se agregan SOLO AL FINAL de la lista.
- `encodeEscudo` devuelve `''` si no hay nada que declarar (sin colores,
  patrón default, sin nombre): el código queda corto.
- Decodificación tolerante: índices fuera de rango se descartan; nombre
  corrupto cae a `''`; segmento ausente → el espectador usa los defaults
  de marca ("Tu once" + escudo default).
- Validado con harness de round-trip (1800+ casos: 0–3 colores × todos los
  patrones × nombres con acentos/emojis/24 chars, códigos v1/v3/basura
  rechazados).