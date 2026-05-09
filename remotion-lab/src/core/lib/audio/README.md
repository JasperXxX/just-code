# `src/core/lib/audio` — audio-reactive hooks

A small library of typed React hooks that make it dead-simple to drive any
visual parameter in a Remotion composition from audio: frequency bands,
transients, energy envelope, spectral content, beat grids. Each hook returns
deterministic values given `(frame, audioSrc, options)` — safe across server
renders and seek-arounds.

## Hook reference

| Hook | Purpose | Key options |
| --- | --- | --- |
| `useFrequencyBands(src)` | Live FFT split into sub / lows / mids / highs (0..1 each). Drive multi-band-reactive UI. | `smoothing`, `numberOfSamples` |
| `useTransientDetector(src)` | One-frame `isTransient` spike when the monitored band exceeds its slow average. Trigger zooms / flashes / cuts. | `threshold`, `cooldownFrames`, `band` |
| `useRMSEnvelope(src)` | Sample-accurate energy envelope with attack/release dynamics. Sidechain for continuous params. | `windowMs`, `attack`, `release` |
| `useSpectralCentroid(src)` | "Brightness" 0..1 (dark/bassy → bright/airy). Drive hue / temperature / glow. | `smoothing`, `numberOfSamples` |
| `useCrossfadeAudio({...})` | Equal-power or linear volume curves for two `<Audio>` tags during a frame window. | `curve`, `startFrame`, `endFrame` |
| `usePrecomputedBeatGrid(jsonSrc)` | Loads a beat-detector JSON and reports nearest / next / last beat in *comp frames*. | `windowFrames` |

All hooks live under one barrel:

```ts
import {
  useFrequencyBands,
  useTransientDetector,
  useRMSEnvelope,
  useSpectralCentroid,
  useCrossfadeAudio,
  usePrecomputedBeatGrid,
} from '../core/lib/audio';
```

## Usage snippet

A composition that pulses the whole frame on every kick and tints the
background based on brightness:

```tsx
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import {
  useFrequencyBands,
  useTransientDetector,
  useSpectralCentroid,
} from '../core/lib/audio';

export const Pulse: React.FC = () => {
  const src = staticFile('aye_20s_section.wav');
  const bands = useFrequencyBands(src);
  const { isTransient, framesSinceLast } = useTransientDetector(src, {
    band: 'lows',
    threshold: 0.5,
  });
  const brightness = useSpectralCentroid(src);

  const punch = Math.max(0, 1 - framesSinceLast / 8);
  const scale = 1 + punch * 0.06 + bands.lows * 0.04;
  const hue = 220 + brightness * 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `hsl(${hue}, 50%, ${10 + brightness * 30}%)`,
        transform: `scale(${scale})`,
      }}
    >
      <Audio src={src} />
      {/* …your content… */}
    </AbsoluteFill>
  );
};
```

## Performance: precomputed JSON vs live FFT

**Prefer `usePrecomputedBeatGrid` when:**
- you need stable beat positions across the entire track
- the track has quiet sections where live FFT would miss kicks
- you're rendering the full timeline (not just a snippet)
- you want zero CPU cost per frame (lookup only)

**Use the live-FFT hooks (`useFrequencyBands`, `useTransientDetector`,
`useSpectralCentroid`, `useRMSEnvelope`) when:**
- you don't have a precomputed JSON
- you want continuous-valued reactivity (envelopes, brightness sweeps),
  not discrete beats
- you need the *current* spectral content, not just hit timing

Each live-FFT hook walks a small look-back chain (12–60 frames) per call to
recompute its smoothing state deterministically. At default settings a
`useFrequencyBands` call costs roughly 13 calls to `visualizeAudio` per
frame; `useTransientDetector` runs ~60. If you're stacking many live hooks on
the same track, expect render-time cost to scale linearly. Use
`numberOfSamples: 128` (or even 64) and `optimizeFor: 'speed'` (already the
default in this lib) to keep it cheap.

## Promotion contract

Hooks under this directory are stable. Their signatures are versioned with
the surrounding repo and won't break silently — bug fixes only, no behavior
changes that would shift renders. **Experimental / exploratory ideas live in
`studies/audio-reactive/`** until they prove themselves and graduate here.
That keeps this directory's surface intentionally small and load-bearing.
