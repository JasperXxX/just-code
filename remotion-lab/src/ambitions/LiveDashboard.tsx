/**
 * P4 — Live data dashboard. Fetches public API at render-startup via
 * calculateMetadata, then animates the result.
 *
 * API used: open-meteo (no auth needed) — current weather for a city.
 * If the fetch fails, falls back to embedded sample data.
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
import { z } from 'zod';
import { COLORS, FONTS } from '../templates/common';

export const liveDashboardSchema = z.object({
  city: z.string(),
  lat: z.number(),
  lon: z.number(),
  temperatureC: z.number(),
  windKph: z.number(),
  humidity: z.number().optional(),
  hourly: z.array(z.number()),
  fetchedAt: z.string(),
  liveStatus: z.enum(['live', 'cached', 'fallback']),
});

export type LiveDashboardProps = z.infer<typeof liveDashboardSchema>;

export const liveDashboardDefaults: LiveDashboardProps = {
  city: 'BERLIN',
  lat: 52.52,
  lon: 13.41,
  temperatureC: 14.2,
  windKph: 18.7,
  humidity: 64,
  hourly: [12, 13, 13, 14, 14, 14, 15, 15, 14, 14, 13, 13, 13, 14, 14, 15, 16, 17, 17, 16, 15, 14, 13, 12],
  fetchedAt: '2026-05-05T02:00:00Z',
  liveStatus: 'fallback',
};

// calculateMetadata-friendly fetcher. Used by Root.tsx to inject live data.
export async function fetchLiveWeather(lat: number, lon: number, city: string): Promise<LiveDashboardProps> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m&forecast_days=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'remotion-lab/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    return {
      city,
      lat,
      lon,
      temperatureC: data.current?.temperature_2m ?? 0,
      windKph: data.current?.wind_speed_10m ?? 0,
      humidity: data.current?.relative_humidity_2m ?? undefined,
      hourly: (data.hourly?.temperature_2m ?? []).slice(0, 24),
      fetchedAt: new Date().toISOString(),
      liveStatus: 'live',
    };
  } catch (e) {
    console.warn('Live fetch failed, falling back', e);
    return { ...liveDashboardDefaults, city, lat, lon, liveStatus: 'fallback' };
  }
}

const Card: React.FC<{
  label: string;
  value: string;
  unit: string;
  delay: number;
  accent: string;
  big?: boolean;
}> = ({ label, value, unit, delay, accent, big = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - delay, config: { damping: 18 } });
  const op = interpolate(sIn, [0, 1], [0, 1]);
  const y = interpolate(sIn, [0, 1], [30, 0]);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 36,
        borderRadius: 18,
        opacity: op,
        transform: `translateY(${y}px)`,
        flex: 1,
      }}
    >
      <div style={{ color: accent, fontFamily: FONTS.mono, fontSize: 14, letterSpacing: 4, fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.mono,
          fontSize: big ? 96 : 56,
          fontWeight: 800,
          marginTop: 16,
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
        <span style={{ fontSize: big ? 36 : 22, color: COLORS.muted, marginLeft: 10, fontWeight: 400 }}>
          {unit}
        </span>
      </div>
    </div>
  );
};

const Sparkline: React.FC<{ values: number[]; accent: string; delay: number }> = ({ values, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - delay, config: { damping: 22 } });
  const reveal = interpolate(sIn, [0, 1], [0, 1]);

  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const W = 1700;
  const H = 320;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H * 0.7) - H * 0.15;
    return `${x},${y}`;
  });
  const visiblePts = pts.slice(0, Math.ceil(pts.length * reveal));

  return (
    <svg width={W} height={H} style={{ marginTop: 30 }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Filled area */}
      {visiblePts.length > 1 && (
        <polygon
          fill="url(#spark-fill)"
          points={`${visiblePts.join(' ')} ${visiblePts[visiblePts.length - 1].split(',')[0]},${H} 0,${H}`}
        />
      )}
      <polyline fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" points={visiblePts.join(' ')} />
      {/* Dots on visible part */}
      {visiblePts.map((p, i) => {
        const [x, y] = p.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r={3} fill={accent} opacity={0.7} />;
      })}
    </svg>
  );
};

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  city,
  lat,
  lon,
  temperatureC,
  windKph,
  humidity,
  hourly,
  fetchedAt,
  liveStatus,
}) => {
  const frame = useCurrentFrame();
  const accent = liveStatus === 'live' ? '#22d3ee' : liveStatus === 'cached' ? '#a78bfa' : '#ff9b59';

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${COLORS.inkSoft} 0%, ${COLORS.ink} 80%)`,
        padding: 80,
        flexDirection: 'column',
      }}
    >
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 20px ${accent}`,
            animation: liveStatus === 'live' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <div style={{ color: '#fff', fontFamily: FONTS.mono, fontSize: 18, letterSpacing: 4, fontWeight: 600 }}>
          {liveStatus === 'live' ? 'LIVE' : liveStatus === 'cached' ? 'CACHED' : 'FALLBACK'} · {fetchedAt}
        </div>
      </div>

      {/* City headline */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ color: accent, fontFamily: FONTS.display, fontSize: 22, letterSpacing: 6, fontWeight: 600 }}>
          {lat >= 0 ? 'N' : 'S'} {Math.abs(lat).toFixed(2)}° {lon >= 0 ? 'E' : 'W'} {Math.abs(lon).toFixed(2)}°
        </div>
        <div
          style={{
            color: COLORS.white,
            fontFamily: FONTS.display,
            fontSize: 188,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginTop: 10,
            opacity: interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [4, 18], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
          }}
        >
          {city}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 24 }}>
        <Card label="TEMPERATURE" value={temperatureC.toFixed(1)} unit="°C" delay={20} accent={accent} big />
        <Card label="WIND" value={windKph.toFixed(1)} unit="km/h" delay={26} accent={accent} />
        <Card label="HUMIDITY" value={humidity != null ? humidity.toFixed(0) : '—'} unit="%" delay={32} accent={accent} />
      </div>

      {/* Sparkline */}
      <div style={{ marginTop: 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 16, letterSpacing: 4, marginBottom: 6 }}>
          24H FORECAST · TEMPERATURE °C
        </div>
        <Sparkline values={hourly} accent={accent} delay={42} />
      </div>

      <div
        style={{
          marginTop: 20,
          color: COLORS.mutedDeep,
          fontFamily: FONTS.mono,
          fontSize: 14,
          letterSpacing: 2,
        }}
      >
        SOURCE · OPEN-METEO · COMPOSED AT RENDER TIME
      </div>
    </AbsoluteFill>
  );
};
