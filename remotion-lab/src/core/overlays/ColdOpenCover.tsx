/**
 * ColdOpenCover — covers the entire frame in black at the start of the comp
 * with a typewriter-style title. Lets the comp open with text-only intent
 * before any video plays. Fades to transparent over the last few frames so
 * the first video clip emerges from black.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const ColdOpenCover: React.FC<{
  text: string;
  /** Total frames the cover lives. Last 25% fades out. */
  liveFrames: number;
  /** Optional secondary line below the title (e.g. date range). */
  subtitle?: string;
  color?: string;
}> = ({ text, liveFrames, subtitle, color = '#f4ede2' }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  if (frame < 0 || frame >= liveFrames) return null;

  const t = frame / liveFrames;

  // Type the title across the first 60% of the cover's life
  const typeProgress = Math.min(1, t / 0.6);
  const charsToShow = Math.floor(typeProgress * text.length);
  const displayText = text.substring(0, charsToShow);
  const showCursor = frame % 6 < 3;

  // Subtitle fades in 50-70%, holds, fades out with the cover
  const subOpacity = interpolate(t, [0.5, 0.65, 0.78, 0.92], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cover fades to transparent over the last 25% of life
  const coverOpacity = interpolate(t, [0.78, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: `rgba(0,0,0,${coverOpacity})` }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div
          style={{
            color,
            fontSize: Math.round(width * 0.10),
            fontFamily: '"SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            opacity: coverOpacity,
            textShadow: '0 4px 18px rgba(0,0,0,0.6)',
          }}
        >
          {displayText}
          {showCursor && charsToShow < text.length && <span style={{ opacity: 0.6 }}>|</span>}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 16,
              color,
              fontSize: Math.round(width * 0.025),
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              letterSpacing: '0.18em',
              opacity: subOpacity * coverOpacity,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
