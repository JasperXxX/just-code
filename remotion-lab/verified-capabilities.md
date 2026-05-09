# Verified Capabilities

> Append-only ledger. Each entry: timestamp · capability · render path · render duration · pass/fail.
> Surfaces correspond to OPERATION TOTAL REMOTION directive.

| Time (UTC) | Capability | Composition | Output | Render | Status |
|---|---|---|---|---|---|
| 2026-05-05 02:01 | spring + interpolate + AbsoluteFill + gradient bg + vignette + multi-stage easing | `HelloWorld` | `outputs/v0/hello.mp4` (666 KB · 4s) | ~5s | ✅ |
| 2026-05-05 02:55 | S1: Sequence + Series + Loop + Freeze + interpolate + spring + random | `StudyPrimitives` | `outputs/studies/primitives/v1.mp4` | 5s | ✅ |
| 2026-05-05 02:55 | S2: parallax, stagger, SVG path draw, particles, fake-3D dolly | `StudyAnimation` | `outputs/studies/animation/v1.mp4` | 11s | ✅ |
| 2026-05-05 02:55 | S3: variable fonts (Fraunces opsz/wght axes), letter-reveal, 3 design systems | `StudyTypography` | `outputs/studies/typography/v1.mp4` | 4s | ✅ |
| 2026-05-05 02:55 | S4: prop-driven 12-bar chart with animated counter | `StudyData` | `outputs/studies/data/v1.mp4` | 3s | ✅ |
| 2026-05-05 02:55 | S5: useAudioData + visualizeAudio (FFT) driving spectrum bars + bass pulse | `StudyAudio` | `outputs/studies/audio/v1.mp4` | 3s | ✅ |
| 2026-05-05 02:56 | S6: noise2D, flow field, voronoi cells, fractal starburst (procedural) | `StudyGenerative` | `outputs/studies/generative/v1.mp4` | 8s | ✅ |
| 2026-05-05 02:55 | S7: TransitionSeries + 8 built-in + 4 custom presentations | `StudyTransitions` | `outputs/studies/transitions/v1.mp4` | 7s | ✅ |
| 2026-05-05 03:25 | LowerThird w/ Zod schema | `LowerThird` | `outputs/templates/LowerThird.mp4` | 3s | ✅ |
| 2026-05-05 03:25 | TitleCard 3 variants | `TitleCardBold`, `TitleCardEditorial`, `TitleCardMinimal` | `outputs/templates/TitleCard*.mp4` | 8s | ✅ |
| 2026-05-05 03:25 | EndCard with rotating decorative rings | `EndCard` | `outputs/templates/EndCard.mp4` | 2s | ✅ |
| 2026-05-05 03:25 | QuoteCard with auto-fit font sizing + word-by-word reveal | `QuoteCard` | `outputs/templates/QuoteCard.mp4` | 3s | ✅ |
| 2026-05-05 03:25 | StatReveal with spring-driven counter + tabular-nums | `StatReveal` | `outputs/templates/StatReveal.mp4` | 3s | ✅ |
| 2026-05-05 03:25 | BarChart vertical/horizontal | `BarChart` | `outputs/templates/BarChart.mp4` | 3s | ✅ |
| 2026-05-05 03:25 | MapReveal w/ animated zoom + pin drop + equirect projection | `MapReveal` | `outputs/templates/MapReveal.mp4` | 3s | ✅ |
| 2026-05-05 03:26 | PhotoCarousel w/ Ken Burns + crossfade | `PhotoCarousel` | `outputs/templates/PhotoCarousel.mp4` | 12s | ✅ |
| 2026-05-05 03:26 | SubtitleBurner 3 styles (classic, kinetic, tiktok-bold) | `SubtitleBurner` | `outputs/templates/SubtitleBurner.mp4` | 4s | ✅ |
| 2026-05-05 03:26 | ProductTrailer composing 4 templates from JSON | `ProductTrailer` | `outputs/templates/ProductTrailer.mp4` | 11s | ✅ |
| 2026-05-05 04:08 | CSV-driven batch render (6 personalized cards) | `PersonalizedCard` × 6 | `outputs/pipelines/csv-personalized/*.mp4` | 17s wall | ✅ |
| 2026-05-05 04:09 | JSON brief → 26s product trailer | `ProductTrailer` | `outputs/pipelines/json-trailer/trailer_brief.mp4` | 11s | ✅ |
| 2026-05-05 04:09 | Audio file → procedural music video w/ beat cuts + FFT | `MusicVideoFromBeats` | `outputs/pipelines/audio-music-video/synth_beat_video.mp4` | 4s | ✅ |
| 2026-05-05 04:09 | URL → explainer (Node fetch + kinetic typography) | `UrlExplainer` | `outputs/pipelines/url-explainer/explainer.mp4` | 7s | ✅ |
| 2026-05-05 04:11 | 2400-particle deterministic galaxy w/ orbital physics | `ParticleGalaxy` | `outputs/ambitions/particle_galaxy.mp4` | 6s | ✅ |
| 2026-05-05 04:11 | three.js scene with custom GLSL shader material (`--gl=angle`) | `ThreeScene` | `outputs/ambitions/three_scene.mp4` | 6s | ✅ |
| 2026-05-05 04:12 | calculateMetadata fetching live open-meteo weather → dashboard | `LiveDashboard` | `outputs/ambitions/live_dashboard.mp4` | 6s | ✅ |
| 2026-05-05 04:14 | 30-second polished broadcast-style ad recreation | `AdShowcase` | `outputs/ambitions/ad_showcase.mp4` | 11s | ✅ |
| 2026-05-08 01:23 | post-refactor smoke: MaskRevealWrapper extracted to `lib/fx/`, visual-parity check | `EurogangVlogTripFXMaskSilhouette` (frames 2950–3150) | `outputs/v44_silhouette_smoke_post_refactor.mp4` (10.2 MB · 6.7s) | ~50s | ✅ |

