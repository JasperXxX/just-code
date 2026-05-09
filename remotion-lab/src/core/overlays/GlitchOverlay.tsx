import {AbsoluteFill, useCurrentFrame, random} from 'remotion';

export const GlitchOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = Array.from({length: 5}, (_, i) => ({
    y: random(`bar-y-${frame}-${i}`) * 1080,
    h: random(`bar-h-${frame}-${i}`) * 30 + 2,
    opacity: random(`bar-o-${frame}-${i}`) * 0.5 + 0.1,
    offset: (random(`bar-x-${frame}-${i}`) - 0.5) * 100,
  }));

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      {bars.map((bar, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: bar.y,
          left: bar.offset,
          width: `calc(100% + ${Math.abs(bar.offset) * 2}px)`,
          height: bar.h,
          backgroundColor: `rgba(255,255,255,${bar.opacity})`,
        }} />
      ))}
    </AbsoluteFill>
  );
};
