/**
 * DropPunctuation — the cinema move at exactly the music drop.
 *
 *   • Hard 3-frame white flash centred on the drop moment
 *   • Global scale pulse 1.0 → 1.15 → 1.0 over 10 frames (zoom-punch feel)
 *   • Temporary letterbox bars snap in 4 frames before, snap out 4 after
 *     ("cinema closes in" → release on the drop)
 *
 * Renders as an absolute overlay; pair with the existing bass_drop.mp3 and
 * GlitchHeadline "DROP" text for the full effect.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Props = {
  flashColor?: string;
  /** Total live frames (default 14). Center-frame (drop moment) is at liveFrames/2 - 1. */
  liveFrames?: number;
  /** Offset within the live window where the drop moment lands. Default 5 — gives
   *  5 frames lead-in (bars closing, scale building) and 8 frames trail (release). */
  centerFrame?: number;
};

export const DropPunctuation: React.FC<Props> = ({
  flashColor = '#ffffff',
  liveFrames = 14,
  centerFrame = 5,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const dt = frame - centerFrame;

  // Flash: peaks at the centre, decays each side over 2 frames
  const flashOp = Math.max(0, 1 - Math.abs(dt) / 2);

  // Letterbox bars: snap in 4 frames before, snap out 4 frames after
  const barFrac = interpolate(
    dt,
    [-4, 0, 4],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1) }
  );
  const barH = barFrac * height * 0.18;

  if (frame >= liveFrames) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Letterbox bars closing in / opening out */}
      {barH > 1 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: barH,
              background: '#000',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: barH,
              background: '#000',
            }}
          />
        </>
      )}

      {/* White flash */}
      {flashOp > 0 && (
        <AbsoluteFill style={{ backgroundColor: flashColor, opacity: flashOp }} />
      )}
    </AbsoluteFill>
  );
};

/**
 * Wraps children with a scale-pulse at the drop. Use this around the main
 * visual stack so the punch actually scales the video, not just the overlay.
 */
export const DropScalePulse: React.FC<{ atFrame: number; children: React.ReactNode }> = ({
  atFrame,
  children,
}) => {
  const frame = useCurrentFrame();
  const dt = frame - atFrame;
  const scaleProgress = interpolate(
    dt,
    [-5, 0, 5],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.6, 1) }
  );
  const scale = 1.0 + scaleProgress * 0.12;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        willChange: 'transform',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
