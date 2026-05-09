/**
 * useCrossfadeAudio — compute volume curves for a two-track crossfade.
 *
 * Returns the volumes you should plug into two `<Audio>` tags during the
 * crossfade window [startFrame..endFrame]. Outside the window the curves
 * resolve to {1, 0} (before) or {0, 1} (after).
 *
 * Curves:
 *   - 'equal-power': prevVol = cos(t * π/2), nextVol = sin(t * π/2). Keeps
 *     the perceived loudness roughly constant across the transition. Best
 *     for uncorrelated material (different songs).
 *   - 'linear': prevVol = 1-t, nextVol = t. Slight perceptual dip at the
 *     midpoint but correct for *correlated* material (same song fading to a
 *     different mix of itself).
 *
 * Pure function of `useCurrentFrame()` — composable, no side effects, no
 * `<Audio>` rendering. The caller stays in control of placement and looping.
 */

import { useCurrentFrame } from 'remotion';

export type CrossfadeCurve = 'equal-power' | 'linear';

export type UseCrossfadeAudioArgs = {
  /** Required for symmetry with the other hooks but not actually consumed —
   *  the volume curves don't depend on the audio buffers themselves.
   *  Kept in the signature so callers can wire `<Audio src={prevSrc} />`
   *  without juggling a separate import path. */
  prevSrc: string;
  nextSrc: string;
  startFrame: number;
  endFrame: number;
  curve?: CrossfadeCurve;
};

export type CrossfadeVolumes = {
  prevVolume: number;
  nextVolume: number;
};

export function useCrossfadeAudio(args: UseCrossfadeAudioArgs): CrossfadeVolumes {
  const frame = useCurrentFrame();
  const { startFrame, endFrame, curve = 'equal-power' } = args;
  // prevSrc / nextSrc are part of the public contract for ergonomic call-sites
  // but the math is purely time-based. Reading them prevents a "noUnusedParams"
  // lint slap and documents intent.
  void args.prevSrc;
  void args.nextSrc;

  if (endFrame <= startFrame) {
    // Degenerate window — instantaneous switch at startFrame.
    return frame < startFrame
      ? { prevVolume: 1, nextVolume: 0 }
      : { prevVolume: 0, nextVolume: 1 };
  }

  if (frame <= startFrame) return { prevVolume: 1, nextVolume: 0 };
  if (frame >= endFrame) return { prevVolume: 0, nextVolume: 1 };

  const t = (frame - startFrame) / (endFrame - startFrame); // 0..1

  if (curve === 'linear') {
    return { prevVolume: 1 - t, nextVolume: t };
  }
  // Equal-power crossfade. cos²(θ) + sin²(θ) = 1 ⇒ summed power constant.
  const angle = t * (Math.PI / 2);
  return { prevVolume: Math.cos(angle), nextVolume: Math.sin(angle) };
}
