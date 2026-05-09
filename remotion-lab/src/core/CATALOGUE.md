# Core Library Catalogue

> Semantic index of every reusable component in `src/core/`. Filter by `use-case`, `mood`, `energy`, `requires`.
>
> **How to use:** `grep` for the tag combo you want, or eyeball the table. Tags are pipe-separated where multiple apply.
>
> Tag vocabularies:
> - **Tags**: `mood-tool` · `glitch` · `accent` · `audio-driven` · `audio-reactive` · `texture` · `text` · `text-motion` · `transition` · `tracking` · `gaming` · `generative` · `image-motion` · `chapter` · `intro` · `data` · `color` · `cinematic` · `temporal`
> - **Use-Case**: `any` · `vlog` · `narrative` · `music` · `hype` · `drop` · `gaming` · `retro` · `archival` · `accent` · `intro` · `photo` · `ambient`
> - **Mood**: `all` · `darkFlow` · `redNeon` · `yeezy` · `opium` · `bwCrushed` · `archival`
> - **Energy**: `low` · `medium` · `high` · `drop`
> - **Requires**: `none` · `audio-beats` · `audio-buffer` · `face-tracks` · `transcripts` · `iso-date` · `stats-array` · `subject-cutout`

---

## Overlays (`src/core/overlays/`) — 31 components

| Name | Tags | Use-Case | Mood | Energy | Requires |
|---|---|---|---|---|---|
| AmbientLayers (`FilmGrain`, `FlashFrame`, `LightLeak`) | mood-tool, texture | any | all | low-medium | none |
| AnimatedText (`HeroText`, `LocationStamp`, `NoteText`, `GlitchHeadline`) | text-motion, accent | vlog, narrative | all | medium | none |
| AudioPulseBars | audio-driven, accent | music | all | medium | audio-buffer |
| BeatFlash | audio-driven, accent | music, vlog | redNeon, yeezy | high | audio-beats |
| BoldHeadline | text | any | all | low | none |
| CaptionOverlay | text | vlog, narrative | all | low | transcripts |
| ChromaticVignette | mood-tool, color | cinematic | darkFlow, archival | low | none |
| ColdOpenCover | text, intro | vlog, narrative | all | low | none |
| CountdownOverlay | text | hype, intro | all | high | none |
| CrosshairOverlay | gaming | gaming | redNeon | medium | none |
| DayCard | text, chapter | vlog, narrative | all | low | iso-date |
| DropPunctuation (`DropPunctuation`, `DropScalePulse`) | accent, audio-reactive | drop, music | all | high | audio-beats |
| FaceSpotlight | tracking | vlog, narrative | all | medium | face-tracks |
| FaceTrackedLabel (`FaceTrackedLabel`, `FaceTrack`) | text, tracking | vlog | all | medium | face-tracks |
| GlitchOverlay | glitch | hype | redNeon, opium | high | none |
| KenBurnsImg | image-motion | photo, narrative | darkFlow, archival | low | none |
| KineticText | text-motion | any | all | medium | none |
| LetterSplit | text-motion | accent | all | medium | none |
| NegativeFlash | accent | hype | redNeon | high | none |
| ParticleField | generative | hype, ambient | redNeon, opium | medium | none |
| RGBSplit (`RGBSplit`, `SvgChannelFilters`) | glitch, accent | hype, drop | redNeon, opium | high | none |
| ScanLine | texture | retro, archival | archival, bwCrushed | low | none |
| ShutterClose | transition | narrative | darkFlow | medium | none |
| SlowReveal | text-motion | narrative | darkFlow | low | none |
| StyledSubtitle | text | vlog | all | low | transcripts |
| TextFlash | accent | hype | all | high | none |
| TripStats | text, data | vlog, narrative | all | low | stats-array |
| TypeWriter | text-motion | narrative | all | medium | none |
| Vignette | mood-tool | any | all | low | none |
| WaveformBar | audio-driven, accent | music | all | medium | audio-buffer |
| WhiteFlicker | accent | hype, drop | all | high | none |

## Transitions (`src/core/transitions/`) — 4 components

| Name | Tags | Use-Case | Mood | Energy | Requires |
|---|---|---|---|---|---|
| decorations | transition, texture | any | all | low | none |
| flashCut | transition, accent | hype, drop | all | high | none |
| glitchCut | transition, glitch | hype | redNeon, opium | high | none |
| whipPan | transition, motion | vlog, hype | all | medium | none |

## Library helpers (`src/core/lib/`)

| File | Purpose |
|---|---|
| `audio/useFrequencyBands.ts` | FFT split into sub/lows/mids/highs bands, EMA-smoothed, deterministic |
| `audio/useTransientDetector.ts` | kick-trigger detection with cooldown — drives one-shot effects on hits |
| `audio/useRMSEnvelope.ts` | smooth audio energy with attack/release follower (FFT-free, cheapest) |
| `audio/useSpectralCentroid.ts` | brightness 0..1 — drives color-temp / hue-shift effects |
| `audio/useCrossfadeAudio.ts` | equal-power volume curves for `<Audio>` crossfades (pure math) |
| `audio/usePrecomputedBeatGrid.ts` | reads `<track>_beats.json`, returns frame-relative beat info |
| `audio/index.ts` | barrel export of the 6 hooks |
| `beats.ts` | beat data types + helpers |
| `filters.ts` | **6 mood packs** (`darkFlow`, `redNeon`, `yeezy`, `opium`, `bwCrushed`, `archival`) as CSS filter strings |
| `loadBeats.ts` | beat loader (delayRender + JSON fetch) |
| `motion.ts` | shared motion/easing utilities |
| `photoScore.ts` | photo asset scoring |
| `sfx.ts` + `sfx-manifest.json` | **142-sound SFX library**. Helpers: `pickSfx(category, seed)`, `pickSfxByTags`, `pickSfxByDuration`, `sfxUrl`, `allSfx`, `sfxMeta`. 11 categories: shutter, whoosh, impact, riser, drop, transition, glitch, ui, vinyl, tape, texture |
| `useBeatPulse.ts` | beat-pulse hook (audio-reactive components) |

