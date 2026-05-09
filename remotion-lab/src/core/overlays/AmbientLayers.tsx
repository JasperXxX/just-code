/**
 * Shared ambient overlay layers used across compositions.
 * - <FilmGrain> — full-timeline grain, screen blend
 * - <LightLeak> — animated coloured leak, screen blend
 * - <FlashFrame> — single-shot white/colour flash at a given time
 * - <ScanlineCRT> — moving horizontal scanlines, screen blend
 * - <Letterbox> — top/bottom black bars
 *
 * All of these are deterministic (use `random(seed)` not `Math.random()`).
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const FilmGrain: React.FC<{ intensity?: number; count?: number }> = ({
  intensity = 0.15,
  count = 220,
}) => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: count }, (_, i) => ({
    x: random(`gx-${frame}-${i}`) * 100,
    y: random(`gy-${frame}-${i}`) * 100,
    size: random(`gs-${frame}-${i}`) * 2 + 0.5,
    opacity: random(`go-${frame}-${i}`) * intensity,
  }));
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            backgroundColor: `rgba(220,220,220,${dot.opacity})`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const LightLeak: React.FC<{
  seed: number | string;
  color?: string;
  size?: number;
  peakOpacity?: number;
}> = ({ seed, color = '#ff6b35', size = 420, peakOpacity = 0.32 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sx = `llx-${seed}`;
  const sy = `lly-${seed}`;
  const x = interpolate(frame, [0, durationInFrames], [
    random(sx) * 100 - 20,
    random(sx + '2') * 100 + 20,
  ]);
  const y = interpolate(frame, [0, durationInFrames], [
    random(sy) * 60,
    random(sy + '2') * 60 + 30,
  ]);
  const opacity = interpolate(
    frame,
    [
      0,
      durationInFrames * 0.25,
      durationInFrames * 0.7,
      durationInFrames,
    ],
    [0, peakOpacity, peakOpacity, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size * 1.4,
          background: `radial-gradient(ellipse, ${color}cc, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
    </AbsoluteFill>
  );
};

export const FlashFrame: React.FC<{
  at: number;
  duration?: number;
  color?: string;
  peakOpacity?: number;
}> = ({ at, duration = 3, color = '#ffffff', peakOpacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flashFrame = Math.round(at * fps);
  const progress = frame - flashFrame;
  if (progress < 0 || progress > duration) return null;
  const opacity = interpolate(progress, [0, duration], [peakOpacity, 0], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{ backgroundColor: color, opacity, pointerEvents: 'none' }}
    />
  );
};

export const ScanlineCRT: React.FC<{
  density?: number;
  drift?: number;
  opacity?: number;
}> = ({ density = 240, drift = 2, opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const step = height / density;
  return (
    <AbsoluteFill
      style={{ mixBlendMode: 'screen', opacity, pointerEvents: 'none' }}
    >
      {Array.from({ length: density }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * step + ((frame * drift) % step),
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Letterbox: React.FC<{ height?: number }> = ({ height = 80 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        backgroundColor: 'black',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        backgroundColor: 'black',
      }}
    />
  </AbsoluteFill>
);
