/**
 * studies/generative — six procedural visuals: noise field, flow lines,
 * shape grid, gradient morph, voronoi-like cells, fractal star burst.
 *
 * Each chapter 60 frames. Total 360 frames @ 30fps = 12s.
 *
 * No external assets. Everything is computed from frame + seed.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { noise2D } from '@remotion/noise';
import { Triangle, Circle, Rect, Star } from '@remotion/shapes';

const CH_LEN = 60;

// 1. Noise field — moving Perlin-ish heightmap
const NoiseField: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = 32;
  const rows = 18;
  return (
    <AbsoluteFill style={{ background: '#0a0a14', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1700, height: 900, position: 'relative' }}>
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((__, x) => {
            const n = noise2D('field', x * 0.18, y * 0.18 + frame * 0.04);
            const lift = (n + 1) * 0.5;
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: `${(x / cols) * 100}%`,
                  top: `${(y / rows) * 100}%`,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `hsl(${220 + lift * 80}, 80%, ${30 + lift * 50}%)`,
                  transform: `scale(${0.3 + lift * 1.5})`,
                  filter: `blur(${(1 - lift) * 2}px)`,
                  boxShadow: `0 0 ${lift * 16}px hsl(${220 + lift * 80}, 80%, 60%)`,
                }}
              />
            );
          })
        )}
      </div>
    </AbsoluteFill>
  );
};

// 2. Flow lines — many particles tracking a noise vector field
const FlowLines: React.FC = () => {
  const frame = useCurrentFrame();
  const N = 200;
  const segments = 18;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #1a1a2e, #050510)' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        {Array.from({ length: N }).map((_, i) => {
          const startX = random(`fx-${i}`) * 1920;
          const startY = random(`fy-${i}`) * 1080;
          let x = startX, y = startY;
          const points: [number, number][] = [[x, y]];
          for (let s = 0; s < segments; s++) {
            const angle = noise2D('flow', x * 0.002 + frame * 0.005, y * 0.002) * Math.PI * 2;
            x += Math.cos(angle) * 18;
            y += Math.sin(angle) * 18;
            points.push([x, y]);
          }
          const hue = 200 + (i / N) * 120;
          return (
            <polyline
              key={i}
              fill="none"
              stroke={`hsla(${hue}, 80%, 70%, 0.55)`}
              strokeWidth={1.2}
              strokeLinecap="round"
              points={points.map(([px, py]) => `${px},${py}`).join(' ')}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// 3. Shape grid (rotating, recoloring per noise)
const ShapeGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = 8;
  const rows = 5;
  const cellW = 1920 / cols;
  const cellH = 1080 / rows;

  const renderShape = (idx: number, fill: string) => {
    switch (idx % 4) {
      case 0:
        return <Triangle length={120} direction="up" fill={fill} edgeRoundness={0.2} />;
      case 1:
        return <Circle radius={60} fill={fill} />;
      case 2:
        return <Rect width={120} height={120} fill={fill} edgeRoundness={0.2} />;
      default:
        return <Star points={5} innerRadius={30} outerRadius={60} fill={fill} edgeRoundness={0.2} />;
    }
  };

  return (
    <AbsoluteFill style={{ background: '#0f0f1f' }}>
      {Array.from({ length: rows }).map((_, y) =>
        Array.from({ length: cols }).map((__, x) => {
          const idx = (x + y * cols) % 4;
          const angle = noise2D('grid', x * 0.6, y * 0.6 + frame * 0.04) * 360;
          const hue = (x * 30 + y * 10 + frame * 1.2) % 360;
          const cx = x * cellW + cellW / 2;
          const cy = y * cellH + cellH / 2;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: cx - 60,
                top: cy - 60,
                transform: `rotate(${angle}deg)`,
              }}
            >
              {renderShape(idx, `hsl(${hue}, 70%, 60%)`)}
            </div>
          );
        })
      )}
    </AbsoluteFill>
  );
};

// 4. Gradient morph
const GradientMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const a = noise2D('ga', frame * 0.02, 0) * 360;
  const b = noise2D('gb', 0, frame * 0.025) * 360;
  const c = noise2D('gc', frame * 0.03, frame * 0.02) * 360;
  const angle = (frame * 1.6) % 360;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, hsl(${a}, 75%, 55%), hsl(${b}, 75%, 50%) 50%, hsl(${c}, 75%, 45%))`,
      }}
    >
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'SF Pro Display', fontSize: 220, fontWeight: 800, letterSpacing: '-0.04em', mixBlendMode: 'overlay' }}>
          MORPH
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 5. Voronoi-like cells via random points + nearest-distance shading
const VoronoiCells: React.FC = () => {
  const frame = useCurrentFrame();
  const SEEDS = 22;
  const seeds = Array.from({ length: SEEDS }).map((_, i) => {
    const baseX = random(`vx-${i}`) * 1920;
    const baseY = random(`vy-${i}`) * 1080;
    return {
      x: baseX + Math.sin(frame * 0.04 + i) * 60,
      y: baseY + Math.cos(frame * 0.03 + i * 1.3) * 60,
      hue: 200 + random(`vh-${i}`) * 100,
    };
  });
  return (
    <AbsoluteFill style={{ background: '#050510' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs>
          <radialGradient id="vor-fade" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopOpacity="1" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
        {seeds.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={300}
            fill={`hsl(${s.hue}, 80%, 55%)`}
            opacity={0.45}
            filter="blur(60px)"
          />
        ))}
        {seeds.map((s, i) => (
          <circle key={`s-${i}`} cx={s.x} cy={s.y} r={6} fill="white" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// 6. Fractal starburst
const Starburst: React.FC = () => {
  const frame = useCurrentFrame();
  const rays = 80;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle, #1a1a2e, #050510)', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="1080" height="1080" viewBox="-540 -540 1080 1080">
        {Array.from({ length: rays }).map((_, i) => {
          const a = (i / rays) * Math.PI * 2 + frame * 0.01;
          const len = 250 + noise2D('ray', i * 0.5, frame * 0.05) * 220;
          const x2 = Math.cos(a) * len;
          const y2 = Math.sin(a) * len;
          const hue = (i * 6 + frame) % 360;
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={x2}
              y2={y2}
              stroke={`hsl(${hue}, 80%, 65%)`}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
        <circle cx={0} cy={0} r={50 + Math.sin(frame * 0.2) * 20} fill="#fff" filter="blur(8px)" />
        <circle cx={0} cy={0} r={20} fill="#fff" />
      </svg>
    </AbsoluteFill>
  );
};

const STUDIES = [
  { name: 'NOISE FIELD', component: NoiseField },
  { name: 'FLOW LINES', component: FlowLines },
  { name: 'SHAPE GRID', component: ShapeGrid },
  { name: 'GRADIENT MORPH', component: GradientMorph },
  { name: 'VORONOI', component: VoronoiCells },
  { name: 'STARBURST', component: Starburst },
];

const Caption: React.FC<{ name: string; index: number }> = ({ name, index }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 6, 50, CH_LEN], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 50,
        left: 60,
        color: '#fff',
        fontFamily: 'SF Pro Display, sans-serif',
        opacity: op,
      }}
    >
      <div style={{ fontSize: 16, color: '#9a9ac0', letterSpacing: 4 }}>GEN {String(index + 1).padStart(2, '0')}</div>
      <div style={{ fontSize: 56, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>{name}</div>
    </div>
  );
};

export const Generative: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050510' }}>
      {STUDIES.map((s, i) => (
        <Sequence key={i} from={i * CH_LEN} durationInFrames={CH_LEN}>
          <s.component />
          <Caption name={s.name} index={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
