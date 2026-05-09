/**
 * Audio-reactive hooks for Remotion compositions.
 *
 * All hooks are deterministic given (frame, audioSrc, options) — safe for
 * server-side renders. See ./README.md for usage and the
 * precomputed-vs-live-FFT decision tree.
 */

export { useFrequencyBands } from './useFrequencyBands';
export type {
  FrequencyBands,
  UseFrequencyBandsOptions,
} from './useFrequencyBands';

export { useTransientDetector } from './useTransientDetector';
export type {
  UseTransientDetectorOptions,
  TransientResult,
  TransientBand,
} from './useTransientDetector';

export { useRMSEnvelope } from './useRMSEnvelope';
export type { UseRMSEnvelopeOptions } from './useRMSEnvelope';

export { useSpectralCentroid } from './useSpectralCentroid';
export type { UseSpectralCentroidOptions } from './useSpectralCentroid';

export { useCrossfadeAudio } from './useCrossfadeAudio';
export type {
  CrossfadeCurve,
  CrossfadeVolumes,
  UseCrossfadeAudioArgs,
} from './useCrossfadeAudio';

export { usePrecomputedBeatGrid } from './usePrecomputedBeatGrid';
export type {
  BeatGridEntry,
  BeatGridResult,
  UsePrecomputedBeatGridOptions,
} from './usePrecomputedBeatGrid';
