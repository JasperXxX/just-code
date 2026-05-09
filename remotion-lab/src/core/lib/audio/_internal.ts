/**
 * Shared internals for the audio-reactive hook library.
 *
 * Kept private (underscore prefix) — not re-exported from index.ts. Tests and
 * other library files import directly from here. External callers should
 * always go through the public hook surface.
 */

import type { MediaUtilsAudioData } from '@remotion/media-utils';

/**
 * Map an FFT bin index to a Hz value, given the audio data and the number of
 * FFT bins requested. visualizeAudio() returns `numberOfSamples` magnitudes
 * spanning [0, sampleRate/2].
 */
export function binToHz(
  binIndex: number,
  numberOfSamples: number,
  sampleRate: number
): number {
  // The N bins span [0, Nyquist] linearly.
  return (binIndex / numberOfSamples) * (sampleRate / 2);
}

/**
 * Convert a Hz range to inclusive [startBin, endBin] indices into the
 * `numberOfSamples`-length output of visualizeAudio.
 */
export function hzRangeToBins(
  loHz: number,
  hiHz: number,
  numberOfSamples: number,
  sampleRate: number
): { start: number; end: number } {
  const nyquist = sampleRate / 2;
  const start = Math.max(
    0,
    Math.floor((loHz / nyquist) * numberOfSamples)
  );
  const end = Math.min(
    numberOfSamples - 1,
    Math.ceil((hiHz / nyquist) * numberOfSamples)
  );
  return { start, end: Math.max(start, end) };
}

/**
 * Mean of bins in [start..end] inclusive. Returns 0 if range is empty.
 */
export function meanBins(bins: number[], start: number, end: number): number {
  if (end < start) return 0;
  let sum = 0;
  for (let i = start; i <= end && i < bins.length; i++) sum += bins[i];
  return sum / Math.max(1, end - start + 1);
}

/**
 * Deterministic exponential moving average: walk frames [startFrame..frame]
 * computing a per-frame value via `valueAt`, threading EMA state forward.
 * Returns the EMA at `frame`. NO React state — the recurrence is recomputed
 * from scratch each call, so it's stable across remounts and seeks.
 *
 * `alpha` is the new-sample weight (higher = faster response).
 */
export function deterministicEMA(
  startFrame: number,
  endFrame: number,
  alpha: number,
  valueAt: (f: number) => number
): number {
  let ema = valueAt(startFrame);
  for (let f = startFrame + 1; f <= endFrame; f++) {
    const v = valueAt(f);
    ema = ema * (1 - alpha) + v * alpha;
  }
  return ema;
}

/**
 * Asymmetric attack/release envelope follower — like an analog compressor's
 * sidechain. Faster attack than release gives a punchy "hold then sag" feel.
 *
 * Recomputes the chain across [startFrame..endFrame] for determinism.
 */
export function deterministicAttackRelease(
  startFrame: number,
  endFrame: number,
  attack: number,
  release: number,
  valueAt: (f: number) => number
): number {
  let env = valueAt(startFrame);
  for (let f = startFrame + 1; f <= endFrame; f++) {
    const v = valueAt(f);
    const a = v > env ? attack : release;
    env = env * (1 - a) + v * a;
  }
  return env;
}

/**
 * RMS over a slice of a Float32 channel waveform — sample-accurate, doesn't
 * touch the FFT path. `start` and `end` are sample indices, clamped to the
 * waveform length.
 */
export function rmsSlice(
  waveform: Float32Array,
  start: number,
  end: number
): number {
  const lo = Math.max(0, Math.floor(start));
  const hi = Math.min(waveform.length, Math.ceil(end));
  if (hi <= lo) return 0;
  let sum = 0;
  for (let i = lo; i < hi; i++) {
    const s = waveform[i];
    sum += s * s;
  }
  return Math.sqrt(sum / (hi - lo));
}

/**
 * Type alias re-export so consumers don't need to reach into media-utils' dist.
 */
export type AudioBuffer = MediaUtilsAudioData;
