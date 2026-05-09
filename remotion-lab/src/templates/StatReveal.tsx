/**
 * Template — StatReveal
 * Big number counts up with spring easing, label + sublabel.
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const statRevealSchema = z.object({
  value: z.number(),
  prefix: z.string().default(''),
  suffix: z.string().default(''),
  label: z.string(),
  sublabel: z.string().optional(),
  accent: z.string().default(COLORS.accent),
  formatThousands: z.boolean().default(true),
  decimals: z.number().default(0),
});

export type StatRevealProps = z.infer<typeof statRevealSchema>;

export const statRevealDefaults: StatRevealProps = {
  value: 1247800,
  prefix: '$',
  suffix: '',
  label: 'PIPELINE GENERATED',
  sublabel: 'AUTONOMOUS · AGENT · 2026',
  accent: '#22d3ee',
  formatThousands: true,
  decimals: 0,
};

export const StatReveal: React.FC<StatRevealProps> = ({
  value,
  prefix = '',
  suffix = '',
  label,
  sublabel,
  accent = COLORS.accent,
  formatThousands = true,
  decimals = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const labelIn = spring({ fps, frame: frame - 4, config: { damping: 18 } });
  const labelOp = interpolate(labelIn, [0, 1], [0, 1]);

  // Counter ramps up with mass — feels punchy at the top
  const counterSpring = spring({
    fps,
    frame: frame - 12,
    config: { damping: 22, mass: 2.2, stiffness: 80 },
  });
  const current = interpolate(counterSpring, [0, 1], [0, value]);
  const counterOp = interpolate(counterSpring, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' });

  const fmt = (n: number) =>
    formatThousands
      ? n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
      : n.toFixed(decimals);

  const sublabelIn = spring({ fps, frame: frame - 30, config: { damping: 22 } });
  const subOp = interpolate(sublabelIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.inkSoft} 0%, ${COLORS.ink} 80%)`,
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
          marginBottom: 30,
          opacity: labelOp,
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.mono,
          fontSize: 280,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          opacity: counterOp,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {prefix}
        {fmt(current)}
        {suffix}
      </div>

      {sublabel && (
        <div
          style={{
            color: COLORS.muted,
            fontFamily: FONTS.display,
            fontSize: 26,
            letterSpacing: 5,
            marginTop: 40,
            opacity: subOp,
            transform: `translateY(${interpolate(sublabelIn, [0, 1], [16, 0])}px)`,
          }}
        >
          {sublabel}
        </div>
      )}

      {/* Underline accent */}
      <div
        style={{
          width: interpolate(counterSpring, [0, 1], [0, 360]),
          height: 4,
          background: accent,
          marginTop: 32,
          boxShadow: `0 0 20px ${accent}`,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
