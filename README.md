# Mística Futbolera

Roll the dice, draft a legendary **Copa Libertadores** XI and simulate the match.
Can you build a team that wins **7–0**?

A small, fast, 100% client-side game. No sign-up, no backend for the core loop —
just a seed, your picks and a shareable result.

🔗 **Live:** https://misticafutbolera.wusman.com

## How it works

1. **Roll** — a seed draws a champion team and its edition.
2. **Build** — pick a valid XI from that real squad (4-3-3 or 4-4-2).
3. **Simulate** — one click tells you the scoreline. 7–0 is the jackpot.

Every result is **deterministic from the seed**, so a shared link always
reproduces the same match.

## Stack

- **Vite + React + TypeScript** — no SSR, tiny bundle, mobile-first
- **Vanilla simulation engine** — pure functions, no framework lock-in
- Deployed on **Cloudflare Pages** via GitHub (CI/CD)
- Dynamic share-card image generated at the edge (Cloudflare Pages Function) — *roadmap*

## Architecture

Decoupled modules. The engine knows nothing about React; the UI only orchestrates it.

| Module | Responsibility |
|---|---|
| `src/data/players.ts` | Hardcoded squads + formations (single source of data) |
| `src/lib/engine.ts` | Seeded PRNG, `rollTeam`, `validateXI`, `simulate` (pure) |
| `src/App.tsx` | Orchestrates the `roll → build → simulate` loop |

## Run locally

```bash
git clone https://github.com/Wusman/mistica-futbolera.git
cd mistica-futbolera
npm install
npm run dev
```

## Data & ratings

Player ratings (0–99) are subjective, legacy-based calls — easy to tune in
`players.ts`. Squads are sourced from public match records.

**No official logos, crests, kits or competition marks are used.** Player names
and historical facts are not copyrightable; the visual identity is original.

## Roadmap

- [x] **Phase 0** — Playable prototype (roll / build / simulate)
- [ ] **Phase 1** — Full dataset, share code + client-side share card, visual identity
- [ ] **Phase 2** — Edge OG image, daily seed (Wordle-style), challenge-by-seed
- [ ] **Phase 3** — Viral polish, Ko-fi / AdSense, analytics, extra modes

## License

MIT © Wusman Guzmán
