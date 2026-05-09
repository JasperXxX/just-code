# `src/core/` — Reusable Building Blocks

Project-agnostic primitives used by every project, template, and study in this repo.

## What lives here

```
src/core/
├── overlays/        31 overlay components (text, mood, accents, tracking, etc.)
├── transitions/     4 transition components (decorations, flashCut, glitchCut, whipPan)
├── lib/             helpers — beats, audio, filters (mood packs), motion, sfx, photo scoring
├── templates-reference/   13 reference snippets for common patterns (whip-pan, ken-burns, etc.)
├── CATALOGUE.md     semantic index of every reusable here — start here when looking for an effect
├── index.ts         barrel export — `import { ... } from 'core'`
└── README.md        this file
```

## What does NOT belong here

- **Project-specific data references** — no `import data from '../../projects/eurogang/data/...'`
- **Hard-coded `staticFile()` paths** — assets must be passed via props, not assumed
- **Compositions that wrap a whole project flow** — those go to `src/projects/<project>/compositions/` (or for isolation tests, `src/projects/<project>/compositions/fx-demos/`)

If a file in `core/` references project data, that's a smell. Either generalize it (data via props) or move it to the project that owns it.

## Naming convention

- **One component per file**, file named after the primary export (`Vignette.tsx` → `export const Vignette`)
- **Multi-export files** (e.g. `AmbientLayers.tsx` exports `FilmGrain`, `FlashFrame`, `LightLeak`) are fine when the components share a domain
- **camelCase for hooks** (`useBeatPulse.ts`), PascalCase for components, lowercase for libs (`beats.ts`, `motion.ts`)

## How to add a new entry

1. Create file in `overlays/`, `transitions/`, or `lib/` as appropriate
2. Export the component / function with a clear typed Props interface
3. **Add a row** to `CATALOGUE.md` with use-case / mood / energy / requires tags
4. (Optional) Add a smoke `<Composition>` entry in `src/Root.tsx` so it can be rendered standalone for visual review
5. Update the barrel `index.ts` (or rely on `export *` if already covered)

## Mood packs

The 6 mood packs in `lib/filters.ts` are the project's core "look" presets. Composition consumers receive a `mood` prop and apply the resulting CSS filter string. See `CATALOGUE.md` for which overlays pair best with which moods.