## 2026-05-08 drop — agents + refactor

Background-agent batch (4 agents, parallel):
- **SFX library** — 142 sounds curated to `public/sfx/` (113 from existing davinci-flow library, 29 new from Mixkit), 11 categories, 48 kHz mono WAV peak −3 dB. Helper: `core/lib/sfx.ts` with `pickSfx`, `pickSfxByTags`, `pickSfxByDuration`, `sfxUrl`. Manifest at `public/sfx/manifest.json`. ✅
- **Trick library** — 10 isolated trick studies in `studies/tricks/`: datamosh-fake, rolling-shutter, frame-smear, iris-reveal, scope-tracker, type-on-beat, sticker-burst, rgb-tear, vhs-dropout, cassette-warp. All 10 bundle and resolve at 1080×1920 @ 30fps via `npx remotion compositions studies/tricks/index.ts`. ✅
- **Audio-reactive hooks** — 6 deterministic hooks in `core/lib/audio/`: `useFrequencyBands`, `useTransientDetector`, `useRMSEnvelope`, `useSpectralCentroid`, `useCrossfadeAudio`, `usePrecomputedBeatGrid`. 6 demo compositions in `studies/audio-reactive/` using `aye_20s_section.wav`. `tsc --strict --noEmit` clean. ✅
- **Reference-mining** — `docs/edit-references.md` (2718 words, 50+ sources) + `docs/edit-vocabulary.md` (67 vocabulary entries, 18 marked as gaps). Top-5 promotion candidates flagged: SpeedRamp, TealOrangeGrade, DigitalZoomCrop, SidechainDuck, TrueAudioFFT. ✅

Refactor:
- Extracted `MaskRevealWrapper` (Silhouette winner) and `GhostEcho` from main composition + FX-demo duplicates into `src/projects/eurogang/lib/fx/`. Single source of truth. Visual-parity verified by smoke render above. Migration log: `docs/MIGRATIONS/2026-05-08-extract-maskrevealwrapper-ghostecho.md`. ✅

