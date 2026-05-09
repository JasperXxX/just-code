import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig} from 'remotion';

export const SlowReveal: React.FC<{text: string; color?: string}> = ({text, color = '#FF0000'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap: '4px'}}>
        {text.split('').map((char: string, i: number) => {
          const charDelay = i * 4; // 4 frames between each character
          const charFrame = Math.max(0, frame - charDelay);

          const opacity = interpolate(charFrame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
          const y = interpolate(charFrame, [0, 6], [30, 0], {extrapolateRight: 'clamp'});
          const blur = interpolate(charFrame, [0, 6], [10, 0], {extrapolateRight: 'clamp'});

          // Fade out at end
          const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

          return (
            <span key={i} style={{
              color,
              fontSize: 100,
              fontFamily: 'Druk Wide Bold Trial, Druk Wide Trial, Arial Black, sans-serif',
              fontWeight: 900,
              display: 'inline-block',
              opacity: opacity * fadeOut,
              transform: `translateY(${y}px)`,
              filter: `blur(${blur}px)`,
              letterSpacing: '0.08em',
              textShadow: `0 0 20px ${color}80`,
            }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
