# remotion-lab

A Remotion (React-based video) capability lab + reusable component library. Studies, Templates, Pipelines, Ambitions — building blocks you can copy into your own video projects.

> Stripped of project-specific edits — this is the **library + studies** half. Personal video projects (Eurogang trip vlog, F1 edits, etc.) are not included.

## Quick start

```bash
cd remotion-lab
npm install
npm run studio   # opens Remotion Studio at http://localhost:3000
```

## What's inside

```
remotion-lab/
├── src/
│   ├── HelloWorld.tsx              # smoke test
│   ├── Root.tsx                    # all compositions registered here
│   ├── index.ts                    # entry point
│   ├── studies/                    # Phase 1 — capability studies (one Remotion concept each)
│   │   ├── primitives/             # AbsoluteFill, Sequence, Video, Audio basics
│   │   ├── animation/              # interpolate, spring, easing
│   │   ├── typography/             # text + font systems
│   │   ├── data/                   # data-driven rendering
│   │   ├── audio/                  # audio-reactive visuals
│   │   ├── generative/             # procedural patterns
│   │   ├── transitions/            # transition reel
│   │   └── hello-world/
│   ├── templates/                  # Phase 2 — drop-in templates with schemas
│   │   ├── LowerThird.tsx
│   │   ├── TitleCard.tsx           # 3 variants (bold/editorial/minimal)
│   │   ├── EndCard.tsx
│   │   ├── QuoteCard.tsx
│   │   ├── StatReveal.tsx
│   │   ├── BarChart.tsx
│   │   ├── MapReveal.tsx
│   │   ├── PhotoCarousel.tsx
│   │   ├── SubtitleBurner.tsx
│   │   ├── ProductTrailer.tsx
│   │   └── F1Vlog/                 # data-driven F1 vlog template
│   ├── pipelines/                  # Phase 3 — content pipelines
│   │   ├── PersonalizedCard.tsx
│   │   ├── UrlExplainer.tsx
│   │   └── MusicVideoFromBeats.tsx
│   ├── ambitions/                  # Phase 4 — advanced demos
│   │   ├── ParticleGalaxy.tsx
│   │   ├── ThreeScene.tsx          # @react-three/fiber inside Remotion
│   │   ├── LiveDashboard.tsx       # fetches live data via calculateMetadata
│   │   └── AdShowcase.tsx
│   └── core/                       # Reusable building blocks
│       ├── overlays/               # 31+ overlay components (BeatFlash, FilmGrain, HeroText, ...)
│       ├── transitions/            # transition kinds (whipPan, flashCut, lightBloom, ...)
│       ├── fx/                     # 8 FX-demo compositions (BassPump, GhostEcho, JCut, MaskReveal*, FlowBlur)
│       ├── lib/                    # filters, helpers
│       ├── templates-reference/    # pattern examples (whip-pan, glitch-text, vignette-pulse, ...)
│       ├── CATALOGUE.md            # semantic index of all overlays + transitions + FX
│       └── README.md
├── scripts/
│   └── verify_edit.py              # automated quality checks (ffmpeg silencedetect + blackdetect)
├── package.json
└── tsconfig.json
```

## Render commands

```bash
# Studio (live preview)
npm run studio

# Single composition
npx remotion render src/index.ts <CompositionId> outputs/<file>.mp4 --codec h264

# Faster iteration (half-res, all cores)
npx remotion render src/index.ts <CompositionId> outputs/<file>.mp4 \
  --scale=0.5 --concurrency=18 --codec h264

# Section-only render (frames N to M)
npx remotion render src/index.ts <CompositionId> outputs/<file>.mp4 \
  --frames=2850-3150 --scale=0.5 --concurrency=18

# List all registered compositions
npx remotion compositions src/index.ts
```

**Composition IDs** must match `[a-zA-Z0-9-]` plus CJK characters — no underscores in the `id="..."` value (component names in TypeScript may have underscores, only the ID string can't).

## QA pipeline (`verify_edit.py`)

Automated quality checks for any rendered MP4. Detects audio gaps and black frames before you ship.

```bash
python3 scripts/verify_edit.py outputs/render.mp4
```

Outputs JSON report on stdout + human summary on stderr. Exit 0 = pass, exit 1 = fail. Useful as a pre-delivery gate.

Detects:
- **Audio gaps** — silence longer than spec (default: 2s)
- **Silence ratio** — too much of the edit silent
- **Black stretches** — more than 0.5s of >98%-black frames
- **Black ratio** — too much of the edit black

## How to add your own project

1. Create `src/projects/<your-project>/` with `compositions/`, `data/`, `scripts/`, `README.md`.
2. Build your composition there — import overlays/transitions/FX from `src/core/` instead of copying them.
3. Register the composition in `src/Root.tsx` (no underscore in the `id`).
4. Render via the commands above.

If your project has a lot of source video, drop them under `public/<project>/` (gitignored by default) and reference via `staticFile()`.

## Adding a new overlay or transition

1. Place generic effect in `src/core/overlays/<Name>.tsx` or `src/core/transitions/<Name>.tsx`.
2. Don't hardcode asset paths — pass via props so it stays project-agnostic.
3. Add a row to `src/core/CATALOGUE.md` with tags (use-case, mood, energy, requires).
4. Optional: drop a demo composition under your project's `compositions/fx-demos/`.

## Mood Packs (in `src/core/lib/filters.ts`)

6 prebuilt CSS-filter packs for clip/photo grading:

| Pack | Vibe |
|---|---|
| `darkFlow` | muted contrast, slight desaturation — house-style default |
| `redNeon` | high-energy hype, neon red/pink |
| `yeezy` | grain-heavy, low-saturation, sepia |
| `opium` | purple/violet, hue-rotated |
| `bwCrushed` | black-and-white, high-contrast |
| `archival` | faded VHS / film, warm sepia |

Pass via the `mood` prop on compositions that support it.

## Notes

- **Built with** Remotion 4.0.457, React 19, TypeScript.
- **Zero AI keys required** — all assets are programmatic or licensed (`@fontsource`, public CC0 fonts).
- **Tested on** Apple Silicon (M-series Macs).

If you get stuck or want to extend something, the source is the documentation. Each study/template/pipeline is intentionally self-contained.

— *Part of [`just-code`](https://github.com/JasperXxX/just-code), the Claude Code loadout.*
