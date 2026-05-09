/**
 * studies/data — JSON-driven bar chart with parametrized props.
 * Demonstrates: defaultProps, prop-driven scaling, staggered reveal, gridlines.
 *
 * Render with:
 *   npx remotion render src/index.ts DataDriven outputs/v1/data.mp4
 *   npx remotion render src/index.ts DataDriven outputs/v1/data_alt.mp4 --props='{"title":"REVENUE Q3","series":[...]}'
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

export type DataPoint = { label: string; value: number };
export type DataDrivenProps = {
  title: string;
  subtitle?: string;
  unit?: string;
  series: DataPoint[];
  accent?: string;
};

export const dataDrivenDefaults: DataDrivenProps = {
  title: 'REMOTION ADOPTION',
  subtitle: 'GitHub stars per month, 2025',
  unit: 'stars',
  accent: '#5e9eff',
  series: [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1850 },
    { label: 'Mar', value: 2100 },
    { label: 'Apr', value: 2780 },
    { label: 'May', value: 3340 },
    { label: 'Jun', value: 3890 },
    { label: 'Jul', value: 4520 },
    { label: 'Aug', value: 5210 },
    { label: 'Sep', value: 6340 },
    { label: 'Oct', value: 7100 },
    { label: 'Nov', value: 8650 },
    { label: 'Dec', value: 10200 },
  ],
};

export const DataDriven: React.FC<DataDrivenProps> = ({
  title,
  subtitle,
  unit,
  series,
  accent = '#5e9eff',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const max = Math.max(...series.map((s) => s.value));
  const niceMax = Math.ceil(max / 1000) * 1000;

  // Title fades in
  const titleSpring = spring({ fps, frame: frame - 4, config: { damping: 16 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);

  // Counter (animates the headline number)
  const counterSpring = spring({ fps, frame: frame - 22, config: { damping: 22, mass: 1.5 } });
  const counter = Math.round(interpolate(counterSpring, [0, 1], [0, max]));

  return (
    <AbsoluteFill style={{ background: '#0a0a14', padding: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, transform: `translateY(${titleY}px)`, opacity: titleOp }}>
        <div>
          <div style={{ color: '#5a5a8a', fontFamily: 'SF Pro Display', fontSize: 18, letterSpacing: 6, marginBottom: 12 }}>STUDY 04 · DATA</div>
          <div style={{ color: '#fff', fontFamily: 'SF Pro Display', fontSize: 84, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{title}</div>
          {subtitle && (
            <div style={{ color: '#a0a0c0', fontFamily: 'SF Pro Display', fontSize: 24, marginTop: 14 }}>{subtitle}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#5a5a8a', fontSize: 18, letterSpacing: 4, fontFamily: 'SF Pro Display' }}>PEAK · {unit?.toUpperCase()}</div>
          <div style={{ color: accent, fontSize: 96, fontWeight: 800, fontFamily: 'SF Mono, ui-monospace, monospace', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {counter.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Gridlines */}
      <div style={{ position: 'relative', flex: 1, marginTop: 30 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const v = Math.round(niceMax * p);
          const op = interpolate(frame, [16, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`, opacity: op }}>
              <div style={{ position: 'absolute', left: 0, fontFamily: 'SF Mono, monospace', color: '#3a3a5a', fontSize: 16 }}>{v.toLocaleString()}</div>
              <div style={{ marginLeft: 80, height: 1, background: '#1f1f33' }} />
            </div>
          );
        })}

        {/* Bars */}
        <div style={{ position: 'absolute', left: 80, right: 0, bottom: 0, top: 0, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          {series.map((d, i) => {
            const enterAt = 22 + i * 4;
            const localSpring = spring({ fps, frame: frame - enterAt, config: { damping: 16, mass: 1 } });
            const heightPct = interpolate(localSpring, [0, 1], [0, (d.value / niceMax) * 100]);
            return (
              <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${accent} 0%, ${accent}88 100%)`,
                      borderRadius: '6px 6px 0 0',
                      boxShadow: `0 -10px 30px ${accent}55`,
                      transition: 'none',
                    }}
                  />
                </div>
                <div style={{ marginTop: 12, color: '#9a9ac0', fontFamily: 'SF Mono, monospace', fontSize: 16 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: 30,
          color: '#3a3a5a',
          fontFamily: 'SF Pro Display',
          fontSize: 16,
          letterSpacing: 3,
          opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        DATA-DRIVEN · DEFAULTPROPS PARAMETRIZED · DETERMINISTIC RENDER
      </div>
    </AbsoluteFill>
  );
};
