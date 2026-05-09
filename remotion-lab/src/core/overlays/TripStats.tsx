/**
 * TripStats — pre-outro data callout. Shows a few hard numbers from the trip
 * before the hero outro lands. Slides up from the bottom, holds, slides off.
 *
 *   01 — slot fades in (frames 0..6)
 *   02 — fully visible (6..32)
 *   03 — slides off + fades out (32..40)
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

export type TripStat = { label: string; value: string };

type Props = {
  stats: TripStat[];
  accent?: string;
};

export const TripStats: React.FC<Props> = ({
  stats,
  accent = '#ff8a4f',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();

  // Spring-in slide
  const inS = spring({ fps, frame, config: { damping: 22, mass: 1.2 } });
  const inY = interpolate(inS, [0, 1], [60, 0]);
  const inOp = interpolate(inS, [0, 1], [0, 1]);

  // Out (slide up + fade)
  const outFrame = durationInFrames - 8;
  const outOp = interpolate(frame, [outFrame, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outY = interpolate(frame, [outFrame, durationInFrames], [0, -28], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: height * 0.18,
      }}
    >
      <div
        style={{
          background: 'rgba(10, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${accent}66`,
          borderRadius: 16,
          padding: '24px 36px',
          opacity: inOp * outOp,
          transform: `translateY(${inY + outY}px)`,
          display: 'flex',
          gap: 32,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${accent}33`,
        }}
      >
        {stats.map((s, i) => {
          const itemS = spring({ fps, frame: frame - 4 - i * 3, config: { damping: 22, mass: 1.0 } });
          const itemOp = interpolate(itemS, [0, 1], [0, 1]);
          const itemY = interpolate(itemS, [0, 1], [12, 0]);
          return (
            <div
              key={i}
              style={{
                textAlign: 'center',
                opacity: itemOp,
                transform: `translateY(${itemY}px)`,
              }}
            >
              <div
                style={{
                  color: accent,
                  fontFamily: 'SF Pro Display, sans-serif',
                  fontSize: 14,
                  letterSpacing: 4,
                  fontWeight: 600,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontFamily: 'SF Mono, ui-monospace, monospace',
                  fontSize: 38,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
