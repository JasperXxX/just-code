/**
 * useFrequencyBands — split the live FFT spectrum into 4 perceptual bands.
 *
 * Bands (Hz):
 *   sub   0–60     thump / sub-bass
 *   lows  60–250   kicks, bass guitar fundamentals
 *   mids  250–2000 vocals, snares, melody
 *   highs 2000–16000 hats, cymbals, sibilance, air
 *
 * Each band is the mean magnitude of the FFT bins falling inside its range,
 * clamped to [0, 1]. Smoothing is a deterministic EMA across the last
 * `~smoothingFrames` frames — recomputed each call so renders are stable
 * regardless of mount order or seeking.
 */

import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { hzRangeToBins, meanBins } from './_internal';

export type FrequencyBands = {
  sub: number;
  lows: number;
  mids: number;
  highs: number;
};

export type UseFrequencyBandsOptions = {
  /** EMA new-sample weight per frame, 0..1. Lower = smoother. Default 0.3. */
  smoothing?: number;
  /** FFT bin count. Default 256. Higher = more frequency resolution, more CPU. */
  numberOfSamples?: number;
};

const ZERO: FrequencyBands = { sub: 0, lows: 0, mids: 0, highs: 0 };

// We integrate EMA over a fixed look-back window. 12 frames (0.4s @ 30fps) is
// enough for the EMA to settle from any starting point at default alpha=0.3.
const SMOOTHING_LOOKBACK_FRAMES = 12;

export function useFrequencyBands(
  audioSrc: string,
  options: UseFrequencyBandsOptions = {}
): FrequencyBands {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const smoothing = options.smoothing ?? 0.3;
  const numberOfSamples = options.numberOfSamples ?? 256;

  // windowInSeconds must cover both the smoothing look-back AND the current
  // frame. 2s gives a comfortable buffer on either side.
  const win = useWindowedAudioData({
    src: audioSrc,
    frame,
    fps,
    windowInSeconds: 2,
  });

  if (!win.audioData) return ZERO;

  const { audioData, dataOffsetInSeconds } = win;
  const sampleRate = audioData.sampleRate;

  const subRange = hzRangeToBins(0, 60, numberOfSamples, sampleRate);
  const lowsRange = hzRangeToBins(60, 250, numberOfSamples, sampleRate);
  const midsRange = hzRangeToBins(250, 2000, numberOfSamples, sampleRate);
  const highsRange = hzRangeToBins(2000, 16000, numberOfSamples, sampleRate);

  const startFrame = Math.max(0, frame - SMOOTHING_LOOKBACK_FRAMES);

  // Walk the EMA chain once; per-frame we compute the FFT a single time and
  // pull all four bands from the same bins array. Avoids 4× redundant FFT.
  let subEma = 0;
  let lowsEma = 0;
  let midsEma = 0;
  let highsEma = 0;
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
    const sV = Math.min(1, Math.max(0, meanBins(bins, subRange.start, subRange.end)));
    const lV = Math.min(1, Math.max(0, meanBins(bins, lowsRange.start, lowsRange.end)));
    const mV = Math.min(1, Math.max(0, meanBins(bins, midsRange.start, midsRange.end)));
    const hV = Math.min(1, Math.max(0, meanBins(bins, highsRange.start, highsRange.end)));
    if (!initialized) {
      subEma = sV;
      lowsEma = lV;
      midsEma = mV;
      highsEma = hV;
      initialized = true;
    } else {
      subEma = subEma * (1 - smoothing) + sV * smoothing;
      lowsEma = lowsEma * (1 - smoothing) + lV * smoothing;
      midsEma = midsEma * (1 - smoothing) + mV * smoothing;
      highsEma = highsEma * (1 - smoothing) + hV * smoothing;
    }
  }

  return { sub: subEma, lows: lowsEma, mids: midsEma, highs: highsEma };
}
