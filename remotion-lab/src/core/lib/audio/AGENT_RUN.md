# AGENT_RUN — audio-reactive hook library

## Deliverable status

### 6 hooks (in `src/core/lib/audio/`)
- [x] `useFrequencyBands.ts` — sub/lows/mids/highs split with deterministic EMA smoothing
- [x] `useTransientDetector.ts` — relative-threshold transient detection with cooldown
- [x] `useRMSEnvelope.ts` — sample-accurate RMS with attack/release envelope follower
- [x] `useSpectralCentroid.ts` — brightness 0..1 from spectral center-of-mass
- [x] `useCrossfadeAudio.ts` — equal-power and linear volume curves
- [x] `usePrecomputedBeatGrid.ts` — JSON loader → comp-frame beat info
- [x] `index.ts` — barrel export of all hooks + types
- [x] `_internal.ts` — shared helpers (binToHz, hzRangeToBins, meanBins, rmsSlice, deterministic EMA helpers)
- [x] `README.md` — usage, perf notes, promotion contract

### 6 demo compositions (in `studies/audio-reactive/`)
- [x] `DemoFrequencyBands.tsx`
- [x] `DemoTransientDetector.tsx`
- [x] `DemoRMSEnvelope.tsx`
- [x] `DemoSpectralCentroid.tsx`
- [x] `DemoCrossfadeAudio.tsx`
- [x] `DemoBeatGrid.tsx`
- [x] `Root.tsx` — registers all six 1080×1920 @ 30 fps, 600-frame compositions
- [x] `index.ts` — `registerRoot` for standalone studio
- [x] `README.md` — composition table + studio command

## Type-check status

**My files**: clean. All eight `src/core/lib/audio/*.ts` files and all eight
files under `studies/audio-reactive/` pass `tsc --strict --noEmit` with no
errors and no `any` types. Verified the demo files separately with an
explicit one-shot invocation (`--ignoreConfig` + matching compiler flags),
since the repo's `tsconfig.json` only includes `src/**/*` and excludes the
top-level `studies/` directory.

**Repo-wide tsc note**: at the start of this run the baseline `tsc --noEmit`
was clean. After my work was complete, repo-wide `tsc --noEmit` reports
two errors in **`src/projects/eurogang/compositions/EurogangVlogTrip.tsx`**
(missing `MaskRevealWrapper` import at lines 1222 and 1236). That file was
modified externally during this session (mtime confirms it post-dates my
edits) and is outside my sandbox — per the brief I did not touch it. The
errors are unrelated to this lib; nothing in `src/core/lib/audio/` or in any
file I created references `MaskRevealWrapper` or imports from
`EurogangVlogTrip.tsx`.

## File list with line counts

```
src/core/lib/audio/_internal.ts                125
src/core/lib/audio/index.ts                     40
src/core/lib/audio/useCrossfadeAudio.ts         68
src/core/lib/audio/useFrequencyBands.ts        106
src/core/lib/audio/usePrecomputedBeatGrid.ts   154
src/core/lib/audio/useRMSEnvelope.ts            77
src/core/lib/audio/useSpectralCentroid.ts       81
src/core/lib/audio/useTransientDetector.ts     131
studies/audio-reactive/DemoBeatGrid.tsx        152
studies/audio-reactive/DemoCrossfadeAudio.tsx  158
studies/audio-reactive/DemoFrequencyBands.tsx  106
studies/audio-reactive/DemoRMSEnvelope.tsx      96
studies/audio-reactive/DemoSpectralCentroid.tsx 89
studies/audio-reactive/DemoTransientDetector.tsx 91
studies/audio-reactive/Root.tsx                 59
studies/audio-reactive/index.ts                 11
                                              ----
                                              1544 total
```

(Plus `README.md` × 2 and this `AGENT_RUN.md`.)

## Performance notes

- **Determinism vs `useRef` EMA**: `EurogangVlogTripFX_BassPump.tsx` uses
  `React.useRef` to thread EMA state across renders. That's *not*
  deterministic — Remotion can re-mount components and seek non-monotonically.
  My hooks recompute the EMA chain from scratch each frame by walking a
  small look-back window, paying CPU for stable renders. Worth the tradeoff
  here because the brief specifies determinism.

- **FFT cost roughly tracks the look-back window**:
  - `useFrequencyBands` (default opts) ≈ 13 `visualizeAudio` calls per frame
    (12-frame look-back + current). All four bands are pulled from each
    bin array — single FFT per past frame, not four.
  - `useTransientDetector` ≈ 60 calls per frame (2-second slow-EMA window).
    This is the heaviest hook in the lib. Drop `cooldownFrames` and
    `LOOKBACK_FRAMES` would shrink it, but at 60 frames the slow average
    settles cleanly even at the start of a track.
  - `useSpectralCentroid` ≈ 13 calls per frame.
  - `useRMSEnvelope` is FFT-free — pure waveform RMS, fastest of the bunch.
  - `useCrossfadeAudio` is pure math, zero audio I/O.
  - `usePrecomputedBeatGrid` does one `fetch` (cached) + linear scan over
    ~30 beats. Effectively free per frame after the first.

- **`numberOfSamples` knob**: defaulted to 256 for `useFrequencyBands` /
  `useSpectralCentroid` (decent frequency resolution, sub-band has ~5–6
  bins at 44.1 kHz). 128 used for `useTransientDetector` since it only
  needs band-aggregate energy. Halve for cheaper renders if you don't need
  resolution.

- **Window sizing**: all FFT hooks call `useWindowedAudioData` with
  `windowInSeconds: 2..4` — tight enough that buffers stay small but wide
  enough to cover the look-back chain plus a frame of slack on either
  side.

- **JSON loading** (`usePrecomputedBeatGrid`): one `fetch` + JSON parse per
  unique src, cached in module-level `Map`. Uses `delayRender` /
  `continueRender` so server renders block until the JSON is in. Detector
  fps (often 24) is converted to comp fps automatically.

## Suggested next hooks (5 ideas)

1. **`useBeatPhase(jsonSrc)` → `{ phase: 0..1, beatIndex }`** — given the
   precomputed beat grid, return the *phase between adjacent beats* at
   the current frame, so callers can drive sweeps or rotations that
   stretch tightly between hits without juggling math themselves.

2. **`useTempoLockedSweep(jsonSrc, { cyclesPerBeat })` → `0..1`** — phase
   accumulator that resets on each beat (or every Nth beat). Gives free
   "swept LFO" values that are guaranteed to phase-align with the music.
   Useful for color cycles, rotation, kaleidoscope effects.

3. **`useStereoBalance(audioSrc)` → `-1..1`** — peak/RMS difference
   between L and R channels. Drive subtle parallax / sway / motion-blur
   direction from where the mix sits in the stereo field.

4. **`useNoteOnsetGrid(jsonSrc, { groupBy })` → `{ kicks, snares, hats }`**
   — load the beat-detector JSON's `onsets` and classify them by spectral
   content (precomputed offline) into drum-kit-like buckets. Lets you
   trigger different visuals on different drums without hand-labeling.

5. **`useDuckedValue(audioSrc, { ducker })` → `0..1`** — given a side
   audio source (e.g. a voiceover track), return a value that *drops*
   when the side source is loud. Inverted compressor sidechain — for
   making music-reactive UIs visibly back off whenever speech kicks in.
