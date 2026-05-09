import {AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate} from 'remotion';

export const LetterSplit: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const directions = ['top', 'right', 'bottom', 'left'];

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {text.split('').map((char, i) => {
        const delay = i * 2;
        const dir = directions[i % 4];
        const progress = spring({frame: Math.max(0, frame - delay), fps, config: {damping: 10}});

        let x = 0, y = 0;
        if (dir === 'top') y = -200 * (1 - progress);
        if (dir === 'bottom') y = 200 * (1 - progress);
        if (dir === 'left') x = -200 * (1 - progress);
        if (dir === 'right') x = 200 * (1 - progress);

        const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});

        return (
          <span key={i} style={{
            color: 'white', fontSize: 140, fontWeight: 900,
            fontFamily: 'Arial Black, sans-serif',
            display: 'inline-block',
            transform: `translate(${x}px, ${y}px)`,
            opacity: progress * fadeOut,
            letterSpacing: '0.1em',
          }}>{char === ' ' ? '\u00A0' : char}</span>
        );
      })}
    </AbsoluteFill>
  );
};
