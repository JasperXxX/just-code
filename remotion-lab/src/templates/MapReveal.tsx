/**
 * Template — MapReveal
 * Animated zoom from world view to a specific lat/lon, with a pin drop.
 * Uses inline SVG world map (no external assets).
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const mapRevealSchema = z.object({
  city: z.string().default('BERLIN'),
  country: z.string().default('GERMANY'),
  lat: z.number().default(52.52),
  lon: z.number().default(13.405),
  accent: z.string().default('#ff2d55'),
});

export type MapRevealProps = z.infer<typeof mapRevealSchema>;

export const mapRevealDefaults: MapRevealProps = {
  city: 'BERLIN',
  country: 'GERMANY',
  lat: 52.52,
  lon: 13.405,
  accent: '#ff2d55',
};

// Highly simplified equirectangular continents — abstract dots stand in for landmasses.
// Dot positions hand-tuned to be roughly continent-shaped without licensed data.
const LANDMASSES_DOTS: Array<[number, number]> = [
  // North America (rough)
  [-160, 65], [-130, 60], [-100, 50], [-80, 45], [-100, 35], [-110, 30], [-90, 25], [-75, 25], [-90, 18],
  // South America
  [-70, 0], [-65, -10], [-55, -20], [-65, -35], [-70, -45],
  // Europe
  [-5, 50], [10, 50], [20, 55], [30, 60], [15, 45], [5, 40],
  // Africa
  [10, 25], [25, 15], [30, 0], [25, -10], [20, -25], [30, -30],
  // Asia
  [40, 55], [60, 55], [80, 50], [100, 45], [120, 40], [80, 30], [100, 25], [110, 15], [80, 20],
  // Oceania
  [135, -25], [145, -30], [120, -25], [170, -45],
];

function projectEquirect(lon: number, lat: number, w: number, h: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * w,
    y: ((90 - lat) / 180) * h,
  };
}

export const MapReveal: React.FC<MapRevealProps> = ({ city, country, lat, lon, accent = '#ff2d55' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Animation timeline:
  // 0..30 → wide world view
  // 30..70 → zoom into target
  // 70..end → pin drop + label
  const zoomT = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const startScale = 1.0;
  const endScale = 6.0;
  const scale = interpolate(zoomT, [0, 1], [startScale, endScale]);

  // Center of frame in equirectangular coords
  const target = projectEquirect(lon, lat, width, height);
  const center = { x: width / 2, y: height / 2 };
  const tx = interpolate(zoomT, [0, 1], [0, center.x - target.x]);
  const ty = interpolate(zoomT, [0, 1], [0, center.y - target.y]);

  const pinSpring = spring({ fps, frame: frame - 75, config: { damping: 9, mass: 0.8 } });
  const pinDrop = interpolate(pinSpring, [0, 1], [-300, 0]);
  const pinOp = interpolate(pinSpring, [0, 1], [0, 1]);

  const labelSpring = spring({ fps, frame: frame - 92, config: { damping: 18 } });
  const labelOp = interpolate(labelSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${COLORS.inkSoft}, ${COLORS.ink})` }}>
      <AbsoluteFill style={{ transformOrigin: `${target.x}px ${target.y}px`, transform: `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px)` }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Equator + meridian lines */}
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={`${accent}22`} strokeWidth={1} />
          <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke={`${accent}22`} strokeWidth={1} />
          {/* Landmass dots */}
          {LANDMASSES_DOTS.map(([lo, la], i) => {
            const p = projectEquirect(lo, la, width, height);
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={20}
                fill={`${COLORS.muted}66`}
                filter="url(#land-blur)"
              />
            );
          })}
          <defs>
            <filter id="land-blur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
        </svg>
      </AbsoluteFill>

      {/* Pin */}
      <div
        style={{
          position: 'absolute',
          left: center.x,
          top: center.y,
          transform: `translate(-50%, calc(-100% + ${pinDrop}px))`,
          opacity: pinOp,
        }}
      >
        <svg width="60" height="80" viewBox="0 0 60 80">
          <path d="M 30 0 C 12 0 0 14 0 32 C 0 50 30 80 30 80 C 30 80 60 50 60 32 C 60 14 48 0 30 0 Z"
                fill={accent} stroke="white" strokeWidth={2} />
          <circle cx={30} cy={32} r={10} fill="white" />
        </svg>
      </div>
      {/* Pin shadow */}
      <div
        style={{
          position: 'absolute',
          left: center.x - 30,
          top: center.y - 4,
          width: 60,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          filter: 'blur(6px)',
          opacity: pinOp * 0.7,
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 100,
          opacity: labelOp,
          transform: `translateY(${interpolate(labelSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ color: accent, fontFamily: FONTS.display, fontSize: 22, letterSpacing: 6, marginBottom: 12, fontWeight: 600 }}>
          · {country}
        </div>
        <div style={{ color: COLORS.white, fontFamily: FONTS.display, fontSize: 132, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {city}
        </div>
        <div style={{ color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 22, marginTop: 14 }}>
          {lat >= 0 ? 'N' : 'S'} {Math.abs(lat).toFixed(2)}°  {lon >= 0 ? 'E' : 'W'} {Math.abs(lon).toFixed(2)}°
        </div>
      </div>
    </AbsoluteFill>
  );
};
