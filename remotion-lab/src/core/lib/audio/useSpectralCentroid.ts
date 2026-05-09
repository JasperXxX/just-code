/**
 * useSpectralCentroid — the "brightness" of the audio at the current frame.
 *
 * Spectral centroid = center of mass of the magnitude spectrum. Low centroid
 * = bassy / dark / muffled; high centroid = bright / airy / sibilant. Typical
 * popular music sits around 1.5-4 kHz; we map 0..6 kHz → 0..1 for usable
 * normalized output.
 *
 * Formula: sum(bin_i * mag_i) / sum(mag_i), where bin_i is the Hz of bin i.
 *
 * Deterministic via a recomputed-EMA chain — same pattern as the other hooks.
 */

import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { binToHz } from './_internal';

export type UseSpectralCentroidOptions = {
  /** EMA new-sample weight, 0..1. Default 0.3. */
  smoothing?: number;
  /** FFT bin count. Default 256. */
  numberOfSamples?: number;
};

const LOOKBACK_FRAMES = 12;
// 6 kHz is a generous brightness ceiling — sibilance and bright cymbals push
// near 5 kHz, so 6 kHz puts most music in the [0..0.7] region without
// clipping at 1 too often.
const BRIGHTNESS_CEILING_HZ = 6000;

export function useSpectralCentroid(
  audioSrc: string,
  options: UseSpectralCentroidOptions = {}
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const smoothing = options.smoothing ?? 0.3;
  const numberOfSamples = options.numberOfSamples ?? 256;

  const win = useWindowedAudioData({
    src: audioSrc,
    frame,
    fps,
    windowInSeconds: 2,
  });
  if (!win.audioData) return 0;

  const { audioData, dataOffsetInSeconds } = win;
  const sampleRate = audioData.sampleRate;

  const startFrame = Math.max(0, frame - LOOKBACK_FRAMES);
  let ema = 0;
  let initialized = false;

  for (let f = startFrame; f <= frame; f++) {
    const bins = visualizeAudio({
      audioData,
      frame: f,
      fps,
      numberOfSamples,
      optimizeFor: 'speed',
      dataOffsetInSeconds,
    });
    let weightedSum = 0;
    let magSum = 0;
    for (let i = 0; i < bins.length; i++) {
      const m = bins[i];
      weightedSum += m * binToHz(i, numberOfSamples, sampleRate);
      magSum += m;
    }
    const centroidHz = magSum > 1e-6 ? weightedSum / magSum : 0;
    const v = Math.min(1, Math.max(0, centroidHz / BRIGHTNESS_CEILING_HZ));
    if (!initialized) {
      ema = v;
      initialized = true;
    } else {
      ema = ema * (1 - smoothing) + v * smoothing;
    }
  }
  return ema;
}
