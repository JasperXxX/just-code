/**
 * BeatFlash — brief amber color fill on every onset within a time window.
 * Locked to the detected music onsets (not random). Used in drop act for
 * 25-67s where the music intensity is highest. ~3-frame envelope, 12% peak
 * opacity — felt rather than seen, but adds energy on every "hit" beat.
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export const BeatFlash: React.FC<{
  onsetsS: number[];
  windowStartS: number;
  windowEndS: number;
  /** Frames the flash takes to decay. 3 = ~100ms at 30fps. */
  durationFrames?: number;
  peakOpacity?: number;
  color?: string;
}> = ({
  onsetsS,
  windowStartS,
  windowEndS,
  durationFrames = 3,
  peakOpacity = 0.12,
  color = '#ff7a3a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < windowStartS || t > windowEndS) return null;

  // Find closest onset within window
  let opacity = 0;
  for (const ons of onsetsS) {
    if (ons < windowStartS || ons > windowEndS) continue;
    const dt = (t - ons) * fps;
    if (dt < -1 || dt > durationFrames) continue;
    // Triangular envelope: peak at frame 0, decay over durationFrames
    const env = Math.max(0, 1 - Math.abs(dt) / durationFrames);
    opacity = Math.max(opacity, env * peakOpacity);
  }
  if (opacity <= 0) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
};
