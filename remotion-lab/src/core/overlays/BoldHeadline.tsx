/**
 * BoldHeadline — large bold red text headline with animated entry.
 * Used for city stamps ("AMSTERDAM"), day markers, and act-boundary
 * statements. Built for visual impact: 280px+, weight 900, high-contrast
 * red, slight 3D pop with shadow.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Style = 'red-bold' | 'white-mono' | 'red-glitch';

export const BoldHeadline: React.FC<{
  text: string;
  /** Total frames the headline lives. Last 25% is exit. */
  liveFrames: number;
  style?: Style;
  /** 'top' | 'middle' | 'bottom' — vertical position. */
  position?: 'top' | 'middle' | 'bottom';
  /** Skew angle for the dynamic pop effect. Default 0 (no skew). */
  skewDeg?: number;
}> = ({ text, liveFrames, style = 'red-bold', position = 'middle', skewDeg = -4 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (frame < 0 || frame >= liveFrames) return null;

  const t = frame / liveFrames;

  // Spring-based entry: characters scale in from 0.6 → 1.05 → 1.0 with overshoot
  const enter = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 200 },
    durationInFrames: Math.round(fps * 0.45),
  });

  // Exit: scale up + fade out (like a stamp punch leaving impact)
  const exitT = Math.max(0, (t - 0.75) / 0.25);
  const exitScale = 1 + exitT * 0.18;
  const exitOpacity = 1 - exitT;

  // Combined transforms
  const scale = enter * exitScale;
  const opacity = enter * exitOpacity;

  // Subtle tilt during life: -2deg → 0deg
  const tilt = interpolate(t, [0, 0.4, 1], [-1.5, 0, 0.5]);

  // Position
  const top = position === 'top' ? '14%' : position === 'bottom' ? '76%' : '38%';

  // Style choice
  const styleProps = (() => {
    if (style === 'white-mono') {
      return {
        color: '#f5f1e6',
        fontFamily: '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif',
        textShadow: '0 4px 16px rgba(0,0,0,0.55)',
      };
    }
    if (style === 'red-glitch') {
      return {
        color: '#ff1133',
        fontFamily: '"Helvetica Neue", system-ui, sans-serif',
        textShadow: '3px 0 0 #00f0ff, -3px 0 0 #ff8a4f, 0 6px 22px rgba(0,0,0,0.6)',
        letterSpacing: '-0.02em',
      };
    }
    // red-bold (default) — full impact
    return {
      color: '#ff1733',
      fontFamily: '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif',
      textShadow:
        '0 6px 24px rgba(0,0,0,0.7), 0 0 4px rgba(255,40,60,0.6), 4px 4px 0 rgba(0,0,0,0.55)',
      WebkitTextStroke: '1.5px rgba(0,0,0,0.4)',
    };
  })();

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top,
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${tilt}deg) skewX(${skewDeg}deg) scale(${scale})`,
          fontWeight: 900,
          fontSize: Math.round(width * 0.16),
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          opacity,
          whiteSpace: 'nowrap',
          ...styleProps,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
