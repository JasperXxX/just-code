/**
 * studies/animation — 5 progressively complex motion studies.
 * Each in its own chapter, 90 frames @ 30fps = 3s. Total 15s.
 *
 * 1. Parallax — multi-layer depth
 * 2. Stagger — list-item cascade
 * 3. Path draw — strokeDashoffset trick
 * 4. Particle system — 200 elements with physics
 * 5. Camera dolly — synthetic 3D camera via transform
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const CHAPTER_LEN = 90;

// 1. Parallax
const ParallaxStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, CHAPTER_LEN], [0, 1], { extrapolateRight: 'clamp' });
  const layer = (depth: number, color: string, count: number, sizeFactor: number) => (
    <AbsoluteFill style={{ transform: `translateX(${-t * depth * 600}px)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${random(`px-${depth}-${i}`) * 200 - 50}%`,
            top: `${random(`py-${depth}-${i}`) * 100}%`,
            width: 80 * sizeFactor + random(`pw-${depth}-${i}`) * 40 * sizeFactor,
            height: 200 * sizeFactor,
            background: color,
            borderRadius: 12,
            boxShadow: `0 10px ${30 * sizeFactor}px ${color}55`,
            filter: `blur(${(1 - sizeFactor) * 4}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a14 60%)', overflow: 'hidden' }}>
      {layer(0.2, '#22223a', 10, 0.7)}
      {layer(0.5, '#3a3a5a', 8, 1.0)}
      {layer(1.0, '#5e9eff', 6, 1.4)}
    </AbsoluteFill>
  );
};

// 2. Stagger
const StaggerStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    'PROGRAMMATIC',
    'VIDEO',
    'IS',
    'DETERMINISTIC',
    'BY',
    'DESIGN',
  ];
  return (
    <AbsoluteFill
      style={{
        background: '#0a0a14',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {items.map((word, i) => {
        const s = spring({ fps, frame: frame - i * 4, config: { damping: 14 } });
        const y = interpolate(s, [0, 1], [60, 0]);
        const op = interpolate(s, [0, 1], [0, 1]);
        const blur = interpolate(s, [0, 1], [16, 0]);
        return (
          <div
            key={word}
            style={{
              color: '#fff',
              fontFamily: 'SF Pro Display, sans-serif',
              fontSize: 80,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              transform: `translateY(${y}px)`,
              opacity: op,
              filter: `blur(${blur}px)`,
            }}
          >
            {word}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 3. Path draw
const PathStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const total = 900; // path length placeholder, we use percent below
  const dashOffset = interpolate(frame, [0, CHAPTER_LEN * 0.9], [total, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  return (
    <AbsoluteFill style={{ background: '#0a0a14', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="800" height="500" viewBox="0 0 800 500">
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5e9eff" />
            <stop offset="1" stopColor="#ff5e9e" />
          </linearGradient>
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 50 250 Q 200 50 400 250 T 750 250"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={total}
          strokeDashoffset={dashOffset}
          filter="url(#line-glow)"
        />
        {[
          [50, 250], [400, 250], [750, 250],
        ].map(([cx, cy], i) => {
          const visibleAt = i * 30 + 5;
          const op = interpolate(frame, [visibleAt, visibleAt + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <circle key={i} cx={cx} cy={cy} r={10} fill="#fff" opacity={op} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// 4. Particle system (200 deterministic particles)
const ParticleStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const N = 200;
  const particles = Array.from({ length: N }).map((_, i) => {
    const seed = i;
    const baseX = random(`px-${seed}`) * 100;
    const baseY = random(`py-${seed}`) * 100;
    const speed = random(`ps-${seed}`) * 0.6 + 0.3;
    const phase = random(`ph-${seed}`) * Math.PI * 2;
    const t = frame / 30;
    const x = (baseX + Math.sin(t * speed + phase) * 12) % 100;
    const y = (baseY + (t * speed * 8) + Math.cos(t + phase) * 6) % 100;
    const size = random(`pz-${seed}`) * 5 + 1.5;
    const hue = random(`ph2-${seed}`) * 60 + 200;
    const op = 0.45 + random(`po-${seed}`) * 0.45;
    return { x, y, size, hue, op };
  });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 70%)' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `hsl(${p.hue}, 80%, 70%)`,
            opacity: p.op,
            boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue}, 80%, 70%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// 5. Camera dolly via stacked transforms
const CameraDollyStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, CHAPTER_LEN], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const camera = {
    z: interpolate(t, [0, 1], [1.0, 1.45]),
    x: interpolate(t, [0, 1], [0, -120]),
    rotateY: interpolate(t, [0, 1], [-8, 8]),
  };
  // Build a "city" of blocks with depth
  const blocks = Array.from({ length: 24 }).map((_, i) => {
    const x = (i % 6) * 200 - 600;
    const z = Math.floor(i / 6) * 200 - 400;
    const h = 200 + random(`bh-${i}`) * 320;
    return { x, z, h, color: `hsl(${220 + random(`bc-${i}`) * 40}, 50%, ${30 + random(`bl-${i}`) * 20}%)` };
  });
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
        perspective: 1200,
        perspectiveOrigin: '50% 60%',
      }}
    >
      <AbsoluteFill
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(${camera.z * 200}px) translateX(${camera.x}px) rotateY(${camera.rotateY}deg)`,
        }}
      >
        {blocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '60%',
              width: 140,
              height: b.h,
              background: b.color,
              transform: `translateX(${b.x}px) translateZ(${b.z}px) translateY(${-b.h * 0.5}px)`,
              transformStyle: 'preserve-3d',
              boxShadow: `0 30px 60px rgba(0,0,0,0.5)`,
              borderTop: '2px solid rgba(255,255,255,0.3)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const STUDIES = [
  { name: 'PARALLAX', component: ParallaxStudy },
  { name: 'STAGGER', component: StaggerStudy },
  { name: 'PATH DRAW', component: PathStudy },
  { name: 'PARTICLES', component: ParticleStudy },
  { name: 'CAMERA DOLLY', component: CameraDollyStudy },
];

const Label: React.FC<{ name: string; index: number }> = ({ name, index }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 6, 80, CHAPTER_LEN], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 60,
        color: '#fff',
        fontFamily: 'SF Pro Display, sans-serif',
        opacity: op,
      }}
    >
      <div style={{ fontSize: 18, color: '#5a5a8a', letterSpacing: 4 }}>STUDY {String(index + 1).padStart(2, '0')}</div>
      <div style={{ fontSize: 64, fontWeight: 800, marginTop: 8 }}>{name}</div>
    </div>
  );
};

export const AnimationProgression: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a14' }}>
      {STUDIES.map((s, i) => (
        <Sequence key={i} from={i * CHAPTER_LEN} durationInFrames={CHAPTER_LEN}>
          <s.component />
          <Label name={s.name} index={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
