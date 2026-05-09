import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const TextFlash: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({frame, fps, config: {damping: 10, stiffness: 100}});
  const opacity = interpolate(frame, [0, 3, 18, 23], [0, 1, 1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        color: 'white',
        fontSize: 250,
        fontFamily: 'Arial Black, sans-serif',
        fontWeight: 900,
        transform: `scale(${scale})`,
        opacity,
        textShadow: '0 0 40px rgba(255,255,255,0.5)',
        letterSpacing: '0.1em',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
