# remotion-lab — Agent Guide

> Single entry point for any agent (or future-you) who lands in this repo.
> Read this first. Then go to the right folder.

---

## What this repo is

A Remotion capability lab + production-vlog repo. Two things live side-by-side:

1. **Production projects** — actual finished or in-progress edits (`src/projects/`)
2. **Reusable building blocks + studies** — overlays, transitions, templates, capability-studies (`src/core/`, `src/templates/`, `src/studies/`, `src/ambitions/`)

Architecture is documented in `DECISIONS.md`. Capability status lives in `capability-map.md` (live) and `verified-capabilities.md` (append-only ledger).

---

## When the user wants…

| Intent | Where to look | Quick example |
|---|---|---|
| **Vlog with real source videos**, beat-driven, full pipeline | `src/projects/eurogang/` | `EurogangVlogTrip` (4-min main comp) |
| **Brief-driven template**, JSON-config, repeatable variants | `src/templates/F1Vlog/` | 4 briefs in `briefs/*.json` |
| **Standalone visual** (title card, bar chart, lower third, end card) | `src/templates/` | 11 self-contained templates |
| **Custom ambition demo** — particle galaxy, three.js scene, live-data dashboard | `src/ambitions/` | `ParticleGalaxy`, `ThreeScene`, `LiveDashboard`, `AdShowcase` |
| **Single Remotion-API study** — one capability tested in isolation | `src/studies/` | per `capability-map.md` |
| **Reusable overlay or transition** | `src/core/` | see `src/core/CATALOGUE.md` |
| **FX-demo** (Eurogang variants tested in isolation, full mini-comp wrapping one effect) | `src/projects/eurogang/compositions/fx-demos/` | `MaskRevealSilhouetteFX` (winner) |
| **Older edit experiment** (Valorant FPS edit, Flow study) | `src/projects/valorant/`, `src/projects/flow/` | `ValorantAye` |

---

## Mood Packs

Defined in `src/core/lib/filters.ts` — 6 packs, each is a CSS `filter` string applied to clips/photos:

| Pack | Vibe | Example use |
|---|---|---|
| `darkFlow` | the original house-style — muted contrast, slight desaturation | default for vlogs |
| `redNeon` | high-energy hype, neon red/pink (Travis Scott vibe) | drop sections, hype edits |
| `yeezy` | grain-heavy, low-saturation, sepia (Kanye DONDA) | introspective, gritty |
| `opium` | purple/violet, hue-rotated (Carti aesthetic) | dreamy, dissociative |
| `bwCrushed` | black-and-white, high-contrast | drama, narrative emphasis |
| `archival` | faded VHS / film, warm sepia | retro, memory-flashback |

Pass via the `mood` prop on Eurogang compositions (e.g. `EurogangCartiOpium`, `EurogangRedNeon`, `EurogangBwCrushed` are pre-set variants).

---

## Effect Catalogue

→ `src/core/CATALOGUE.md` — semantic index of all 31 overlays + 4 transitions + 8 FX-demo compositions.

Tagged by `use-case`, `mood`, `energy`, `requires`. Filter by grepping the table — e.g. `grep "audio-driven" src/core/CATALOGUE.md`.

---

## Adding a new effect or overlay

1. **Place generic effect** in `src/core/{overlays|transitions}/<Name>.tsx`
2. **Don't hard-code asset paths** (`staticFile("...")`) — pass via props so it's project-agnostic
3. **Add row** to `src/core/CATALOGUE.md` with tags
4. **Optional**: project-specific demo composition in `src/projects/<project>/compositions/fx-demos/<Name>FX.tsx`
5. **Register** in `src/Root.tsx` if it should be renderable on its own

---

## Adding a new project

1. **Create** `src/projects/<project>/`
2. **Inside**: `compositions/`, `data/`, `scripts/`, `README.md`
3. **README.md** lists compositions, render commands, data pipeline
4. **Reuse from `src/core/`** — don't copy overlays. Import them.

---

## Render command pattern

```bash
cd ~/remotion-lab
npx remotion render src/index.ts <CompositionId> outputs/<file>.mp4 --frames=<start>-<end> --codec h264 --concurrency=8
```

**Composition IDs** (the `<CompositionId>` argument) live in `src/Root.tsx`. **No underscores allowed** in IDs — only `[a-zA-Z0-9-]` plus CJK characters. Component names in TypeScript may have underscores; only the ID string can't.

Outputs land in `outputs/`, organized as `outputs/v<N>/`, `outputs/studies/`, `outputs/templates/`, `outputs/pipelines/`, `outputs/ambitions/`.

---

## Verification & history

| File | Purpose |
|---|---|
| `capability-map.md` | Live status of 50 tracked Remotion capabilities (⚪ untested, 🟡 partial, 🟢 verified, 🔴 broken) |
| `verified-capabilities.md` | Append-only ledger — every successful render with timestamp |
| `DECISIONS.md` | Append-only ledger of architectural decisions |
| `docs/MIGRATIONS/<date>-<topic>.md` | When files move/rename, the change-log lives here. Always check before assuming an old import path is current. |
| `docs/specs/<date>-<topic>-design.md` | Design specs for in-flight or completed initiatives |

---

## What NOT to do

- **Don't put project-coupled code in `src/core/`** — it belongs in `src/projects/<project>/`. Core = no project-specific data references.
- **Don't hard-code `staticFile()` paths in core effects** — pass via props.
- **Don't add new top-level `src/*.tsx` files** — pick a folder. Top-level is reserved for `Root.tsx` + `index.ts`.
- **Don't rename or move without logging** in `docs/MIGRATIONS/<date>-<topic>.md`. Future agents will grep for old paths.
- **Don't change Composition IDs** in `Root.tsx` without checking — they're public render-command strings; renaming breaks the user's scripts and muscle memory.
- **Don't invent capability statuses** — only mark a row 🟢 in `capability-map.md` after a render lands in `verified-capabilities.md`.

---

## Current production focus (snapshot 2026-05-08)

The active edit is `EurogangVlogTrip` — a 4-min vertical TikTok vlog at v43+. Iterate via FX-demo compositions in `src/projects/eurogang/compositions/fx-demos/` first (300-frame smoke renders), only integrate proven effects into the main comp. Critique log: `src/projects/eurogang/docs/CRITIQUES.md` (or wherever the project's iteration log lives).

The F1Vlog template (`src/templates/F1Vlog/`) is the second consumer of the library — when adding new core overlays, F1Vlog is a useful reuse-test target.
