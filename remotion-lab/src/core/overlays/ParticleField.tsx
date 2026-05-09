import {AbsoluteFill, useCurrentFrame, random} from 'remotion';

export const ParticleField: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({length: 50}, (_, i) => ({
    x: (random(`px-${i}`) * 1920 + frame * (random(`speed-${i}`) * 2 - 1)) % 1920,
    y: (random(`py-${i}`) * 1080 + frame * random(`speedy-${i}`) * -1) % 1080,
    size: 2 + random(`size-${i}`) * 6,
    opacity: 0.2 + random(`op-${i}`) * 0.5,
  }));

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.x, top: p.y,
          width: p.size, height: p.size,
          borderRadius: '50%',
          backgroundColor: 'white',
          opacity: p.opacity,
        }} />
      ))}
    </AbsoluteFill>
  );
};
