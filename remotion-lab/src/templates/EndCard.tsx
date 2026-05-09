/**
 * Template — EndCard
 * Logo + CTA + social handles. Subtle outro animation.
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const endCardSchema = z.object({
  logo: z.string().default('REMOTION'),
  cta: z.string().default('SUBSCRIBE'),
  handles: z.array(z.string()).default(['@remotion', 'remotion.dev']),
  accent: z.string().default(COLORS.accent),
});

export type EndCardProps = z.infer<typeof endCardSchema>;

export const endCardDefaults: EndCardProps = {
  logo: 'REMOTION LAB',
  cta: 'BUILD WITH CODE',
  handles: ['@remotionlab', 'github.com/remotion-dev', 'remotion.dev'],
  accent: COLORS.accent,
};

export const EndCard: React.FC<EndCardProps> = ({ logo, cta, handles, accent = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoIn = spring({ fps, frame: frame - 4, config: { damping: 14 } });
  const ctaIn = spring({ fps, frame: frame - 18, config: { damping: 16 } });

  // Continuous slow ring rotation
  const rotation = interpolate(frame, [0, 200], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.inkSoft} 0%, ${COLORS.ink} 80%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {/* Decorative spinning rings */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          border: `1px solid ${accent}33`,
          borderRadius: '50%',
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          border: `1px solid ${accent}22`,
          borderRadius: '50%',
          transform: `rotate(${-rotation * 0.6}deg)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.display,
          fontSize: 144,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          transform: `scale(${interpolate(logoIn, [0, 1], [0.85, 1])})`,
          opacity: interpolate(logoIn, [0, 1], [0, 1]),
        }}
      >
        {logo}
      </div>

      {/* CTA */}
      <div
        style={{
          color: accent,
          fontFamily: FONTS.display,
          fontSize: 36,
          letterSpacing: 8,
          marginTop: 30,
          padding: '18px 60px',
          border: `2px solid ${accent}`,
          borderRadius: 100,
          opacity: interpolate(ctaIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(ctaIn, [0, 1], [20, 0])}px)`,
          fontWeight: 700,
        }}
      >
        {cta}
      </div>

      {/* Handles */}
      <div
        style={{
          marginTop: 80,
          display: 'flex',
          gap: 40,
          color: COLORS.mutedDeep,
          fontFamily: FONTS.mono,
          fontSize: 24,
          letterSpacing: 2,
        }}
      >
        {handles.map((h, i) => {
          const op = interpolate(frame, [30 + i * 4, 38 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={h} style={{ opacity: op, color: i === 0 ? COLORS.muted : COLORS.mutedDeep }}>
              {h}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
