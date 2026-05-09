/**
 * useTransientDetector — emits a one-frame `isTransient: true` when the
 * monitored band's energy spikes above (slow-running average × 1+threshold).
 *
 * Algorithm (deterministic, recomputed each call):
 *   1. Walk frames [frame - LOOKBACK .. frame] running a slow EMA (alpha 0.08)
 *      and tracking when the per-frame value exceeds slowEma * (1 + threshold).
 *   2. The current frame is a transient iff:
 *      - value(frame) crosses the dynamic threshold AND
 *      - the last detected transient was at least `cooldownFrames` ago.
 *   3. `framesSinceLast` is the gap to the most recent past detection inside
 *      the lookback window (clamped at LOOKBACK).
 *   4. `intensity` is the relative excess: (value - slowEma) / slowEma at the
 *      current frame, clamped to [0,1].
 *
 * Why a slow EMA + relative threshold rather than a fixed magnitude cutoff:
 * keeps detection robust across loud and quiet sections of the same track.
 */

import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { hzRangeToBins, meanBins } from './_internal';

export type TransientBand = 'sub' | 'lows' | 'all';

export type UseTransientDetectorOptions = {
  /** Relative spike threshold above the slow-running average. 0..1, default 0.5. */
  threshold?: number;
  /** Minimum frame gap between consecutive triggers. Default 6 (0.2s @ 30fps). */
  cooldownFrames?: number;
  /** Which frequency band to monitor. Default 'lows' (good for kicks). */
  band?: TransientBand;
};

export type TransientResult = {
  isTransient: boolean;
  framesSinceLast: number;
  intensity: number;
};

// 60 frames (2s @ 30fps) gives the slow EMA enough history to be stable and
// covers cooldownFrames up to 60.
const LOOKBACK_FRAMES = 60;
const SLOW_ALPHA = 0.08;
const NUMBER_OF_SAMPLES = 128;

const ZERO: TransientResult = {
  isTransient: false,
  framesSinceLast: LOOKBACK_FRAMES,
  intensity: 0,
};

export function useTransientDetector(
  audioSrc: string,
  options: UseTransientDetectorOptions = {}
): TransientResult {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const threshold = options.threshold ?? 0.5;
  const cooldownFrames = options.cooldownFrames ?? 6;
  const band: TransientBand = options.band ?? 'lows';

  const win = useWindowedAudioData({
    src: audioSrc,
    frame,
    fps,
    windowInSeconds: 4,
  });
  if (!win.audioData) return ZERO;

  const { audioData, dataOffsetInSeconds } = win;
  const sampleRate = audioData.sampleRate;

  // Resolve band → bin range. 'all' = full spectrum mean.
  const range =
    band === 'sub'
      ? hzRangeToBins(0, 60, NUMBER_OF_SAMPLES, sampleRate)
      : band === 'lows'
        ? hzRangeToBins(60, 250, NUMBER_OF_SAMPLES, sampleRate)
        : { start: 0, end: NUMBER_OF_SAMPLES - 1 };

  const startFrame = Math.max(0, frame - LOOKBACK_FRAMES);
  let slowEma = 0;
  let initialized = false;
  let lastTransientFrame = -Infinity;
  let currentValue = 0;
  let currentSlow = 0;

  for (let f = startFrame; f <= frame; f++) {
    const bins = visualizeAudio({
      audioData,
      frame: f,
      fps,
      numberOfSamples: NUMBER_OF_SAMPLES,
      optimizeFor: 'speed',
      dataOffsetInSeconds,
    });
    const v = meanBins(bins, range.start, range.end);

    if (!initialized) {
      slowEma = v;
      initialized = true;
    } else {
      // The slow EMA must NOT include big spikes — otherwise the threshold
      // walks up after every transient and we miss the next one. Only update
      // the slow EMA when v stays under (slowEma * (1 + threshold)).
      const dynThr = slowEma * (1 + threshold);
      if (v < dynThr || slowEma < 1e-6) {
        slowEma = slowEma * (1 - SLOW_ALPHA) + v * SLOW_ALPHA;
      } else if (f - lastTransientFrame >= cooldownFrames) {
        lastTransientFrame = f;
      }
    }
    if (f === frame) {
      currentValue = v;
      currentSlow = slowEma;
    }
  }

  const isTransient = lastTransientFrame === frame;
  const framesSinceLast =
    lastTransientFrame === -Infinity
      ? LOOKBACK_FRAMES
      : frame - lastTransientFrame;
  const intensity =
    currentSlow > 1e-6
      ? Math.min(1, Math.max(0, (currentValue - currentSlow) / currentSlow))
      : 0;

  return { isTransient, framesSinceLast, intensity };
}