---

## FX Demo Compositions (`src/projects/eurogang/compositions/fx-demos/`) — 8 components

> These are **full Eurogang demo-compositions** wrapping a single effect for isolated render testing. They are **not** reusable primitives — each one bundles the entire EurogangVlogTrip flow plus one new effect. To reuse the underlying effect in another project, the effect would need extraction first (separate spec, deferred until a real second-consumer need arises).

| Name | Tags | Notes |
|---|---|---|
| BassPumpFX | audio-reactive, transition | uses Eurogang track for beat reactivity, drop-energy |
| GhostEchoFX | cut, temporal | yeezy/opium-flavoured echo on cut |
| JCutFX | transition, audio-lead | vlog narrative — audio leads visual |
| MaskRevealFX | transition | base mask-reveal — pivot of the family |
| MaskRevealCircleFX | transition, geometric | circle-shaped variant |
| MaskRevealCrossFadeFX | transition, soft | crossfade-blend variant — softest |
| MaskRevealSilhouetteFX | transition, cinematic | **winner per CRITIQUES.md** — 2-phase silhouette → expand, 18 frames. Wrapper extracted to `projects/eurogang/lib/fx/MaskRevealWrapper.tsx` 2026-05-08, shared with main composition |
| MaskRevealTinySpotFX | transition, accent | tiny-spot variant — punchiest |

---

## Project-internal shared modules

Components that are reused *within* a project but are too project-coupled to live in `src/core/`. Documented here so future agents can grep for the canonical location.

| Project | Module | Purpose |
|---|---|---|
| eurogang | `projects/eurogang/lib/fx/MaskRevealWrapper.tsx` | Silhouette-variant mask-image wrapper. Used by main `EurogangVlogTrip` + `MaskRevealSilhouetteFX` demo. Phase-1 = 12 frames, total = 18 frames at 30fps. Single source of truth since 2026-05-08 (see `docs/MIGRATIONS/2026-05-08-extract-maskrevealwrapper-ghostecho.md`) |
| eurogang | `projects/eurogang/lib/fx/GhostEcho.tsx` | 4-layer alpha-staggered subject_webm trail. Used by main + `GhostEchoFX` demo. |

## Studies (`src/studies/tricks/`) — 10 effect studies

Isolated demo compositions for distinctive video edit techniques. **Not core primitives** — these are experiments that may graduate to `core/{overlays,transitions}/` when reused.

| Composition ID | Trick |
|---|---|
| `TrickDatamoshFake` | frame-doubled offset displacement |
| `TrickRollingShutter` | jello distortion via slice-skew |
| `TrickFrameSmear` | motion-blur on cut, 5-layer trail |
| `TrickIrisReveal` | aperture/pupil reveal with 6-blade geometry |
| `TrickScopeTracker` | HUD crosshair + brackets that follow target |
| `TrickTypeOnBeat` | kinetic typography burst on fake beat array |
| `TrickStickerBurst` | random sticker explosion on impact |
| `TrickRGBTear` | horizontal slice tear with channel separation |
| `TrickVHSDropout` | random tape-damage frames |
| `TrickCassetteWarp` | wow & flutter visual + pitch-bar |

Preview: `npx remotion studio studies/tricks/index.ts`

## Filtering examples

| Looking for… | Filter | Matches |
|---|---|---|
| **High-energy hype** | `Energy=high\|drop`, `Mood=redNeon\|opium` | BeatFlash, RGBSplit, GlitchOverlay, NegativeFlash, TextFlash, CountdownOverlay, DropPunctuation, WhiteFlicker, MaskRevealTinySpotFX (demo) |
| **Calm narrative vlog** | `Energy=low\|medium`, `Mood=darkFlow\|archival`, `Tags=transition\|text-motion` | KenBurnsImg, SlowReveal, TypeWriter, StyledSubtitle, CaptionOverlay, ShutterClose, ChromaticVignette |
| **Audio-reactive** | `Tags=audio-driven\|audio-reactive` | BeatFlash, AudioPulseBars, WaveformBar, DropPunctuation |
| **Needs face-tracking data** | `Requires=face-tracks` | FaceSpotlight, FaceTrackedLabel |
| **Pure mood-tools (no data needed)** | `Tags=mood-tool`, `Requires=none` | Vignette, ChromaticVignette, AmbientLayers |
| **Glitch / hype accents** | `Tags=glitch\|accent` | GlitchOverlay, RGBSplit, NegativeFlash, TextFlash, WhiteFlicker, BeatFlash, AudioPulseBars, WaveformBar, DropPunctuation, AnimatedText/GlitchHeadline |
| **Text components for vlog** | `Tags=text\|text-motion`, `Use-Case=vlog\|narrative` | AnimatedText, BoldHeadline, CaptionOverlay, ColdOpenCover, DayCard, KineticText, LetterSplit, SlowReveal, StyledSubtitle, TripStats, TypeWriter |
