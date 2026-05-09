/**
 * Template — TitleCard
 * Three variants: editorial (serif), bold (display), minimal (light).
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  variant: z.enum(['editorial', 'bold', 'minimal']).default('bold'),
  accent: z.string().default(COLORS.accent),
  bg: z.string().optional(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaults: TitleCardProps = {
  title: 'TOTAL REMOTION',
  subtitle: 'A study in deterministic motion',
  variant: 'bold',
  accent: COLORS.accent,
};

export const TitleCard: React.FC<TitleCardProps> = ({ title, subtitle, variant = 'bold', accent = COLORS.accent, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sIn = spring({ fps, frame: frame - 4, config: { damping: 15, mass: 1 } });
  const titleY = interpolate(sIn, [0, 1], [60, 0]);
  const titleOp = interpolate(sIn, [0, 1], [0, 1]);
  const titleBlur = interpolate(sIn, [0, 1], [10, 0]);

  const subIn = spring({ fps, frame: frame - 18, config: { damping: 18 } });
  const subOp = interpolate(subIn, [0, 1], [0, 1]);

  // Editorial
  if (variant === 'editorial') {
    return (
      <AbsoluteFill style={{ background: bg ?? COLORS.paperWarm, padding: 120, justifyContent: 'center' }}>
        <div style={{ color: COLORS.ink, fontFamily: FONTS.serif, fontSize: 20, letterSpacing: 6, marginBottom: 20, opacity: titleOp }}>· EDITORIAL</div>
        <div
          style={{
            color: COLORS.ink,
            fontFamily: FONTS.serif,
            fontSize: 200,
            fontWeight: 400,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            transform: `translateY(${titleY}px)`,
            opacity: titleOp,
            filter: `blur(${titleBlur * 0.4}px)`,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              color: '#80604a',
              fontFamily: FONTS.serif,
              fontSize: 32,
              fontStyle: 'italic',
              marginTop: 28,
              maxWidth: 1000,
              opacity: subOp,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // Minimal
  if (variant === 'minimal') {
    return (
      <AbsoluteFill style={{ background: bg ?? COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            color: COLORS.ink,
            fontFamily: FONTS.display,
            fontSize: 84,
            fontWeight: 200,
            letterSpacing: '0.4em',
            transform: `translateY(${titleY * 0.4}px)`,
            opacity: titleOp,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 200,
            height: 1,
            background: accent,
            margin: '40px 0',
            transform: `scaleX(${interpolate(sIn, [0, 1], [0, 1])})`,
          }}
        />
        {subtitle && (
          <div
            style={{
              color: COLORS.muted,
              fontFamily: FONTS.display,
              fontSize: 22,
              letterSpacing: 4,
              opacity: subOp,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // Bold (default)
  return (
    <AbsoluteFill
      style={{
        background:
          bg ??
          `radial-gradient(ellipse at top right, ${accent}33 0%, transparent 50%), linear-gradient(180deg, ${COLORS.ink} 0%, ${COLORS.inkSoft} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          color: accent,
          fontFamily: FONTS.display,
          fontSize: 22,
          letterSpacing: 8,
          marginBottom: 24,
          opacity: titleOp,
          fontWeight: 600,
        }}
      >
        · TITLE
      </div>
      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.display,
          fontSize: 180,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          textAlign: 'center',
          transform: `translateY(${titleY}px)`,
          opacity: titleOp,
          filter: `blur(${titleBlur}px)`,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            color: COLORS.muted,
            fontFamily: FONTS.display,
            fontSize: 32,
            marginTop: 30,
            letterSpacing: 1,
            opacity: subOp,
            maxWidth: 1100,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
