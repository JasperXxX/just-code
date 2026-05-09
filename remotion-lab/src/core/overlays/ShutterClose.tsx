/**
 * ShutterClose — cinema "blink" effect. Black bars snap shut from top+bottom
 * to fully cover the frame, hold ~3 frames, then snap open. Used at the
 * pre-drop moment (98.5-99.5s) to suspend the visual flow before the drop
 * lands. Brief, intense, deliberate.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const ShutterClose: React.FC<{
  liveFrames: number;
  /** When in the timeline both bars are fully closed (covering screen). */
  closeFrame: number;
}> = ({ liveFrames, closeFrame }) => {
  const frame = useCurrentFrame();
  if (frame < 0 || frame >= liveFrames) return null;

  // Fraction of screen height each bar covers (0 = open, 0.5 = bars meet at center)
  let barFrac: number;
  if (frame < closeFrame) {
    // Closing — accelerate
    barFrac = interpolate(frame, [0, closeFrame], [0, 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.7, 0, 0.95, 0.5),
    });
  } else if (frame < closeFrame + 3) {
    // Held closed for 3 frames
    barFrac = 0.5;
  } else {
    // Opening — quick snap
    const openT = (frame - closeFrame - 3) / Math.max(1, liveFrames - closeFrame - 3);
    barFrac = interpolate(openT, [0, 1], [0.5, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.2, 0.5, 0.3, 1),
    });
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${barFrac * 100}%`,
          backgroundColor: '#000',
          boxShadow: '0 0 24px rgba(0,0,0,0.8)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${barFrac * 100}%`,
          backgroundColor: '#000',
          boxShadow: '0 0 24px rgba(0,0,0,0.8)',
        }}
      />
    </AbsoluteFill>
  );
};