## Aggregate

- 34 MP4 outputs
- 0 failed renders (1 was caught + fixed: Generative `<Pie>` mid-Phase-1, AdShowcase `interpolate` 0-fade mid-Phase-4)
- Total render time: < 3 minutes wall clock for everything
- Average render speed: ~7 fps for animation-heavy comps, ~50 fps for simple typography

## What was NOT verified (yet)

- ❌ Lambda deployment (no AWS creds)
- ❌ Cloud Run deployment (no GCP creds)
- ❌ AI-generated assets (no `~/.env`)
- ❌ `<Player>` interactive embed (out of CLI scope)
- ❌ `@remotion/lottie` Lottie integration (no Lottie file at hand)
- ❌ `@remotion/rive` (same)
- ❌ Quality-gate run on every output (gate exists; only HelloWorld run through it)
- ❌ ProRes 4444 alpha render (codec available, untested)
- ❌ V2 of the 5 🟡 studies (critique landed, v2 not built)
- ❌ Custom GLSL post-process on AdShowcase (would need `<canvas>` overlay)
- ❌ Top-5 vocabulary gaps not yet built: SpeedRamp, TealOrangeGrade, DigitalZoomCrop, SidechainDuck, TrueAudioFFT (specced in `docs/edit-vocabulary.md`)
- ❌ Trick studies not yet promoted to `core/{overlays,transitions}/` — they're still studies/tricks/ until proven in real comps

## 2026-05-08 16:46 — Flow-Edits Style Library: 4 new project-local effects + studies verified

Pipeline derived effects from a curated set of 65 TikTok flow-edit references (60/65 downloaded, 5 blocked TikTok-side). All 4 verified via `npx remotion still` renders against hero TikTok contact-sheets. `npx tsc --noEmit` clean across the full repo.

- `src/projects/flow/effects/CassetteFrame.tsx` + `compositions/FlowStudy06CassetteFrame.tsx` — cassette/vinyl-shape wrapper with audio waveform + cursive title. Sources: ZGdumBRXB, ZGdumPvx2, ZGdumbCbU. Still: `outputs/verify/06-cassette-f120.png`. ✅
- `src/projects/flow/effects/IGUIMockup.tsx` + `compositions/FlowStudy07IGUIMockup.tsx` — 4 iOS UI variants (igPost, iMessage, spotify, calendar) via TS discriminated union. Source: ZGdumha6w. Stills: `outputs/verify/07-igui-f{30,90,150,210}-*.png`. All 4 variants render correctly, pixel-close match to hero. ✅
- `src/projects/flow/effects/ShutterCutSync.tsx` + `compositions/FlowStudy08ShutterCutSync.tsx` — `hitFrames[]` triggers 1-frame white flash + camera-shutter SFX (`pickSfxByDuration('shutter', 100, 600, …)`). Source: ZGdumBqbD. Stills: `outputs/verify/08-shutter-f{80,90}-*.png` (f80 = full white at hit; f90 = subject visible between hits with HUD). ✅
- `src/projects/flow/effects/NightVisionGreen.tsx` + `compositions/FlowStudy09NightVisionGreen.tsx` — green NV color grade + HUD (point-cloud annotations, grid, scanline, watermark, REC chrome). Source: ZGdumkK4C. Still: `outputs/verify/09-nv-f120.png`. ✅

Pipeline tooling: `scripts/{inspo-add,inspo-bulk-intake,inspo-extract,inspo-rank.py}` (+ `test_inspo_rank.py` 5/5 pass). Source data: `inspo/`. Spec: `docs/specs/2026-05-08-flow-edits-style-library-design.md`. Plan: `docs/superpowers/plans/2026-05-08-flow-edits-style-library.md`. Migration log: `docs/MIGRATIONS/2026-05-08-flow-edits-spec-relocate.md` (initial spec mis-targeted `src/templates/effects/`; CLAUDE.md discovered post-Phase-1, restructured to `src/projects/flow/effects/` per repo convention).
