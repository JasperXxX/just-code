import {AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate} from 'remotion';

export const KineticText: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {text.split('').map((char, i) => {
        const delay = i * 3;
        const y = spring({frame: Math.max(0, frame - delay), fps, config: {damping: 8, stiffness: 80}});
        const opacity = interpolate(frame - delay, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

        return (
          <span key={i} style={{
            color: 'white',
            fontSize: 150,
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 900,
            display: 'inline-block',
            transform: `translateY(${(1 - y) * 200}px)`,
            opacity,
            letterSpacing: '0.15em',
            textShadow: '0 0 30px rgba(255,255,255,0.4)',
          }}>
            {char}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};
