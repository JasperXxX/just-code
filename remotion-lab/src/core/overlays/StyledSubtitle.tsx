import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const StyledSubtitle: React.FC<{text: string; style?: 'red-bold' | 'white-clean' | 'negative' | 'glitch'}> = ({text, style = 'red-bold'}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Slide up from bottom
  const slideY = spring({frame, fps, config: {damping: 12, stiffness: 80}});
  const y = interpolate(slideY, [0, 1], [100, 0]);

  // Fade out at end
  const opacity = interpolate(frame, [0, 5, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  // Scale punch on appear
  const scale = spring({frame, fps, config: {damping: 8, stiffness: 120}});

  // Deterministic glitch offset based on frame
  const glitchOffset = frame % 3 === 0 ? 3 : -3;

  const styles: Record<string, React.CSSProperties> = {
    'red-bold': {
      color: '#FF0000',
      fontSize: 120,
      fontFamily: 'Druk Wide Bold Trial, Druk Wide Trial, Arial Black, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      textShadow: '0 0 30px rgba(255,0,0,0.6), 0 0 60px rgba(255,0,0,0.3)',
    },
    'white-clean': {
      color: '#FFFFFF',
      fontSize: 100,
      fontFamily: 'Druk Bold Trial, Druk Trial, Arial Black, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textShadow: '0 0 20px rgba(255,255,255,0.4)',
    },
    'negative': {
      color: '#000000',
      fontSize: 130,
      fontFamily: 'Druk Heavy Trial, Druk Trial, Arial Black, sans-serif',
      fontWeight: 900,
      backgroundColor: '#FFFFFF',
      padding: '10px 40px',
      textTransform: 'uppercase' as const,
    },
    'glitch': {
      color: '#FFFFFF',
      fontSize: 110,
      fontFamily: 'Druk Super Trial, Druk Trial, Arial Black, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase' as const,
      textShadow: `${glitchOffset}px 0 #FF0000, ${-glitchOffset}px 0 #00FFFF`,
    },
  };

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        ...styles[style],
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
