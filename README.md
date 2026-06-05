# Mística Futbolera

Roll the dice, draft an XI from a legendary **Copa Libertadores** champion squad,
and simulate a full campaign — group stage, knockouts, penalties. Can you lift the cup?

A fast, 100% client-side game. No sign-up, no backend for the core loop — just a seed,
your picks and a shareable campaign card.

🔗 **Live:** https://misticafutbolera.wusman.com

## How it works

1. **Set up** — choose a formation and a mode (*Classic* shows ratings, *From memory* hides them).
2. **Roll** — a seed draws a champion club and its edition. Limited rerolls.
3. **Build** — fill your XI from that real squad; a live attack/defense box score updates as you go.
4. **Simulate** — play a whole Libertadores run: groups, knockouts, scorers, penalty shootouts.
5. **Share** — a campaign card with the seed embedded, so anyone can replay the exact run.

Every result is **deterministic from the seed**, so a shared link always reproduces the same campaign.

## Stack

- **Vite + React + TypeScript** — tiny bundle, mobile-first, no SSR
- **Pure-function simulation engine** — no framework lock-in, fully testable
- Deployed on **Cloudflare Pages** via GitHub (CI/CD)
- Dynamic share-card image generated at the edge (Cloudflare Pages Function) — *roadmap*

## Architecture

The engine knows nothing about React; the UI only orchestrates it.

| Module | Responsibility |
|---|---|
| `src/data/players.ts` | Hardcoded squads (club × edition) + formations |
| `src/lib/engine.ts` | Seeded PRNG, `rollTeam`, `validateXI`, `simulate` (single match) |
| `src/lib/campaign.ts` | Wraps `simulate` into a full tournament: draw, groups, knockouts, penalties |
| `src/App.tsx` | Orchestrates setup → roll → build → simulate → card |

## Data & ratings

Player ratings (0–99) are subjective, legacy-based calls — easy to tune in `players.ts`.
Squads are sourced from public match records. No player images: jersey numbers only.

**No official logos, crests, kits or competition marks are used.** Player names and
historical facts are not copyrightable; the visual identity is original.

## Run locally

```bash
git clone https://github.com/Wusman/mistica-futbolera.git
cd mistica-futbolera
npm install
npm run dev
```

## Roadmap

- [x] **Phase 0** — Roll + build XI + single-match result
- [ ] **Phase 1** — Full campaign sim, scorers, penalties, share card + code
- [ ] **Phase 2** — Edge OG image, daily seed, expanded dataset, modes/formations
- [ ] **Phase 3** — Viral polish, Ko-fi / AdSense, analytics

## License

MIT © Wusman