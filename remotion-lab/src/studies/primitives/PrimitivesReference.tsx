/**
 * studies/primitives — exhaustive demo of every Remotion primitive.
 * 6 chapters * 60 frames = 360 frames @ 30fps = 12s
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Loop,
  Sequence,
  Series,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const Chapter: React.FC<{ title: string; children: React.ReactNode; index: number }> = ({
  title,
  children,
  index,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a14', opacity: fadeIn, padding: 80 }}>
      <div
        style={{
          color: '#5a5a8a',
          fontFamily: 'SF Pro Display, sans-serif',
          fontSize: 22,
          letterSpacing: 6,
          fontWeight: 500,
        }}
      >
        CH {String(index + 1).padStart(2, '0')}
      </div>
      <div
        style={{
          color: '#fff',
          fontFamily: 'SF Pro Display, sans-serif',
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginTop: 12,
          marginBottom: 60,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 700 }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// 1. useCurrentFrame + interpolate
const ChInterpolate: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 60], [-300, 300], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const op = interpolate(frame, [0, 20, 40, 60], [0, 1, 1, 0.6], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        width: 220,
        height: 220,
        borderRadius: 32,
        background: 'linear-gradient(135deg, #ff6b35, #f74e9c)',
        transform: `translateX(${x}px)`,
        opacity: op,
        boxShadow: '0 30px 80px rgba(255,107,53,0.35)',
      }}
    />
  );
};

// 2. Spring physics (3 different damping)
const ChSpring: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sBouncy = spring({ fps, frame: frame - 4, config: { damping: 8 } });
  const sNatural = spring({ fps, frame: frame - 12, config: { damping: 14 } });
  const sStiff = spring({ fps, frame: frame - 20, config: { damping: 30, stiffness: 220 } });
  const item = (s: number, color: string, label: string) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: color,
          margin: '0 auto',
          transform: `translateY(${interpolate(s, [0, 1], [240, 0])}px) scale(${interpolate(s, [0, 1], [0.4, 1])})`,
          boxShadow: `0 20px 60px ${color}55`,
        }}
      />
      <div style={{ color: '#9a9ac0', marginTop: 28, fontSize: 22, fontFamily: 'SF Pro Display' }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', width: '100%', gap: 80 }}>
      {item(sBouncy, '#5e9eff', 'damping=8')}
      {item(sNatural, '#9b59ff', 'damping=14')}
      {item(sStiff, '#ff5e9e', 'damping=30')}
    </div>
  );
};

// 3. Sequence
const ChSequence: React.FC = () => {
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Sequence from={0} durationInFrames={20}>
        <Card text="from=0" color="#5e9eff" />
      </Sequence>
      <Sequence from={20} durationInFrames={20}>
        <Card text="from=20" color="#9b59ff" />
      </Sequence>
      <Sequence from={40} durationInFrames={20}>
        <Card text="from=40" color="#ff5e9e" />
      </Sequence>
    </AbsoluteFill>
  );
};

const Card: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 4, 16, 20], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        background: color,
        padding: '40px 80px',
        borderRadius: 24,
        color: 'white',
        fontSize: 60,
        fontFamily: 'SF Pro Display',
        fontWeight: 700,
        opacity: op,
      }}
    >
      {text}
    </div>
  );
};

// 4. Series
const ChSeries: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={20}>
        <Card text="part 1" color="#5e9eff" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={20}>
        <Card text="part 2" color="#9b59ff" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={20}>
        <Card text="part 3" color="#ff5e9e" />
      </Series.Sequence>
    </Series>
  );
};

// 5. Loop + Freeze
const ChLoopFreeze: React.FC = () => {
  return (
    <div style={{ display: 'flex', width: '100%', gap: 80 }}>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: 240 }}>
          <Loop durationInFrames={20}>
            <SpinDot color="#5e9eff" />
          </Loop>
        </div>
        <div style={{ color: '#9a9ac0', marginTop: 16, fontSize: 22 }}>Loop (period 20)</div>
      </div>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: 240 }}>
          <Freeze frame={10}>
            <SpinDot color="#ff5e9e" />
          </Freeze>
        </div>
        <div style={{ color: '#9a9ac0', marginTop: 16, fontSize: 22 }}>Freeze @ frame 10</div>
      </div>
    </div>
  );
};

const SpinDot: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 20], [0, 360]);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 200,
        height: 200,
        marginLeft: -100,
        marginTop: -100,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: color,
          marginLeft: -18,
          boxShadow: `0 0 40px ${color}`,
        }}
      />
    </div>
  );
};

// 6. random(seed) deterministic
const ChRandom: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 60 }).map((_, i) => ({
    x: random(`x-${i}`) * 100,
    y: random(`y-${i}`) * 100,
    size: random(`s-${i}`) * 16 + 6,
    hue: random(`h-${i}`) * 60 + 200,
    phase: random(`p-${i}`) * Math.PI * 2,
  }));
  return (
    <AbsoluteFill>
      {dots.map((d, i) => {
        const wobble = Math.sin(frame / 8 + d.phase) * 12;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              transform: `translate(${wobble}px, ${wobble * 0.5}px)`,
              background: `hsl(${d.hue}, 80%, 65%)`,
              boxShadow: `0 0 12px hsl(${d.hue}, 80%, 65%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const CHAPTERS = [
  { title: 'INTERPOLATE + EASING', component: ChInterpolate },
  { title: 'SPRING PHYSICS', component: ChSpring },
  { title: 'SEQUENCE', component: ChSequence },
  { title: 'SERIES', component: ChSeries },
  { title: 'LOOP & FREEZE', component: ChLoopFreeze },
  { title: 'RANDOM(seed)', component: ChRandom },
];

const CHAPTER_LEN = 60;

export const PrimitivesReference: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a14' }}>
      {CHAPTERS.map((c, i) => (
        <Sequence key={i} from={i * CHAPTER_LEN} durationInFrames={CHAPTER_LEN}>
          <Chapter title={c.title} index={i}>
            <c.component />
          </Chapter>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
