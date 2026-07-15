# Mística Futbolera — reglas fijas

- Responder en español rioplatense, conciso, decisión primero.
- Determinismo: nada en engine.ts/tournament.ts puede depender de
  Date.now, Math.random en runtime o red. Todo deriva de la semilla.
- Funcional core / imperative shell: React solo estado + eventos.
- Validar con `npm run build` (no `tsc --noEmit` solo) antes de dar
  algo por cerrado.
- package.json cambia → commitear package-lock.json en el mismo commit.
- Mobile-first (~380px).
- i18n: todo string nuevo pasa por t()/flavor(), nunca hardcodeado.

Contexto completo: @docs/CONTEXTO_mistica_futbolera.md
Identidad visual: @IDENTIDAD.md