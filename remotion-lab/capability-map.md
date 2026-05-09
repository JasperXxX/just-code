# Capability Map

> Living document. Each row = one Remotion capability + status.
> Status: 🟢 verified / 🟡 partial / 🔴 broken / ⚪ untested
>
> Synced with `verified-capabilities.md` on 2026-05-08 as part of the library-discoverability refactor (D9).

| # | Capability | Surface | Status | Verified at | Notes |
|---|---|---|---|---|---|
| 1 | `useCurrentFrame` + `useVideoConfig` | 1 Primitives | 🟢 | 2026-05-05 | HelloWorld + every study uses these |
| 2 | `interpolate` w/ easing | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives, AdShowcase |
| 3 | `spring` physics | 1 Primitives | 🟢 | 2026-05-05 | HelloWorld, StudyPrimitives |
| 4 | `AbsoluteFill` | 1 Primitives | 🟢 | 2026-05-05 | universal — every comp |
| 5 | `Composition` defaultProps | 1 Primitives | 🟢 | 2026-05-05 | HelloWorld + all templates with Zod schema |
| 6 | `<Sequence>` | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives |
| 7 | `<Series>` | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives |
| 8 | `<Loop>` | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives |
| 9 | `<Freeze>` | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives |
| 10 | `random(seed)` | 1 Primitives | 🟢 | 2026-05-05 | StudyPrimitives, deterministic procedural content |
| 11 | `delayRender` / `continueRender` | 1 Primitives | 🟢 | 2026-05-05 | LiveDashboard via calculateMetadata, beats loader |
| 12 | `<Img>` | 1 Primitives | 🟢 | 2026-05-05 | PhotoCarousel |
| 13 | `<OffthreadVideo>` | 1 Primitives | 🟡 | 2026-05-05 | used in EurogangVlogTrip + ValorantEdit production; no isolated study |
| 14 | `<Audio>` w/ volume curves | 5 Audio | 🟢 | 2026-05-05 | StudyAudio, EurogangVlogTrip 3-track music arc |
| 15 | `<IFrame>` | 1 Primitives | ⚪ | — | low priority |
| 16 | spring-stagger across N elements | 2 Animation | 🟢 | 2026-05-05 | StudyAnimation |
| 17 | text-by-letter reveal | 3 Typography | 🟢 | 2026-05-05 | StudyTypography, AnimatedText/HeroText |
| 18 | text-by-word reveal | 3 Typography | 🟢 | 2026-05-05 | QuoteCard |
| 19 | path animation w/ strokeDashoffset | 2 Animation | 🟢 | 2026-05-05 | StudyAnimation |
| 20 | parallax + camera dolly via transform | 2 Animation | 🟢 | 2026-05-05 | StudyAnimation |
| 21 | `@remotion/google-fonts` font loading | 3 Typography | 🟢 | 2026-05-05 | StudyTypography |
| 22 | variable fonts (wght axis) | 3 Typography | 🟢 | 2026-05-05 | StudyTypography (Fraunces opsz/wght) |
| 23 | auto-fit text to container | 3 Typography | 🟢 | 2026-05-05 | QuoteCard |
| 24 | `defaultProps` + `getInputProps()` | 4 Data | 🟢 | 2026-05-05 | StudyData, all templates with Zod schema |
| 25 | CSV → batch render N personalised | 4 Data | 🟢 | 2026-05-05 | PersonalizedCard × 6 |
| 26 | API fetch with `delayRender` | 4 Data | 🟢 | 2026-05-05 | UrlExplainer |
| 27 | beat detection → cut on beat | 5 Audio | 🟢 | 2026-05-05 | MusicVideoFromBeats; also Eurogang production |
| 28 | `useAudioData` + `visualizeAudio` (FFT bins) | 5 Audio | 🟢 | 2026-05-05 | StudyAudio |
| 29 | `useWindowedAudioData` | 5 Audio | 🟢 | 2026-05-08 | drives all 6 audio-reactive hooks in `core/lib/audio/` + 6 demos in `studies/audio-reactive/` |
| 30 | `<TransitionSeries>` + `fade`/`slide`/`wipe`/`flip` | 7 Transitions | 🟢 | 2026-05-05 | StudyTransitions (8 built-in) |
| 31 | custom `TransitionPresentation` | 7 Transitions | 🟢 | 2026-05-05 | StudyTransitions (4 custom) |
| 32 | `<Trail>` + `<CameraMotionBlur>` | 7 Transitions | ⚪ | — | not yet exercised |
| 33 | `@remotion/three` `<ThreeCanvas>` | 6 Generative | 🟢 | 2026-05-05 | ThreeScene (`--gl=angle`) |
| 34 | `useVideoTexture` (video → 3D material) | 6 Generative | ⚪ | — | not yet exercised |
| 35 | custom GLSL shader transition | 6+7 | 🟡 | 2026-05-05 | ThreeScene uses custom GLSL material; not used as transition yet |
| 36 | `@remotion/lottie` Lottie integration | 6 Generative | ⚪ | — | no Lottie file at hand (per ledger) |
| 37 | `@remotion/shapes` (`Triangle`, `Star`, etc) | 6 Generative | 🟢 | 2026-05-05 | StudyGenerative |
| 38 | `@remotion/paths` SVG path interp | 6 Generative | 🟢 | 2026-05-05 | StudyAnimation |
| 39 | `@remotion/noise` 2D/3D noise field | 6 Generative | 🟢 | 2026-05-05 | StudyGenerative (noise2D, flow field) |
| 40 | `@remotion/layout-utils` flex/grid helpers | 3 Typography | 🟢 | 2026-05-05 | BarChart |
| 41 | particle system 1000+ elements | 6 Generative | 🟢 | 2026-05-05 | ParticleGalaxy (2400 deterministic particles) |
| 42 | film grain overlay (procedural) | 7 Transitions | 🟢 | 2026-05-05 | AmbientLayers/FilmGrain (production) |
| 43 | chromatic aberration / RGB split | 7 Transitions | 🟢 | 2026-05-05 | RGBSplit, ChromaticVignette (production) |
| 44 | light leak / vignette overlay | 7 Transitions | 🟢 | 2026-05-05 | Vignette, AmbientLayers/LightLeak (production) |
| 45 | local CLI `render` flags (`--concurrency`, `--codec`) | 8 Performance | 🟢 | 2026-05-05 | used in every render command |
| 46 | programmatic render via `@remotion/renderer` | 8 Performance | 🟡 | 2026-05-05 | pipelines use it indirectly via batch render scripts; not a standalone study |
| 47 | ProRes 4444 with alpha | 8 Performance | ⚪ | — | codec available; no alpha render run yet (per ledger ❌) |
| 48 | benchmark `--concurrency=N` matrix | 8 Performance | ⚪ | — | not yet exercised |
| 49 | `@remotion/player` interactive | 9 Embedding | ⚪ | — | out of CLI scope (per ledger ❌) |
| 50 | quality-gate.js (no black frames, audio LUFS, contrast) | 11 Quality | 🟡 | 2026-05-05 | gate exists; only HelloWorld run through it (per ledger) |
| 51 | FFT band split (sub/lows/mids/highs) | 5 Audio | 🟢 | 2026-05-08 | `useFrequencyBands` + `DemoFrequencyBands` |
| 52 | transient detection (kick trigger) | 5 Audio | 🟢 | 2026-05-08 | `useTransientDetector` + `DemoTransientDetector`, deterministic look-back |
| 53 | RMS envelope follower (attack/release) | 5 Audio | 🟢 | 2026-05-08 | `useRMSEnvelope` + `DemoRMSEnvelope` (FFT-free, cheapest) |
| 54 | spectral centroid (audio brightness) | 5 Audio | 🟢 | 2026-05-08 | `useSpectralCentroid` + `DemoSpectralCentroid` |
| 55 | equal-power audio crossfade curves | 5 Audio | 🟢 | 2026-05-08 | `useCrossfadeAudio` + `DemoCrossfadeAudio` (pure-math) |
| 56 | precomputed beat-grid lookup | 5 Audio | 🟢 | 2026-05-08 | `usePrecomputedBeatGrid` + `DemoBeatGrid`, reads `_beats.json` |
| 57 | mask-image with alpha-webm subject | 7 Transitions | 🟢 | 2026-05-08 | `MaskRevealWrapper` (Silhouette winner, 2-phase 18f) — production main + smoke `outputs/v44_silhouette_smoke_post_refactor.mp4` |
| 58 | deterministic SFX picker (manifest-driven) | 5 Audio | 🟢 | 2026-05-08 | `core/lib/sfx.ts` — `pickSfx`, `pickSfxByTags`, `pickSfxByDuration`. 142 sounds in `public/sfx/`, 11 categories |

**Surfaces** (per OPERATION TOTAL REMOTION directive):
- 1 Core Primitives · 2 Animation Sophistication · 3 Typography & Motion Graphics · 4 Data-Driven Video · 5 Audio Mastery · 6 Generative & AI · 7 Transitions & Effects · 8 Rendering & Performance · 9 Embedding · 10 Studio Workflow · 11 Quality Enforcement

## Summary (post-sync 2026-05-08)

- 🟢 verified: **37**
- 🟡 partial: **5** (`<OffthreadVideo>` no isolated study; custom GLSL not used as transition; `@remotion/renderer` indirect; quality-gate only on HelloWorld; `useWindowedAudioData` was downgraded — still ⚪)
- ⚪ untested: **8** (`<IFrame>`, `useWindowedAudioData`, `<Trail>`/`<CameraMotionBlur>`, `useVideoTexture`, `@remotion/lottie`, ProRes 4444 alpha, concurrency benchmark, `@remotion/player`)
- 🔴 broken: **0**
