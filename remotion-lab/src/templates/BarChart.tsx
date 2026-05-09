/**
 * Template — BarChart
 * Reusable bar chart with staggered reveal. Differs from studies/data by being:
 *  - Smaller / loop-friendly (4s default)
 *  - Self-contained (no header)
 *  - Horizontal OR vertical orientation
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const barChartSchema = z.object({
  series: z.array(z.object({ label: z.string(), value: z.number() })),
  orientation: z.enum(['vertical', 'horizontal']).default('vertical'),
  accent: z.string().default(COLORS.accent),
  bg: z.string().default(COLORS.ink),
  showValues: z.boolean().default(true),
});

export type BarChartProps = z.infer<typeof barChartSchema>;

export const barChartDefaults: BarChartProps = {
  series: [
    { label: 'Mon', value: 240 },
    { label: 'Tue', value: 380 },
    { label: 'Wed', value: 520 },
    { label: 'Thu', value: 410 },
    { label: 'Fri', value: 690 },
    { label: 'Sat', value: 850 },
    { label: 'Sun', value: 720 },
  ],
  orientation: 'vertical',
  accent: '#22d3ee',
  bg: COLORS.ink,
  showValues: true,
};

export const BarChart: React.FC<BarChartProps> = ({
  series,
  orientation = 'vertical',
  accent = COLORS.accent,
  bg = COLORS.ink,
  showValues = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...series.map((s) => s.value));

  return (
    <AbsoluteFill style={{ background: bg, padding: 100 }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'row' : 'column',
          gap: 20,
          alignItems: orientation === 'vertical' ? 'flex-end' : 'stretch',
        }}
      >
        {series.map((d, i) => {
          const enterAt = 6 + i * 4;
          const sIn = spring({ fps, frame: frame - enterAt, config: { damping: 16, mass: 1.1 } });
          const sizePct = interpolate(sIn, [0, 1], [0, (d.value / max) * 100]);
          const valueOp = interpolate(sIn, [0.6, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          if (orientation === 'vertical') {
            return (
              <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                {showValues && (
                  <div style={{ color: accent, fontFamily: FONTS.mono, fontSize: 22, fontVariantNumeric: 'tabular-nums', marginBottom: 14, opacity: valueOp }}>
                    {d.value.toLocaleString()}
                  </div>
                )}
                <div
                  style={{
                    width: '70%',
                    height: `${sizePct}%`,
                    background: `linear-gradient(180deg, ${accent} 0%, ${accent}55 100%)`,
                    borderRadius: '6px 6px 0 0',
                    boxShadow: `0 -10px 28px ${accent}44`,
                  }}
                />
                <div style={{ color: COLORS.muted, fontFamily: FONTS.display, fontSize: 22, marginTop: 14, letterSpacing: 2 }}>
                  {d.label}
                </div>
              </div>
            );
          }

          return (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 18, height: '100%' }}>
              <div style={{ color: COLORS.muted, fontFamily: FONTS.display, fontSize: 22, width: 100, letterSpacing: 2 }}>{d.label}</div>
              <div style={{ flex: 1, height: 56 }}>
                <div
                  style={{
                    width: `${sizePct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${accent} 0%, ${accent}55 100%)`,
                    borderRadius: '0 6px 6px 0',
                    boxShadow: `10px 0 28px ${accent}44`,
                  }}
                />
              </div>
              {showValues && (
                <div style={{ color: accent, fontFamily: FONTS.mono, fontSize: 22, width: 120, fontVariantNumeric: 'tabular-nums', opacity: valueOp }}>
                  {d.value.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
